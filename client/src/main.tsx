import { createRoot } from 'react-dom/client';
import { AuthProvider } from './app/context/AuthProvider';
import './styles/index.css';
import './app/i18n/i18n';

import App from './app/App';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
); 