param(
    [Parameter(Mandatory=$false)]
    [string]$SharePointSiteUrl = $env:SHAREPOINT_URL,

    [Parameter(Mandatory=$false)]
    [switch]$UseCredentials,

    [Parameter(Mandatory=$false)]
    [string]$Username,

    [Parameter(Mandatory=$false)]
    [string]$Password
)

# Set defaults if environment variables are not set
if (-not $SharePointSiteUrl) { $SharePointSiteUrl = "http://hospp16srv:36156" }

# Set security protocol to allow HTTP connections
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls11 -bor [System.Net.SecurityProtocolType]::Tls

$ErrorActionPreference = "Stop"
$siteUrl = $SharePointSiteUrl
$targetFolder = "/innovativeIdeas/dist"
$assetsFolder = "$targetFolder/assets"
$sourcePath = Join-Path $PSScriptRoot "dist"

Write-Host "Starting Innovative Ideas SharePoint REST API Deployment" -ForegroundColor Cyan
Write-Host "   Source: $sourcePath"
Write-Host "   Target: $siteUrl$targetFolder"
Write-Host ""

# Function to get form digest for authentication
function Get-SharePointRequestDigest {
    param([string]$SiteUrl)

    $contextInfoUrl = "$SiteUrl/_api/contextinfo"
    $headers = @{
        "Accept" = "application/json;odata=verbose"
        "Content-Type" = "application/json;odata=verbose"
    }

    try {
        if ($UseCredentials) {
            $securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
            $credential = New-Object System.Management.Automation.PSCredential ($Username, $securePassword)
            $response = Invoke-RestMethod -Uri $contextInfoUrl -Method POST -Headers $headers -Credential $credential
        } else {
            $response = Invoke-RestMethod -Uri $contextInfoUrl -Method POST -Headers $headers -UseDefaultCredentials
        }

        return $response.d.GetContextWebInformation.FormDigestValue
    }
    catch {
        Write-Error "Failed to get request digest: $_"
        throw
    }
}

# Function to delete a file
function Remove-SharePointFile {
    param (
        [string]$ServerRelativeUrl,
        [string]$RequestDigest
    )

    $deleteUrl = "$siteUrl/_api/web/GetFileByServerRelativeUrl('$ServerRelativeUrl')"
    $deleteHeaders = @{
        "X-RequestDigest" = $RequestDigest
        "X-HTTP-Method" = "DELETE"
        "IF-MATCH" = "*"
    }

    try {
        if ($UseCredentials) {
            $securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
            $credential = New-Object System.Management.Automation.PSCredential ($Username, $securePassword)
            Invoke-RestMethod -Uri $deleteUrl -Method POST -Headers $deleteHeaders -Credential $credential
        } else {
            Invoke-RestMethod -Uri $deleteUrl -Method POST -Headers $deleteHeaders -UseDefaultCredentials
        }
        return $true
    }
    catch {
        return $false
    }
}

# Function to create folder if it doesn't exist
function New-SharePointFolder {
    param (
        [string]$FolderPath,
        [string]$RequestDigest
    )

    $createUrl = "$siteUrl/_api/web/folders"
    $folderData = @{
        "__metadata" = @{ "type" = "SP.Folder" }
        "ServerRelativeUrl" = $FolderPath
    } | ConvertTo-Json

    $createHeaders = @{
        "X-RequestDigest" = $RequestDigest
        "Accept" = "application/json;odata=verbose"
        "Content-Type" = "application/json;odata=verbose"
    }

    try {
        if ($UseCredentials) {
            $securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
            $credential = New-Object System.Management.Automation.PSCredential ($Username, $securePassword)
            Invoke-RestMethod -Uri $createUrl -Method POST -Headers $createHeaders -Body $folderData -Credential $credential
        } else {
            Invoke-RestMethod -Uri $createUrl -Method POST -Headers $createHeaders -Body $folderData -UseDefaultCredentials
        }
        Write-Host "Created folder: $FolderPath" -ForegroundColor Green
        return $true
    }
    catch {
        # Folder might already exist, which is fine
        Write-Host "Folder exists or created: $FolderPath" -ForegroundColor DarkGray
        return $true
    }
}

