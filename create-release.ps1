# Bu betik, yeni bir sürüm oluşturma sürecini otomatikleştirir.

# Hata durumunda betiği durdur
$ErrorActionPreference = "Stop"

# 1. Sürüm numarasını artır ve git etiketi oluştur
Write-Host "Sürüm numarası artırılıyor ve git etiketi oluşturuluyor..."
npm version patch

# 2. Değişiklikleri ve etiketleri GitHub'a gönder
Write-Host "Değişiklikler ve etiketler GitHub'a gönderiliyor..."
git push origin main --tags

Write-Host "Yeni sürüm oluşturma işlemi başarıyla tetiklendi!"
Write-Host "GitHub Actions iş akışının durumunu 'Actions' sekmesinden kontrol edebilirsiniz."