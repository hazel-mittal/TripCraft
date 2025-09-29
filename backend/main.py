

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv
import google.generativeai as genai  # Gemini SDK
import json

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")


@app.get("/")
def read_root():
    return {"message": "Backend is working with Gemini!"}


@app.post("/api/destination-photo")
async def get_destination_photo(request: Request):
    data = await request.json()
    destination = data.get("destination", "").strip()
    
    if not destination:
        return {"error": "Destination is required"}
    
    try:
        # Search for the destination to get a place with photo
        query = f"{destination} landmarks attractions"
        url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={query}&key={GOOGLE_API_KEY}"
        response = requests.get(url)
        
        if response.status_code != 200:
            return {"error": "Failed to search for destination"}
        
        results = response.json().get("results", [])
        
        # Find the first result with a photo
        for place in results:
            if place.get("photos") and len(place["photos"]) > 0:
                photo_reference = place["photos"][0]["photo_reference"]
                photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={GOOGLE_API_KEY}"
                return {
                    "photo_url": photo_url,
                    "place_name": place.get("name", destination),
                    "photo_reference": photo_reference
                }
        
        # If no photos found, try a more general search
        query = destination
        url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={query}&key={GOOGLE_API_KEY}"
        response = requests.get(url)
        
        if response.status_code == 200:
            results = response.json().get("results", [])
            for place in results:
                if place.get("photos") and len(place["photos"]) > 0:
                    photo_reference = place["photos"][0]["photo_reference"]
                    photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={GOOGLE_API_KEY}"
                    return {
                        "photo_url": photo_url,
                        "place_name": place.get("name", destination),
                        "photo_reference": photo_reference
                    }
        
        return {"error": "No photos found for this destination"}
        
    except Exception as e:
        return {"error": f"Error fetching photo: {str(e)}"}


@app.post("/api/search")
async def search_places(request: Request):
    data = await request.json()
    destination = data.get("query", "").strip()
    interests = data.get("interests", [])

    search_terms = interests if interests else ["general"]
    categorized_places = {}

    # First, get the coordinates of the destination to use for location bias
    destination_coords = None
    try:
        geocode_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={destination}&key={GOOGLE_API_KEY}"
        geocode_response = requests.get(geocode_url)
        if geocode_response.status_code == 200:
            geocode_data = geocode_response.json()
            if geocode_data.get("results"):
                location = geocode_data["results"][0]["geometry"]["location"]
                destination_coords = f"{location['lat']},{location['lng']}"
    except Exception as e:
        print(f"Error getting destination coordinates: {e}")

    for interest in search_terms:
        if interest.lower() == "general":
            query = destination
        else:
            # Make the search more explicit for better results, especially for nature/parks
            if "nature" in interest.lower() or "park" in interest.lower():
                query = f"parks nature reserves {destination}"
            elif "nightlife" in interest.lower():
                query = f"bars clubs nightlife {destination}"
            elif "beach" in interest.lower():
                query = f"beaches {destination}"
            elif "landmark" in interest.lower():
                query = f"landmarks monuments {destination}"
            else:
                query = f"{interest} in {destination}"
        
        # Build URL with location bias if we have coordinates
        url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={query}&key={GOOGLE_API_KEY}"
        if destination_coords:
            url += f"&location={destination_coords}&radius=50000"  # 50km radius
        
        print(f"Searching for: {query} in {destination} with coords: {destination_coords}")
        response = requests.get(url)
        if response.status_code != 200:
            continue
        results = response.json().get("results", [])
        seen_names = set()
        places_for_category = categorized_places.get(interest, [])
        for place in results:
            name = place.get("name")
            if not name or name in seen_names:
                continue
            
            # Additional filtering to ensure results are from the correct location
            address = place.get("formatted_address", "").lower()
            if destination_coords and destination.lower() not in address:
                # Skip results that don't seem to be from the destination
                continue
            photo_url = None
            photos = place.get("photos")
            if photos and isinstance(photos, list) and "photo_reference" in photos[0]:
                photo_reference = photos[0]["photo_reference"]
                photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={GOOGLE_API_KEY}"
            cleaned_place = {
                "name": name,
                "address": place.get("formatted_address"),
                "rating": place.get("rating"),
                "open_now": place.get("opening_hours", {}).get("open_now"),
                "photo_url": photo_url,
                "user_ratings_total": place.get("user_ratings_total"),
                "price_level": place.get("price_level"),
            }
            places_for_category.append(cleaned_place)
            seen_names.add(name)
        categorized_places[interest] = places_for_category

    return {"results": categorized_places}


