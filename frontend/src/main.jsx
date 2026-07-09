import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error(
    '[KrishiLink] Could not find #root element. Check your index.html.',
  );
}

createRoot(container).render(
  <StrictMode>
    {/*
     * BrowserRouter lives here so AuthProvider (inside App) can
     * call useNavigate without "Router not found" errors.
     */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
