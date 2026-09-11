import { Buffer } from 'buffer';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// The "docx" library (via jszip) checks `Buffer.isBuffer(...)` internally
// when building the .docx file, even though we never touch Buffer directly.
// Vite doesn't provide Node's Buffer in the browser, and relying on the
// polyfill plugin's automatic global injection turned out to be unreliable
// in production builds — it silently produced a corrupted .docx instead of
// erroring, which is worse than not polyfilling at all. Setting it
// explicitly here, before anything else runs, guarantees it's always
// available by the time the DOCX export code needs it.
if (typeof (globalThis as unknown as { Buffer?: unknown }).Buffer === 'undefined') {
  (globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