@app.post("/api/itinerary")
async def generate_itinerary(request: Request):
    data = await request.json()
    destination = data.get("destination", "").strip()
    duration = data.get("trip_length") or 1
    vibes = [data.get("trip_type", "general")]
    frontend_interests = data.get("interests") or []

    selected_places = data.get("selectedPlaces", {})
    flat_places = []

    if "places" in data:
        flat_places = data["places"]
    elif isinstance(selected_places, dict):
        for category, places in selected_places.items():
            for place in places:
                flat_places.append({
                    "name": place.get("name"),
                    "address": place.get("address"),
                    "category": category
                })

    attractions = [p["name"] for p in flat_places] if flat_places else frontend_interests

    # STRICT JSON Prompt
    prompt = f"""
You are a travel planner that creates detailed, daily itineraries. Return ONLY valid JSON - no markdown, no code blocks, no explanations.

USER INFO:
Destination: {destination}
Trip Duration: {duration} days
Vibe/General Interests: {', '.join(vibes) if vibes else 'None'}
Specific Attractions: {', '.join(attractions) if attractions else 'None'}

REQUIREMENTS:
1. Generate exactly {duration} days.
2. Each day must have 3-5 activities with:
   - time (e.g., "9:00 AM - 11:00 AM")
   - name
   - description
   - tips (local tip)
   - optional photo_url
   - optional cost
3. Include specific attractions if provided; otherwise use general interests.
4. Return ONLY the JSON object - no markdown code blocks, no explanations, no extra text.

Expected JSON structure:
{{
  "days": [
    {{
      "day": 1,
      "activities": [
        {{
          "time": "9:00 AM - 11:00 AM",
          "name": "Attraction Name",
          "description": "Short description",
          "tips": "Local tip",
          "photo_url": "https://example.com/photo.jpg",
          "cost": "$20"
        }}
      ]
    }}
  ]
}}

Return only the JSON object above, nothing else.
"""

    try:
        response = model.generate_content(prompt)
        itinerary_text = response.text.strip()

        # Clean the response - remove markdown code blocks and extra text
        print(f"Raw AI response: {itinerary_text[:200]}...")  # Debug log
        
        # Remove markdown code blocks
        if itinerary_text.startswith("```json"):
            itinerary_text = itinerary_text[7:]
        elif itinerary_text.startswith("```"):
            itinerary_text = itinerary_text[3:]
        
        if itinerary_text.endswith("```"):
            itinerary_text = itinerary_text[:-3]
        
        # Remove any leading/trailing whitespace
        itinerary_text = itinerary_text.strip()
        
        # Find the first { and last } to extract just the JSON
        first_brace = itinerary_text.find('{')
        last_brace = itinerary_text.rfind('}')
        
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            itinerary_text = itinerary_text[first_brace:last_brace + 1]
        
        print(f"Cleaned JSON: {itinerary_text[:200]}...")  # Debug log

        # Attempt to parse JSON
        try:
            itinerary_data = json.loads(itinerary_text)
            # Wrap the data in the expected format
            return {"itinerary": itinerary_data}
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {str(e)}")
            print(f"Problematic JSON: {itinerary_text}")
            return {"itinerary": None, "error": f"AI did not return valid JSON: {str(e)}", "raw": itinerary_text}

    except Exception as e:
        return {"itinerary": None, "error": str(e)}


@app.post("/api/autocomplete")
async def autocomplete_places(request: Request):
    data = await request.json()
    query = data.get("query", "").strip()
    
    if not query or len(query) < 2:
        return {"predictions": []}
    
    try:
        # Use Google Places Autocomplete API
        url = f"https://maps.googleapis.com/maps/api/place/autocomplete/json?input={query}&types=(cities)&key={GOOGLE_API_KEY}"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            return {"predictions": data.get("predictions", [])}
        else:
            return {"predictions": [], "error": "Failed to fetch autocomplete suggestions"}
            
    except Exception as e:
        return {"predictions": [], "error": str(e)}
