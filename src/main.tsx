import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './LanguageContext';
import { UserProvider } from './UserContext';
import { ServiceProvider } from './ServiceContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <UserProvider>
        <ServiceProvider>
          <App />
        </ServiceProvider>
      </UserProvider>
    </LanguageProvider>
  </StrictMode>,
);
