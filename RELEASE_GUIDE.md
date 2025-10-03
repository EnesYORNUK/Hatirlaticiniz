# Sürüm Oluşturma Rehberi

Bu doküman, "Hatırlatıcınız" uygulaması için nasıl yeni bir sürüm oluşturulacağını adım adım açıklamaktadır. Bu süreç, `create-release.ps1` betiği kullanılarak otomatikleştirilmiştir.

## Yeni Sürüm Oluşturma Adımları

Yeni bir sürüm yayınlamak için aşağıdaki komutu projenin ana dizininde bir PowerShell terminalinde çalıştırmanız yeterlidir:

```powershell
./create-release.ps1
```

Bu komut, aşağıdaki işlemleri otomatik olarak gerçekleştirir:

1.  **Sürüm Numarasını Artırma:** `package.json` dosyasındaki `version` alanını bir sonraki yama sürümüne (örn: `4.0.18` -> `4.0.19`) yükseltir.
2.  **Değişiklikleri Commit'leme:** Sürüm artışını içeren `package.json` dosyasını "feat: Auto-release on [tarih]" mesajıyla commit'ler.
3.  **Git Etiketi Oluşturma:** Yeni sürüm numarasıyla (örn: `v4.0.19`) bir git etiketi oluşturur.
4.  **Değişiklikleri GitHub'a Gönderme:** Yapılan commit'i ve oluşturulan yeni etiketi `main` dalına gönderir (`git push` ve `git push --tags`).
5.  **GitHub Actions'ı Tetikleme:** Bu işlem, `.github/workflows/release.yml` dosyasında tanımlanan sürüm oluşturma iş akışını otomatik olarak tetikler. İş akışı, uygulamayı derler, `.exe` yükleyicisini oluşturur ve GitHub'daki "Releases" sayfasında yeni bir sürüm yayınlar.

## Önemli Notlar

- Bu betiği çalıştırmadan önce, yayınlamak istediğiniz tüm değişikliklerin `main` dalına birleştirildiğinden emin olun.
- Betik, sürüm numarasını otomatik olarak artırdığı için `package.json` dosyasını manuel olarak değiştirmenize gerek yoktur.
- İş akışının durumunu, projenizin GitHub sayfasındaki "Actions" sekmesinden takip edebilirsiniz. İş akışı tamamlandığında, yeni sürüm "Releases" sayfasında görünecektir.