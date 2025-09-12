# Supabase Setup Instructions / Supabase Kurulum Talimatları

## English

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Wait for the project to be ready (2-3 minutes)

### 2. Set up Database
1. Go to your project dashboard
2. Click on "SQL Editor" in the sidebar
3. Copy the contents of `supabase-schema.sql` 
4. Paste it into the SQL editor and run it
5. This will create all necessary tables, policies, and triggers

### 3. Configure Environment Variables
1. In your Supabase project dashboard, go to "Settings" > "API"
2. Copy the "Project URL" and "anon public" key
3. Update `.env.local` file:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Disable Email Confirmation (Optional)
1. Go to "Authentication" > "Settings" 
2. Turn off "Enable email confirmations"
3. This allows users to register without email verification

### 5. Test the Application
1. Run `npm run dev`
2. Create a new account or login
3. The app will automatically migrate your localStorage data to Supabase
4. Your data will now sync across all devices!

---

## Türkçe

### 1. Supabase Projesi Oluşturun
1. [supabase.com](https://supabase.com) adresine gidin
2. Kayıt olun/Giriş yapın ve yeni bir proje oluşturun
3. Projenin hazır olmasını bekleyin (2-3 dakika)

### 2. Veritabanını Kurun
1. Proje dashboard'unuza gidin
2. Kenar çubuğunda "SQL Editor"e tıklayın
3. `supabase-schema.sql` dosyasının içeriğini kopyalayın
4. SQL editörüne yapıştırın ve çalıştırın
5. Bu işlem gerekli tüm tabloları, politikaları ve tetikleyicileri oluşturacak

### 3. Ortam Değişkenlerini Yapılandırın
1. Supabase proje dashboard'unuzda "Settings" > "API" bölümüne gidin
2. "Project URL" ve "anon public" anahtarını kopyalayın
3. `.env.local` dosyasını güncelleyin:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. E-posta Doğrulamayı Kapatın (Opsiyonel)
1. "Authentication" > "Settings" bölümüne gidin
2. "Enable email confirmations" seçeneğini kapatın
3. Bu, kullanıcıların e-posta doğrulaması olmadan kayıt olmasını sağlar

### 5. Uygulamayı Test Edin
1. `npm run dev` komutunu çalıştırın
2. Yeni hesap oluşturun veya giriş yapın
3. Uygulama otomatik olarak localStorage verilerinizi Supabase'e taşıyacak
4. Verileriniz artık tüm cihazlarınızda senkronize olacak!

## Features / Özellikler

### Multi-Device Sync / Çoklu Cihaz Senkronizasyonu
- All data syncs in real-time across devices / Tüm veriler cihazlar arasında gerçek zamanlı senkronize
- User-specific data isolation / Kullanıcıya özel veri izolasyonu
- Automatic migration from localStorage / localStorage'dan otomatik geçiş

### Security / Güvenlik
- Row Level Security (RLS) enabled / Satır Düzeyi Güvenlik (RLS) aktif
- Each user can only access their own data / Her kullanıcı sadece kendi verilerine erişebilir
- Secure authentication with Supabase Auth / Supabase Auth ile güvenli kimlik doğrulama

### Data Migration / Veri Geçişi
- Automatic detection of existing localStorage data / Mevcut localStorage verisinin otomatik tespiti
- One-click migration process / Tek tıkla geçiş işlemi  
- Backup and restore functionality / Yedekleme ve geri yükleme işlevselliği