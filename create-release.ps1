# Değişiklikleri hazırlık alanına ekle
git add .

# Commit mesajı için tarih ve saat bilgisi al
$commitMessage = "feat: Auto-release on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Değişiklikleri commit'le
git commit -m $commitMessage

# Değişiklikleri GitHub'a push'la ve otomatik sürüm oluşturmayı tetikle
git push origin main