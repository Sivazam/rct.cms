'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  MapPin, 
  Users, 
  Package, 
  RefreshCw, 
  Truck, 
  TrendingUp,
  Menu,
  LogOut,
  User,
  Settings
} from 'lucide-react';

interface MobileBottomNavProps {
  userRole: 'admin' | 'operator';
  userName: string;
  onLogout: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  isMain?: boolean;
}

export default function MobileBottomNav({ userRole, userName, onLogout }: MobileBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  console.log('MobileBottomNav: Component rendered', {
    userRole,
    userName,
    pathname,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : 'unknown'
  });

  const adminNavItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Home className="h-5 w-5" />,
      href: '/dashboard/admin',
      isMain: true
    },
    {
      id: 'locations',
      label: 'Locations',
      icon: <MapPin className="h-5 w-5" />,
      href: '/dashboard/admin?tab=locations',
      isMain: true
    },
    {
      id: 'operators',
      label: 'Operators',
      icon: <Users className="h-5 w-5" />,
      href: '/dashboard/admin?tab=operators',
      isMain: true
    },
    {
      id: 'entries',
      label: 'Entries',
      icon: <Package className="h-5 w-5" />,
      href: '/dashboard/admin?tab=entries',
      isMain: true
    },
    {
      id: 'renewals',
      label: 'Renewals',
      icon: <RefreshCw className="h-5 w-5" />,
      href: '/dashboard/admin?tab=renewals',
      isMain: true
    },
    {
      id: 'deliveries',
      label: 'Deliveries',
      icon: <Truck className="h-5 w-5" />,
      href: '/dashboard/admin?tab=deliveries',
      isMain: true
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <TrendingUp className="h-5 w-5" />,
      href: '/dashboard/admin?tab=analytics'
    }
  ];

  const operatorNavItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Home className="h-5 w-5" />,
      href: '/dashboard/operator',
      isMain: true
    },
    {
      id: 'entries',
      label: 'Entries',
      icon: <Package className="h-5 w-5" />,
      href: '/dashboard/operator?tab=entries',
      isMain: true
    },
    {
      id: 'renewals',
      label: 'Renewals',
      icon: <RefreshCw className="h-5 w-5" />,
      href: '/dashboard/operator?tab=renewals',
      isMain: true
    },
    {
      id: 'deliveries',
      label: 'Deliveries',
      icon: <Truck className="h-5 w-5" />,
      href: '/dashboard/operator?tab=deliveries',
      isMain: true
    }
  ];

  const navItems = userRole === 'admin' ? adminNavItems : operatorNavItems;
  const visibleItems = navItems; // Show ALL items in bottom nav
  const remainingItems = []; // No remaining items since we show everything

  console.log('MobileBottomNav: Navigation items calculated', {
    totalItems: navItems.length,
    visibleItems: visibleItems.length,
    remainingItems: remainingItems.length,
    visibleItems: visibleItems.map(item => item.id)
  });

  const handleNavClick = (href: string) => {
    router.push(href);
  };

  const getCurrentTab = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('tab') || 'overview';
    }
    return 'overview';
  };

  const currentTab = getCurrentTab();

  console.log('MobileBottomNav: About to render JSX', {
    currentTab,
    visibleItemsCount: visibleItems.length,
    isMobileView: typeof window !== 'undefined' ? window.innerWidth < 768 : 'unknown'
  });

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          {visibleItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`flex flex-col items-center justify-center h-full w-full rounded-none border-0 px-1 ${
                currentTab === item.id ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              onClick={() => handleNavClick(item.href)}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] mt-1 leading-none">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Spacer for bottom nav */}
      <div className="md:hidden h-16"></div>
    </>
  );
}