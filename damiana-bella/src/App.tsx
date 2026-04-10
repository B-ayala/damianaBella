import { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './utils/theme';
import AppRouter from './routes/AppRouter';
import WhatsAppButton from './components/common/WhatsAppButton/WhatsAppButton';
import Footer from './components/common/Footer/Footer';
import { supabase } from './config/supabaseClient';
import { useAdminStore } from './admin/store/adminStore';
import { InitialLoadProvider, useInitialLoad } from './components/common/InitialLoad/InitialLoadProvider';

const AppContent = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isAuthRoute = location.pathname.startsWith('/auth');
  const initializeAuth = useAdminStore((state) => state.initializeAuth);
  const { completeTask } = useInitialLoad();

  useEffect(() => {
    if (document.readyState === 'complete') {
      completeTask('window');
      return;
    }

    const handleWindowLoad = () => {
      completeTask('window');
    };

    window.addEventListener('load', handleWindowLoad);

    return () => {
      window.removeEventListener('load', handleWindowLoad);
    };
  }, [completeTask]);

  useEffect(() => {
    const setupAuth = async () => {
      try {
        await initializeAuth();
      } finally {
        completeTask('auth');
      }
    };

    void setupAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void initializeAuth();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [completeTask, initializeAuth]);

  useEffect(() => {
    if (isAdmin || isAuthRoute) {
      completeTask('public-layout');
    }
  }, [completeTask, isAdmin, isAuthRoute]);

  return (
    <>
      <AppRouter />
      {!isAdmin && <Footer />}
      {!isAdmin && !isAuthRoute && <WhatsAppButton />}
    </>
  );
};

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <InitialLoadProvider>
            <AppContent />
          </InitialLoadProvider>
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
