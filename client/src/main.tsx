import { createRoot } from 'react-dom/client';
import { AuthProvider } from './app/context/AuthProvider';
import { Toaster } from './app/components/ui/sonner';
import './styles/index.css';

import App from './app/App';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
    <Toaster position="top-center" />
  </AuthProvider>
); 