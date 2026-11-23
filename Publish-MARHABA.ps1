$ErrorActionPreference = 'Stop'
$RepoUrl = 'https://github.com/hhvxvvf1-jpg/marhaba.git'
$ZipPath = Join-Path $PSScriptRoot 'MARHABA-deploy-clean.zip'
$WorkDir = Join-Path $env:TEMP 'MARHABA-GitHub-Publish'

Write-Host ''
Write-Host 'MARHABA - GitHub Publisher' -ForegroundColor Cyan
Write-Host 'Target: hhvxvvf1-jpg/marhaba (main)' -ForegroundColor Gray

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host 'Git for Windows is not installed.' -ForegroundColor Red
    Write-Host 'Install it from https://git-scm.com/download/win, then run this file again.'
    exit 1
}
if (-not (Test-Path -LiteralPath $ZipPath)) {
    Write-Host "Could not find $ZipPath" -ForegroundColor Red
    Write-Host 'Keep this script beside MARHABA-deploy-clean.zip.'
    exit 1
}

if (Test-Path -LiteralPath $WorkDir) { Remove-Item -LiteralPath $WorkDir -Recurse -Force }
New-Item -ItemType Directory -Path $WorkDir | Out-Null
Expand-Archive -LiteralPath $ZipPath -DestinationPath $WorkDir -Force
Set-Location $WorkDir

git init
if ($LASTEXITCODE -ne 0) { throw 'git init failed.' }
git branch -M main
if ($LASTEXITCODE -ne 0) { throw 'Could not create main branch.' }

$name = (git config user.name 2>$null | Out-String).Trim()
$email = (git config user.email 2>$null | Out-String).Trim()
if (-not $name) { $name = Read-Host 'Enter your name for the Git commit'; git config user.name $name }
if (-not $email) { $email = Read-Host 'Enter your GitHub email (or GitHub noreply email)'; git config user.email $email }

git add -A
if ($LASTEXITCODE -ne 0) { throw 'git add failed.' }
git commit -m 'Publish MARHABA application source'
if ($LASTEXITCODE -ne 0) { throw 'Commit failed. Check the Git name/email values and try again.' }

$origin = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) { git remote set-url origin $RepoUrl } else { git remote add origin $RepoUrl }
if ($LASTEXITCODE -ne 0) { throw 'Could not configure GitHub remote.' }

Write-Host ''
Write-Host 'GitHub sign-in may open in your browser. Complete the login when asked.' -ForegroundColor Yellow
git push -u origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host ''
    Write-Host 'The push did not complete. Confirm that you are signed into the correct GitHub account and that the empty repository is still accessible.' -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host 'SUCCESS - MARHABA source has been uploaded to GitHub.' -ForegroundColor Green
Write-Host 'https://github.com/hhvxvvf1-jpg/marhaba' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Note: GitHub stores the source code. It does not run this Next.js + SQLite app as a live website.' -ForegroundColor Yellow
