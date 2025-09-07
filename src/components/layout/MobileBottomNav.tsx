'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Home, 
  MapPin, 
  Users, 
  Package, 
  RefreshCw, 
  Truck, 
  TrendingUp,
  MoreHorizontal,
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

  const getActiveNav = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('tab') || 'overview';
    }
    return 'overview';
  };

  const activeNav = getActiveNav();

  const handleNavClick = (navId: string, href: string) => {
    console.log('MobileBottomNav: Navigation clicked', { navId, href });
    
    // Update URL parameters if needed
    if (href.includes('?tab=')) {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', navId);
      window.history.pushState({}, '', url.toString());
      
      // Dispatch custom event to notify dashboard of URL change
      window.dispatchEvent(new Event('urlchange'));
    }
    
    // Navigate to the href
    router.push(href);
    setShowMoreMenu(false);
  };

  console.log('MobileBottomNav: About to render', {
    activeNav,
    navItemsCount: navItems.length,
    navItems: navItems.map(item => item.id)
  });

  return (
    <>
      {/* Mobile Bottom Navigation - Professional Style */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <nav className="flex justify-around items-center py-2" aria-label="Mobile navigation">
            {/* First 3 navigation items */}
            {navItems.slice(0, 3).map((item) => {
              const isActive = activeNav === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id, item.href)}
                  className={`
                    flex flex-col items-center justify-center px-4 py-2 min-w-[60px] max-w-[80px]
                    transition-all duration-200 rounded-lg
                    ${isActive 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`
                      h-5 w-5 mb-1
                      ${isActive ? 'text-blue-600' : 'text-gray-400'}
                      transition-colors duration-200
                    `}>
                      {item.icon}
                    </div>
                    {item.badge && (
                      <Badge 
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs min-w-[16px] border border-white"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                  </div>
                  <span className={`
                    text-xs font-medium text-center leading-tight w-full
                    ${isActive ? 'text-blue-600' : 'text-gray-600'}
                    transition-colors duration-200
                  `}>
                    {item.label}
                  </span>
                </button>
              );
            })}
            
            {/* More Menu Button */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`
                  flex flex-col items-center justify-center px-4 py-2 min-w-[60px] max-w-[80px]
                  transition-all duration-200 rounded-lg
                  ${showMoreMenu 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className="relative flex-shrink-0">
                  <MoreHorizontal className={`
                    h-5 w-5 mb-1
                    ${showMoreMenu ? 'text-blue-600' : 'text-gray-400'}
                    transition-colors duration-200
                  `} />
                </div>
                <span className={`
                  text-xs font-medium text-center leading-tight w-full
                  ${showMoreMenu ? 'text-blue-600' : 'text-gray-600'}
                  transition-colors duration-200
                `}>
                  More
                </span>
              </button>
              
              {/* More Menu Dropdown */}
              {showMoreMenu && navItems.length > 3 && (
                <div className="absolute bottom-full right-0 mb-3 z-40 sm:right-auto sm:left-1/2 sm:transform sm:-translate-x-1/2">
                  {/* Menu container with professional styling */}
                  <div className="relative z-20">
                    {/* Arrow pointing to More button */}
                    <div className="absolute top-full right-4 sm:right-auto sm:left-1/2 sm:transform sm:-translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
                    
                    {/* Menu header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-t-lg border-b border-blue-800">
                      <h3 className="text-sm font-semibold">More Options</h3>
                      <p className="text-xs text-blue-100 mt-0.5">Additional navigation</p>
                    </div>
                    
                    {/* Menu items list */}
                    <div className="bg-white rounded-b-lg shadow-2xl border border-gray-200 min-w-[240px] max-h-[70vh] overflow-y-auto">
                      <div className="p-1">
                        {navItems.slice(3).map((item, index) => {
                          const isActive = activeNav === item.id;
                          
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                handleNavClick(item.id, item.href);
                                setShowMoreMenu(false);
                              }}
                              className={`
                                w-full flex items-center px-3 py-3 rounded-lg text-sm mb-1 last:mb-0
                                transition-all duration-200 group relative overflow-hidden
                                ${isActive 
                                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-l-4 border-blue-600 shadow-sm' 
                                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-md'
                                }
                              `}
                            >
                              {/* Icon container */}
                              <div className={`
                                flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mr-3
                                transition-all duration-200
                                ${isActive 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                                }
                              `}>
                                <div className="h-4 w-4">
                                  {item.icon}
                                </div>
                              </div>
                              
                              {/* Text content */}
                              <div className="flex-1 text-left">
                                <div className={`font-medium ${isActive ? 'text-blue-700' : 'text-gray-800 group-hover:text-gray-900'}`}>
                                  {item.label}
                                </div>
                                <div className={`text-xs mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-600'}`}>
                                  Navigate to {item.label.toLowerCase()}
                                </div>
                              </div>
                              
                              {/* Badge */}
                              {item.badge && (
                                <Badge 
                                  variant={isActive ? "default" : "secondary"}
                                  className={`
                                    ml-2 px-2 py-1 text-xs font-medium rounded-full
                                    ${isActive 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-gray-200 text-gray-700 group-hover:bg-blue-200 group-hover:text-blue-700'
                                    }
                                  `}
                                >
                                  {item.badge > 99 ? '99+' : item.badge}
                                </Badge>
                              )}
                              
                              {/* Active indicator */}
                              {isActive && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Menu footer */}
                      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 rounded-b-lg">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{navItems.length - 3} items</span>
                          <span>Tap to close</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Spacer for bottom nav */}
      <div className="lg:hidden h-16"></div>
    </>
  );
}