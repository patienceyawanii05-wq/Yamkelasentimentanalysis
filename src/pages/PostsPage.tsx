import { useEffect, useState, useMemo } from 'react';
import { supabase, type DatabasePost } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/Loading';
import { SentimentBadge, EmotionBadge, RiskBadge, IntentBadge } from '@/components/Badges';
import { Search, Filter, Calendar, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SentimentLabel, RiskLevel } from '@/lib/sentiment';

const PAGE_SIZE = 10;

export function PostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<DatabasePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<SentimentLabel | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    let query = supabase.from('posts').select('*').eq('user_id', user.id);
    if (sentimentFilter !== 'all') query = query.eq('sentiment', sentimentFilter);
    if (riskFilter !== 'all') query = query.eq('risk_level', riskFilter);
    if (dateFrom) query = query.gte('created_at', dateFrom + 'T00:00:00');
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');
    if (search.trim()) query = query.ilike('content', `%${search.trim()}%`);
    query = query.order('created_at', { ascending: false });

    query.then(({ data, error }) => {
      if (!error && data) setPosts(data as DatabasePost[]);
      setLoading(false);
    });
  }, [user, sentimentFilter, riskFilter, dateFrom, dateTo, search]);

  const totalPages = Math.ceil(posts.length / PAGE_SIZE) || 1;
  const pagedPosts = useMemo(
    () => posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [posts, page]
  );

  function clearFilters() {
    setSearch('');
    setSentimentFilter('all');
    setRiskFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }

  async function deletePost(id: string) {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) setPosts(posts.filter((p) => p.id !== id));
  }

  const hasFilters = search || sentimentFilter !== 'all' || riskFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-brand-500" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            Search & Filter
          </h3>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost ml-auto text-xs">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search posts..."
              className="input-field pl-10"
            />
          </div>

          <select
            value={sentimentFilter}
            onChange={(e) => { setSentimentFilter(e.target.value as SentimentLabel | 'all'); setPage(1); }}
            className="input-field"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
            <option value="mixed">Mixed</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => { setRiskFilter(e.target.value as RiskLevel | 'all'); setPage(1); }}
            className="input-field"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {loading ? 'Loading...' : `${posts.length} post${posts.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <LoadingSpinner size={32} />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {hasFilters
                ? 'No posts match your filters. Try adjusting them.'
                : 'No posts yet. Analyze a post to get started.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-light-border text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:border-surface-dark-border dark:text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Post</th>
                    <th className="pb-3 pr-4 font-medium">Sentiment</th>
                    <th className="pb-3 pr-4 font-medium">Emotion</th>
                    <th className="pb-3 pr-4 font-medium">Intent</th>
                    <th className="pb-3 pr-4 font-medium">Risk</th>
                    <th className="pb-3 pr-4 font-medium">Topic</th>
                    <th className="pb-3 pr-4 font-medium">Keywords</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {pagedPosts.map((post) => (
                    <tr key={post.id} className="border-b border-surface-light-border last:border-0 dark:border-surface-dark-border">
                      <td className="max-w-xs py-3 pr-4 text-slate-700 dark:text-slate-300">
                        <div className="truncate" title={post.content}>{post.content}</div>
                        {post.detected_emojis && (post.detected_emojis as string[]).length > 0 && (
                          <span className="text-base">{(post.detected_emojis as string[]).join('')}</span>
                        )}
                        {post.is_sarcastic && (
                          <span className="mt-1 inline-block text-xs text-amber-500">Sarcasm detected</span>
                        )}
                      </td>
                      <td className="py-3 pr-4"><SentimentBadge sentiment={post.sentiment} /></td>
                      <td className="py-3 pr-4"><EmotionBadge emotion={post.emotion} /></td>
                      <td className="py-3 pr-4"><IntentBadge intent={post.intent} /></td>
                      <td className="py-3 pr-4"><RiskBadge risk={post.risk_level} /></td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                        {post.topic || '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex max-w-[150px] flex-wrap gap-1">
                          {(post.keywords as string[]).slice(0, 3).map((kw) => (
                            <span key={kw} className="rounded bg-surface-light-subtle px-2 py-0.5 text-xs text-slate-600 dark:bg-surface-dark dark:text-slate-400">
                              {kw}
                            </span>
                          ))}
                          {(post.keywords as string[]).length > 3 && (
                            <span className="text-xs text-slate-400">+{(post.keywords as string[]).length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => deletePost(post.id)}
                          className="btn-ghost text-red-500 hover:text-red-600"
                          aria-label="Delete post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="btn-secondary px-3 py-2 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary px-3 py-2 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
