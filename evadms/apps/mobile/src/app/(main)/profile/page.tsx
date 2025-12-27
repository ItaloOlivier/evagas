'use client';

import { useRouter } from 'next/navigation';
import { User, Truck, Phone, Mail, Shield, LogOut, ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    { icon: User, label: 'Personal Information', href: '/profile/edit' },
    { icon: Truck, label: 'My Vehicles', href: '/profile/vehicles' },
    { icon: Shield, label: 'Safety Certifications', href: '/profile/certifications' },
    { icon: Settings, label: 'Settings', href: '/profile/settings' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      {/* User card */}
      <Card className="bg-eva-primary text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-3xl font-bold">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-white/80 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-white/80">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <Phone className="h-4 w-4" />
              <span className="text-sm">+27 82 123 4567</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-eva-primary">156</p>
            <p className="text-xs text-muted-foreground">Deliveries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">98%</p>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">4.9</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Menu items */}
      <Card>
        <CardContent className="p-0 divide-y">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              onClick={() => router.push(item.href)}
            >
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="flex-1 text-left font-medium">{item.label}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Logout button */}
      <Button
        variant="outline"
        size="lg"
        className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-5 w-5" />
        Sign Out
      </Button>

      {/* Version info */}
      <p className="text-center text-xs text-muted-foreground">
        EVA DMS Mobile v1.0.0
      </p>
    </div>
  );
}
