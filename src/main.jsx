import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// ─── Security: Console Warning ───────────────────────────────────────────────
console.log(
  '%c⚠️ ATENÇÃO — AÇÃO NÃO PERMITIDA',
  'color: #ff0000; font-size: 20px; font-weight: bold;'
);
console.log(
  '%cEste console é destinado exclusivamente a desenvolvedores autorizados.\nQualquer uso indevido desta ferramenta pode caracterizar violação de segurança e será registrado.\n\nBy: Log Lab Digital — Rafael Araujo',
  'color: #f59e0b; font-size: 13px;'
);
console.log(
  '%c🔒 Sistema protegido — Acesso monitorado.',
  'color: #ffffff; background: #000000; font-size: 12px; padding: 4px 8px;'
);

// ─── Security: Disable console in production (keep console.error) ─────────────
if (import.meta.env.PROD) {
  const noop = () => {};
  console.log = noop;
  console.debug = noop;
  console.info = noop;
  console.warn = noop;
  // console.error kept intentionally for real error monitoring
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)