# Modern Dashboard SharePoint Deployment Script

This PowerShell script automates the deployment of the Modern ITG SharePoint Task Dashboard to SharePoint sites using REST API.

## Prerequisites

- PowerShell 5.1 or higher
- Node.js and npm installed
- Access to SharePoint site with appropriate permissions
- SharePoint document library for deployment

## Usage

### Basic Usage (Windows Authentication)

```powershell
.\deploy.ps1 -SharePointSiteUrl "http://your-sharepoint-site" -DocumentLibrary "SiteAssets"
```

### With Custom Subfolder

```powershell
.\deploy.ps1 -SharePointSiteUrl "http://your-sharepoint-site" -DocumentLibrary "SiteAssets" -SubFolder "modern_dashboard"
```

### With Explicit Credentials

```powershell
.\deploy.ps1 -SharePointSiteUrl "http://your-sharepoint-site" -DocumentLibrary "SiteAssets" -UseCredentials -Username "domain\username" -Password "yourpassword"
```

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `SharePointSiteUrl` | Yes | The URL of your SharePoint site |
| `DocumentLibrary` | Yes | Name of the document library to deploy to |
| `SubFolder` | No | Subfolder within the document library (default: "modern_dashboard") |
| `UseCredentials` | No | Switch to use explicit credentials instead of default Windows auth |
| `Username` | No* | Username for authentication (required if UseCredentials is specified) |
| `Password` | No* | Password for authentication (required if UseCredentials is specified) |

## What the Script Does

1. **Builds the Application**: Runs `npm run build` to create production assets
2. **Authenticates**: Gets SharePoint request digest for API calls
3. **Prepares Folders**: Creates necessary folders in SharePoint if they don't exist
4. **Cleans Up**: Deletes existing deployment files
5. **Uploads New Files**: Uploads the new build to SharePoint

## File Structure After Deployment

```
DocumentLibrary/
└── SubFolder/
    ├── index.html
    ├── vite.svg
    └── assets/
        ├── index-[hash].css
        ├── index-[hash].js
        ├── vendor-[hash].js
        ├── charts-[hash].js
        └── router-[hash].js
```

## Access the Dashboard

After successful deployment, access your dashboard at:

```
http://your-sharepoint-site/DocumentLibrary/SubFolder/index.html
```

## Troubleshooting

### Authentication Issues
- Ensure you have appropriate permissions on the SharePoint site
- For on-premises SharePoint, Windows authentication should work by default
- For explicit credentials, use the `-UseCredentials` parameter

### Build Failures
- Ensure Node.js and npm are installed
- Check that all dependencies are installed (`npm install`)
- Verify the build process completes without errors

### Upload Failures
- Check SharePoint site URL is correct
- Verify document library exists and you have write permissions
- Ensure network connectivity to SharePoint site

### Permission Errors
- You need Contribute or higher permissions on the target document library
- For folder creation, you may need Design permissions

## Security Notes

- Credentials are handled securely using PowerShell's secure string
- The script uses SharePoint's built-in request digest for CSRF protection
- Files are uploaded with overwrite enabled

## Examples

### Deploy to SiteAssets with default subfolder
```powershell
.\deploy.ps1 -SharePointSiteUrl "http://intranet.company.com" -DocumentLibrary "SiteAssets"
```

### Deploy to custom library and folder
```powershell
.\deploy.ps1 -SharePointSiteUrl "http://portal.company.com/sites/it" -DocumentLibrary "Documents" -SubFolder "apps/dashboard"
```

### Deploy with explicit credentials
```powershell
.\deploy.ps1 -SharePointSiteUrl "https://company.sharepoint.com/sites/it" -DocumentLibrary "SiteAssets" -UseCredentials -Username "user@company.com" -Password "mypassword"
```