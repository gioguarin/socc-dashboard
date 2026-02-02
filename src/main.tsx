import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, ProtectedRoute } from './auth';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ProtectedRoute>
          <App />
        </ProtectedRoute>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
