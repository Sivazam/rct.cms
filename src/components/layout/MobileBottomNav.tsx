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

  console.log('MobileBottomNav: Component initialized', {
    userRole,
    userName,
    pathname,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : 'unknown',
    windowExists: typeof window !== 'undefined'
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
    visibleItems: visibleItems.map(item => item.id),
    isMobileView: typeof window !== 'undefined' ? window.innerWidth < 768 : 'unknown'
  });

  return (
    <>
      {/* Mobile Bottom Navigation - TEST VERSION - Always Visible */}
      <div className="fixed bottom-0 left-0 right-0 bg-red-500 border-t-4 border-red-700 z-[9999] shadow-2xl">
        <div className="flex overflow-x-auto whitespace-nowrap h-20 bg-red-400">
          {visibleItems.map((item, index) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`flex flex-col items-center justify-center h-full min-w-[80px] max-w-[100px] rounded-none border-0 px-1 flex-shrink-0 ${
                currentTab === item.id 
                  ? 'text-white bg-red-600 border-t-4 border-white' 
                  : 'text-white hover:bg-red-500'
              }`}
              onClick={() => {
                console.log('MobileBottomNav: Clicked item', { id: item.id, label: item.label, href: item.href });
                handleNavClick(item.href);
              }}
            >
              <div className="relative">
                <div className="text-white">
                  {item.icon}
                </div>
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-yellow-400 text-black"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] mt-1 leading-none text-center px-1 font-bold truncate w-full text-white">
                {item.label}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Spacer for bottom nav */}
      <div className="h-20"></div>
    </>
  );
}