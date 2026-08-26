import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from './context/StoreContext';
import { CustomerStorefront } from './components/storefront/CustomerStorefront';
import './index.css';

function CustomerApp() {
  return (
    <StoreProvider>
      <CustomerStorefront
        onSwitchToStaff={() => {
          window.location.href = '/cashier';
        }}
      />
    </StoreProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CustomerApp />
  </StrictMode>
);
