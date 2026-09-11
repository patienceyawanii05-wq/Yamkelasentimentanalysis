import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthPage } from '@/pages/AuthPage';
import { AppLayout, type PageKey } from '@/components/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { AnalyzePage } from '@/pages/AnalyzePage';
import { BulkPage } from '@/pages/BulkPage';
import { PostsPage } from '@/pages/PostsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { FullPageLoader } from '@/components/Loading';

function AppContent() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');

  if (loading) return <FullPageLoader />;
  if (!session) return <AuthPage />;

  return (
    <AppLayout currentPage={page} onNavigate={setPage}>
      {page === 'dashboard' && <DashboardPage />}
      {page === 'analyze' && <AnalyzePage />}
      {page === 'bulk' && <BulkPage />}
      {page === 'posts' && <PostsPage />}
      {page === 'reports' && <ReportsPage />}
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
