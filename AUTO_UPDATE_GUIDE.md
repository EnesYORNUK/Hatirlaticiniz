# 🚀 Otomatik Güncelleme Sistemi Kullanım Kılavuzu

## 📋 İlk Kurulum (Geliştirici İçin)

### 1. GitHub Repository Hazırlığı
```bash
# Projeyi GitHub'a yükle
git add .
git commit -m "Initial commit with auto-updater"
git push origin main
```

### 2. İlk Release Oluşturma
```bash
# Package.json'da version'ı güncelle ve tag oluştur
cd project
npm run release

# Bu komut şunları yapar:
# - package.json'da version'ı artırır (0.0.7 -> 0.0.8)
# - Git tag oluşturur (v0.0.8)
# - Tag'i GitHub'a push eder
# - GitHub Actions otomatik build başlatır
```

### 3. GitHub Repository Settings
1. **Repository Settings** → **Actions** → **General**
2. **Workflow permissions**'da **Read and write permissions** seçin
3. **Allow GitHub Actions to create and approve pull requests** işaretleyin

## 🔄 Güncellem Yayınlama Süreci

### Her Yeni Özellik İçin:
```bash
# 1. Kod değişikliklerini yap
git add .
git commit -m "feat: yeni özellik eklendi"

# 2. Ana branch'e push et
git push origin main

# 3. Yeni version çıkar (otomatik tag + release)
npm run release
```

### Version Türleri:
```bash
npm run version:patch  # 0.0.7 -> 0.0.8 (küçük düzeltmeler)
npm run version:minor  # 0.0.7 -> 0.1.0 (yeni özellikler)
npm run version:major  # 0.0.7 -> 1.0.0 (büyük değişiklikler)
```

## 👥 Kullanıcı Deneyimi

### İlk Kurulum (Kullanıcı İçin)
1. **GitHub Releases** sayfasından en son `.exe` dosyasını indir
2. Kurulum yap (bir kerelik)
3. Uygulama otomatik olarak güncellemeleri kontrol edecek

### Otomatik Güncelleme Süreci
1. **Uygulama başladığında**: 2 saniye sonra güncelleme kontrolü
2. **Periyodik kontrol**: Her 30 dakikada bir
3. **Manuel kontrol**: Ayarlar → "Güncellemeleri Kontrol Et"

### Güncelleme Akışı
```
Yeni sürüm tespit edildi
      ↓
Kullanıcıya bildirim göster
      ↓
"Güncellemeyi İndir" butonu
      ↓
Arka planda indirme
      ↓
"Yeniden Başlat ve Kur" butonu
      ↓
Otomatik yeniden başlatma
      ↓
Yeni sürüm hazır!
```

## ⚙️ Kullanıcı Ayarları

### Otomatik Güncelleme Kontrolü
- **Ayarlar** → **Otomatik Güncelleme** checkbox'ı
- Kapalıysa: Sadece manuel kontrol çalışır
- Açıksa: Otomatik kontrol + bildirimler

### Güncelleme Bildirimleri
- Yeni sürüm mevcut olduğunda masaüstü bildirimi
- Uygulama içi güncelleme durumu göstergesi
- İndirme progress bar'ı

## 🔧 Teknik Detaylar

### Desteklenen Platformlar
- ✅ **Windows** (`.exe` installer)
- ✅ **Linux** (`.AppImage`)
- ✅ **macOS** (`.dmg`)

### Güvenlik
- GitHub Releases üzerinden güvenli indirme
- Checksum doğrulaması
- HTTPS ile şifreli bağlantı

### Hata Durumları
- İnternet bağlantısı yoksa: Sessizce atla
- Sunucu erişilemezse: Sonraki kontrole ertele
- Güncelleme başarısızsa: Kullanıcıya hata bildirimi

## 📝 Örnek Kullanım Senaryosu

```bash
# Geliştirici tarafında:
1. Kod değişikliği yap
2. git add . && git commit -m "fix: çek düzenleme hatası düzeltildi"
3. git push origin main
4. npm run release

# GitHub Actions otomatik olarak:
5. Tüm platformlar için build yapar
6. GitHub Release oluşturur
7. Binary dosyaları yükler

# Kullanıcı tarafında:
8. Uygulama otomatik olarak yeni sürümü tespit eder
9. "Güncelleme mevcut" bildirimi gösterir
10. Kullanıcı "İndir" butonuna basar
11. Arka planda güncelleme indirilir
12. "Yeniden Başlat" butonu gösterilir
13. Tek tıkla güncelleme tamamlanır
```

## 🎯 Avantajlar

### Geliştirici İçin:
- ✅ Tek komutla release (`npm run release`)
- ✅ Otomatik build + deployment
- ✅ Cross-platform support
- ✅ Version management otomatik

### Kullanıcı İçin:
- ✅ Bir kerelik kurulum
- ✅ Otomatik güncelleme bildirimleri
- ✅ Tek tıkla güncelleme
- ✅ Uygulamayı tekrar indirmeye gerek yok
- ✅ Her zaman en son sürümü kullanma

## 🚨 Önemli Notlar

1. **İlk release** mutlaka GitHub Actions ile yapılmalı
2. **Version number** her seferinde artırılmalı
3. **Internet bağlantısı** güncelleme için gerekli
4. **GitHub token** repository'de otomatik mevcut
5. **Release notes** her sürümde güncellenmeli

Bu sistem sayede kullanıcılarınız her zaman en güncel uygulamayı kullanacak! 🎉 