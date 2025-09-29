import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, MapPin, Users, Trash2, Eye, Bookmark } from "lucide-react";
import { getUserTrips, deleteTrip } from "@/lib/firestore";
import GoogleSignIn from "@/components/GoogleSignIn";
import Navbar from "@/components/Navbar";

export default function SavedTripsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [savedTrips, setSavedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tripPhotos, setTripPhotos] = useState({});

  // Get photo from Google Places data
  const getTripPhoto = (trip) => {
    console.log('Getting photo for trip:', trip.destination);
    
    // First try to get a photo from selected places (using photo_url directly)
    if (trip.selectedPlaces && Object.keys(trip.selectedPlaces).length > 0) {
      for (const category in trip.selectedPlaces) {
        const places = trip.selectedPlaces[category];
        if (places && places.length > 0) {
          const place = places[0]; // Get first place
          if (place.photo_url) {
            console.log('Using selected place photo_url:', place.photo_url);
            return place.photo_url;
          }
          // Also check for photo_reference as fallback
          if (place.photo_reference) {
            const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`;
            console.log('Using selected place photo_reference:', photoUrl);
            return photoUrl;
          }
        }
      }
    }
    
    // If no selected places, try to get from search results
    if (trip.resultsByCategory && Object.keys(trip.resultsByCategory).length > 0) {
      for (const category in trip.resultsByCategory) {
        const places = trip.resultsByCategory[category];
        if (places && places.length > 0) {
          const place = places[0]; // Get first place
          if (place.photo_url) {
            console.log('Using search result photo_url:', place.photo_url);
            return place.photo_url;
          }
          // Also check for photo_reference as fallback
          if (place.photo_reference) {
            const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`;
            console.log('Using search result photo_reference:', photoUrl);
            return photoUrl;
          }
        }
      }
    }
    
    // If no existing photos, return null to trigger API call
    console.log('No existing photos found, will fetch from API');
    return null;
  };

  // Fetch destination photo from API
  const fetchDestinationPhoto = async (destination) => {
    try {
      const response = await fetch('http://localhost:8000/api/destination-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination })
      });
      const data = await response.json();
      
      if (data.photo_url) {
        console.log('Fetched photo for', destination, ':', data.photo_url);
        return data.photo_url;
      } else {
        console.log('No photo found for', destination);
        return null;
      }
    } catch (error) {
      console.error('Error fetching photo for', destination, ':', error);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      loadUserTrips();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Fetch photos for trips that don't have existing photos
  useEffect(() => {
    if (savedTrips.length > 0) {
      savedTrips.forEach(async (trip) => {
        const existingPhoto = getTripPhoto(trip);
        if (!existingPhoto && !tripPhotos[trip.id]) {
          console.log('Fetching photo for trip:', trip.destination);
          const photoUrl = await fetchDestinationPhoto(trip.destination);
          if (photoUrl) {
            setTripPhotos(prev => ({
              ...prev,
              [trip.id]: photoUrl
            }));
          }
        }
      });
    }
  }, [savedTrips]);

  const loadUserTrips = async () => {
    try {
      setLoading(true);
      const trips = await getUserTrips(user.uid);
      setSavedTrips(trips);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (confirm('Are you sure you want to delete this trip?')) {
      try {
        await deleteTrip(tripId);
        setSavedTrips(savedTrips.filter(trip => trip.id !== tripId));
      } catch (error) {
        console.error('Error deleting trip:', error);
        alert('Failed to delete trip. Please try again.');
      }
    }
  };

  const handleViewTrip = (trip) => {
    // Store trip data and navigate to itinerary page
    sessionStorage.setItem('itineraryData', JSON.stringify(trip));
    router.push('/itinerary');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navbar />
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-full">
                <Bookmark className="h-6 w-6 text-white" />
              </div>
              Saved Trips
            </h1>
            <p className="text-gray-600">
              {savedTrips.length} {savedTrips.length === 1 ? 'trip' : 'trips'} saved
            </p>
          </div>
          <Button
            onClick={() => router.push('/search')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Button>
        </div>

        {!user ? (
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold mb-4">Sign In to View Your Trips</h2>
              <p className="text-gray-600 mb-6">
                Sign in with Google to save and view your travel itineraries!
              </p>
              <GoogleSignIn className="mx-auto">
                Sign In with Google
              </GoogleSignIn>
            </CardContent>
          </Card>
        ) : loading ? (
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Loading your trips...</p>
            </CardContent>
          </Card>
        ) : savedTrips.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h2 className="text-2xl font-bold mb-4">No Saved Trips Yet</h2>
              <p className="text-gray-600 mb-6">
                Start planning your next adventure and save your favorite itineraries here!
              </p>
              <Button
                onClick={() => router.push('/search')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Plan Your First Trip
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedTrips.map((trip) => (
              <Card key={trip.id} className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                {/* Destination Photo */}
                <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500">
                  <img
                    src={getTripPhoto(trip) || tripPhotos[trip.id] || 'https://picsum.photos/400/300?random=999'}
                    alt={trip.destination}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  {/* Overlay with destination name */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <div className="text-white">
                      <h3 className="text-xl font-bold drop-shadow-lg">{trip.destination}</h3>
                    </div>
                  </div>
                  {/* Fallback gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center" style={{display: 'none'}}>
                    <div className="text-white text-center">
                      <div className="text-4xl mb-2">✈️</div>
                      <h3 className="text-xl font-bold">{trip.destination}</h3>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Trip Header */}
                    <div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {trip.tripLength} {trip.tripLength === 1 ? 'day' : 'days'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {trip.party}
                        </span>
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Type:</span>
                        <span className="capitalize">{trip.tripType}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Budget:</span>
                        <span className="capitalize">{trip.budget}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Saved:</span>
                        <span>{trip.createdAt ? new Date(trip.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}</span>
                      </div>
                    </div>

                    {/* Activities Preview */}
                    {trip.itinerary && trip.itinerary.days && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Itinerary Preview:</h4>
                        <div className="text-sm text-gray-600">
                          {trip.itinerary.days.length} {trip.itinerary.days.length === 1 ? 'day' : 'days'} planned
                        </div>
                        <div className="text-sm text-gray-600">
                          {trip.itinerary.days.reduce((total, day) => total + day.activities.length, 0)} activities
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleViewTrip(trip)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleDeleteTrip(trip.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
