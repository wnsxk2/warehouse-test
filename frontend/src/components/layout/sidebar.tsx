'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Warehouse, Package, History, Settings, Users, ClipboardList, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Warehouses', href: '/warehouses', icon: Warehouse },
  { name: 'Items', href: '/items', icon: Package },
  { name: 'Stock Summary', href: '/stock-summary', icon: ClipboardList },
  { name: 'Transactions', href: '/transactions', icon: History },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Admin-only navigation items
const adminNavigation = [
  { name: 'Management', href: '/management', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Combine navigation items based on user role
  const allNavigation = user?.role === 'ADMIN'
    ? [...navigation, ...adminNavigation]
    : navigation;

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-gray-50 border-r border-gray-200">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {allNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive
                      ? 'bg-gray-200 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 flex-shrink-0 h-5 w-5'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
