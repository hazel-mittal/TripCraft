import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, User, Settings } from 'lucide-react';

export default function UserProfile({ onClose }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      if (onClose) onClose();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-80 shadow-xl">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* User Avatar */}
          <div className="mx-auto w-20 h-20 rounded-full overflow-hidden border-4 border-blue-500">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div>
            <h3 className="text-lg font-bold">{user?.displayName || 'User'}</h3>
            <p className="text-gray-600 text-sm">{user?.email}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleLogout}
              disabled={loading}
              variant="outline"
              className="w-full flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              {loading ? 'Signing out...' : 'Sign Out'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
