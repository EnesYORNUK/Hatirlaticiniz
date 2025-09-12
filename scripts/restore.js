const fs = require('fs');
const path = require('path');
const os = require('os');

// AppData yolu
const getAppDataPath = () => {
  const platform = process.platform;
  switch (platform) {
    case 'win32':
      return path.join(os.homedir(), 'AppData', 'Roaming', 'Hatirlaticinim');
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', 'Hatirlaticinim');
    default:
      return path.join(os.homedir(), '.config', 'Hatirlaticinim');
  }
};

// Backup klasörü
const backupDir = path.join(__dirname, '..', 'backups');

// Mevcut backup'ları listele
if (!fs.existsSync(backupDir)) {
  console.log('❌ No backups found');
  process.exit(1);
}

const backups = fs.readdirSync(backupDir)
  .filter(dir => dir.startsWith('backup-'))
  .sort()
  .reverse(); // En son backup'ı önce göster

if (backups.length === 0) {
  console.log('❌ No backups found');
  process.exit(1);
}

console.log('📦 Available backups:');
backups.forEach((backup, index) => {
  const backupPath = path.join(backupDir, backup);
  const infoFile = path.join(backupPath, 'backup-info.json');
  
  if (fs.existsSync(infoFile)) {
    const info = JSON.parse(fs.readFileSync(infoFile, 'utf8'));
    console.log(`  ${index + 1}. ${backup} (${info.timestamp}) - v${info.version}`);
  } else {
    console.log(`  ${index + 1}. ${backup}`);
  }
});

// Son backup'ı otomatik seç (argument yoksa)
const selectedIndex = process.argv[2] ? parseInt(process.argv[2]) - 1 : 0;

if (selectedIndex < 0 || selectedIndex >= backups.length) {
  console.log('❌ Invalid backup selection');
  process.exit(1);
}

const selectedBackup = backups[selectedIndex];
const selectedBackupPath = path.join(backupDir, selectedBackup);

console.log(`🔄 Restoring backup: ${selectedBackup}`);

try {
  // AppData klasörünü oluştur
  const appDataPath = getAppDataPath();
  if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath, { recursive: true });
  }
  
  // Backup dosyalarını geri yükle
  const files = fs.readdirSync(selectedBackupPath);
  files.forEach(file => {
    if (file.startsWith('appdata-')) {
      const originalName = file.replace('appdata-', '');
      const src = path.join(selectedBackupPath, file);
      const dest = path.join(appDataPath, originalName);
      
      fs.copyFileSync(src, dest);
      console.log(`✅ ${originalName} restored`);
    }
  });
  
  console.log(`🎉 Restore completed from: ${selectedBackup}`);
  console.log(`📁 Data restored to: ${appDataPath}`);
  
} catch (error) {
  console.error('❌ Restore failed:', error);
  process.exit(1);
} 