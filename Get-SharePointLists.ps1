param(
    [Parameter(Mandatory=$false)]
    [string]$SharePointSiteUrl = "http://hospp16srv:34334",

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

# Function to get all lists from SharePoint site
function Get-SharePointLists {
    param([string]$SiteUrl)

    $listsUrl = "$SiteUrl/_api/web/lists"
    $headers = @{
        "Accept" = "application/json;odata=verbose"
    }

    try {
        if ($UseCredentials) {
            $securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
            $credential = New-Object System.Management.Automation.PSCredential ($Username, $securePassword)
            $response = Invoke-RestMethod -Uri $listsUrl -Method GET -Headers $headers -Credential $credential
        } else {
            $response = Invoke-RestMethod -Uri $listsUrl -Method GET -Headers $headers -UseDefaultCredentials
        }

        return $response.d.results
    }
    catch {
        Write-Error "Failed to get lists: $_"
        throw
    }
}

# Main script execution
Write-Host "Connecting to SharePoint site: $SharePointSiteUrl" -ForegroundColor Green

try {
    # Test connection by getting request digest
    Write-Host "Getting request digest..." -ForegroundColor Yellow
    $digest = Get-SharePointRequestDigest -SiteUrl $SharePointSiteUrl
    Write-Host "Successfully connected to SharePoint site!" -ForegroundColor Green

    # Get all lists
    Write-Host "Fetching all lists from the site..." -ForegroundColor Yellow
    $lists = Get-SharePointLists -SiteUrl $SharePointSiteUrl

    Write-Host "`n=== SharePoint Lists ===" -ForegroundColor Cyan
    Write-Host "Total lists found: $($lists.Count)" -ForegroundColor Green
    Write-Host ""

    # Display list information
    foreach ($list in $lists) {
        Write-Host "List Title: $($list.Title)" -ForegroundColor White
        Write-Host "  Internal Name: $($list.EntityTypeName)" -ForegroundColor Gray
        Write-Host "  Item Count: $($list.ItemCount)" -ForegroundColor Gray
        Write-Host "  List URL: $($list.RootFolder.ServerRelativeUrl)" -ForegroundColor Gray
        Write-Host "  Base Type: $($list.BaseType)" -ForegroundColor Gray
        Write-Host ""
    }

    # Export to CSV for reference
    $exportPath = "SharePointLists_$((Get-Date).ToString('yyyyMMdd_HHmmss')).csv"
    $lists | Select-Object Title, EntityTypeName, ItemCount, @{Name="ListUrl";Expression={$_.RootFolder.ServerRelativeUrl}}, BaseType | Export-Csv -Path $exportPath -NoTypeInformation
    Write-Host "List information exported to: $exportPath" -ForegroundColor Green

} catch {
    Write-Error "Script execution failed: $_"
    exit 1
}

Write-Host "Script completed successfully!" -ForegroundColor Green