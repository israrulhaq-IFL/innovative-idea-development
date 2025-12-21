// Performance monitoring utility for Innovative Ideas Application

export const performanceMonitor = {
  // Initialize performance monitoring
  init: () => {
    if (typeof window !== "undefined" && "performance" in window) {
      // Track initial page load
      window.addEventListener("load", () => {
        const loadTime = performance.now();
        console.log(`[Performance] Page loaded in ${loadTime.toFixed(2)}ms`);
      });

      // Track navigation timing
      window.addEventListener("DOMContentLoaded", () => {
        const domContentLoaded = performance.now();
        console.log(
          `[Performance] DOM content loaded in ${domContentLoaded.toFixed(2)}ms`,
        );
      });
    }
  },

  // Log bundle information
  logBundleInfo: () => {
    if (typeof window !== "undefined" && "performance" in window) {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        console.log("[Performance] Navigation timing:", {
          domContentLoaded:
            navigation.domContentLoadedEventEnd -
            navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart,
        });
      }
    }
  },
};

// Export logBundleInfo separately for convenience
export const logBundleInfo = performanceMonitor.logBundleInfo;

// Initialize performance monitoring
performanceMonitor.init();
