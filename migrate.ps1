# Migration Script for SharePoint Server Changes
# This script helps migrate the dashboard to a new SharePoint server

param(
    [Parameter(Mandatory=$true)]
    [string]$NewSharePointUrl,

    [Parameter(Mandatory=$false)]
    [string]$NewDocumentLibrary = "SiteAssets",

    [Parameter(Mandatory=$false)]
    [string]$NewSubFolder = "modern_dashboard",

    [Parameter(Mandatory=$false)]
    [switch]$TestConnection,

    [Parameter(Mandatory=$false)]
    [switch]$UpdateConfig,

    [Parameter(Mandatory=$false)]
    [switch]$Deploy
)

Write-Host "🔄 SharePoint Migration Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Test connection to new SharePoint server
if ($TestConnection) {
    Write-Host "Testing connection to new SharePoint server..." -ForegroundColor Yellow

    try {
        $response = Invoke-WebRequest -Uri "$NewSharePointUrl/_api/web" -Method GET -UseDefaultCredentials
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Connection successful!" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "❌ Connection failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Update environment configuration
if ($UpdateConfig) {
    Write-Host "Updating environment configuration..." -ForegroundColor Yellow

    # Create .env.production file
    $envContent = @"
# Production Environment Configuration
VITE_SHAREPOINT_URL=$NewSharePointUrl
VITE_DEPLOYMENT_TYPE=sharepoint
VITE_BASE_PATH=/$NewDocumentLibrary/$NewSubFolder/
VITE_DOCUMENT_LIBRARY=$NewDocumentLibrary
VITE_SUBFOLDER=$NewSubFolder
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_LOGGING=false
"@

    $envContent | Out-File -FilePath ".env.production" -Encoding UTF8
    Write-Host "✅ Created .env.production" -ForegroundColor Green

    # Update deployment script defaults
    $deployScript = Get-Content "deploy.ps1" -Raw
    $deployScript = $deployScript -replace '(\$SharePointSiteUrl = ")[^"]*(")', "`$1$NewSharePointUrl`$2"
    $deployScript = $deployScript -replace '(\$DocumentLibrary = ")[^"]*(")', "`$1$NewDocumentLibrary`$2"
    $deployScript = $deployScript -replace '(\$SubFolder = ")[^"]*(")', "`$1$NewSubFolder`$2"
    $deployScript | Out-File -FilePath "deploy.ps1" -Encoding UTF8
    Write-Host "✅ Updated deploy.ps1 defaults" -ForegroundColor Green
}

# Build and deploy
if ($Deploy) {
    Write-Host "Building application..." -ForegroundColor Yellow
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build successful!" -ForegroundColor Green

    Write-Host "Deploying to new SharePoint server..." -ForegroundColor Yellow
    & npm run deploy
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Deployment successful!" -ForegroundColor Green

    Write-Host ""
    Write-Host "🎉 Migration completed successfully!" -ForegroundColor Green
    Write-Host "New URL: $NewSharePointUrl/$NewDocumentLibrary/$NewSubFolder/index.html" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Migration Checklist:" -ForegroundColor Yellow
Write-Host "□ Test the new deployment URL" -ForegroundColor Gray
Write-Host "□ Verify all data loads correctly" -ForegroundColor Gray
Write-Host "□ Test user permissions and access" -ForegroundColor Gray
Write-Host "□ Update any bookmarks or shortcuts" -ForegroundColor Gray
Write-Host "□ Update documentation with new URLs" -ForegroundColor Gray
Write-Host "□ Notify users of the new location" -ForegroundColor Gray