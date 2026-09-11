import { useEffect, useState, useMemo } from 'react';
import { supabase, type DatabasePost } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/Loading';
import { SentimentBadge, EmotionBadge, RiskBadge } from '@/components/Badges';
import {
  SENTIMENT_COLORS, EMOTION_COLORS, EMOTION_LABELS, RISK_COLORS,
} from '@/lib/constants';
import type { SentimentLabel, EmotionLabel, RiskLevel } from '@/lib/sentiment';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar,
} from 'recharts';
import {
  MessageSquare, Smile, Meh, Frown, Shuffle,
  AlertTriangle, Lightbulb, TrendingUp, TrendingDown, Gauge,
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<DatabasePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setPosts(data as DatabasePost[]);
        setLoading(false);
      });
  }, [user]);

  const stats = useMemo(() => {
    const positive = posts.filter((p) => p.sentiment === 'positive').length;
    const negative = posts.filter((p) => p.sentiment === 'negative').length;
    const neutral = posts.filter((p) => p.sentiment === 'neutral').length;
    const mixed = posts.filter((p) => p.sentiment === 'mixed').length;
    const highRisk = posts.filter((p) => p.risk_level === 'high').length;
    const mediumRisk = posts.filter((p) => p.risk_level === 'medium').length;
    const avgConfidence = posts.length > 0
      ? posts.reduce((sum, p) => sum + p.confidence_score, 0) / posts.length
      : 0;
    return { total: posts.length, positive, negative, neutral, mixed, highRisk, mediumRisk, avgConfidence };
  }, [posts]);

  const pieData = useMemo(() => [
    { name: 'Positive', value: stats.positive, color: SENTIMENT_COLORS.positive },
    { name: 'Neutral', value: stats.neutral, color: SENTIMENT_COLORS.neutral },
    { name: 'Negative', value: stats.negative, color: SENTIMENT_COLORS.negative },
    { name: 'Mixed', value: stats.mixed, color: SENTIMENT_COLORS.mixed },
  ], [stats]);

  const emotionData = useMemo(() => {
    const counts: Partial<Record<EmotionLabel, number>> = {};
    posts.forEach((p) => {
      counts[p.emotion] = (counts[p.emotion] || 0) + 1;
    });
    return (Object.keys(counts) as EmotionLabel[])
      .map((e) => ({ name: EMOTION_LABELS[e], value: counts[e]!, color: EMOTION_COLORS[e] }))
      .sort((a, b) => b.value - a.value);
  }, [posts]);

  const emotionTrendData = useMemo(() => {
    const byDate = new Map<string, Record<string, number>>();
    posts.forEach((p) => {
      const date = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!byDate.has(date)) byDate.set(date, {});
      const day = byDate.get(date)!;
      day[p.emotion] = (day[p.emotion] || 0) + 1;
    });
    return [...byDate.entries()]
      .map(([date, vals]) => ({ date, ...vals }))
      .slice(-14);
  }, [posts]);

  const trendData = useMemo(() => {
    const byDate = new Map<string, { positive: number; neutral: number; negative: number; mixed: number }>();
    posts.forEach((p) => {
      const date = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!byDate.has(date)) byDate.set(date, { positive: 0, neutral: 0, negative: 0, mixed: 0 });
      byDate.get(date)![p.sentiment]++;
    });
    return [...byDate.entries()]
      .map(([date, vals]) => ({ date, ...vals }))
      .slice(-14);
  }, [posts]);

  const keywordData = useMemo(() => {
    const freq = new Map<string, number>();
    posts.forEach((p) => {
      (p.keywords as string[]).forEach((kw) => {
        freq.set(kw, (freq.get(kw) || 0) + 1);
      });
    });
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  }, [posts]);

  const topicData = useMemo(() => {
    const freq = new Map<string, number>();
    posts.forEach((p) => {
      if (p.topic) freq.set(p.topic, (freq.get(p.topic) || 0) + 1);
    });
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [posts]);

  const negativePosts = useMemo(() =>
    posts.filter((p) => p.sentiment === 'negative' || p.sentiment === 'mixed')
      .slice(0, 5),
    [posts]);

  const highRiskPosts = useMemo(() =>
    posts.filter((p) => p.risk_level === 'high').slice(0, 5),
    [posts]);

  const recommendations = useMemo(() => {
    const recs: { type: 'positive' | 'warning' | 'info'; text: string }[] = [];
    if (stats.total === 0) {
      return [{ type: 'info' as const, text: 'Analyze some posts to generate personalized AI recommendations.' }];
    }

    const posPct = (stats.positive / stats.total) * 100;
    const negPct = (stats.negative / stats.total) * 100;
    const mixedPct = (stats.mixed / stats.total) * 100;

    if (posPct > 60) {
      recs.push({
        type: 'positive',
        text: `Your audience sentiment is predominantly positive (${posPct.toFixed(0)}%). This is a great time to launch new products or campaigns — your audience is receptive and engaged.`,
      });
    }
    if (negPct > 40) {
      recs.push({
        type: 'warning',
        text: `${negPct.toFixed(0)}% of analyzed posts are negative. Consider addressing customer concerns proactively and reviewing recent changes that may have caused dissatisfaction.`,
      });
    }
    if (mixedPct > 20) {
      recs.push({
        type: 'info',
        text: `${mixedPct.toFixed(0)}% of posts show mixed sentiment. Customers see both positives and negatives — focus on resolving the pain points while maintaining what works.`,
      });
    }
    if (stats.highRisk > 0) {
      recs.push({
        type: 'warning',
        text: `${stats.highRisk} high-risk post${stats.highRisk !== 1 ? 's' : ''} detected. These contain anger, frustration, or disappointment and require immediate attention.`,
      });
    }

    // Topic-based recommendations
    const topNegativeTopic = topicData.find(([topic]) => {
      const topicPosts = posts.filter((p) => p.topic === topic);
      const negCount = topicPosts.filter((p) => p.sentiment === 'negative' || p.sentiment === 'mixed').length;
      return negCount > 0 && topicPosts.length >= 2;
    });
    if (topNegativeTopic) {
      recs.push({
        type: 'warning',
        text: `Customers are increasingly mentioning ${topNegativeTopic[0].toLowerCase()} issues. Consider investigating and addressing this area proactively.`,
      });
    }

    // Emotion-based recommendations
    const angerCount = posts.filter((p) => p.emotion === 'anger' || p.emotion === 'frustration').length;
    if (angerCount > stats.total * 0.25) {
      recs.push({
        type: 'warning',
        text: `Anger and frustration are dominant emotions (${angerCount} posts). Investigate root causes — check for product issues, service complaints, or controversial content.`,
      });
    }
    const joyCount = posts.filter((p) => p.emotion === 'joy' || p.emotion === 'happiness' || p.emotion === 'love').length;
    if (joyCount > stats.total * 0.3) {
      recs.push({
        type: 'positive',
        text: `Positive emotions are leading (${joyCount} posts). Your content is resonating well. Double down on what's working and share user-generated positive stories.`,
      });
    }

    if (recs.length === 0) {
      recs.push({
        type: 'info',
        text: 'Your sentiment distribution is balanced. Continue monitoring trends over time to identify patterns and opportunities.',
      });
    }
    return recs;
  }, [stats, posts, topicData]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  const sentimentPct = (count: number) =>
    stats.total > 0 ? ((count / stats.total) * 100).toFixed(0) : '0';

  const statCards = [
    { label: 'Total Posts', value: stats.total, icon: MessageSquare, color: 'text-brand-600 dark:text-brand-400' },
    { label: 'Positive', value: `${sentimentPct(stats.positive)}%`, icon: Smile, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Neutral', value: `${sentimentPct(stats.neutral)}%`, icon: Meh, color: 'text-slate-500 dark:text-slate-400' },
    { label: 'Negative', value: `${sentimentPct(stats.negative)}%`, icon: Frown, color: 'text-red-600 dark:text-red-400' },
    { label: 'Mixed', value: `${sentimentPct(stats.mixed)}%`, icon: Shuffle, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Avg Confidence', value: `${Math.round(stats.avgConfidence * 100)}%`, icon: Gauge, color: 'text-blue-600 dark:text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Dashboard - Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-white">{card.value}</p>
                </div>
                <div className={`rounded-xl bg-surface-light-subtle p-3 dark:bg-surface-dark ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Emotion Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Emotion distribution pie */}
        <div className="card">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
            Emotion Distribution
          </h3>
          {emotionData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={emotionData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {emotionData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sentiment distribution pie */}
        <div className="card">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
            Sentiment Distribution
          </h3>
          {stats.total === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Emotion trend chart */}
      <div className="card">
        <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
          Emotion Trend Over Time
        </h3>
        {emotionTrendData.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={emotionTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:!stroke-slate-700" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              {emotionData.slice(0, 5).map((e) => (
                <Line key={e.name} type="monotone" dataKey={e.name} stroke={e.color} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Sentiment trend chart */}
      <div className="card">
        <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
          Sentiment Trend Over Time
        </h3>
        {trendData.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:!stroke-slate-700" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="positive" stroke={SENTIMENT_COLORS.positive} strokeWidth={2} dot={{ r: 4 }} name="Positive" />
              <Line type="monotone" dataKey="neutral" stroke={SENTIMENT_COLORS.neutral} strokeWidth={2} dot={{ r: 4 }} name="Neutral" />
              <Line type="monotone" dataKey="negative" stroke={SENTIMENT_COLORS.negative} strokeWidth={2} dot={{ r: 4 }} name="Negative" />
              <Line type="monotone" dataKey="mixed" stroke={SENTIMENT_COLORS.mixed} strokeWidth={2} dot={{ r: 4 }} name="Mixed" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Keyword Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Word cloud */}
        <div className="card">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
            Keyword Word Cloud
          </h3>
          {keywordData.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2 py-4">
              {keywordData.map(([word, count]) => {
                const size = Math.min(2, 0.8 + count * 0.15);
                const opacity = Math.min(1, 0.4 + count * 0.15);
                return (
                  <span
                    key={word}
                    className="cursor-default font-semibold transition-transform hover:scale-110"
                    style={{
                      fontSize: `${size}rem`,
                      opacity,
                      color: '#1f5be0',
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Top topics */}
        <div className="card">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
            Top Discussed Topics
          </h3>
          {topicData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topicData.map(([topic, count]) => ({ name: topic, value: count }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:!stroke-slate-700" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#1f5be0" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Complaint Monitoring */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Negative posts */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <Frown className="h-5 w-5 text-red-500" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">
              Negative & Mixed Posts
            </h3>
          </div>
          {negativePosts.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
              No negative posts found. Great job!
            </p>
          ) : (
            <div className="space-y-3">
              {negativePosts.map((post) => (
                <div key={post.id} className="rounded-xl border border-surface-light-border p-3 dark:border-surface-dark-border">
                  <p className="mb-2 line-clamp-2 text-sm text-slate-700 dark:text-slate-300">
                    {post.content}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <SentimentBadge sentiment={post.sentiment} />
                    <EmotionBadge emotion={post.emotion} />
                    {post.detected_emojis && (post.detected_emojis as string[]).length > 0 && (
                      <span className="text-lg">{(post.detected_emojis as string[]).join(' ')}</span>
                    )}
                    {post.topic && (
                      <span className="text-xs text-slate-400">{post.topic}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* High-risk posts */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">
              Urgent Customer Issues (High Risk)
            </h3>
            {stats.highRisk > 0 && (
              <span className="ml-auto rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-500/20 dark:text-red-400">
                {stats.highRisk} flagged
              </span>
            )}
          </div>
          {highRiskPosts.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
              No high-risk posts. All clear.
            </p>
          ) : (
            <div className="space-y-3">
              {highRiskPosts.map((post) => (
                <div key={post.id} className="rounded-xl border border-red-200 bg-red-50/50 p-3 dark:border-red-500/20 dark:bg-red-500/5">
                  <p className="mb-2 line-clamp-2 text-sm text-slate-700 dark:text-slate-300">
                    {post.content}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <RiskBadge risk={post.risk_level} />
                    <EmotionBadge emotion={post.emotion} />
                    {post.is_sarcastic && (
                      <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        Sarcastic
                      </span>
                    )}
                    {post.detected_emojis && (post.detected_emojis as string[]).length > 0 && (
                      <span className="text-lg">{(post.detected_emojis as string[]).join(' ')}</span>
                    )}
                    {post.suggested_response && (
                      <p className="mt-2 w-full rounded-lg bg-surface-light-subtle p-2 text-xs text-slate-500 dark:bg-surface-dark dark:text-slate-400">
                        <strong>Suggested response:</strong> {post.suggested_response}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            AI Recommendations
          </h3>
        </div>
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl p-4 ${
                rec.type === 'positive'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10'
                  : rec.type === 'warning'
                  ? 'bg-red-50 dark:bg-red-500/10'
                  : 'bg-blue-50 dark:bg-blue-500/10'
              }`}
            >
              {rec.type === 'positive' ? (
                <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : rec.type === 'warning' ? (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              ) : (
                <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              )}
              <p className="text-sm text-slate-700 dark:text-slate-300">{rec.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent posts */}
      <div className="card">
        <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
          Recent Analyzed Posts
        </h3>
        {posts.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No posts analyzed yet. Head to the Analyze Post page to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-light-border text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:border-surface-dark-border dark:text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Post</th>
                  <th className="pb-3 pr-4 font-medium">Sentiment</th>
                  <th className="pb-3 pr-4 font-medium">Emotion</th>
                  <th className="pb-3 pr-4 font-medium">Risk</th>
                  <th className="pb-3 pr-4 font-medium">Confidence</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {posts.slice(0, 8).map((post) => (
                  <tr key={post.id} className="border-b border-surface-light-border last:border-0 dark:border-surface-dark-border">
                    <td className="max-w-xs truncate py-3 pr-4 text-slate-700 dark:text-slate-300">
                      {post.content}
                      {post.detected_emojis && (post.detected_emojis as string[]).length > 0 && (
                        <span className="ml-1">{(post.detected_emojis as string[]).join('')}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4"><SentimentBadge sentiment={post.sentiment} /></td>
                    <td className="py-3 pr-4"><EmotionBadge emotion={post.emotion} /></td>
                    <td className="py-3 pr-4"><RiskBadge risk={post.risk_level} /></td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                      {Math.round(post.confidence_score * 100)}%
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">
                      {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[280px] items-center justify-center">
      <p className="text-sm text-slate-400 dark:text-slate-500">No data to display yet</p>
    </div>
  );
}
