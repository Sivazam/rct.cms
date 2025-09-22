'use client';

import { useState, useEffect } from 'react';

export default function DateTimeBar() {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      // Format date: "Monday, January 15, 2024"
      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      
      // Format time: "2:30:45 PM"
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      
      const dateString = now.toLocaleDateString('en-US', dateOptions);
      const timeString = now.toLocaleTimeString('en-US', timeOptions);
      
      setCurrentDateTime(`${dateString} | ${timeString}`);
    };

    // Update immediately
    updateDateTime();
    
    // Update every second
    const interval = setInterval(updateDateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden sm:block bg-[#99031e] text-white py-2 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium">
            Cremation Management System
          </div>
          <div className="text-sm font-mono">
            {currentDateTime}
          </div>
        </div>
      </div>
    </div>
  );
}