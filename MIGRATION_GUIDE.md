# Migration & Future-Proofing Guide for Modern ITG Dashboard

## Overview
This document outlines the steps required to migrate the dashboard to a new SharePoint server or convert it to a standalone web application, along with recommendations for making it future-proof.

## Current SharePoint Dependencies

### 1. **SharePoint REST API Integration**
- **Location**: `src/services/sharePointService.js`
- **Dependencies**:
  - Hard-coded site URL: `window.location.origin`
  - SharePoint list GUIDs and names (department-specific)
  - SharePoint authentication (same-origin credentials)
  - SharePoint request digest for POST operations

### 2. **Deployment Configuration**
- **Location**: `vite.config.js`, `deploy.ps1`
- **Dependencies**:
  - Base path: `/SiteAssets/modern_dashboard/`
  - SharePoint document library deployment
  - PowerShell deployment scripts

### 3. **Authentication & Security**
- Relies on SharePoint's built-in authentication
- Same-origin policy for API calls
- No custom authentication layer

## Migration Scenarios

### Scenario 1: Migrating to New SharePoint Server

#### Difficulty: **LOW to MEDIUM**
#### Estimated Time: **2-4 hours**

#### Steps Required:

1. **Update Environment Configuration**
   ```javascript
   // Create src/config/environment.js
   export const CONFIG = {
     SHAREPOINT_SITE_URL: 'https://newserver.domain.com',
     DOCUMENT_LIBRARY: 'SiteAssets',
     SUBFOLDER: 'modern_dashboard'
   };
   ```

2. **Update SharePoint Service**
   ```javascript
   // In sharePointService.js
   import { CONFIG } from '../config/environment.js';

   constructor() {
     this.siteUrl = CONFIG.SHAREPOINT_SITE_URL;
     // ... rest of constructor
   }
   ```

3. **Update Deployment Scripts**
   ```powershell
   # In deploy.ps1
   param(
       [string]$SharePointSiteUrl = "https://newserver.domain.com"
   )
   ```

4. **Update Vite Configuration**
   ```javascript
   // In vite.config.js
   base: process.env.NODE_ENV === 'production'
     ? `/${CONFIG.DOCUMENT_LIBRARY}/${CONFIG.SUBFOLDER}/`
     : '/'
   ```

5. **Redeploy**
   ```bash
   npm run build
   npm run deploy
   ```

### Scenario 2: Converting to Standalone Web Application

#### Difficulty: **HIGH**
#### Estimated Time: **2-3 weeks**

#### Why It's Hard:
- Complete rewrite of data access layer required
- Authentication system needs to be implemented
- Database schema needs to be designed
- API endpoints need to be created
- Data migration strategy required

#### Required Changes:

1. **Replace SharePoint Service with Generic API Service**
   ```javascript
   // New src/services/apiService.js
   class ApiService {
     constructor() {
       this.baseUrl = process.env.REACT_APP_API_URL;
     }

     async getTasks(department) {
       // Generic API call instead of SharePoint REST
       const response = await fetch(`${this.baseUrl}/api/tasks?department=${department}`);
       return response.json();
     }
   }
   ```

2. **Implement Authentication**
   - JWT-based authentication
   - User management system
   - Role-based access control

3. **Database Design**
   - Task tables with proper relationships
   - User and department tables
   - Audit logging

4. **API Development**
   - RESTful API endpoints
   - Data validation and sanitization
   - Error handling

5. **Data Migration**
   - Export data from SharePoint lists
   - Transform data to new schema
   - Import to new database

## Future-Proofing Recommendations

### Phase 1: Configuration Management (HIGH PRIORITY)

#### 1. Create Environment Configuration
```javascript
// src/config/environment.js
export const CONFIG = {
  // SharePoint Configuration
  SHAREPOINT_SITE_URL: import.meta.env.VITE_SHAREPOINT_URL || window.location.origin,
  LIST_CONFIG: {
    infra: { name: 'si_tasklist', guid: 'e41bb365-20be-4724-8ff8-18438d9c2354' },
    erp: { name: 'erp_tasklist', guid: '4693a94b-4a71-4821-b8c1-3a6fc8cdac69' },
    // ... other departments
  },

  // Deployment Configuration
  DEPLOYMENT: {
    TYPE: import.meta.env.VITE_DEPLOYMENT_TYPE || 'sharepoint', // 'sharepoint' | 'standalone'
    BASE_PATH: import.meta.env.VITE_BASE_PATH || '/SiteAssets/modern_dashboard/',
    API_URL: import.meta.env.VITE_API_URL
  }
};
```

#### 2. Create Abstract Data Service Layer
```javascript
// src/services/dataService.js
import { CONFIG } from '../config/environment.js';
import SharePointService from './sharePointService.js';
import ApiService from './apiService.js';

class DataService {
  constructor() {
    this.service = CONFIG.DEPLOYMENT.TYPE === 'sharepoint'
      ? new SharePointService()
      : new ApiService();
  }

  async getTasks(department) {
    return this.service.getTasks(department);
  }

  // ... other methods
}

export default DataService;
```

