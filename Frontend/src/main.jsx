import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider, Auth0Context } from '@auth0/auth0-react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import './index.css';
import { FinTrack } from './FinTrack';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

const hasValidAuth0 = Boolean(
  domain &&
  clientId &&
  typeof domain === 'string' &&
  typeof clientId === 'string' &&
  domain.trim().length > 0 &&
  clientId.trim().length > 0
);

const dummyAuth0Value = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  loginWithRedirect: undefined,
  logout: () => {},
  getAccessTokenSilently: async () => '',
  getIdTokenClaims: async () => null,
  loginWithPopup: async () => {},
  handleRedirectCallback: async () => ({})
};

const AppContent = (
  <Provider store={store}>
    <BrowserRouter>
      <FinTrack />
    </BrowserRouter>
  </Provider>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  hasValidAuth0 ? (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
      cacheLocation="localstorage"
    >
      {AppContent}
    </Auth0Provider>
  ) : (
    <Auth0Context.Provider value={dummyAuth0Value}>
      {AppContent}
    </Auth0Context.Provider>
  )
);