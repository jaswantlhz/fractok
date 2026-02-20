import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react';
import "./index.css";
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx';
import { InvestmentProvider } from './context/InvestmentProvider.jsx';
import { WalletProvider } from './context/WalletContext.jsx';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin + "/callback",
        audience: audience,
      }}
    >
      <AuthProvider>
        <InvestmentProvider>
          <WalletProvider>
            <App />
          </WalletProvider>
        </InvestmentProvider>
      </AuthProvider>
    </Auth0Provider>
  </StrictMode>,
)
