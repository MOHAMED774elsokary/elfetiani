import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export default function CustomCursor() {
  const [isDesktop, setIsDesktop] = useState(true);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Lightning fast inner dot
  const springConfig = { damping: 20, stiffness: 1000, mass: 0.1 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  
  // Smooth, fast tracking outer ring
  const outerSpringConfig = { damping: 25, stiffness: 500, mass: 0.2 };
  const outerXSpring = useSpring(cursorX, outerSpringConfig);
  const outerYSpring = useSpring(cursorY, outerSpringConfig);

  useEffect(() => {
    if (window.matchMedia("(hover: hover)").matches) {
      setIsDesktop(true);
    } else {
      setIsDesktop(false);
      return;
    }

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, [cursorX, cursorY]);

  if (!isDesktop) return null;

  return (
    <>
      {/* Background Spotlight Glow - Rich vibrant deep orange/purple pro theme */}
      <motion.div
        className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none blur-[120px] mix-blend-screen z-10 opacity-70"
        style={{
          background: 'radial-gradient(circle, rgba(232, 82, 13, 0.6) 0%, rgba(150,0,255,0.3) 40%, transparent 80%)',
          x: outerXSpring,
          y: outerYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />

      {/* Outer Fast Trailing Ring */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 border-[1.5px] border-primary/70 rounded-full pointer-events-none z-[9999]"
        style={{
          x: outerXSpring,
          y: outerYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />

      {/* Inner Hyper-fast Glowing Dot */}
      <motion.div
        className="fixed top-0 left-0 w-2.5 h-2.5 bg-white rounded-full pointer-events-none z-[9999] shadow-[0_0_15px_#E8520D]"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
    </>
  );
}
