import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Share2, Heart, Calendar, MapPin, Clock, DollarSign, Users, Plane, Lightbulb } from "lucide-react";
import { saveTrip } from "@/lib/firestore";
import Navbar from "@/components/Navbar";

export default function ItineraryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [itineraryData, setItineraryData] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dayImages, setDayImages] = useState({});
  const [activityImages, setActivityImages] = useState({});

  // Function to fetch Google Places photo
  const fetchGooglePlacesPhoto = async (photoReference, maxWidth = 400) => {
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`);
      if (response.ok) {
        return response.url;
      }
    } catch (error) {
      console.error('Error fetching Google Places photo:', error);
    }
    return null;
  };

  // Function to get destination photo from backend
  const fetchDestinationPhoto = async (destination) => {
    try {
      const response = await fetch('http://localhost:8000/api/destination-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ destination }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.photo_url;
      }
    } catch (error) {
      console.error('Error fetching destination photo:', error);
    }
    return null;
  };

  useEffect(() => {
    // Get itinerary data from sessionStorage
    const data = sessionStorage.getItem('itineraryData');
    if (!data) {
      router.push('/search');
      return;
    }
    const parsedData = JSON.parse(data);
    setItineraryData(parsedData);

    // Load images for the itinerary
    const loadImages = async () => {
      if (!parsedData.itinerary?.days) return;

      const newDayImages = {};
      const newActivityImages = {};

      // Load day header images
      for (let i = 0; i < parsedData.itinerary.days.length; i++) {
        const day = parsedData.itinerary.days[i];
        // Get a photo from the first activity of the day, or use destination photo
        if (day.activities && day.activities.length > 0) {
          const firstActivity = day.activities[0];
          if (firstActivity.photo_url) {
            newDayImages[day.day] = firstActivity.photo_url;
          } else if (firstActivity.photo_reference) {
            const photoUrl = await fetchGooglePlacesPhoto(firstActivity.photo_reference);
            if (photoUrl) {
              newDayImages[day.day] = photoUrl;
            }
          }
        }
        
        // If no day image yet, try to get destination photo
        if (!newDayImages[day.day]) {
          const destPhoto = await fetchDestinationPhoto(parsedData.destination);
          if (destPhoto) {
            newDayImages[day.day] = destPhoto;
          }
        }
      }

      // Load activity images
      for (const day of parsedData.itinerary.days) {
        if (day.activities) {
          for (const activity of day.activities) {
            const activityKey = `${day.day}-${activity.name}`;
            if (activity.photo_url) {
              newActivityImages[activityKey] = activity.photo_url;
            } else if (activity.photo_reference) {
              const photoUrl = await fetchGooglePlacesPhoto(activity.photo_reference);
              if (photoUrl) {
                newActivityImages[activityKey] = photoUrl;
              }
            }
          }
        }
      }

      setDayImages(newDayImages);
      setActivityImages(newActivityImages);
    };

    loadImages();
  }, [router]);

  const handleSaveTrip = async () => {
    if (!itineraryData) return;
    
    if (!user) {
      alert('Please sign in to save your trips!');
      return;
    }

    setSaving(true);
    try {
      const tripData = {
        destination: itineraryData.destination,
        tripLength: itineraryData.tripLength,
        budget: itineraryData.budget,
        tripType: itineraryData.tripType,
        party: itineraryData.party,
        interests: itineraryData.interests,
        selectedPlaces: itineraryData.selectedPlaces,
        itinerary: itineraryData.itinerary
      };

      await saveTrip(user.uid, tripData);
      setSaved(true);
      
      // Show success message
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving trip:', error);
      alert('Failed to save trip. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My ${itineraryData.destination} Itinerary`,
          text: `Check out my ${itineraryData.tripLength}-day trip to ${itineraryData.destination}!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (!itineraryData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading your itinerary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navbar />
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center mb-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-full mr-3">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold">Your Perfect Itinerary</h1>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{itineraryData.destination}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{itineraryData.tripLength} {itineraryData.tripLength === 1 ? 'day' : 'days'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Plane className="h-4 w-4" />
                <span className="capitalize">{itineraryData.tripType}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="capitalize">{itineraryData.party}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/places')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Places
            </Button>
            <Button
              onClick={() => router.push('/search')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              New Search
            </Button>
          </div>
        </div>

        {/* Trip Summary Card */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="font-semibold">Destination</h3>
                <p className="text-gray-600">{itineraryData.destination}</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="font-semibold">Duration</h3>
                <p className="text-gray-600">{itineraryData.tripLength} {itineraryData.tripLength === 1 ? 'day' : 'days'}</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Plane className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="font-semibold">Trip Type</h3>
                <p className="text-gray-600 capitalize">{itineraryData.tripType}</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="font-semibold">Travel Party</h3>
                <p className="text-gray-600 capitalize">{itineraryData.party}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Itinerary Days */}
        {itineraryData.itinerary && itineraryData.itinerary.days && (
          <div className="space-y-8">
            {itineraryData.itinerary.days.map((day, dayIndex) => (
              <Card key={day.day} className="shadow-lg">
                <CardContent className="p-0">
                  {/* Day Header */}
                  <div className="relative text-white p-6 rounded-t-xl overflow-hidden h-32">
                    {dayImages[day.day] ? (
                      <>
                        <div 
                          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                          style={{ backgroundImage: `url(${dayImages[day.day]})` }}
                        ></div>
                        <div className="absolute inset-0 bg-black opacity-50"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-70"></div>
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                    )}
                    <div className="relative z-10 h-full flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold">Day {day.day}</h3>
                        <p className="text-blue-100 mt-1">
                          {dayIndex === 0 ? 'Arrival & First Impressions' : 
                           dayIndex === itineraryData.itinerary.days.length - 1 ? 'Final Day & Departure' : 
                           'Exploring & Adventures'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="bg-white bg-opacity-20 rounded-full p-3 backdrop-blur-sm">
                          <Calendar className="h-8 w-8" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activities Timeline */}
                  <div className="p-6 space-y-6">
                    {day.activities.map((activity, actIndex) => (
                      <div key={actIndex} className="relative">
                        {/* Timeline Line */}
                        {actIndex < day.activities.length - 1 && (
                          <div className="absolute left-6 top-16 w-0.5 h-16 bg-gray-200"></div>
                        )}
                        
                        {/* Activity Card */}
                        <div className="flex gap-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-300">
                          {/* Time Badge */}
                          <div className="flex-shrink-0">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-sm">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <Clock className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          </div>

                          {/* Activity Content */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                {activity.time}
                              </span>
                              {activity.cost && (
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {activity.cost}
                                </span>
                              )}
                            </div>
                            
                            <h4 className="text-xl font-bold text-gray-900">{activity.name}</h4>
                            <p className="text-gray-700 leading-relaxed">{activity.description}</p>
                            
                            {activity.tips && (
                              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                                <div className="flex items-start">
                                  <div className="flex-shrink-0">
                                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-yellow-800">Local Tip</p>
                                    <p className="text-sm text-yellow-700 mt-1">{activity.tips}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="mt-4">
                              {activity.photo_url || activityImages[`${day.day}-${activity.name}`] ? (
                                <img 
                                  src={activity.photo_url || activityImages[`${day.day}-${activity.name}`]} 
                                  alt={activity.name} 
                                  className="w-full h-48 object-cover rounded-lg shadow-sm"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) {
                                      e.target.nextSibling.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              {/* Show fallback image for every 3rd activity or first activity of each day */}
                              {!activity.photo_url && !activityImages[`${day.day}-${activity.name}`] && 
                               (actIndex === 0 || actIndex % 3 === 0) && (
                                <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg shadow-sm flex items-center justify-center">
                                  <div className="text-center text-gray-500">
                                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-60" />
                                    <p className="text-sm font-medium">{activity.name}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mt-8 pt-8 border-t">
          <Button
            onClick={handleSaveTrip}
            disabled={saving || saved}
            className={`flex items-center gap-2 ${
              saved ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Heart className="w-4 h-4" />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Trip'}
          </Button>
          
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Print Itinerary
          </Button>
          
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Trip
          </Button>
          
          <Button
            onClick={() => router.push('/search')}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Plan Another Trip
          </Button>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
            ✅ Trip saved successfully!
          </div>
        )}
      </div>
    </div>
  );
}
