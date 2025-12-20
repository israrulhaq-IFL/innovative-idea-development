@echo off
REM Modern Dashboard Deployment Script
REM Usage: deploy.bat [SharePointSiteUrl] [DocumentLibrary] [SubFolder]

if "%~1"=="" (
    echo Usage: deploy.bat [SharePointSiteUrl] [DocumentLibrary] [SubFolder]
    echo Example: deploy.bat "http://sharepoint-site" "SiteAssets" "modern_dashboard"
    echo Using defaults: http://hospp16srv:34334 SiteAssets modern_dashboard
    powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
) else (
    if "%~2"=="" (
        powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1" -SharePointSiteUrl "%~1"
    ) else (
        if "%~3"=="" (
            powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1" -SharePointSiteUrl "%~1" -DocumentLibrary "%~2"
        ) else (
            powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1" -SharePointSiteUrl "%~1" -DocumentLibrary "%~2" -SubFolder "%~3"
        )
    )
)