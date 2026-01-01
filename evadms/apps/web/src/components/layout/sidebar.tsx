'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ShoppingCart,
  Truck,
  ClipboardCheck,
  Database,
  BarChart3,
  Settings,
  LogOut,
  Cylinder,
  PackageX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/app/customers', icon: Users, permission: 'customers:read' },
  { name: 'Products', href: '/app/products', icon: Package, permission: 'products:read' },
  { name: 'Quotes', href: '/app/quotes', icon: FileText, permission: 'quotes:read' },
  { name: 'Orders', href: '/app/orders', icon: ShoppingCart, permission: 'orders:read' },
  { name: 'Schedule', href: '/app/schedule', icon: Truck, permission: 'schedule:read' },
  { name: 'Inventory', href: '/app/inventory', icon: Cylinder, permission: 'inventory:read' },
  { name: 'Foreign Cylinders', href: '/app/foreign-cylinders', icon: PackageX, permission: 'foreign_cylinders:read' },
  { name: 'Checklists', href: '/app/checklists', icon: ClipboardCheck, permission: 'checklists:read' },
  { name: 'Reports', href: '/app/reports', icon: BarChart3, permission: 'reports:read' },
  { name: 'Users', href: '/app/users', icon: Users, permission: 'users:read' },
  { name: 'Settings', href: '/app/settings', icon: Settings, permission: 'settings:read' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuthStore();

  // Show all navigation items - permission filtering handled by API
  // Admin users see everything, others will get 403 on restricted pages
  const filteredNavigation = navigation;

  return (
    <div className="flex h-full w-64 flex-col bg-eva-dark text-white">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-eva-primary flex items-center justify-center">
            <span className="font-bold text-white">E</span>
          </div>
          <span className="text-xl font-bold">EVA DMS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-eva-primary text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-eva-primary flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
