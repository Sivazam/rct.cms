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
  const mainItems = navItems.filter(item => item.isMain);
  const visibleItems = mainItems.slice(0, 5); // Show max 5 items in bottom nav
  const remainingItems = [...mainItems.slice(5), ...moreItems]; // Put remaining main items and non-main items in More

  console.log('MobileBottomNav: Navigation items calculated', {
    totalItems: navItems.length,
    mainItems: mainItems.length,
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
    mainItemsCount: mainItems.length,
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
              className={`flex flex-col items-center justify-center h-full w-full rounded-none border-0 ${
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
              <span className="text-xs mt-1">{item.label}</span>
            </Button>
          ))}
          
          {/* More Menu */}
          <Sheet open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center h-full w-full rounded-none border-0 ${
                  isMoreMenuOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
                }`}
              >
                <Menu className="h-5 w-5" />
                <span className="text-xs mt-1">More</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[60vh]">
              <SheetHeader>
                <SheetTitle>More Options</SheetTitle>
                <SheetDescription>
                  Additional features and settings
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-4 mt-6">
                {/* User Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{userName}</p>
                      <p className="text-sm text-gray-600 capitalize">{userRole}</p>
                    </div>
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="space-y-2">
                  {remainingItems.map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className={`w-full justify-start ${
                        currentTab === item.id ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
                      }`}
                      onClick={() => {
                        handleNavClick(item.href);
                        setIsMoreMenuOpen(false);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon}
                        <span>{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>

                {/* Settings & Logout */}
                <div className="border-t pt-4 space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                    }}
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    Settings
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      onLogout();
                      setIsMoreMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Spacer for bottom nav */}
      <div className="md:hidden h-16"></div>
    </>
  );
}