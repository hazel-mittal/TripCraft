import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plane, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  MapPin, 
  Heart, 
  Users,
  Star,
  Sparkles
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered",
      description: "Custom itineraries based on your interests and preferences"
    },
    {
      icon: Clock,
      title: "Time-Optimized", 
      description: "Efficiently planned schedules that maximize your experience"
    },
    {
      icon: DollarSign,
      title: "Budget-Friendly",
      description: "Options for every budget from backpacker to luxury"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Tell Us Your Preferences",
      description: "Share your destination, budget, travel style, and interests"
    },
    {
      number: "2", 
      title: "Customize Attractions",
      description: "Pick specific places you want to visit or let us surprise you"
    },
    {
      number: "3",
      title: "Get Your Itinerary", 
      description: "Receive a detailed day-by-day plan for your perfect trip"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full mr-4">
                <Plane className="h-12 w-12 text-white" />
            </div>
              <h1 className="text-6xl font-bold text-gray-900">TripCraft</h1>
            </div>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your AI-powered travel companion that creates personalized itineraries 
              tailored to your preferences, budget, and travel style.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => router.push('/search')}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg"
              >
                Start Planning Your Trip
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              {user && (
                <Button 
                  onClick={() => router.push('/saved-trips')}
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-lg rounded-xl"
                >
                  <Heart className="mr-2 h-5 w-5" />
                  View Saved Trips
                </Button>
              )}
                  </div>
          </div>
              </div>
            </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose TripCraft?</h2>
            <p className="text-xl text-gray-600">Experience the future of travel planning</p>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="text-center p-8 hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                      <IconComponent className="h-8 w-8 text-white" />
                              </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>

      {/* How It Works Section */}
      <div className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to your perfect vacation</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center text-2xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Plan Your Next Adventure?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of travelers who trust TripCraft for their perfect trips
          </p>
          <Button 
            onClick={() => router.push('/search')}
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-xl shadow-lg"
          >
            <Plane className="mr-2 h-5 w-5" />
            Start Planning Now
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Plane className="h-8 w-8 text-blue-400 mr-2" />
            <span className="text-2xl font-bold">TripCraft</span>
          </div>
          <p className="text-gray-400">
            © 2024 TripCraft. Your perfect trip awaits.
          </p>
        </div>
      </div>
    </div>
  );
}