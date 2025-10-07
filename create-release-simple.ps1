Param(
  [ValidateSet('major','minor','patch')]
  [string]$Bump = 'patch',
  [switch]$MajorTag
)

$ErrorActionPreference = 'Stop'

Write-Host "Yeni release oluşturma başlıyor... (bump: $Bump)"

# 0) GITHUB_TOKEN isteğe bağlı; yoksa API release adımı atlanır ve CI devreye girer
$hasToken = $true
if (-not $env:GITHUB_TOKEN) {
  $hasToken = $false
  Write-Host "Uyarı: GITHUB_TOKEN ayarlı değil. Tag ve push yapılacak; GitHub Actions release’i oluşturacak."
}

# 1) origin URL'den owner/repo çıkar
$originUrl = (git remote get-url origin).Trim()
if (-not $originUrl) { Write-Error "Git origin URL alınamadı"; exit 1 }

$owner = $null; $repo = $null
if ($originUrl -match 'github.com[:/](?<owner>[^/]+)/(?<repo>[^/.]+)') {
  $owner = $Matches.owner
  $repo = $Matches.repo
} else {
  Write-Error "Owner/Repo parse edilemedi: $originUrl"
  exit 1
}

# 2) Geçerli branch belirle
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if (-not $branch) { $branch = 'main' }

# 3) Versiyonu bump et (package.json)
$oldVersion = (Get-Content package.json | ConvertFrom-Json).version
Write-Host "Mevcut sürüm: $oldVersion"

npm version $Bump --no-git-tag-version | Out-Null
$newVersion = (Get-Content package.json | ConvertFrom-Json).version
Write-Host "Yeni sürüm: $newVersion"

git add package.json
git commit -m "chore: release v$($newVersion)" | Out-Null

# 4) Tag oluştur
$fullTag = "v$($newVersion)"
git tag $fullTag

if ($MajorTag -or $Bump -eq 'major') {
  $major = $newVersion.Split('.')[0]
  $majorTagName = "v$major"
  Write-Host "Major tag oluşturuluyor: $majorTagName (force)"
  git tag -f $majorTagName
}

# 5) Push (commit + tags)
git push origin $branch
git push origin --tags

if ($hasToken) {
  # 6) GitHub Release oluştur (REST API)
  $headers = @{ 
    Authorization = "token $($env:GITHUB_TOKEN)"
    'User-Agent' = "$owner-$repo-release-script"
  }

  $releaseBody = @{ 
    tag_name = $fullTag
    name     = "Release $fullTag"
    body     = "Automated release for version $newVersion"
    draft    = $false
    prerelease = $false
  } | ConvertTo-Json

  $createUrl = "https://api.github.com/repos/$owner/$repo/releases"
  Write-Host "GitHub Release oluşturuluyor: $createUrl"
  $release = Invoke-RestMethod -Method Post -Uri $createUrl -Headers $headers -Body $releaseBody
  Write-Host "Release oluşturuldu: $($release.html_url)"

  # 7) Varsa artefaktları yükle (electron-dist)
  $assetPatterns = @(
    'electron-dist\latest.yml',
    'electron-dist\*.exe',
    'electron-dist\*.exe.blockmap'
  )

  $assetFiles = @()
  foreach ($pat in $assetPatterns) {
    $assetFiles += Get-ChildItem -Path $pat -ErrorAction SilentlyContinue
  }

  foreach ($file in $assetFiles) {
    Write-Host "Yükleniyor: $($file.FullName)"
    $uploadUrl = $release.upload_url -replace '\{.*\}', "?name=$($file.Name)"
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $uploadHeaders = $headers.Clone()
    $uploadHeaders['Content-Type'] = 'application/octet-stream'
    $resp = Invoke-RestMethod -Method Post -Uri $uploadUrl -Headers $uploadHeaders -Body $bytes
  }
} else {
  Write-Host "Release API adımı atlandı. GitHub Actions push ile release oluşturacak."
}

Write-Host "Tamamlandı."