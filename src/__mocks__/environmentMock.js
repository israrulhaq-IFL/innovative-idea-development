// Mock for environment configuration
export const getConfig = () => ({
  SHAREPOINT: {
    SITE_URL: "http://test.sharepoint.com",
    LIST_CONFIG: {
      infra: {
        name: "si_tasklist",
        guid: "e41bb365-20be-4724-8ff8-18438d9c2354",
        displayName: "Data Center & Cloud Infrastructure",
      },
      erp: {
        name: "erp_tasklist",
        guid: "4693a94b-4a71-4821-b8c1-3a6fc8cdac69",
        displayName: "ERP & Software Development",
      },
      ops: {
        name: "ops_tasklist",
        guid: "6eb2cec0-f94f-47ae-8745-5e48cd52ffd9",
        displayName: "ITG Operations",
      },
      network: {
        name: "networks_tasklist",
        guid: "12345678-1234-1234-1234-123456789abc",
        displayName: "Networks & Security",
      },
      ideas: {
        name: "innovative_ideas",
        guid: "87654321-4321-4321-4321-abcdefabcdef",
        displayName: "Innovative Ideas",
      },
    },
  },
  API: {
    BASE_URL: "http://test.api.com",
    TIMEOUT: 10000,
  },
  FEATURES: {
    ENABLE_ANALYTICS: false,
    ENABLE_NOTIFICATIONS: true,
    ENABLE_AUTO_REFRESH: false,
  },
});
