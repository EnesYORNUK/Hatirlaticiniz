import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // localStorage'a kaydet
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Telegram bot için AppData'ya da kaydet
      if (window.electronAPI?.saveAppData) {
        try {
          await window.electronAPI.saveAppData(key, valueToStore);
          console.log(`✅ ${key} AppData'ya kaydedildi (Telegram bot için)`);
        } catch (error) {
          console.error(`❌ ${key} AppData'ya kaydedilemedi:`, error);
        }
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}