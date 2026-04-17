import { useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  once?: boolean;
}

/**
 * Hook pour détecter si un élément est visible dans le viewport
 * Utile pour lazy-loader les images/vidéos uniquement quand elles sont visibles
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {},
) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const { once = false, ...observerOptions } = options;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        setHasBeenVisible(true);
        if (once) {
          observer.unobserve(entry.target);
        }
      } else {
        setIsVisible(false);
      }
    }, observerOptions);

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [once, observerOptions]);

  return { elementRef, isVisible, hasBeenVisible };
}
