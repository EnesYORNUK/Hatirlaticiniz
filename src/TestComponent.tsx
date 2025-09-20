import React from 'react';

export default function TestComponent() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'lightblue', 
      color: 'black',
      fontSize: '24px',
      fontWeight: 'bold'
    }}>
      <h1>Test Component Çalışıyor!</h1>
      <p>Bu basit bir test component'idir.</p>
      <button onClick={() => alert('Buton çalışıyor!')}>
        Test Butonu
      </button>
    </div>
  );
}