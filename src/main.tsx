import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const AdminApp = lazy(() => import('@/admin/AdminApp'));
const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? (
      <Suspense fallback={<div className="min-h-screen bg-[#0e0d0c]" />}>
        <AdminApp />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>
);