# Function to upload a file
function Add-SharePointFile {
    param (
        [string]$LocalPath,
        [string]$RemoteFolder,
        [string]$FileName,
        [string]$RequestDigest
    )

    $uploadUrl = $siteUrl + "/_api/web/GetFolderByServerRelativeUrl('" + $RemoteFolder + "')/Files/add(url='" + $FileName + "',overwrite=true)"

    $fileContent = [System.IO.File]::ReadAllBytes($LocalPath)

    $uploadHeaders = @{
        "X-RequestDigest" = $RequestDigest
        "Accept" = "application/json;odata=verbose"
    }

    try {
        if ($UseCredentials) {
            $securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
            $credential = New-Object System.Management.Automation.PSCredential ($Username, $securePassword)
            $response = Invoke-RestMethod -Uri $uploadUrl -Method POST -Headers $uploadHeaders -Body $fileContent -Credential $credential
        } else {
            $response = Invoke-RestMethod -Uri $uploadUrl -Method POST -Headers $uploadHeaders -Body $fileContent -UseDefaultCredentials
        }
        Write-Host "Uploaded: $FileName" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Failed to upload $FileName : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main deployment function
function Deploy-InnovativeIdeas {
    # Step 1: Build the application
    Write-Host "Building application..." -ForegroundColor Yellow
    try {
        Push-Location $PSScriptRoot
        $buildProcess = Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run build:sharepoint" -NoNewWindow -Wait -PassThru
        if ($buildProcess.ExitCode -ne 0) {
            throw "Build failed with exit code $($buildProcess.ExitCode)"
        }
        Write-Host "Build completed successfully" -ForegroundColor Green
    }
    catch {
        Write-Error "Build failed: $_"
        throw
    }
    finally {
        Pop-Location
    }

    # Step 2: Get request digest
    Write-Host "Getting SharePoint request digest..." -ForegroundColor Yellow
    try {
        $requestDigest = Get-SharePointRequestDigest -SiteUrl $siteUrl
        Write-Host "Got form digest" -ForegroundColor Green
    }
    catch {
        Write-Error "Failed to get form digest: $_"
        throw
    }

    # Step 3: Delete old assets
    Write-Host "Deleting old assets..." -ForegroundColor Yellow
    $deletedCount = 0
    $failedDeletes = 0

    # Get all files in the assets folder
    try {
        $assetsUrl = "$siteUrl/_api/web/GetFolderByServerRelativeUrl('$assetsFolder')/Files"
        $headers = @{ "Accept" = "application/json;odata=verbose" }

        if ($UseCredentials) {
            $securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
            $credential = New-Object System.Management.Automation.PSCredential ($Username, $securePassword)
            $assetsResponse = Invoke-RestMethod -Uri $assetsUrl -Method GET -Headers $headers -Credential $credential
        } else {
            $assetsResponse = Invoke-RestMethod -Uri $assetsUrl -Method GET -Headers $headers -UseDefaultCredentials
        }

        foreach ($file in $assetsResponse.d.results) {
            $fileUrl = "$assetsFolder/$($file.Name)"
            if (Remove-SharePointFile -ServerRelativeUrl $fileUrl -RequestDigest $requestDigest) {
                $deletedCount++
            } else {
                $failedDeletes++
            }
        }
    }
    catch {
        Write-Host "Could not retrieve existing assets (folder might not exist yet): $($_.Exception.Message)" -ForegroundColor Yellow
    }

    Write-Host "Deleted $deletedCount old asset files" -ForegroundColor Green
    if ($failedDeletes -gt 0) {
        Write-Host "Failed to delete $failedDeletes files" -ForegroundColor Yellow
    }

    # Step 4: Delete old index.html
    Write-Host "Deleting old index.html..." -ForegroundColor Yellow
    if (Remove-SharePointFile -ServerRelativeUrl "$targetFolder/index.html" -RequestDigest $requestDigest) {
        Write-Host "Deleted old index.html" -ForegroundColor Green
    } else {
        Write-Host "Old index.html not found or already deleted" -ForegroundColor Yellow
    }

    # Step 5: Upload new files
    Write-Host "Uploading new files..." -ForegroundColor Yellow
    $uploadedCount = 0
    $failedUploads = 0

    # Create necessary folders
    Write-Host "Creating folders..." -ForegroundColor Yellow
    New-SharePointFolder -FolderPath $targetFolder -RequestDigest $requestDigest
    New-SharePointFolder -FolderPath $assetsFolder -RequestDigest $requestDigest

    # Upload assets
    if (Test-Path "$sourcePath\assets") {
        Get-ChildItem -Path "$sourcePath\assets" -File | ForEach-Object {
            if (Add-SharePointFile -LocalPath $_.FullName -RemoteFolder $assetsFolder -FileName $_.Name -RequestDigest $requestDigest) {
                $uploadedCount++
            } else {
                $failedUploads++
            }
        }
    }

    # Upload index.html
    if (Test-Path "$sourcePath\index.html") {
        if (Add-SharePointFile -LocalPath "$sourcePath\index.html" -RemoteFolder $targetFolder -FileName "index.html" -RequestDigest $requestDigest) {
            $uploadedCount++
        } else {
            $failedUploads++
        }
    }

    # Summary
    Write-Host ""
    Write-Host "Deployment Summary:" -ForegroundColor Cyan
    Write-Host "   Files uploaded: $uploadedCount" -ForegroundColor Green
    Write-Host "   Failed uploads: $failedUploads" -ForegroundColor Red
    Write-Host "   Files deleted: $deletedCount" -ForegroundColor Green

    if ($failedUploads -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS: Deployment completed successfully!" -ForegroundColor Green
        Write-Host "   Access your app at: $siteUrl$targetFolder/index.html" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "WARNING: Deployment completed with errors. Please check the logs above." -ForegroundColor Yellow
        exit 1
    }
}

# Validate parameters
if ($UseCredentials -and (-not $Username -or -not $Password)) {
    Write-Error "When using -UseCredentials, both -Username and -Password must be provided"
    exit 1
}

# Run deployment
try {
    Deploy-InnovativeIdeas
}
catch {
    Write-Error "Deployment failed: $_"
    exit 1
}