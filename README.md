# 📝 Hatırlatıcınız - Çek ve İlaç Takip Uygulaması

## 🎯 Genel Bakış

**Hatırlatıcınız**, çek ödemelerinizi ve ilaç alım zamanlarınızı takip etmenizi sağlayan modern bir masaüstü uygulamasıdır. Electron, React ve TypeScript teknolojileri ile geliştirilmiş olup, Windows, macOS ve Linux platformlarında çalışır.

### ✨ Ana Özellikler

#### 💰 Çek ve Fatura Yönetimi
- **Çek/Fatura Ekleme**: Tutار, vade tarihi, imza sahibi bilgileri
- **Otomatik Hatırlatma**: Ödeme tarihinden önceden belirlenen gün sayısı kadar önce bildirim
- **Tekrarlayan Ödemeler**: Aylık, haftalık, yıllık tekrarlayan ödemeler
- **Fatura Türleri**: Elektrik, su, doğalgaz, telefon, internet ve özel fatura türleri
- **Ödeme Durumu**: Checkbox ile ödeme tamamlama işaretleme
- **Filtreleme ve Arama**: Tarih, tür ve durum bazında filtreleme

#### 💊 İlaç Takip Sistemi
- **İlaç Ekleme**: İlaç adı, dozaj, sıklık ve zaman bilgileri
- **Günlük Program**: Gün içerisinde alınması gereken ilaçların listesi
- **Hatırlatma Sistemi**: Belirlenen süre öncesinde bildirim (varsayılan 15 dakika)
- **Aktif/Pasif Durumu**: İlaçları geçici olarak devre dışı bırakma
- **Alım Kayıtları**: Hangi ilaçların ne zaman alındığının takibi

#### 🎨 Tema ve Kişiselleştirme
- **10 Farklı Tema**: Açık, Koyu, Mavi, Yeşil, Turuncu, Mor, Gri, Kırmızı, Turkuaz, Pembe
- **Responsive Tasarım**: Farklı ekran boyutlarına uyumlu arayüz
- **Sabit Başlık**: Kaydırma sırasında navigasyon menüsü her zaman görünür

#### 🔔 Bildirim Sistemi
- **Masaüstü Bildirimleri**: Sistem bildirimleri ile hatırlatma
- **Günlük Bildirimler**: Belirlenen saatte günlük özet bildirimi
- **Telegram Entegrasyonu**: Telegram bot ile bildirim gönderme (opsiyonel)
- **Ses Bildirimleri**: İlaç hatırlatmaları için ses uyarısı

#### 📊 Günlük Program
- **Bugünün Ödemeleri**: Bugün vadesi gelen çek/faturaların listesi
- **Bugünün İlaçları**: Bugün alınması gereken ilaçların zamanları
- **Hızlı İşaretleme**: Ödemeleri ve ilaç alımlarını tek tıkla tamamlama

#### 🔧 Ayarlar ve Yedekleme
- **Hatırlatma Ayarları**: Kaç gün önceden hatırlatma yapılacağı
- **Bildirim Tercihleri**: Hangi bildirimlerin aktif olacağı
- **Veri Yedekleme**: JSON formatında veri dışa/içe aktarma
- **Otomatik Güncelleme**: Uygulama güncellemelerinin otomatik kontrolü

## 🚀 Kurulum

### Kullanıcılar İçin (Hazır Uygulama)

