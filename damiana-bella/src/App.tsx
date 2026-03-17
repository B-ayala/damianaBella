import { BrowserRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from './utils/ThemeProvider';
import { theme } from './utils/theme';
import AppRouter from './routes/AppRouter';
import WhatsAppButton from './components/common/WhatsAppButton/WhatsAppButton';
import Footer from './components/common/Footer/Footer';

const AppContent = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      <AppRouter />
      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppButton />}
    </>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter basename="/LIA">
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
