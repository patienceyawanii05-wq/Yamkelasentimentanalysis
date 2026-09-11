import { type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Activity,
  LayoutDashboard,
  MessageSquareText,
  FileSpreadsheet,
  ListFilter,
  FileText,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export type PageKey = 'dashboard' | 'analyze' | 'bulk' | 'posts' | 'reports';

interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'analyze', label: 'Analyze Post', icon: MessageSquareText },
  { key: 'bulk', label: 'Bulk Analysis', icon: FileSpreadsheet },
  { key: 'posts', label: 'Posts', icon: ListFilter },
  { key: 'reports', label: 'Reports', icon: FileText },
];

interface LayoutProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}

export function AppLayout({ currentPage, onNavigate, children }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (profile?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function handleNav(page: PageKey) {
    onNavigate(page);
    setMobileOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-surface-light-subtle dark:bg-surface-dark">
      {/* Sidebar - desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-surface-light-border bg-surface-light dark:border-surface-dark-border dark:bg-surface-dark-subtle lg:flex">
        <SidebarContent currentPage={currentPage} onNavigate={handleNav} />
      </aside>

      {/* Sidebar - mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-surface-light-border bg-surface-light dark:border-surface-dark-border dark:bg-surface-dark-subtle lg:hidden">
            <SidebarContent currentPage={currentPage} onNavigate={handleNav} />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-light-border bg-surface-light/80 px-4 backdrop-blur-md dark:border-surface-dark-border dark:bg-surface-dark/80 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="btn-ghost lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {NAV_ITEMS.find((n) => n.key === currentPage)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="btn-ghost" aria-label="Toggle theme">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2 rounded-xl px-2 py-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {initials}
              </div>
              <span className="hidden text-sm font-medium text-slate-600 dark:text-slate-300 sm:block">
                {profile?.name || 'User'}
              </span>
            </div>
            <button onClick={signOut} className="btn-ghost" aria-label="Sign out">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );

  function SidebarContent({
    currentPage,
    onNavigate,
  }: {
    currentPage: PageKey;
    onNavigate: (p: PageKey) => void;
  }) {
    return (
      <>
        <div className="flex h-16 items-center gap-2.5 border-b border-surface-light-border px-6 dark:border-surface-dark-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-md shadow-brand-600/30">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-800 dark:text-white">Social Insights</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-slate-600 hover:bg-surface-light-subtle dark:text-slate-400 dark:hover:bg-surface-dark'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-surface-light-border p-4 dark:border-surface-dark-border">
          <div className="rounded-xl bg-surface-light-subtle p-4 dark:bg-surface-dark">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Powered by AI NLP
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Real-time sentiment & emotion detection
            </p>
          </div>
        </div>
      </>
    );
  }
}
