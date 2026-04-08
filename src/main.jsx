import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initNotifications } from './lib/notifications';
import { themeStore } from './lib/themeStore';

// Initialize theme before render to avoid flash
themeStore.init();

// Initialize Capacitor plugins
initNotifications();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
