import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/unbounded/cyrillic-400.css';
import '@fontsource/unbounded/latin-400.css';
import '@fontsource/unbounded/cyrillic-500.css';
import '@fontsource/unbounded/latin-500.css';
import '@fontsource/onest/cyrillic-400.css';
import '@fontsource/onest/latin-400.css';
import '@fontsource/onest/cyrillic-500.css';
import '@fontsource/onest/latin-500.css';
import '@fontsource/onest/cyrillic-600.css';
import '@fontsource/onest/latin-600.css';
import './styles/ruble.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';
import { SmoothScrollProvider } from './motion';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, CSS.supports('-webkit-touch-callout', 'none') ? 1 : 0);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SmoothScrollProvider>
      <App />
    </SmoothScrollProvider>
  </StrictMode>,
);
