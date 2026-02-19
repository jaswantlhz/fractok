import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./index.css"; 
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx';
import { InvestmentProvider } from './context/InvestmentProvider.jsx';
import { WalletProvider } from './context/WalletContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <AuthProvider>
  <InvestmentProvider>
    <WalletProvider>
      <App />
    </WalletProvider>
  </InvestmentProvider>
</AuthProvider>
  </StrictMode>,
)
