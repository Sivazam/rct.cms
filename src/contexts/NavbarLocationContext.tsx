'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavbarLocationContextType {
  navbarLocation: string;
  setNavbarLocation: (location: string) => void;
}

const NavbarLocationContext = createContext<NavbarLocationContextType | undefined>(undefined);

export function NavbarLocationProvider({ children }: { children: ReactNode }) {
  const [navbarLocation, setNavbarLocation] = useState<string>('all');

  return (
    <NavbarLocationContext.Provider value={{ navbarLocation, setNavbarLocation }}>
      {children}
    </NavbarLocationContext.Provider>
  );
}

export function useNavbarLocation() {
  const context = useContext(NavbarLocationContext);
  if (context === undefined) {
    throw new Error('useNavbarLocation must be used within a NavbarLocationProvider');
  }
  return context;
}