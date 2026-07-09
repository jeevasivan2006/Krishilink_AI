import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { setGlobalErrorHandler } from '@/api/api';
import AppRouter from '@/routes/AppRouter';

/* ── TanStack Query client ──────────────────────────────────────── */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          1000 * 60 * 2,   // 2 minutes
      gcTime:             1000 * 60 * 10,  // 10 minutes
      retry:              1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/* ── Toast config ──────────────────────────────────────────────── */
const toastOptions = {
  duration: 4000,
  style: {
    borderRadius: '12px',
    fontSize:     '14px',
    fontFamily:   'Inter, system-ui, sans-serif',
    boxShadow:    '0 4px 14px rgba(0,0,0,.1)',
  },
  success: {
    iconTheme: { primary: '#16a34a', secondary: '#fff' },
  },
  error: {
    iconTheme: { primary: '#dc2626', secondary: '#fff' },
  },
};

/**
 * Application root.
 *
 * Provider order (outermost → innermost):
 *   QueryClientProvider  — data fetching state
 *   ThemeProvider        — dark/light mode
 *   AuthProvider         — authentication (uses router via useNavigate)
 *   AppRouter            — page routing
 */
export default function App() {
  // Wire the Axios global error handler to react-hot-toast once on mount.
  // This catches any non-401, non-404 API error not handled at the call site.
  useEffect(() => {
    setGlobalErrorHandler((err) => {
      // Avoid duplicate toasts for auth errors (login page shows inline errors)
      if (err.status !== 400 && err.status !== 422) {
        toast.error(err.message || 'Something went wrong');
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/* AuthProvider must be inside BrowserRouter (in main.jsx) */}
        <AuthProvider>
          <AppRouter />

          {/* Global toast notifications */}
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={toastOptions}
          />

          {/* TanStack Query devtools — only in development */}
          {import.meta.env.DEV && (
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          )}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
