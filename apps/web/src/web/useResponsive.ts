import { useEffect, useState } from "react";

/** Responsive breakpoint hook shared by An Sarraf views. */
export function useIsMobile(bp = 768): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(`(max-width: ${bp}px)`).matches : false
  );

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${bp}px)`);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [bp]);

  return isMobile;
}