1. [GitHub Releases](https://github.com/EnesYORNUK/Hatirlaticiniz/releases) sayfasından en son sürümü indirin
2. İşletim sisteminize uygun dosyayı seçin:
   - **Windows**: `Hatirlaticinim-Setup-X.X.X.exe`
   - **macOS**: `Hatirlaticinim-X.X.X.dmg`
   - **Linux**: `Hatirlaticinim-X.X.X.AppImage`
3. İndirilen dosyayı çalıştırın ve kurulum talimatlarını takip edin
4. Uygulama otomatik olarak güncellemeleri kontrol edecektir

### Geliştiriciler İçin

#### Gereksinimler
- Node.js (v18 veya üzeri)
- npm veya yarn
- Git

#### Kurulum Adımları


# Repository'yi klonlayın
git clone https://github.com/EnesYORNUK/Hatirlaticiniz.git
cd Hatirlaticiniz

# Bağımlılıkları yükleyin
npm install

# Geliştirme modunda çalıştırın
npm run dev

# Electron uygulamasını build edin
npm run build-electron

# Platform özelinde build
npm run dist-win    # Windows için
npm run dist        # Tüm platformlar için

📱 Kullanım Kılavuzu
İlk Kullanım

Uygulama Kurulumu: Uygulamayı kurup ilk kez açın

Ayarları Yapılandırın: Ayarlar sekmesinden bildirim tercihlerinizi belirleyin

İlk Çeki Ekleyin: Ana sayfadan "Çek Ekle" butonuna tıklayın

İlk İlacı Ekleyin: İlaçlar sekmesinden "İlaç Ekle" butonuna tıklayın

Çek/Fatura Ekleme

Ana sayfa → "Çek Ekle" butonu

Gerekli bilgileri doldurun:

Tür: Çek veya Fatura seçin

Tutar: Ödeme miktarı

Vade Tarihi: Ödeme yapılacak tarih

İmza Sahibi: Çeki kesen kişi/kurum

Ödenecek: Ödeme yapılacak kişi/kurum

Tekrarlayan: Düzenli ödemeler için işaretleyin

"Kaydet" butonuna tıklayın

İlaç Ekleme

İlaçlar sekmesi → "İlaç Ekle" butonu

İlaç bilgilerini girin:

İlaç Adı: İlacın tam adı

Dozaj: Kaç tablet/damla vs.

Sıklık: Günde kaç kez alınacağı

Zamanlar: Hangi saatlerde alınacağı

Başlangıç/Bitiş Tarihi: İlaç kullanım süresi

"Kaydet" butonuna tıklayın

Günlük Programa Erişim

Günlük Program sekmesine tıklayın

Bugünün Ödemeleri bölümünde vadesi gelen çek/faturaları görün

Bugünün İlaçları bölümünde alınması gereken ilaçları görün

Tamamlanan işlemleri ✅ işaretiyle tamamlayın

Bildirim Ayarları

Ayarlar sekmesine gidin

Bildirim Tercihleri bölümünde:

Kaç gün önceden hatırlatma istediğinizi belirleyin

Günlük bildirim saatini ayarlayın

İlaç bildirimleri için süreyi belirleyin

Telegram bot entegrasyonu kurun (opsiyonel)

Veri Yedekleme

Veri Dışa Aktarma

Ayarlar → "Verileri Dışa Aktar"

JSON dosyası bilgisayarınıza indirilecek

Bu dosyayı güvenli bir yerde saklayın

Veri İçe Aktarma

Ayarlar → "Verileri İçe Aktar"

Daha önce dışa aktardığınız JSON dosyasını seçin

Verileriniz geri yüklenecek

🛠️ Teknik Detaylar

Kullanılan Teknolojiler

Frontend: React 18, TypeScript

Desktop Framework: Electron

Styling: Tailwind CSS

Icons: Lucide React

Build Tool: Vite

Notifications: electron-updater

External API: Telegram Bot API (opsiyonel)

Proje Yapısı

src/
├── components/           # React bileşenleri
│   ├── CheckForm.tsx    # Çek/fatura formu
│   ├── CheckList.tsx    # Çek/fatura listesi
│   ├── MedicationForm.tsx # İlaç formu
│   ├── MedicationList.tsx # İlaç listesi
│   ├── DailySchedule.tsx  # Günlük program
│   ├── Settings.tsx     # Ayarlar sayfası
│   └── Layout.tsx       # Ana layout
├── hooks/               # Custom React hooks
│   ├── useLocalStorage.ts
│   ├── useMedications.ts
│   └── useNotifications.ts
├── types/               # TypeScript tipleri
│   ├── index.ts
│   └── medication.ts
├── utils/               # Yardımcı fonksiyonlar
│   └── dateUtils.ts
└── App.tsx              # Ana uygulama bileşeni

Veri Depolama

Uygulama tüm verileri yerel olarak saklar:

Location: %APPDATA%/hatirlaticinim (Windows)

Format: JSON tabanlı LocalStorage

Backup: Manuel dışa/içe aktarma özelliği

Bildirim Sistemi

Masaüstü Bildirimleri

Electron'un native notification API'si kullanılır

Windows, macOS ve Linux'ta desteklenir

Kullanıcı izni gerektirir

Telegram Entegrasyonu

Telegram Bot API üzerinden çalışır

Bot token ve chat ID gerektirir

Opsiyonel özellik, kapatılabilir

🔒 Güvenlik ve Gizlilik

Yerel Veri: Tüm veriler cihazınızda saklanır

İnternet Bağlantısı: Sadece güncelleme kontrolü ve Telegram bildirimleri için

Üçüncü Taraf: Hiçbir üçüncü taraf servisine veri gönderilmez

Şifreleme: Hassas veriler için local şifreleme planlanmaktadır

🔄 Otomatik Güncelleme

Uygulama otomatik güncelleme sistemi ile gelir:

Kontrol Sıklığı: Uygulama başlangıcında ve her 30 dakikada bir

Bildirim: Yeni sürüm mevcut olduğunda kullanıcıya bildirilir

İndirme: Arka planda otomatik indirilir

Kurulum: Tek tıkla yeniden başlatma ve kurulum

Güvenlik: GitHub Releases üzerinden güvenli indirme

🤝 Katkıda Bulunma

Bug Raporu

GitHub Issues sayfasında yeni issue açın

Hatayı detaylı olarak açıklayın

Hata oluştuğunda ki adımları belirtin

Ekran görüntüsü ekleyin (gerekirse)

Özellik İsteği

GitHub Issues'da "enhancement" etiketi ile issue açın

İstediğiniz özelliği detaylı açıklayın

Kullanım senaryosunu belirtin

Kod Katkısı

Repository'yi fork edin

Yeni feature branch oluşturun (git checkout -b feature/amazing-feature)

Değişikliklerinizi commit edin (git commit -m 'Add some amazing feature')

Branch'inizi push edin (git push origin feature/amazing-feature)

Pull Request oluşturun

📄 Lisans

Bu proje MIT lisansı altında dağıtılmaktadır. Detaylar için LICENSE dosyasına bakınız.

👨‍💻 Geliştirici

Geliştirici: Enes YORNUK

GitHub: @EnesYORNUK

Repository: Hatirlaticiniz

🆕 Sürüm Geçmişi

v2.0.0 (Mevcut)

✅ İlaç takip sistemi eklendi
✅ Günlük program özelliği
✅ 10 farklı tema seçeneği
✅ Gelişmiş bildirim sistemi
✅ Telegram bot entegrasyonu
✅ Otomatik güncelleme sistemi
✅ Veri yedekleme ve geri yükleme
v1.0.0
✅ Temel çek takip sistemi
✅ Fatura yönetimi
✅ Tekrarlayan ödemeler
✅ Masaüstü bildirimleri
📞 Destek
Herhangi bir sorun yaşıyorsanız:
Dokümantasyon: Bu README dosyasını inceleyin
Issues: GitHub Issues sayfasında arama yapın
Yeni Issue: Sorununuzu GitHub'da rapor edin
🎯 Gelecek Güncellemeler
🔄 Bulut senkronizasyonu (opsiyonel)
📱 Mobil uygulama uyumluluğu
🔐 Veri şifreleme
📊 Gelişmiş raporlama
🌐 Çoklu dil desteği
💾 Veritabanı desteği (SQLite)
⚡ Hatırlatıcınız ile çek ödemelerinizi ve ilaç alım zamanlarınızı asla unutmayın!

-Bu README dosyası uygulamanızın tüm özelliklerini kapsamlı bir şekilde açıklıyor. İsterseniz bazı bölümleri güncelleyebilir veya eksik gördüğünüz kısımları ekleyebiliriz.-

<!-- release trigger -->
