$ErrorActionPreference = 'Stop'
$siteUrl = 'http://localhost:4174'
$siteRoot = $PSScriptRoot
try {
    $siteReady = $false
    try {
        $siteResponse = Invoke-WebRequest -Uri $siteUrl -UseBasicParsing -TimeoutSec 2
        if ($siteResponse.Content -match '<title>Little English') { $siteReady = $true }
        else { throw 'Another website is using port 4174.' }
    } catch {
        if ($_.Exception.Message -match 'Another website') { throw }
    }
    if (-not $siteReady) {
        $siteNode = (Get-Command node -ErrorAction Stop).Source
        $siteProcess = Start-Process -FilePath $siteNode -ArgumentList 'server.mjs' -WorkingDirectory $siteRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $siteRoot 'server.log') -RedirectStandardError (Join-Path $siteRoot 'server-error.log') -PassThru
        for ($siteAttempt = 0; $siteAttempt -lt 30; $siteAttempt++) {
            Start-Sleep -Milliseconds 250
            if ($siteProcess.HasExited) { throw 'The local service did not start. Check server-error.log in this folder.' }
            try {
                $siteResponse = Invoke-WebRequest -Uri $siteUrl -UseBasicParsing -TimeoutSec 1
                if ($siteResponse.Content -match '<title>Little English') { $siteReady = $true; break }
            } catch { }
        }
    }
    if (-not $siteReady) { throw 'The local service is taking longer than expected. Try opening the launcher again.' }
    Start-Process -FilePath $siteUrl
} catch {
    Write-Host "Could not open Little English: $($_.Exception.Message)"
    Read-Host 'Press Enter to close'
    exit 1
}
