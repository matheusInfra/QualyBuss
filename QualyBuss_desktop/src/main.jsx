import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import GlobalErrorBoundary from './components/ErrorBoundary';
// Importações de I18n e Contextos
import './lib/i18n';
import { ThemeProvider } from './contexts/ThemeContext';


// Global Error Handler for Extension/Async issues
window.addEventListener('unhandledrejection', (event) => {
  // Suppress "message channel closed" error often caused by extensions
  if (event.reason && event.reason.message && event.reason.message.includes('message channel closed')) {
    event.preventDefault(); // Prevent it from showing as a red error in console
    console.warn('Suppressed "message channel closed" error (likely extension-related):', event.reason.message);
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </GlobalErrorBoundary>
  </StrictMode>,
)
