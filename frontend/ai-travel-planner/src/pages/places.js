import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function PlacesPage() {
  const router = useRouter();
  const [searchData, setSearchData] = useState(null);
  const [selectedPlaces, setSelectedPlaces] = useState({});
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    // Get search data from sessionStorage
    const data = sessionStorage.getItem('searchData');
    if (!data) {
      router.push('/search');
      return;
    }
    setSearchData(JSON.parse(data));
  }, [router]);

  const togglePlaceSelection = (category, place) => {
    setSelectedPlaces((prev) => {
      const selectedInCategory = prev[category] || [];
      const isSelected = selectedInCategory.some((p) => p.name === place.name);
      const updatedCategory = isSelected
        ? selectedInCategory.filter((p) => p.name !== place.name)
        : [...selectedInCategory, place];
      return { ...prev, [category]: updatedCategory };
    });
  };

  const handleGenerateItinerary = async () => {
    if (!searchData) return;
    
    setGenerating(true);
    try {
      let placesToUse = [];
      if (Object.keys(selectedPlaces).length > 0) {
        for (const category in selectedPlaces) {
          placesToUse = placesToUse.concat(selectedPlaces[category]);
        }
      } else {
        for (const category in searchData.resultsByCategory) {
          placesToUse = placesToUse.concat(searchData.resultsByCategory[category]);
        }
      }

      const response = await fetch("http://localhost:8000/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: searchData.destination,
          places: placesToUse,
          trip_length: searchData.tripLength,
          budget: searchData.budget,
          trip_type: searchData.tripType,
          party: searchData.party,
          interests: searchData.interests,
        }),
      });

      const data = await response.json();
      
      if (data.itinerary && data.itinerary.days) {
        // Store itinerary data for the next page
        sessionStorage.setItem('itineraryData', JSON.stringify({
          ...searchData,
          itinerary: data.itinerary,
          selectedPlaces
        }));
        
        // Navigate to itinerary page
        router.push('/itinerary');
      } else {
        alert("Failed to generate itinerary. Please try again.");
      }
    } catch (error) {
      console.error("Itinerary fetch error:", error);
      alert("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const getTotalSelectedPlaces = () => {
    return Object.values(selectedPlaces).reduce((total, places) => total + places.length, 0);
  };

  if (!searchData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navbar />
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">📍 Choose Your Places</h1>
            <p className="text-gray-600 mb-2">
              {searchData.destination} • {searchData.tripLength} {searchData.tripLength === 1 ? 'day' : 'days'} • 
              {getTotalSelectedPlaces() > 0 ? ` ${getTotalSelectedPlaces()} places selected` : ' No places selected yet'}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl">
              <p className="text-blue-800 text-sm">
                <strong>💡 Optional Selection:</strong> You can select specific places to include in your itinerary, 
                or skip this step and let our AI create a personalized itinerary based on your preferences. 
                Either way, you'll get an amazing travel plan!
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/search')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Button>
        </div>

        {/* Places by Category */}
        {Object.keys(searchData.resultsByCategory).length > 0 && (
          <div className="space-y-8">
            {Object.entries(searchData.resultsByCategory).map(([category, places]) => {
              const selectedInCategory = selectedPlaces[category] || [];
              return (
                <Card key={category} className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold">{category}</h2>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {selectedInCategory.length} of {places.length} selected
                      </span>
                    </div>

                    <div className="relative">
                      {/* Navigation Arrows */}
                      <button
                        onClick={() => {
                          const container = document.getElementById(`carousel-${category}`);
                          container.scrollBy({ left: -300, behavior: "smooth" });
                        }}
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border rounded-full p-3 shadow-lg hover:bg-gray-50"
                      >
                        ◀
                      </button>
                      <button
                        onClick={() => {
                          const container = document.getElementById(`carousel-${category}`);
                          container.scrollBy({ left: 300, behavior: "smooth" });
                        }}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border rounded-full p-3 shadow-lg hover:bg-gray-50"
                      >
                        ▶
                      </button>

                      {/* Places Carousel */}
                      <div
                        id={`carousel-${category}`}
                        className="flex gap-6 overflow-x-auto scrollbar-hide px-12"
                      >
                        {places.map((place, idx) => {
                          const isSelected = selectedInCategory.some((p) => p.name === place.name);
                          return (
                            <div
                              key={idx}
                              className={`min-w-[280px] border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                                isSelected 
                                  ? "border-blue-500 bg-blue-50 shadow-lg" 
                                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                              }`}
                              onClick={() => togglePlaceSelection(category, place)}
                            >
                              {/* Selection Indicator */}
                              {isSelected && (
                                <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1">
                                  <Check className="w-4 h-4" />
                                </div>
                              )}

                              {/* Place Image */}
                              {place.photo_url ? (
                                <img
                                  src={place.photo_url}
                                  alt={place.name}
                                  className="w-full h-48 object-cover rounded-lg mb-4"
                                />
                              ) : (
                                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-gray-500">
                                  No Image
                                </div>
                              )}

                              {/* Place Info */}
                              <h3 className="text-lg font-bold mb-2">{place.name}</h3>
                              <p className="text-sm text-gray-600 mb-2">{place.address}</p>
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1">
                                  ⭐ {place.rating} ({place.user_ratings_total} reviews)
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  place.open_now ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {place.open_now ? 'Open' : 'Closed'}
                                </span>
                              </div>
                              
                              {/* Selection Status */}
                              <div className="mt-3 text-center">
                                <span className={`text-sm font-medium ${
                                  isSelected ? 'text-blue-600' : 'text-gray-500'
                                }`}>
                                  {isSelected ? '✓ Selected' : 'Click to select'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            onClick={() => router.push('/search')}
            variant="outline"
            size="lg"
            className="px-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
          
          <Button
            onClick={handleGenerateItinerary}
            disabled={generating}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 px-8"
          >
            {generating ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Generating Itinerary...
              </>
            ) : (
              <>
                {getTotalSelectedPlaces() > 0 ? 'Generate Custom Itinerary' : 'Generate AI Itinerary'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Selection Summary */}
        {getTotalSelectedPlaces() > 0 && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              You've selected <span className="font-bold text-blue-600">{getTotalSelectedPlaces()}</span> places for your itinerary
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
