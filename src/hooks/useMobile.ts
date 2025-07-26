import { useState, useEffect } from 'react';

const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Method 1: Using window width (common approach)
      const width = window.innerWidth;
      const mobileBreakpoint = 768; // You can adjust this breakpoint
      
      // Method 2: Using user agent (more comprehensive)
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      
      // Combine both methods for better accuracy
      const isMobileWidth = width < mobileBreakpoint;
      const isMobileDevice = mobileRegex.test(userAgent);
      
      setIsMobile(isMobileWidth || isMobileDevice);
    };

    // Check on mount
    checkDevice();

    // Add resize listener to handle window resizing
    window.addEventListener('resize', checkDevice);

    // Cleanup
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile;
};

export default useMobile;