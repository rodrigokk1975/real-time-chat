import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { AuthPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";

function AppRoutes() {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
        Validando sessão...
      </div>
    );
  }

  if (!user || !token) {
    return <AuthPage />;
  }

  return (
    <SocketProvider>
      <ChatPage />
    </SocketProvider>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
