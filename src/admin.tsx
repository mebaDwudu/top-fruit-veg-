import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from './context/StoreContext';
import { AdminPortal } from './components/admin/AdminPortal';
import './index.css';

function AdminApp() {
  return (
    <StoreProvider>
      <AdminPortal
        onSwitchToPos={() => {
          window.location.href = '/cashier';
        }}
        onSwitchToStorefront={() => {
          window.location.href = '/customer';
        }}
      />
    </StoreProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>
);
