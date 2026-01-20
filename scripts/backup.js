const fs = require('fs');
const path = require('path');
const os = require('os');

// AppData yolu
const getAppDataPath = () => {
  const platform = process.platform;
  switch (platform) {
    case 'win32':
      return path.join(os.homedir(), 'AppData', 'Roaming', 'Hatirlaticiniz');
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', 'Hatirlaticiniz');
    default:
      return path.join(os.homedir(), '.config', 'Hatirlaticiniz');
  }
};

// Backup klasörü
const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `backup-${timestamp}`);

try {
  fs.mkdirSync(backupPath, { recursive: true });
  
  // AppData dosyalarını kopyala
  const appDataPath = getAppDataPath();
  if (fs.existsSync(appDataPath)) {
    const files = fs.readdirSync(appDataPath);
    files.forEach(file => {
      const src = path.join(appDataPath, file);
      const dest = path.join(backupPath, `appdata-${file}`);
      fs.copyFileSync(src, dest);
      console.log(`✅ ${file} backed up`);
    });
  }
  
  // Geliştirme bilgilerini kaydet
  const devInfo = {
    timestamp: new Date().toISOString(),
    version: require('../package.json').version,
    platform: process.platform,
    nodeVersion: process.version,
    appDataPath,
    backupPath
  };
  
  fs.writeFileSync(
    path.join(backupPath, 'backup-info.json'),
    JSON.stringify(devInfo, null, 2)
  );
  
  console.log(`🎉 Backup completed: ${backupPath}`);
  
} catch (error) {
  console.error('❌ Backup failed:', error);
  process.exit(1);
} 