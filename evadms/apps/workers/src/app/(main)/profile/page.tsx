'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Shield, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { authApi } from '@/lib/api';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const userData = authApi.getUser();
    if (userData) {
      setUser(userData);
    }
  }, []);

  const handleLogout = () => {
    authApi.logout();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse">
          <div className="h-12 w-12 rounded-full bg-eva-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Your account details</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-eva-primary/10 flex items-center justify-center mb-4">
              <User className="h-10 w-10 text-eva-primary" />
            </div>
            <h2 className="text-xl font-bold">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex gap-2 mt-3">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 bg-eva-primary/10 text-eva-primary rounded-full text-sm font-medium capitalize"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardContent className="p-0 divide-y">
          <div className="flex items-center gap-4 p-4">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>

          {user.phone && (
            <div className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Phone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{user.phone}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 p-4">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{user.roles.join(', ')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">EVA Gas Workers</p>
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Depot Management</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="destructive"
        className="w-full"
        size="lg"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-5 w-5" />
        Sign Out
      </Button>
    </div>
  );
}
