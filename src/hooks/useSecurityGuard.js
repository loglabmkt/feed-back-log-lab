import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Security hook for sensitive/public pages.
 * - Blocks right-click (context menu)
 * - Detects DevTools open via window size diff and reports to backend
 *
 * Usage: call useSecurityGuard() inside the component.
 */
export function useSecurityGuard() {
  // Block right-click
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  // Detect DevTools via window size threshold
  useEffect(() => {
    const threshold = 160;
    let reported = false;

    const detectDevTools = () => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      if ((widthDiff > threshold || heightDiff > threshold) && !reported) {
        reported = true;
        base44.functions.invoke("securityLog", {
          timestamp: new Date().toISOString(),
          page: window.location.pathname,
          userAgent: navigator.userAgent,
        }).catch(() => {});
      } else if (widthDiff <= threshold && heightDiff <= threshold) {
        reported = false; // reset so it can report again if re-opened
      }
    };

    window.addEventListener("resize", detectDevTools);
    detectDevTools(); // check on mount
    return () => window.removeEventListener("resize", detectDevTools);
  }, []);
}