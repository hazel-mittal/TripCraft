import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, 
  Heart, 
  User, 
  Menu, 
  X, 
  Home,
  Search,
  Calendar,
  LogOut,
  Plane
} from "lucide-react";
import GoogleSignIn from "@/components/GoogleSignIn";
import UserProfile from "@/components/UserProfile";

export default function Navbar() {
  const router = useRouter();
  const { user, logout, signInWithGoogle } = useAuth();
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowUserProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserProfile(false);
      router.push('/search');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationItems = [
    { name: 'Plan Trip', href: '/search', icon: Search },
    { name: 'Saved Trips', href: '/saved-trips', icon: Heart },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => router.push('/')}
            >
              <Plane className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">TripCraft</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href;
              
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowUserProfile(!showUserProfile)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {user.displayName || user.email}
                  </span>
                </button>

                {showUserProfile && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user.displayName || 'User'}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    
                    <div className="py-2">
                      <button
                        onClick={() => {
                          router.push('/saved-trips');
                          setShowUserProfile(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Heart className="h-4 w-4 mr-3" />
                        Saved Trips
                      </button>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                  } catch (error) {
                    console.error('Sign in error:', error);
                  }
                }}
                className="hidden sm:flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md min-w-[160px] h-10 px-4 py-2 rounded-md text-sm font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              {showMobileMenu ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = router.pathname === item.href;
                
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      router.push(item.href);
                      setShowMobileMenu(false);
                    }}
                    className={`flex items-center space-x-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
              
              {!user && (
                <div className="pt-4 border-t border-gray-200">
                  <GoogleSignIn className="w-full">
                    Sign In
                  </GoogleSignIn>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
