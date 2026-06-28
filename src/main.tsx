import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme/tokens.css';
import './theme/components.css';
import App from './App';
import { applyTheme } from './core/theme';

applyTheme(JSON.parse(localStorage.getItem('hc.theme') || '"system"'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
