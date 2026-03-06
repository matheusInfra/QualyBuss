import { AppRoutes } from './routes';
import AuthProvider from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;