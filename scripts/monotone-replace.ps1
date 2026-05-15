# 모노톤 디자인 일괄 치환 스크립트
$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path
$targetDirs = @("src\app")

$hexMap = @(
    @{ from = "#4285F4"; to = "#0A0A0A" },
    @{ from = "#EA4335"; to = "#262626" },
    @{ from = "#34A853"; to = "#404040" },
    @{ from = "#F9AB00"; to = "#737373" },
    @{ from = "#9C27B0"; to = "#525252" },
    @{ from = "#1A73E8"; to = "#0A0A0A" },
    @{ from = "#E1306C"; to = "#404040" },
    @{ from = "#03C75A"; to = "#525252" },
    @{ from = "#168EEA"; to = "#525252" },
    @{ from = "#9B72CB"; to = "#525252" },
    @{ from = "#D96570"; to = "#404040" },
    @{ from = "#D97706"; to = "#171717" },
    @{ from = "#1557B0"; to = "#262626" },
    @{ from = "#137333"; to = "#404040" },
    @{ from = "#B45309"; to = "#525252" },
    @{ from = "#ECFDF5"; to = "#F5F5F5" },
    @{ from = "#A7F3D0"; to = "#D4D4D4" },
    @{ from = "#065F46"; to = "#171717" },
    @{ from = "#FFFBEB"; to = "#FAFAFA" },
    @{ from = "#FCD34D"; to = "#D4D4D4" },
    @{ from = "#92400E"; to = "#404040" },
    @{ from = "#FEF2F2"; to = "#FAFAFA" },
    @{ from = "#FECACA"; to = "#E5E5E5" },
    @{ from = "#991B1B"; to = "#171717" }
)

$rgbaMap = @(
    @{ from = "26,\s*115,\s*232";  to = "10,10,10" },
    @{ from = "66,\s*133,\s*244";  to = "10,10,10" },
    @{ from = "234,\s*67,\s*53";   to = "38,38,38" },
    @{ from = "52,\s*168,\s*83";   to = "64,64,64" },
    @{ from = "249,\s*171,\s*0";   to = "115,115,115" },
    @{ from = "156,\s*39,\s*176";  to = "82,82,82" },
    @{ from = "225,\s*48,\s*108";  to = "64,64,64" },
    @{ from = "3,\s*199,\s*90";    to = "82,82,82" },
    @{ from = "168,\s*199,\s*250"; to = "250,250,250" }
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$files = @()
foreach ($d in $targetDirs) {
    $abs = Join-Path $root $d
    $files += Get-ChildItem -Path $abs -Recurse -File -Include "*.tsx", "*.ts", "*.css"
}

$changed = 0
foreach ($f in $files) {
    $orig = [System.IO.File]::ReadAllText($f.FullName, $utf8NoBom)
    $new = $orig

    foreach ($m in $hexMap) {
        $pattern = [regex]::Escape($m.from)
        $new = [regex]::Replace($new, $pattern, $m.to, "IgnoreCase")
    }
    foreach ($m in $rgbaMap) {
        $new = [regex]::Replace($new, $m.from, $m.to)
    }

    if ($new -ne $orig) {
        [System.IO.File]::WriteAllText($f.FullName, $new, $utf8NoBom)
        $rel = $f.FullName.Substring($root.Length + 1)
        Write-Host ("updated: " + $rel)
        $changed++
    }
}

Write-Host ""
Write-Host ("Done. " + $changed + " files changed.")
