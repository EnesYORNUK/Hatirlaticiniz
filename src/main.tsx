import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { initializeSupabase } from './lib/supabase';

console.log('React main.tsx is loading...')
console.log('window.electronAPI:', window.electronAPI)

const rootElement = document.getElementById('root');
const root = createRoot(rootElement!);

// Show a loading message while Supabase is initializing
root.render(
  <StrictMode>
    <HashRouter>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Supabase başlatılıyor...</p>
        </div>
      </div>
    </HashRouter>
  </StrictMode>
);

console.log('Starting Supabase initialization...');
initializeSupabase()
  .then(() => {
    console.log('Supabase initialized successfully');
    root.render(
      <StrictMode>
        <HashRouter>
          <App />
        </HashRouter>
      </StrictMode>
    );
  })
  .catch((error) => {
    console.error('Failed to initialize Supabase:', error);
    root.render(
      <div className="flex flex-col justify-center items-center h-screen">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Uygulama Başlatılamadı</h1>
        <p className="text-gray-700">
          Gerekli servislerle bağlantı kurulamadı. Lütfen internet bağlantınızı kontrol edin ve uygulamayı yeniden başlatın.
        </p>
        <pre className="mt-4 p-2 bg-gray-100 rounded text-sm text-left overflow-auto">
          {error instanceof Error ? error.toString() : JSON.stringify(error)}
        </pre>
      </div>
    );
  });
