import React, { useEffect, useState, useRef } from 'react';

// To display the ongoing polls only when in view
export function useInView(){
    const [isInView, setIsInView] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
  
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsInView(entry.isIntersecting);
        },
        { threshold: 0.1 }
      );
  
      if(ref.current){
        observer.observe(ref.current);
      }
  
      return () => {
        if(ref.current){
          observer.unobserve(ref.current);
        }
      };
    }, []);
  
    return { ref, isInView };
  }