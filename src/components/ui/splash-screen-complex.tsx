// 'use client';

// import { useEffect, useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// interface SplashScreenProps {
//   onSplashComplete: () => void;
// }

// export default function SplashScreen({ onSplashComplete }: SplashScreenProps) {
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const [progress, setProgress] = useState(0);
//   const [appLoaded, setAppLoaded] = useState(false);

//   const splashImages = [
//     '/splash1.jpg',
//     '/splash2.jpg', 
//     '/splash3.jpg',
//     '/splash4.jpg'
//   ].map(img => {
//     // Ensure the image path is correct
//     console.log('SplashScreen: Image path:', img);
//     return img;
//   });


//     // 🔥 Preload splash images
//   useEffect(() => {
//     splashImages.forEach((src) => {
//       const img = new Image();
//       img.src = src;
//     });
//   }, []);


//   useEffect(() => {
//     console.log('SplashScreen: Component mounted');
//     console.log('SplashScreen: Available images:', splashImages);
    
//     // Auto-advance carousel every 3 seconds
//     const carouselInterval = setInterval(() => {
//       setCurrentImageIndex((prev) => {
//         const newIndex = (prev + 1) % splashImages.length;
//         console.log('SplashScreen: Changing to image', newIndex, splashImages[newIndex]);
//         return newIndex;
//       });
//     }, 3000);

//     return () => clearInterval(carouselInterval);
//   }, [splashImages.length]);

//   useEffect(() => {
//     // Progress timer for 10 seconds
//     const duration = 10000; // 10 seconds
//     const startTime = Date.now();
    
//     const progressInterval = setInterval(() => {
//       const elapsed = Date.now() - startTime;
//       const newProgress = Math.min((elapsed / duration) * 100, 100);
//       setProgress(newProgress);
      
//       if (newProgress >= 100) {
//         clearInterval(progressInterval);
//         // Check if app is loaded before completing
//         if (appLoaded) {
//           setTimeout(() => {
//             onSplashComplete();
//           }, 500);
//         }
//       }
//     }, 100);

//     return () => clearInterval(progressInterval);
//   }, [appLoaded, onSplashComplete]);

//   // Simulate app loading check
//   useEffect(() => {
//     // In a real app, this would check actual loading state
//     const loadCheck = setTimeout(() => {
//       setAppLoaded(true);
//     }, 3000); // Simulate 3 seconds loading time

//     return () => clearTimeout(loadCheck);
//   }, []);

//   return (
//     <div className="fixed inset-0 z-50 overflow-hidden">
//       {/* Carousel Background */}
//       <div className="relative w-full h-full bg-gradient-to-br from-primary via-primary/90 to-destructive">
//         <AnimatePresence mode="wait">
//           {/* <motion.div
//             key={currentImageIndex}
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.8, ease: "easeInOut" }}
//             className="absolute inset-0"
//           >
//             <div 
//               className="w-full h-full bg-cover bg-center bg-no-repeat"
//               style={{
//                 backgroundImage: `url(${splashImages[currentImageIndex]})`
//               }}
//               onError={(e) => {
//                 console.error('Background image failed to load:', splashImages[currentImageIndex]);
//               }}
//             />
//           </motion.div> */}
//           <motion.div
//             key={currentImageIndex}
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.8, ease: "easeInOut" }}
//             className="absolute inset-0 bg-cover bg-center bg-no-repeat"
//             style={{
//               backgroundImage: `url(${splashImages[currentImageIndex]})`
//             }}
//           >
//             {/* Hidden img for error logging */}
//             <img
//               src={splashImages[currentImageIndex]}
//               alt="splash"
//               className="hidden"
//               onError={() =>
//                 console.error(
//                   "Background image failed to load:",
//                   splashImages[currentImageIndex]
//                 )
//               }
//             />
//           </motion.div>
//         </AnimatePresence>
        
//         {/* Black Tint Overlay */}
//         {/* <div className="absolute inset-0 bg-black bg-opacity-60" /> */}
//         <div className="absolute inset-0 bg-black bg-opacity-0" />
//         {/* Content Overlay */}
//         <div className="absolute inset-0 flex flex-col items-center justify-center">
//           {/* Logo */}
//           <div className="relative z-10 flex flex-col items-center space-y-8">
//             <motion.div
//               initial={{ y: 0 }}
//               animate={{ y: [-10, 0, -10] }}
//               transition={{ 
//                 duration: 2, 
//                 repeat: Infinity, 
//                 ease: "easeInOut" 
//               }}
//               className="relative"
//             >
//               <img
//                 src="/logo-placeholder.png"
//                 alt="Logo"
//                 width={160}
//                 height={160}
//                 style={{"border-radius":"8px"}}
//                 className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
//                 onError={(e) => {
//                   // Simply hide the broken image, don't show fallback text
//                   const target = e.target as HTMLImageElement;
//                   target.style.display = 'none';
//                 }}
//               />
//             </motion.div>

