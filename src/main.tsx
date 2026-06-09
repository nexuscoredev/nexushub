import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initSiteTheme } from './lib/siteTheme';
import './index.css';
import './styles/responsive.css';
import './styles/nexusClientShell.css';

initSiteTheme();

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
