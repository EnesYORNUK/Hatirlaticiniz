# 🚀 Güvenli Deployment Rehberi

Bu rehber, uygulamayı güvenli şekilde güncellemek ve deploy etmek için oluşturulmuştur.

## 📋 Ön Kontrol Listesi

### ✅ Geliştirme Öncesi
- [ ] Mevcut verilerin yedeğini al (`npm run backup`)
- [ ] Local development test et (`npm run dev`)
- [ ] Electron build test et (`npm run safe:test`)

### ✅ Kod Değişiklikleri
- [ ] ErrorBoundary düzgün çalışıyor mu?
- [ ] Loading state'ler var mı?
- [ ] Async işlemler timeout korumalı mı?
- [ ] LocalStorage backward compatibility var mı?

## 🛠️ Güvenli Deployment Komutları

### 📦 Küçük Değişiklikler (UI, bug fix)
```bash
npm run safe:patch
```

### 🔄 Orta Değişiklikler (yeni özellik)
```bash
npm run safe:minor
```

### ⚡ Acil Düzeltme (hotfix)
```bash
# Hızlı test
npm run safe:test

# Release
npm run version:patch
```

## 🧪 Test Prosedürü

### 1. Local Test
```bash
npm run dev
# - UI çalışıyor mu?
# - Tüm özellikler çalışıyor mu?
# - Console'da hata var mı?
```

### 2. Build Test
```bash
npm run safe:test
# - Build başarılı mı?
# - Electron açılıyor mu?
# - Packaged app çalışıyor mu?
```

### 3. Production Test
```bash
npm run electron:dist
# - Setup dosyası oluştu mu?
# - Kurulum testi
# - Auto-update testi
```

## 🚨 Hata Durumları

### Beyaz Ekran
```bash
# 1. Loading state kontrolü
# 2. Async işlem timeout'ları
# 3. ErrorBoundary aktif mi?
# 4. LocalStorage compatibility
```

### Auto-Update Hatası
```bash
# 1. GitHub release var mı?
# 2. Dosya adı doğru mu?
# 3. electron-updater config doğru mu?
```

### Data Loss
```bash
# Backup restore
npm run restore
```

## 📂 Klasör Yapısı

```
project/
├── scripts/
│   ├── backup.js      # Veri yedekleme
│   └── restore.js     # Veri geri yükleme
├── backups/           # Local yedekler (git'de yok)
├── src/
│   └── components/
│       └── ErrorBoundary.tsx  # Hata yakalama
└── DEPLOYMENT_GUIDE.md  # Bu dosya
```

## 🔍 Rollback Prosedürü

### Acil Geri Dönüş
1. **GitHub'da eski release'i aktif et**
2. **Kullanıcılara downgrade talimatı**
3. **Problemi çöz**
4. **Yeni hotfix release**

### Veri Geri Yükleme
```bash
# Backup listesi
npm run restore

# Belirli backup seç
npm run restore 2
```

## 🎯 Best Practices

### ✅ YAPMALISIN
- Her deploy öncesi backup al
- Safe komutları kullan
- Test prosedürünü takip et
- ErrorBoundary ekle
- Loading state'ler ekle

### ❌ YAPMAMALSIN
- Doğrudan `npm run version:patch` kullanma
- Async işlemler timeout'suz bırakma
- Major değişiklikleri patch olarak gönderme
- Backup almadan deploy etme
- Production'da test etme

## 📞 Acil Durum

### Kullanıcı Desteği
1. **Backup restore**: `npm run restore`
2. **Manual setup download**: GitHub releases
3. **Data export**: Uygulama → Ayarlar → Export
4. **Clear data**: LocalStorage clear

### Developer Desteği
1. **GitHub Issues**
2. **Error logs** (`console.log`)
3. **Version info** (`package.json`)
4. **System info** (OS, Node version)

---

🔧 **Son güncelleme**: Bu rehber v0.0.17 sonrası oluşturulmuştur.
💡 **Tavsiye**: Her major deployment öncesi bu rehberi gözden geçirin! 