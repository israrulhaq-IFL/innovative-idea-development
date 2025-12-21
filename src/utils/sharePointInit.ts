// SharePoint Context Initialization
// src/utils/sharePointInit.ts

// Initialize SharePoint context for development
export const initializeSharePointContext = () => {
  // Only set mock context if not already provided by SharePoint
  if (typeof (window as any)._spPageContextInfo === "undefined") {
    // Get SharePoint URL from environment or use development default
    const sharePointUrl =
      import.meta.env?.VITE_SHAREPOINT_BASE_URL || "http://hospp16srv:36156";
    console.log(
      "[Innovative Ideas] Development mode: Using mock SharePoint context (" +
        sharePointUrl +
        ")",
    );

    (window as any)._spPageContextInfo = {
      webAbsoluteUrl: sharePointUrl,
      webServerRelativeUrl: "/",
      siteAbsoluteUrl: sharePointUrl,
      userId: 1,
      userDisplayName: "System User",
    };
  } else {
    console.log(
      "[Innovative Ideas] Production mode: Using real SharePoint context",
    );
  }
};
