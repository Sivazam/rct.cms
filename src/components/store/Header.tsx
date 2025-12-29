'use client';


import { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Menu, Search, Heart, ShoppingCart, User, Package, LogOut, Phone, MapPin, Edit, UserPlus, AlertCircle, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';
import { isUserAuthenticated, getCurrentUser } from '@/lib/auth';
import { isProfileComplete, getCurrentUserProfile } from '@/lib/profileCompletionMiddleware';
import { useRouter, usePathname } from 'next/navigation';
import { wishlistService } from '@/lib/services/wishlistService';
import { SearchDropdown } from './SearchDropdown';


interface HeaderProps {
  onSearch: (query: string) => void;
  clearSearch?: () => void;
  children?: ReactNode;
}


export function Header({ onSearch, clearSearch, children }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [desktopSearchQuery, setDesktopSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { getTotalItems, openCart } = useCartStore();
  const router = useRouter();
  const pathname = usePathname();

  // Sync mobile search query with URL search parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const searchParam = urlParams.get('search');
      
      // Update mobile search input to match URL search parameter
      if (searchParam !== null) {
        setSearchQuery(searchParam);
      }
    }
  }, [pathname]); // Re-run when pathname changes

  // Detect if we're on the homepage
  const isHomepage = pathname === '/';
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  useEffect(() => {
    setIsMounted(true);
   
    // Function to check authentication status and get current user
    const checkAuth = async () => {
      const authStatus = isUserAuthenticated();
      setIsAuth(authStatus);
      if (authStatus) {
        const userToken = getCurrentUser();
        if (userToken) {
          // Fetch complete user profile from userService
          try {
            const { userService } = await import('@/lib/services');
            const fullUser = await userService.getUserByPhoneNumber(userToken.phoneNumber);
            setCurrentUser(fullUser || userToken); // Fallback to token if full user not found
          } catch (error) {
            console.error('Error fetching user profile:', error);
            setCurrentUser(userToken); // Fallback to token data
          }
        }
       
        // Check profile completion
        try {
          setIsCheckingProfile(true);
          const profileCompleteStatus = await isProfileComplete();
          console.log('Profile completion check result:', profileCompleteStatus);
          setProfileComplete(profileCompleteStatus);
        } catch (error) {
          console.error('Error checking profile completion:', error);
          setProfileComplete(false);
        } finally {
          setIsCheckingProfile(false);
        }
      } else {
        setCurrentUser(null);
        setProfileComplete(null);
      }
    };
   
    // Load wishlist count
    const loadWishlistCount = async () => {
      try {
        const count = await wishlistService.getWishlistCount();
        setWishlistCount(count);
      } catch (error) {
        console.error('Error loading wishlist count:', error);
      }
    };
   
    // Check authentication and load wishlist count immediately
    checkAuth();
    loadWishlistCount();
   
    // Set up event listeners for auth state changes
    const handleStorageChange = () => {
      checkAuth();
      loadWishlistCount();
    };
   
    const handleAuthStateChange = () => {
      console.log('Auth state change event received');
      // Add a small delay to ensure Firestore updates are committed
      setTimeout(() => {
        checkAuth();
        loadWishlistCount();
      }, 500);
    };
   
    const handleWishlistChange = () => {
      console.log('Wishlist change event received');
      loadWishlistCount();
    };
   
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-state-changed', handleAuthStateChange);
    window.addEventListener('wishlist-changed', handleWishlistChange);
   
    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
      window.removeEventListener('wishlist-changed', handleWishlistChange);
    };
  }, []);


  const handleLogout = () => {
    // Clear the auth token cookie
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    // Clear localStorage fallback
    localStorage.removeItem('auth-token');
    setIsAuth(false);
    setCurrentUser(null);
    router.push('/');
  };


  const handleNavigation = (path: string) => {
    setIsSidebarOpen(false);
    router.push(path);
  };


  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    if (phone.startsWith('+91')) {
      return `+91 ${phone.slice(3, 8)} ${phone.slice(8)}`;
    }
    return phone;
  };


  const getDisplayName = (user: any) => {
    if (!user) return 'User';
    // If user has a name property (from full profile), use it
    if (user.name && user.name.trim() !== '') return user.name;
    // If user has phoneNumber (from token), use last 4 digits as fallback
    if (user.phoneNumber) return `User ${user.phoneNumber.slice(-4)}`;
    // Final fallback
    return 'User';
  };


  const getUserEmail = (user: any) => {
    if (!user) return null;
    // Return email if available from full profile
    return user.email || null;
  };


  const getUserPhone = (user: any) => {
    if (!user) return null;
    // Return phoneNumber from either full profile or token
    return user.phoneNumber || null;
  };

  // Search handlers
  const handleDesktopSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDesktopSearchQuery(value);
    
    if (isHomepage) {
      // On homepage: instant search (current behavior)
      onSearch(value);
      setShowSearchDropdown(false);
    } else {
      // On other pages: show dropdown for desktop
      setShowSearchDropdown(true);
    }
  };

  const handleDesktopSearchFocus = () => {
    if (!isHomepage && desktopSearchQuery.trim()) {
      setShowSearchDropdown(true);
    }
  };

  const handleDesktopSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (desktopSearchQuery.trim()) {
      if (isHomepage) {
        // On homepage: use existing instant search
        onSearch(desktopSearchQuery);
      } else {
        // On other pages: redirect to homepage with search results
        router.push(`/?search=${encodeURIComponent(desktopSearchQuery.trim())}`);
        setShowSearchDropdown(false);
      }
    }
  };

  const handleMobileSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Use instant search like desktop mode
    if (isHomepage) {
      // On homepage: instant search
      onSearch(value);
    } else {
      // On other pages: show dropdown for mobile
      setShowSearchDropdown(true);
    }
  };

  const handleMobileSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Dismiss keyboard by blurring the input
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }
      
      // Close mobile search and dropdown
      setIsSearchOpen(false);
      setShowSearchDropdown(false);
      
      // If not on homepage, redirect to homepage with search results
      if (!isHomepage && searchQuery.trim()) {
        router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const handleMobileSearchClear = () => {
    // Just close the search - don't clear the search query
    // This keeps the search term in the URL and maintains filtering
    setIsSearchOpen(false);
  };

  const handleDesktopSearchClear = () => {
    setDesktopSearchQuery('');
    setShowSearchDropdown(false);
    if (isHomepage) {
      onSearch('');
    }
  };

  const handleSearchDropdownClose = () => {
    setShowSearchDropdown(false);
  };


  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-white">
              <nav className="space-y-6 mt-6 px-4">
                <Link href="/" className="block text-lg font-semibold text-black">
                  <div className="flex items-center space-x-3">
                    <div className="w-13 h-13 flex items-center justify-center">
                      <img
                        src="/logo-original.png"
                        alt="Sanathan Rudraksha Logo"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    {/* <div>
                      <span className="font-spiritual" style={{ color: '#755e3e' }}>Sanathan</span>
                      <br />
                      <span className="font-spiritual" style={{ color: '#755e3e' }}>Rudraksha</span>
                    </div> */}
                   <div className="text-center">
                    <span
                      className="block text-xl font-bold font-spiritual leading-none"
                      style={{ color: '#755e3e' }}
                    >
                      SANATHAN
                    </span>
                    <span
                      className="block text-sm font-bold font-spiritual -mt-1 leading-tight"
                      style={{ color: '#755e3e' }}
                    >
                      RUDRAKSHA
                    </span>
                  </div>


                  </div>
                </Link>
               
                {/* User Information Section - Only show if authenticated */}
                {isAuth && currentUser && (
                  <div className="space-y-4">
                    {/* Profile Completion Warning - Only show if profile is incomplete and not loading */}
                    {!isCheckingProfile && profileComplete === false && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-orange-800">Complete Your Profile</p>
                            <p className="text-xs text-orange-600">Please add your name and email</p>
                          </div>
                        </div>
                        <Link href="/auth/complete-profile" className="block mt-2">
                          <Button
                            className="w-full text-xs py-1.5"
                            style={{ backgroundColor: 'rgba(156,86,26,255)', color: 'white' }}
                          >
                            Complete Now
                          </Button>
                        </Link>
                      </div>
                    )}
                   
                    {/* Loading indicator for profile check */}
                    {isCheckingProfile && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          <span className="ml-2 text-xs text-gray-600">Checking profile...</span>
                        </div>
                      </div>
                    )}
                   
                    {/* User Details Row */}
                    <div className="flex items-start space-x-3">
                      {/* Left Column - Avatar */}
                      <Avatar className="h-14 w-14 flex-shrink-0">
                        <AvatarFallback className="bg-orange-100 text-orange-600 text-sm">
                          {getUserPhone(currentUser) ? getUserPhone(currentUser)!.slice(-2) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                     
                      {/* Right Column - User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-black">
                          {getDisplayName(currentUser)}
                        </p>
                        {getUserEmail(currentUser) && (
                          <p className="text-xs text-gray-600 mt-1">
                            {getUserEmail(currentUser)}
                          </p>
                        )}
                        {getUserPhone(currentUser) && (
                          <div className="flex items-center space-x-1 text-xs text-gray-600 mt-1">
                            <Phone className="h-3 w-3" style={{ color: '#846549' }} />
                            <span>{formatPhoneNumber(getUserPhone(currentUser)!)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                   
                    {/* Edit Profile Button - Much Smaller */}
                    <Link href="/profile" className="block">
                      <Button
                        className="w-full text-xs py-1.5"
                        style={{ backgroundColor: 'rgba(156,86,26,255)', color: 'white' }}
                      >
                        <Edit className="h-3 w-3 mr-2" />
                        Edit Profile
                      </Button>
                    </Link>
                   
                    {/* Shop by Category Button - Outlined */}
                    <Link href="/" onClick={(e) => { e.preventDefault(); clearSearch?.(); handleNavigation('/'); }} className="block">
                      <Button
                        variant="outline"
                        className="w-full text-xs py-1.5 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <ShoppingBag className="h-3 w-3 mr-2" />
                        Shop by category
                      </Button>
                    </Link>
                  </div>
                )}
               
                {/* User-specific menu items - Only show if authenticated */}
                {isAuth && (
                  <div className="space-y-1">
                    <div className="border-b border-gray-200"></div>
                    <Link href="/addresses" className="block py-3 hover:opacity-80 transition-colors flex items-center space-x-3 text-black">
                      <MapPin className="h-4 w-4" style={{ color: '#846549' }} />
                      <span>Addresses</span>
                    </Link>
                    <div className="border-b border-gray-200"></div>
                    <Link href="/my-favorites" className="block py-3 hover:opacity-80 transition-colors flex items-center space-x-3 text-black">
                      <Heart className="h-4 w-4" style={{ color: '#846549' }} />
                      <span>My Favourites</span>
                    </Link>
                    <div className="border-b border-gray-200"></div>
                    <Link href="/my-orders" className="block py-3 hover:opacity-80 transition-colors flex items-center space-x-3 text-black">
                      <Package className="h-4 w-4" style={{ color: '#846549' }} />
                      <span>My Orders</span>
                    </Link>
                    <div className="border-b border-gray-200"></div>
                    <button
                      onClick={handleLogout}
                      className="block py-3 hover:opacity-80 transition-colors text-left w-full flex items-center space-x-3 text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
               
                {/* Login/Signup section - Only show if not authenticated */}
                {!isAuth && (
                  <div className="space-y-4 pt-4">
                    {/* Shop by Category Button - Outlined */}
                    <Link href="/" onClick={(e) => { e.preventDefault(); clearSearch?.(); handleNavigation('/'); }} className="block">
                      <Button
                        variant="outline"
                        className="w-full text-sm py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Shop by category
                      </Button>
                    </Link>
                   
                    <Link href="/auth/login" className="block">
                      <Button
                        className="w-full text-sm py-3"
                        style={{ backgroundColor: 'rgba(156,86,26,255)', color: 'white' }}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Login / Signup
                      </Button>
                    </Link>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>


          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" onClick={() => clearSearch?.()}>
            <div className="w-11 h-11 flex items-center justify-center">
              <img
                src="/logo-original.png"
                alt="Sanathan Rudraksha Logo"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="block text-center">
              <span
                className="block text-xl font-bold font-spiritual leading-none"
                style={{ color: '#755e3e' }}
              >
                SANATHAN
              </span>
              <span
                className="block text-sm font-bold font-spiritual -mt-1 leading-tight"
                style={{ color: '#755e3e' }}
              >
                RUDRAKSHA
              </span>
            </div>
          </Link>


          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors" onClick={() => clearSearch?.()}>
              <ShoppingBag className="h-4 w-4" />
              <span>Shop by category</span>
            </Link>
          </nav>


          {/* Search and Actions */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <form onSubmit={handleDesktopSearchSubmit}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      className="pl-10 w-64"
                      value={desktopSearchQuery}
                      onChange={handleDesktopSearchChange}
                      onFocus={handleDesktopSearchFocus}
                    />
                    {desktopSearchQuery && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                        onClick={handleDesktopSearchClear}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </form>
                
                {/* Search Dropdown for non-homepage desktop */}
                {showSearchDropdown && !isHomepage && (
                  <SearchDropdown
                    searchQuery={desktopSearchQuery}
                    onSearchChange={setDesktopSearchQuery}
                    onClose={handleSearchDropdownClose}
                  />
                )}
              </div>
            </div>


            {/* Mobile Search */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => {
                if (!isSearchOpen) {
                  // Clear search when opening mobile search
                  setSearchQuery('');
                  onSearch('');
                }
                setIsSearchOpen(!isSearchOpen);
              }}
            >
              <Search className="h-6 w-6" />
            </Button>


            {/* Wishlist */}
            <Link href="/my-favorites">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-6 w-6" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: 'rgba(156,86,26,255)' }}>
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Button>
            </Link>


            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={openCart}
            >
              <ShoppingCart className="h-6 w-6" />
              {isMounted && getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: 'rgba(156,86,26,255)' }}>
                  {getTotalItems()}
                </span>
              )}
            </Button>


            {/* User Account - Desktop Only */}
            {isAuth && currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hidden md:flex">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        {getUserPhone(currentUser) ? getUserPhone(currentUser)!.slice(-2) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{getDisplayName(currentUser)}</p>
                      {getUserEmail(currentUser) && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {getUserEmail(currentUser)}
                        </p>
                      )}
                      {getUserPhone(currentUser) && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {formatPhoneNumber(getUserPhone(currentUser)!)}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/addresses" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Addresses</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-favorites" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      <span>My Favourites</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-orders" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>My Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login" className="hidden md:flex">
                <Button variant="ghost" size="icon">
                  <User className="h-6 w-6" />
                </Button>
              </Link>
            )}
          </div>
        </div>


        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden pb-4 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
              <Input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-10"
                value={searchQuery}
                onChange={handleMobileSearchChange}
                onKeyDown={handleMobileSearchKeyDown}
                enterKeyHint="search"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    onSearch('');
                    setShowSearchDropdown(false);
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Mobile Search Dropdown */}
            {showSearchDropdown && !isHomepage && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50">
                <SearchDropdown
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onClose={() => {
                    setShowSearchDropdown(false);
                    setIsSearchOpen(false);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </header>
    </>
  );
}

