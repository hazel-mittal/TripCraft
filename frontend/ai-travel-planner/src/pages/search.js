import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, 
  MapPin, 
  ArrowRight, 
  DollarSign, 
  Castle, 
  Coins,
  Waves,
  Mountain,
  Building2,
  ShoppingBag,
  Theater,
  Utensils,
  User,
  Heart,
  Users,
  Home,
  Camera,
  TreePine,
  Landmark,
  Moon,
  ShoppingCart,
  BookOpen,
  Activity,
  Plane
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default function SearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [destination, setDestination] = useState("");
  const [tripLength, setTripLength] = useState(1);
  const [budget, setBudget] = useState("");
  const [tripType, setTripType] = useState("");
  const [party, setParty] = useState("");
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const autocompleteRef = useRef(null);
  const autocompleteTimeoutRef = useRef(null);

  // Autocomplete functions
  const fetchAutocompleteSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setAutocompleteSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('http://localhost:8000/api/autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const suggestions = data.predictions || [];
        setAutocompleteSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } else {
        console.error('Failed to fetch autocomplete suggestions');
        setAutocompleteSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      setAutocompleteSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleDestinationChange = (value) => {
    setDestination(value);
    
    // Debounce the autocomplete API call
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current);
    }
    
    autocompleteTimeoutRef.current = setTimeout(() => {
      fetchAutocompleteSuggestions(value);
    }, 300); // 300ms delay
  };

  const handleSuggestionSelect = (suggestion) => {
    setDestination(suggestion.description);
    setAutocompleteSuggestions([]);
    setShowSuggestions(false);
  };

  const handleClickOutside = (event) => {
    if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (autocompleteTimeoutRef.current) {
        clearTimeout(autocompleteTimeoutRef.current);
      }
    };
  }, []);

  const budgetOptions = [
    { id: "budget", title: "Budget-friendly", icon: Coins, desc: "Affordable accommodations and activities", color: "text-blue-600" },
    { id: "moderate", title: "Moderate", icon: DollarSign, desc: "Comfortable mid-range options", color: "text-green-600" },
    { id: "luxury", title: "Luxury", icon: Castle, desc: "Premium experiences and accommodations", color: "text-purple-600" },
  ];

  const tripTypeOptions = [
    { id: "relaxing", title: "Relaxing", icon: Waves, desc: "Peaceful and restorative experiences", color: "text-blue-500" },
    { id: "adventurous", title: "Adventurous", icon: Mountain, desc: "Thrilling activities and experiences", color: "text-orange-500" },
    { id: "sightseeing", title: "Sightseeing", icon: Camera, desc: "Explore landmarks and attractions", color: "text-indigo-500" },
    { id: "shopping", title: "Shopping", icon: ShoppingBag, desc: "Retail therapy and local markets", color: "text-pink-500" },
    { id: "cultural", title: "Cultural", icon: Theater, desc: "Museums, traditions, and arts", color: "text-amber-500" },
    { id: "foodie", title: "Foodie", icon: Utensils, desc: "Delicious local cuisine", color: "text-red-500" },
  ];

  const partyOptions = [
    { id: "alone", title: "Solo Travel", icon: User, desc: "Just me, myself, and I", color: "text-gray-600" },
    { id: "couple", title: "Couple", icon: Heart, desc: "Romantic getaway for two", color: "text-rose-500" },
    { id: "friends", title: "Friends", icon: Users, desc: "Group of friends adventure", color: "text-emerald-500" },
    { id: "family", title: "Family", icon: Home, desc: "Family vacation", color: "text-blue-600" },
  ];

  const interestOptions = [
    { name: "Museums", icon: BookOpen, color: "text-purple-500" },
    { name: "Nightlife", icon: Moon, color: "text-indigo-500" },
    { name: "Landmarks", icon: Landmark, color: "text-amber-500" },
    { name: "Nature & Parks", icon: TreePine, color: "text-green-500" },
    { name: "Food & Restaurants", icon: Utensils, color: "text-red-500" },
    { name: "Shopping", icon: ShoppingCart, color: "text-pink-500" },
    { name: "Cultural Sites", icon: Theater, color: "text-orange-500" },
    { name: "Adventure Activities", icon: Activity, color: "text-emerald-500" },
    { name: "Beaches", icon: Waves, color: "text-cyan-500" },
    { name: "Historical Sites", icon: Building2, color: "text-gray-600" },
  ];

  const toggleInterest = (interestName) => {
    setInterests((prev) =>
      prev.includes(interestName)
        ? prev.filter((i) => i !== interestName)
        : [...prev, interestName]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!destination.trim()) {
      alert('Please enter a destination');
      return;
    }
    if (!budget) {
      alert('Please select a budget option');
      return;
    }
    if (!tripType) {
      alert('Please select a trip type');
      return;
    }
    if (!party) {
      alert('Please select your travel party');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch("http://localhost:8000/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: destination, interests }),
      });
      const data = await response.json();
      
      // Store search data in sessionStorage for the next page
      sessionStorage.setItem('searchData', JSON.stringify({
        destination,
        tripLength,
        budget,
        tripType,
        party,
        interests,
        resultsByCategory: data.results || {}
      }));
      
      // Navigate to places page
      router.push('/places');
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Failed to search places. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navbar />
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full mr-4">
                    <Plane className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900">TripCraft</h1>
                </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {user ? `Welcome back, ${user.displayName?.split(' ')[0] || 'User'}! Let's plan your perfect trip with AI-powered recommendations.` : "Plan your perfect trip with AI-powered recommendations. Sign in to save your itineraries."}
          </p>
        </div>


        {/* Search Form Card */}
        <Card className="shadow-xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Destination */}
              <div className="space-y-2">
                <label className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Where do you want to go? <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={autocompleteRef}>
                  <input
                    type="text"
                    placeholder="Enter destination (e.g., Paris, Tokyo, New York)..."
                    value={destination}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-6 py-4 text-lg focus:border-blue-500 focus:outline-none transition-colors"
                    required
                    autoComplete="off"
                  />
                  
                  {/* Autocomplete Suggestions */}
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {isLoadingSuggestions ? (
                        <div className="p-4 text-center text-gray-500">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                          Loading suggestions...
                        </div>
                      ) : (
                        autocompleteSuggestions.map((suggestion, index) => (
                          <div
                            key={suggestion.place_id}
                            onClick={() => handleSuggestionSelect(suggestion)}
                            className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {suggestion.structured_formatting?.main_text || suggestion.description}
                                </div>
                                {suggestion.structured_formatting?.secondary_text && (
                                  <div className="text-sm text-gray-500">
                                    {suggestion.structured_formatting.secondary_text}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Trip Length */}
              <div className="space-y-2">
                <label className="text-lg font-semibold">How many days?</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={tripLength}
                    onChange={(e) => setTripLength(Number(e.target.value))}
                    className="border-2 border-gray-200 rounded-xl px-6 py-4 text-lg focus:border-blue-500 focus:outline-none transition-colors w-32"
                    required
                  />
                  <span className="text-gray-600">days</span>
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-4">
                <label className="text-lg font-semibold text-gray-800">What's your budget? <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {budgetOptions.map((b) => {
                    const IconComponent = b.icon;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setBudget(b.id)}
                        className={`cursor-pointer border-2 rounded-xl p-6 text-center transition-all duration-200 ${
                          budget === b.id 
                            ? "border-blue-500 bg-blue-50 shadow-lg" 
                            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                        }`}
                      >
                        <div className={`mb-3 flex justify-center`}>
                          <IconComponent className={`h-8 w-8 ${b.color}`} />
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-gray-800">{b.title}</h3>
                        <p className="text-sm text-gray-600">{b.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trip Type */}
              <div className="space-y-4">
                <label className="text-lg font-semibold text-gray-800">What kind of trip? <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {tripTypeOptions.map((t) => {
                    const IconComponent = t.icon;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setTripType(t.id)}
                        className={`cursor-pointer border-2 rounded-xl p-6 text-center transition-all duration-200 ${
                          tripType === t.id 
                            ? "border-blue-500 bg-blue-50 shadow-lg" 
                            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                        }`}
                      >
                        <div className="mb-3 flex justify-center">
                          <IconComponent className={`h-8 w-8 ${t.color}`} />
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-gray-800">{t.title}</h3>
                        <p className="text-sm text-gray-600">{t.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Travel Party */}
              <div className="space-y-4">
                <label className="text-lg font-semibold text-gray-800">Who's traveling? <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {partyOptions.map((p) => {
                    const IconComponent = p.icon;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setParty(p.id)}
                        className={`cursor-pointer border-2 rounded-xl p-6 text-center transition-all duration-200 ${
                          party === p.id 
                            ? "border-blue-500 bg-blue-50 shadow-lg" 
                            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                        }`}
                      >
                        <div className="mb-3 flex justify-center">
                          <IconComponent className={`h-8 w-8 ${p.color}`} />
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-gray-800">{p.title}</h3>
                        <p className="text-sm text-gray-600">{p.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-4">
                <label className="text-lg font-semibold text-gray-800">What interests you?</label>
                <p className="text-gray-600">Select the types of attractions you'd like to visit</p>
                <div className="flex flex-wrap gap-3">
                  {interestOptions.map((interest) => {
                    const IconComponent = interest.icon;
                    return (
                      <button
                        type="button"
                        key={interest.name}
                        onClick={() => toggleInterest(interest.name)}
                        className={`px-4 py-2 rounded-full border-2 transition-all duration-200 flex items-center gap-2 ${
                          interests.includes(interest.name)
                            ? "bg-blue-500 text-white border-blue-500 shadow-lg"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-md"
                        }`}
                      >
                        <IconComponent className={`h-4 w-4 ${interests.includes(interest.name) ? 'text-white' : interest.color}`} />
                        {interest.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-6">
                <Button 
                  type="submit" 
                  disabled={loading || !destination}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-12 py-4 text-lg rounded-xl shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-3" />
                      Searching Places...
                    </>
                  ) : (
                    <>
                      Search Places
                      <ArrowRight className="ml-3 w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
