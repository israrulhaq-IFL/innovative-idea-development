param(
    [Parameter(Mandatory=$false)]
    [string]$SharePointSiteUrl = "http://hospp16srv:34334",

    [Parameter(Mandatory=$false)]
    [string]$DocumentLibrary = "SiteAssets",

    [Parameter(Mandatory=$false)]
    [string]$SubFolder = "modern_dashboard",

    [Parameter(Mandatory=$false)]
    [switch]$UseCredentials,

    [Parameter(Mandatory=$false)]
    [string]$Username,

    [Parameter(Mandatory=$false)]
    [string]$Password
)

# Function to get SharePoint request digest
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

# Function to delete file/folder from SharePoint
function Remove-SharePointFile {
    param(
        [string]$SiteUrl,
        [string]$FilePath,
        [string]$RequestDigest
    )

    $deleteUrl = "$SiteUrl/_api/web/GetFileByServerRelativeUrl('$FilePath')"
    $headers = @{
        "Accept" = "application/json;odata=verbose"
        "X-RequestDigest" = $RequestDigest
        "X-HTTP-Method" = "DELETE"
        "If-Match" = "*"
    }

    try {
        if ($UseCredentials) {
            $securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
            $credential = New-Object System.Management.Automation.PSCredential ($Username, $securePassword)
            Invoke-RestMethod -Uri $deleteUrl -Method POST -Headers $headers -Credential $credential
        } else {
            Invoke-RestMethod -Uri $deleteUrl -Method POST -Headers $headers -UseDefaultCredentials
        }

        Write-Host "Deleted: $FilePath"
    }
    catch {
        # File might not exist, which is fine
        Write-Host "File not found or already deleted: $FilePath"
    }
}

# Function to upload file to SharePoint
function Add-SharePointFile {
    param(
        [string]$SiteUrl,
        [string]$LocalFilePath,
        [string]$ServerRelativePath,
        [string]$RequestDigest
    )

    $fileName = [System.IO.Path]::GetFileName($LocalFilePath)
    $uploadUrl = "$SiteUrl/_api/web/lists/getbytitle('$DocumentLibrary')/RootFolder/Files/add(url='$fileName',overwrite=true)"

    # If there's a subfolder path, include it
    if ($ServerRelativePath) {
        $uploadUrl = "$SiteUrl/_api/web/GetFolderByServerRelativeUrl('$ServerRelativePath')/Files/add(url='$fileName',overwrite=true)"
    }

    $fileContent = [System.IO.File]::ReadAllBytes($LocalFilePath)

    $headers = @{
        "Accept" = "application/json;odata=verbose"
        "X-RequestDigest" = $RequestDigest
    }

    try {
        if ($UseCredentials) {
            $securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
            $credential = New-Object System.Management.Automation.PSCredential ($Username, $securePassword)
            $response = Invoke-RestMethod -Uri $uploadUrl -Method POST -Headers $headers -Body $fileContent -Credential $credential
        } else {
            $response = Invoke-RestMethod -Uri $uploadUrl -Method POST -Headers $headers -Body $fileContent -UseDefaultCredentials
        }

        Write-Host "Uploaded: $fileName to $ServerRelativePath"
    }
    catch {
        Write-Error "Failed to upload $fileName : $_"
        throw
    }
}

# Function to create folder in SharePoint
function New-SharePointFolder {
    param(
        [string]$SiteUrl,
        [string]$FolderPath,
        [string]$RequestDigest
    )

    $createFolderUrl = "$SiteUrl/_api/web/folders"
    $folderData = @{
        "__metadata" = @{ "type" = "SP.Folder" }
        "ServerRelativeUrl" = $FolderPath
    } | ConvertTo-Json

    $headers = @{
        "Accept" = "application/json;odata=verbose"
        "Content-Type" = "application/json;odata=verbose"
        "X-RequestDigest" = $RequestDigest
    }

    try {
        if ($UseCredentials) {
            $securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
            $credential = New-Object System.Management.Automation.PSCredential ($Username, $securePassword)
            Invoke-RestMethod -Uri $createFolderUrl -Method POST -Headers $headers -Body $folderData -Credential $credential
        } else {
            Invoke-RestMethod -Uri $createFolderUrl -Method POST -Headers $headers -Body $folderData -UseDefaultCredentials
        }

        Write-Host "Created folder: $FolderPath"
    }
    catch {
        # Folder might already exist
        Write-Host "Folder already exists or creation failed: $FolderPath"
    }
}

