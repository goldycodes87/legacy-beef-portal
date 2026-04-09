'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function FadeIn({ 
  children, 
  delay = 0,
  direction = 'up',
  className = ''
}: { 
  children: React.ReactNode; 
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  
  return (
    <motion.div
      ref={ref}
      initial={{ 
        opacity: 0,
        y: direction === 'up' ? 40 : 0,
        x: direction === 'left' ? -40 : direction === 'right' ? 40 : 0,
      }}
      animate={inView ? { 
        opacity: 1, 
        y: 0, 
        x: 0,
        transition: {
          duration: 0.7,
          delay,
        },
      } : { 
        opacity: 0,
        y: direction === 'up' ? 40 : 0,
        x: direction === 'left' ? -40 : direction === 'right' ? 40 : 0,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
