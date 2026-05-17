import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2 } from "lucide-react";

// Auth pages (small, load eagerly)
import { LoginPage } from "@/pages/Login";
import { RegisterPage } from "@/pages/Register";

// Dashboard pages (lazy loaded for code splitting)
const DashboardPage = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.DashboardPage }))
);
const AnalyzerPage = lazy(() =>
  import("@/pages/Analyzer").then((m) => ({ default: m.AnalyzerPage }))
);
const AiReportsPage = lazy(() =>
  import("@/pages/AiReports").then((m) => ({ default: m.AiReportsPage }))
);
const RankTrackingPage = lazy(() =>
  import("@/pages/RankTracking").then((m) => ({ default: m.RankTrackingPage }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  );
}

function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto" />
          <p className="mt-3 text-sm text-surface-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <DashboardPage />
                </Suspense>
              }
            />
            {/* SEO Analyzer (Phase 2) */}
            <Route
              path="/analyzer"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AnalyzerPage />
                </Suspense>
              }
            />
            <Route
              path="/keywords"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <RankTrackingPage />
                </Suspense>
              }
            />
            <Route
              path="/rankings"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <RankTrackingPage />
                </Suspense>
              }
            />
            <Route path="/websites" element={<PlaceholderPage title="Websites" />} />
            <Route path="/backlinks" element={<PlaceholderPage title="Backlinks" />} />
            {/* AI Intelligence (Phase 3) */}
            <Route
              path="/reports"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AiReportsPage />
                </Suspense>
              }
            />
            <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

/** Temporary placeholder for future pages */
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-surface-900 mb-2">{title}</h1>
      <p className="text-surface-500">
        This page will be implemented in a future phase.
      </p>
    </div>
  );
}

export default App;
