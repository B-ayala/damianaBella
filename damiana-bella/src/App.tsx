import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './utils/ThemeProvider';
import { theme } from './utils/theme';
import AppRouter from './routes/AppRouter';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter basename="/damianaBella">
        <AppRouter />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
