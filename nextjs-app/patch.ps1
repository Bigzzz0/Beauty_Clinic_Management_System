Get-ChildItem -Path "src/app/api" -Filter "route.ts" -Recurse | ForEach-Object {
    $c = [System.IO.File]::ReadAllText($_.FullName)
    if (-not $c.Contains("force-dynamic")) {
        [System.IO.File]::WriteAllText($_.FullName, "export const dynamic = 'force-dynamic';`n" + $c)
        Write-Host "Fixed $($_.FullName)"
    }
}