# Main deployment script
function Deploy-ModernDashboard {
    param(
        [string]$SiteUrl,
        [string]$DocLib,
        [string]$SubFolder
    )

    Write-Host "Starting Modern Dashboard Deployment..."
    Write-Host "SharePoint Site: $SiteUrl"
    Write-Host "Document Library: $DocLib"
    Write-Host "Subfolder: $SubFolder"

    # Step 1: Build the application
    Write-Host "`nStep 1: Building application..."
    try {
        Push-Location $PSScriptRoot
        $buildProcess = Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run build" -NoNewWindow -Wait -PassThru
        if ($buildProcess.ExitCode -ne 0) {
            throw "Build failed with exit code $($buildProcess.ExitCode)"
        }
        Write-Host "Build completed successfully"
    }
    catch {
        Write-Error "Build failed: $_"
        throw
    }
    finally {
        Pop-Location
    }

    # Step 1.5: Fix asset paths in index.html for SharePoint deployment
    Write-Host "`nStep 1.5: Updating asset paths for SharePoint deployment..."
    try {
        $indexPath = Join-Path $PSScriptRoot "dist\index.html"
        if (Test-Path $indexPath) {
            $content = Get-Content $indexPath -Raw
            
            # Replace absolute paths with relative paths
            $content = $content -replace 'href="/vite\.svg"', 'href="./vite.svg"'
            $content = $content -replace 'src="/assets/', 'src="./assets/'
            $content = $content -replace 'href="/assets/', 'href="./assets/'
            
            # Save the updated content
            $content | Set-Content $indexPath -Encoding UTF8
            Write-Host "Asset paths updated successfully"
        } else {
            Write-Warning "index.html not found at $indexPath"
        }
    }
    catch {
        Write-Error "Failed to update asset paths: $_"
        throw
    }

    # Step 2: Get request digest
    Write-Host "`nStep 2: Getting SharePoint request digest..."
    $requestDigest = Get-SharePointRequestDigest -SiteUrl $SiteUrl
    Write-Host "Request digest obtained"

    # Step 3: Prepare deployment paths
    $baseServerPath = "/$DocLib"
    if ($SubFolder) {
        $baseServerPath = "/$DocLib/$SubFolder"
    }

    $assetsServerPath = "$baseServerPath/assets"

    # Step 3: Ensuring folders exist
    Write-Host "`nStep 3: Ensuring folders exist..."
    if ($SubFolder) {
        New-SharePointFolder -SiteUrl $SiteUrl -FolderPath "$DocLib/$SubFolder" -RequestDigest $requestDigest
    }
    New-SharePointFolder -SiteUrl $SiteUrl -FolderPath "$DocLib/$SubFolder/assets" -RequestDigest $requestDigest

    # Step 4: Clean up existing deployment
    Write-Host "`nStep 4: Cleaning up existing deployment..."

    # Delete index.html
    $indexPath = "$baseServerPath/index.html"
    Remove-SharePointFile -SiteUrl $SiteUrl -FilePath $indexPath -RequestDigest $requestDigest

    # Delete vite.svg
    $vitePath = "$baseServerPath/vite.svg"
    Remove-SharePointFile -SiteUrl $SiteUrl -FilePath $vitePath -RequestDigest $requestDigest

    # Get all files in assets folder and delete them
    try {
        $assetsUrl = "$SiteUrl/_api/web/GetFolderByServerRelativeUrl('$assetsServerPath')/Files"
        $headers = @{ "Accept" = "application/json;odata=verbose" }

        if ($UseCredentials) {
            $securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
            $credential = New-Object System.Management.Automation.PSCredential ($Username, $securePassword)
            $assetsResponse = Invoke-RestMethod -Uri $assetsUrl -Method GET -Headers $headers -Credential $credential
        } else {
            $assetsResponse = Invoke-RestMethod -Uri $assetsUrl -Method GET -Headers $headers -UseDefaultCredentials
        }

        foreach ($file in $assetsResponse.d.results) {
            $filePath = "$assetsServerPath/$($file.Name)"
            Remove-SharePointFile -SiteUrl $SiteUrl -FilePath $filePath -RequestDigest $requestDigest
        }
    }
    catch {
        Write-Host "No existing assets folder or error listing files: $_"
    }

    # Step 5: Upload new files
    Write-Host "`nStep 5: Uploading new build..."

    $distPath = Join-Path $PSScriptRoot "dist"

    # Upload index.html
    $indexFile = Join-Path $distPath "index.html"
    if (Test-Path $indexFile) {
        Add-SharePointFile -SiteUrl $SiteUrl -LocalFilePath $indexFile -ServerRelativePath $baseServerPath -RequestDigest $requestDigest
    }

    # Upload vite.svg (if exists)
    $viteFile = Join-Path $distPath "vite.svg"
    if (Test-Path $viteFile) {
        Add-SharePointFile -SiteUrl $SiteUrl -LocalFilePath $viteFile -ServerRelativePath $baseServerPath -RequestDigest $requestDigest
    }

    # Upload assets
    $assetsPath = Join-Path $distPath "assets"
    if (Test-Path $assetsPath) {
        Get-ChildItem $assetsPath -File | ForEach-Object {
            Add-SharePointFile -SiteUrl $SiteUrl -LocalFilePath $_.FullName -ServerRelativePath $assetsServerPath -RequestDigest $requestDigest
        }
    }

    Write-Host "`nDeployment completed successfully!"
    Write-Host "Access your dashboard at: $SiteUrl$baseServerPath/index.html"
}

# Validate parameters
if ($UseCredentials -and (-not $Username -or -not $Password)) {
    Write-Error "When using -UseCredentials, both -Username and -Password must be provided"
    exit 1
}

# Run deployment
try {
    Deploy-ModernDashboard -SiteUrl $SharePointSiteUrl -DocLib $DocumentLibrary -SubFolder $SubFolder
}
catch {
    Write-Error "Deployment failed: $_"
    exit 1
}