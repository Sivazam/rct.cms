'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Users, 
  TrendingUp,
  Settings,
  User,
  LogOut
} from 'lucide-react';

interface MobileBottomNavProps {
  userRole?: 'admin' | 'operator';
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

export default function MobileBottomNav({ userRole = 'admin', userName = 'User', onLogout }: MobileBottomNavProps) {
  // Get router and pathname hooks at the top level (rules of hooks)
  const pathname = usePathname();
  const router = useRouter();

  // Safety check for onLogout
  const safeOnLogout = () => {
    try {
      if (typeof onLogout === 'function') {
        onLogout();
      } else {
        console.warn('MobileBottomNav: onLogout is not a function');
      }
    } catch (error) {
      console.error('MobileBottomNav: Error in onLogout:', error);
    }
  };

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
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
      href: '/dashboard/admin?tab=overview',
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
      id: 'analytics',
      label: 'Analytics',
      icon: <TrendingUp className="h-5 w-5" />,
      href: '/dashboard/admin?tab=analytics',
      isMain: true
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      href: '/dashboard/admin?tab=settings',
      isMain: true
    }
  ];

  const operatorNavItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
      href: '/dashboard/operator?tab=overview',
      isMain: true
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="h-5 w-5" />,
      href: '/dashboard/operator?tab=profile',
      isMain: false
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: <LogOut className="h-5 w-5" />,
      href: '#', // Will handle logout directly
      isMain: false
    }
  ];

  const navItems = userRole === 'admin' ? adminNavItems : operatorNavItems;

  // Safety check: if userRole is invalid, default to admin
  const safeUserRole = userRole === 'admin' || userRole === 'operator' ? userRole : 'admin';
  const safeNavItems = safeUserRole === 'admin' ? adminNavItems : operatorNavItems;

  const getActiveNav = () => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('tab') || 'overview';
      }
    } catch (error) {
      console.warn('MobileBottomNav: Error accessing window or URL:', error);
    }
    return 'overview';
  };

  const activeNav = getActiveNav();

  const handleNavClick = (navId: string, href: string) => {
    try {
      console.log('MobileBottomNav: Navigation clicked', { navId, href });
      
      // Handle logout specially
      if (navId === 'logout') {
        safeOnLogout();
        return;
      }
      
      // Update URL parameters if needed
      if (href.includes('?tab=') && typeof window !== 'undefined') {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('tab', navId);
          window.history.pushState({}, '', url.toString());
          
          // Dispatch custom event to notify dashboard of URL change
          window.dispatchEvent(new Event('urlchange'));
        } catch (urlError) {
          console.warn('MobileBottomNav: Error updating URL:', urlError);
        }
      }
      
      // Navigate to the href
      if (router && typeof router.push === 'function') {
        router.push(href);
      } else {
        console.warn('MobileBottomNav: Router push not available, using fallback');
        if (typeof window !== 'undefined') {
          window.location.href = href;
        }
      }
    } catch (error) {
      console.error('MobileBottomNav: Error in handleNavClick:', error);
    }
  };

  console.log('MobileBottomNav: About to render', {
    activeNav,
    userRole,
    safeUserRole,
    navItemsCount: safeNavItems.length,
    navItems: safeNavItems.map(item => item.id)
  });

  return (
    <>
      {/* Mobile Bottom Navigation - Professional Style */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white border-t border-orange-200 shadow-lg">
          <nav className="flex justify-around items-center py-2" aria-label="Mobile navigation">
            {/* All 4 navigation items */}
            {safeNavItems.map((item) => {
              const isActive = activeNav === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id, item.href)}
                  className={`
                    flex flex-col items-center justify-center px-4 py-2 min-w-[60px] max-w-[80px]
                    transition-all duration-200 rounded-lg
                    ${isActive 
                      ? 'text-orange-600 bg-orange-50' 
                      : 'text-gray-500 hover:text-orange-700 hover:bg-orange-50'
                    }
                  `}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`
                      h-5 w-5 mb-1
                      ${isActive ? 'text-orange-600' : 'text-gray-400'}
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
                    ${isActive ? 'text-orange-600' : 'text-gray-600'}
                    transition-colors duration-200
                  `}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Spacer for bottom nav */}
      <div className="lg:hidden h-16"></div>
    </>
  );
}