#### 3. Update Environment Variables
```bash
# .env.local
VITE_SHAREPOINT_URL=http://hospp16srv:34334
VITE_DEPLOYMENT_TYPE=sharepoint
VITE_BASE_PATH=/SiteAssets/modern_dashboard/

# .env.production
VITE_SHAREPOINT_URL=https://newserver.domain.com
VITE_DEPLOYMENT_TYPE=sharepoint
VITE_BASE_PATH=/SiteAssets/modern_dashboard/
```

### Phase 2: Service Abstraction (MEDIUM PRIORITY)

#### 1. Create Service Interface
```javascript
// src/services/interfaces/ITaskService.js
export class ITaskService {
  async getTasks(department) { throw new Error('Not implemented'); }
  async createTask(task) { throw new Error('Not implemented'); }
  async updateTask(taskId, updates) { throw new Error('Not implemented'); }
  async deleteTask(taskId) { throw new Error('Not implemented'); }
}
```

#### 2. Implement SharePoint Adapter
```javascript
// src/services/adapters/SharePointTaskService.js
import { ITaskService } from '../interfaces/ITaskService.js';
import SharePointService from '../sharePointService.js';

export class SharePointTaskService extends ITaskService {
  constructor() {
    super();
    this.spService = new SharePointService();
  }

  async getTasks(department) {
    return this.spService.getTasks(department);
  }

  // ... implement other methods
}
```

#### 3. Implement REST API Adapter
```javascript
// src/services/adapters/RestApiTaskService.js
import { ITaskService } from '../interfaces/ITaskService.js';

export class RestApiTaskService extends ITaskService {
  constructor(apiUrl) {
    super();
    this.apiUrl = apiUrl;
  }

  async getTasks(department) {
    const response = await fetch(`${this.apiUrl}/tasks?department=${department}`);
    return response.json();
  }

  // ... implement other methods
}
```

### Phase 3: Deployment Flexibility (MEDIUM PRIORITY)

#### 1. Configurable Build System
```javascript
// vite.config.js
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.VITE_BASE_PATH || '/',
    // ... rest of config
  };
});
```

#### 2. Multi-Environment Deployment Scripts
```powershell
# deploy.ps1
param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "production",

    [Parameter(Mandatory=$false)]
    [string]$DeploymentType = "sharepoint"  # sharepoint | azure | standalone
)

# Load environment-specific configuration
$config = Get-Content "config/$Environment.json" | ConvertFrom-Json

switch ($DeploymentType) {
    "sharepoint" {
        # Existing SharePoint deployment logic
    }
    "azure" {
        # Azure Static Web App deployment
    }
    "standalone" {
        # Generic web server deployment
    }
}
```

### Phase 4: Authentication Abstraction (LOW PRIORITY)

#### 1. Authentication Service Interface
```javascript
// src/services/auth/IAuthService.js
export class IAuthService {
  async login(credentials) { throw new Error('Not implemented'); }
  async logout() { throw new Error('Not implemented'); }
  async getCurrentUser() { throw new Error('Not implemented'); }
  async checkPermission(permission) { throw new Error('Not implemented'); }
}
```

#### 2. SharePoint Auth Adapter
```javascript
// src/services/auth/SharePointAuthService.js
import { IAuthService } from './IAuthService.js';

export class SharePointAuthService extends IAuthService {
  async getCurrentUser() {
    // Use SharePoint's current user endpoint
    const response = await fetch('/_api/web/currentuser');
    return response.json();
  }

  async checkPermission(permission) {
    // Check SharePoint permissions
    const response = await fetch('/_api/web/effectivebasepermissions');
    const permissions = await response.json();
    return this.hasPermission(permissions, permission);
  }
}
```

## Implementation Priority

### Immediate (Next Sprint):
1. ✅ Environment configuration setup
2. ✅ Abstract data service layer
3. ✅ Configurable deployment scripts

### Short-term (1-2 months):
1. Service interface implementation
2. Authentication abstraction
3. Multi-environment build configuration

### Long-term (3-6 months):
1. Complete REST API adapter
2. Standalone deployment pipeline
3. Automated migration tools

## Risk Assessment

### Migration to New SharePoint Server:
- **Risk**: LOW
- **Complexity**: Configuration changes only
- **Testing**: Basic functionality testing required
- **Downtime**: Minimal (deployment time only)

### Conversion to Standalone Application:
- **Risk**: HIGH
- **Complexity**: Complete architecture rewrite
- **Testing**: Full regression testing required
- **Downtime**: Extended (data migration + testing)
- **Cost**: Significant development effort required

## Recommendations

1. **Start with Configuration Management**: Implement environment-based configuration first
2. **Test Migration Scenarios**: Set up staging environments for testing migrations
3. **Document All Dependencies**: Keep this document updated with any new SharePoint dependencies
4. **Consider Hybrid Approach**: Maintain SharePoint compatibility while adding standalone capabilities
5. **Plan for Data Migration**: Design data export/import tools early
6. **Automate Testing**: Implement automated tests for different deployment scenarios

## Quick Migration Checklist

### For SharePoint Server Migration:
- [ ] Update environment variables
- [ ] Test SharePoint connectivity
- [ ] Update deployment scripts
- [ ] Rebuild and redeploy
- [ ] Test all functionality
- [ ] Update documentation

### For Standalone Conversion:
- [ ] Design new database schema
- [ ] Implement REST API
- [ ] Create authentication system
- [ ] Migrate existing data
- [ ] Update frontend services
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Security audit