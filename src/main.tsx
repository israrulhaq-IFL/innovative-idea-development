import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { SecurityHeaders } from "./utils/security";
import { logInfo, logError } from "./utils/logger";

// Performance monitoring
import { performanceMonitor, logBundleInfo } from "./utils/performance";

// SharePoint context initialization
import { initializeSharePointContext } from "./utils/sharePointInit";

// Extend window object types
declare global {
  interface Window {
    $: any;
    jQuery: any;
    Chart: any;
  }
}

// Make jQuery globally available for any legacy code
import $ from "jquery";
window.$ = window.jQuery = $;

// Make Chart.js globally available
import Chart from "chart.js/auto";
window.Chart = Chart;

// Initialize security measures
SecurityHeaders.setSecurityMetaTags();

// Initialize performance monitoring
performanceMonitor;

// Log bundle information in production
if (process.env.NODE_ENV === "production") {
  logBundleInfo();
}

// Log security initialization
logInfo("Security measures initialized", { component: "main" });

// Initialize SharePoint context for development
initializeSharePointContext();

// Disable PWA features in SharePoint environments
const isSharePoint =
  window.location.hostname.includes("sharepoint.com") ||
  window.location.hostname.includes("hospp16srv") ||
  window.location.href.includes("_layouts") ||
  document.referrer.includes("sharepoint.com");

if (isSharePoint) {
  logInfo("SharePoint environment detected - disabling PWA features", {
    component: "main",
    hostname: window.location.hostname,
    referrer: document.referrer,
  });

  // Remove manifest link
  const manifestLink = document.getElementById("manifest-link");
  if (manifestLink) {
    manifestLink.remove();
  }

  // Remove favicon links that cause 404s
  const favicon32 = document.getElementById("favicon-32");
  const favicon16 = document.getElementById("favicon-16");
  const appleTouchIcon = document.getElementById("apple-touch-icon");
  if (favicon32) favicon32.remove();
  if (favicon16) favicon16.remove();
  if (appleTouchIcon) appleTouchIcon.remove();
}

// Register service worker for caching and offline support (only in non-SharePoint environments)
if (
  "serviceWorker" in navigator &&
  process.env.NODE_ENV === "production" &&
  !isSharePoint
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        logInfo("Service worker registered successfully", {
          component: "main",
          scope: registration.scope,
        });
      })
      .catch((error) => {
        logError("Service worker registration failed", {
          component: "main",
          error: error.message,
        });
      });
  });
}

const appElement = document.getElementById("app");
if (!appElement) {
  throw new Error('Root element with id "app" not found');
}

const root = ReactDOM.createRoot(appElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