//             {/* Animated Loading Bar */}
//             <motion.div
//               initial={{ width: 0, opacity: 0 }}
//               animate={{ width: 300, opacity: 1 }}
//               transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
//               className="w-72 max-w-full"
//             >
//               <div className="relative">
//                 {/* Background track */}
//                 <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
//                   {/* Progress fill */}
//                   <motion.div
//                     className="h-full bg-gradient-to-r from-primary/80 via-primary/80 to-primary rounded-full"
//                     initial={{ width: 0 }}
//                     animate={{ width: `${progress}%` }}
//                     transition={{ duration: 0.3, ease: "easeOut" }}
//                   />
//                 </div>
                
//                 {/* Animated shine effect */}
//                 <motion.div
//                   className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
//                   initial={{ x: '-100%' }}
//                   animate={{ x: '100%' }}
//                   transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
//                 />
//               </div>
              
//               {/* Progress percentage */}
//               <div className="text-center mt-2">
//                 <span className="text-white text-sm font-medium">
//                   {Math.round(progress)}%
//                 </span>
//               </div>
//             </motion.div>
//           </div>

//           {/* Build by Harte Labs - Bottom */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 1, delay: 1, ease: "easeOut" }}
//             className="absolute bottom-8 left-0 right-0 text-center"
//           >
//             <p className="text-white/80 text-sm font-light tracking-wide">
//               Build by Harte Labs
//             </p>
//           </motion.div>
//         </div>
//       </div>
//     </div>
//   );
// }
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onSplashComplete: () => void;
}

type ImgState = 'idle' | 'loading' | 'loaded' | 'error';

export default function SplashScreen({ onSplashComplete }: SplashScreenProps) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const splashImages = [
    '/KB1.webp',
    '/KB2.webp',
    '/KB3.webp',
  ].map((p) => `${basePath}${p}`);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [appLoaded, setAppLoaded] = useState(false);
  const [isFirstImage, setIsFirstImage] = useState(true);

  // preload images
  useEffect(() => {
    // Preload first image with higher priority
    const firstImg = new Image();
    firstImg.src = splashImages[0];
    
    // Then preload the rest
    splashImages.slice(1).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [splashImages]);

  // carousel
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentImageIndex((p) => (p + 1) % splashImages.length);
      setIsFirstImage(false);
    }, 3000);
    return () => clearInterval(id);
  }, [splashImages.length]);

  // progress timer
  useEffect(() => {
    const duration = 7000; // Changed from 10000 to 7000 (7 seconds)
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(id);
        if (appLoaded) setTimeout(() => onSplashComplete(), 500);
      }
    }, 100);
    return () => clearInterval(id);
  }, [appLoaded, onSplashComplete]);

  useEffect(() => {
    const t = setTimeout(() => setAppLoaded(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const currentSrc = splashImages[currentImageIndex];

  return (
    <div className="fixed inset-0 z-50">
      <div className="relative w-full h-full flex flex-col">
        {/* Background carousel - full screen */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-white z-0" />
          <AnimatePresence>
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: isFirstImage ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat z-10"
              style={{
                backgroundImage: `url(${currentSrc})`,
                backgroundColor: 'transparent', // let the white base show through
              }}
            />
          </AnimatePresence>
          
          {/* Black tint overlay */}
          <div className="absolute inset-0 bg-black/60 z-20" />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex items-center justify-center relative z-30">
          <div className="flex flex-col items-center space-y-8">
            {/* Logo */}
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 transition-transform duration-100 ease-linear animate-spin" style={{
                animation: 'spin 8s linear infinite' // Changed from 3s to 8s for slower rotation
              }}>
                <img
                  src="/logo.webp"
                  alt="Logo"
                  width={120}
                  height={120}
                  className="w-full h-full object-contain rounded-[12px] drop-shadow-2xl"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    t.style.display = 'none';
                  }}
                />
              </div>
            </div>

            {/* Loader bar */}
            <div className="w-72 max-w-full">
              <div className="relative">
                <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      background:
                        'linear-gradient(90deg, #fb923c, #fb923c 50%, #f59e0b)',
                    }}
                  />
                </div>
              </div>
              <div className="text-center mt-2 text-white/90">
                {Math.round(progress)}%
              </div>
            </div>
          </div>
        </div>
        
        {/* Status area - extends carousel background */}
        <div className="relative z-30 p-4 bg-gradient-to-t from-black/40 to-transparent">
          <div className="text-center">
            <p className="text-white/80 text-sm">
              Build with ❤️ by HarTe Labs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}