# Context Generator v2 - Includes Anki Templates
$coreFiles = @("manifest.json", "content.js", "background.js")
$templateFiles = @("anki_templates\front.html", "anki_templates\back.html", "anki_templates\styling.css")

$output = "Here is my complete project context:`n"

# 1. Grab Core Extension Files
foreach ($f in $coreFiles) {
    if (Test-Path $f) {
        $content = Get-Content $f -Raw
        $output += "================`nFILE: $f`n================`n$content`n`n"
    } else {
        $output += "Warning: $f not found.`n"
    }
}

# 2. Grab Anki Templates
foreach ($t in $templateFiles) {
    if (Test-Path $t) {
        $content = Get-Content $t -Raw
        $output += "================`nTEMPLATE: $t`n================`n$content`n`n"
    } else {
        $output += "Warning: Template $t not found.`n"
    }
}

$output | Set-Clipboard
Write-Host "✅ detailed context (Code + Templates) copied to clipboard!" -ForegroundColor Green
Write-Host "👉 Go back to Gemini and press Ctrl+V." -ForegroundColor White
Start-Sleep -Seconds 3