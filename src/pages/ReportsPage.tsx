import { useEffect, useState, useMemo } from 'react';
import { supabase, type DatabasePost } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/Loading';
import {
  SENTIMENT_COLORS, EMOTION_COLORS, EMOTION_LABELS, INTENT_LABELS, RISK_LABELS,
} from '@/lib/constants';
import type { EmotionLabel, IntentLabel, RiskLevel } from '@/lib/sentiment';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { FileText, Download, TrendingUp, TrendingDown, Lightbulb, AlertTriangle } from 'lucide-react';

export function ReportsPage() {
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
    const total = posts.length;
    const avgConfidence = total > 0 ? posts.reduce((s, p) => s + p.confidence_score, 0) / total : 0;
    const avgEmotionalScore = total > 0 ? posts.reduce((s, p) => s + (p.emotional_score || 0), 0) / total : 0;
    const sarcasticCount = posts.filter((p) => p.is_sarcastic).length;
    return { positive, negative, neutral, mixed, total, avgConfidence, avgEmotionalScore, sarcasticCount };
  }, [posts]);

  const emotionCounts = useMemo(() => {
    const counts: Partial<Record<EmotionLabel, number>> = {};
    posts.forEach((p) => {
      counts[p.emotion] = (counts[p.emotion] || 0) + 1;
    });
    return counts;
  }, [posts]);

  const intentCounts = useMemo(() => {
    const counts: Partial<Record<IntentLabel, number>> = {};
    posts.forEach((p) => {
      counts[p.intent] = (counts[p.intent] || 0) + 1;
    });
    return counts;
  }, [posts]);

  const riskCounts = useMemo(() => {
    const counts: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0 };
    posts.forEach((p) => { counts[p.risk_level]++; });
    return counts;
  }, [posts]);

  const topKeywords = useMemo(() => {
    const freq = new Map<string, number>();
    posts.forEach((p) => {
      (p.keywords as string[]).forEach((kw) => {
        freq.set(kw, (freq.get(kw) || 0) + 1);
      });
    });
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, [posts]);

  const topicData = useMemo(() => {
    const freq = new Map<string, number>();
    posts.forEach((p) => {
      if (p.topic) freq.set(p.topic, (freq.get(p.topic) || 0) + 1);
    });
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [posts]);

  const recommendations = useMemo(() => {
    const recs: { type: 'positive' | 'warning' | 'info'; text: string }[] = [];
    if (stats.total === 0) {
      return [{ type: 'info' as const, text: 'Analyze some posts to generate personalized recommendations.' }];
    }

    const posPct = (stats.positive / stats.total) * 100;
    const negPct = (stats.negative / stats.total) * 100;
    const neuPct = (stats.neutral / stats.total) * 100;
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
        text: `${negPct.toFixed(0)}% of analyzed posts are negative. Consider addressing customer concerns proactively, reviewing recent changes that may have caused dissatisfaction, and engaging with critical feedback directly.`,
      });
    }
    if (neuPct > 50) {
      recs.push({
        type: 'info',
        text: `Over half of posts are neutral (${neuPct.toFixed(0)}%). Try creating more emotionally engaging content — ask questions, share stories, or use humor to spark stronger reactions.`,
      });
    }
    if (mixedPct > 20) {
      recs.push({
        type: 'info',
        text: `${mixedPct.toFixed(0)}% of posts show mixed sentiment. Customers see both positives and negatives — focus on resolving pain points while maintaining what works.`,
      });
    }
    if (riskCounts.high > 0) {
      recs.push({
        type: 'warning',
        text: `${riskCounts.high} high-risk post${riskCounts.high !== 1 ? 's' : ''} detected containing anger, frustration, or disappointment. These require immediate attention and response.`,
      });
    }
    if (stats.sarcasticCount > 0) {
      recs.push({
        type: 'info',
        text: `${stats.sarcasticCount} sarcastic post${stats.sarcasticCount !== 1 ? 's' : ''} detected. Sarcasm often masks dissatisfaction — read between the lines and address the underlying issues.`,
      });
    }

    const angerCount = (emotionCounts.anger || 0) + (emotionCounts.frustration || 0);
    if (angerCount > stats.total * 0.25) {
      recs.push({
        type: 'warning',
        text: `Anger and frustration are dominant emotions (${angerCount} posts). Investigate the root causes — check for product issues, service complaints, or controversial content.`,
      });
    }
    const joyCount = (emotionCounts.joy || 0) + (emotionCounts.happiness || 0) + (emotionCounts.love || 0);
    if (joyCount > stats.total * 0.3) {
      recs.push({
        type: 'positive',
        text: `Joy, happiness, and love are leading emotions (${joyCount} posts). Your content is resonating well. Double down on what's working and share user-generated positive stories.`,
      });
    }
    if (stats.avgConfidence > 0.75) {
      recs.push({
        type: 'positive',
        text: `Analysis confidence is high (${(stats.avgConfidence * 100).toFixed(0)}%). The sentiment classifications are reliable and can be trusted for strategic decisions.`,
      });
    }

    // Topic-based recommendation
    if (topicData.length > 0) {
      const topTopic = topicData[0];
      const topicPosts = posts.filter((p) => p.topic === topTopic[0]);
      const negInTopic = topicPosts.filter((p) => p.sentiment === 'negative' || p.sentiment === 'mixed').length;
      if (negInTopic > topicPosts.length * 0.4) {
        recs.push({
          type: 'warning',
          text: `Customers are increasingly mentioning ${topTopic[0].toLowerCase()} issues. Consider investigating and addressing this area proactively.`,
        });
      }
    }

    if (recs.length === 0) {
      recs.push({
        type: 'info',
        text: 'Your sentiment distribution is balanced. Continue monitoring trends over time to identify patterns and opportunities.',
      });
    }
    return recs;
  }, [stats, emotionCounts, riskCounts, topicData, posts]);

  const pieData = [
    { name: 'Positive', value: stats.positive, color: SENTIMENT_COLORS.positive },
    { name: 'Neutral', value: stats.neutral, color: SENTIMENT_COLORS.neutral },
    { name: 'Negative', value: stats.negative, color: SENTIMENT_COLORS.negative },
    { name: 'Mixed', value: stats.mixed, color: SENTIMENT_COLORS.mixed },
  ].filter((d) => d.value > 0);

  const emotionData = (Object.keys(emotionCounts) as EmotionLabel[])
    .map((e) => ({ name: EMOTION_LABELS[e], value: emotionCounts[e]!, color: EMOTION_COLORS[e] }))
    .sort((a, b) => b.value - a.value)
    .filter((d) => d.value > 0);

  const intentData = (Object.keys(intentCounts) as IntentLabel[])
    .map((i) => ({ name: INTENT_LABELS[i], value: intentCounts[i]! }))
    .sort((a, b) => b.value - a.value)
    .filter((d) => d.value > 0);

  const riskData = (Object.keys(riskCounts) as RiskLevel[])
    .map((r) => ({ name: RISK_LABELS[r], value: riskCounts[r], color: r === 'high' ? '#ef4444' : r === 'medium' ? '#f59e0b' : '#10b981' }))
    .filter((d) => d.value > 0);

  function exportPDFReport() {
    const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const html = `
<!DOCTYPE html>
<html>
<head>
<title>Social Insights Report - ${esc(reportDate)}</title>
<style>
  body { font-family: 'Inter', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; }
  h1 { color: #1f5be0; border-bottom: 3px solid #1f5be0; padding-bottom: 10px; }
  h2 { color: #334155; margin-top: 32px; }
  .stat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 20px 0; }
  .stat-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
  .stat-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; }
  .stat-card .value { font-size: 24px; font-weight: bold; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  th { color: #64748b; font-size: 12px; text-transform: uppercase; }
  .rec { border-left: 4px solid; padding: 12px 16px; margin: 8px 0; border-radius: 0 8px 8px 0; }
  .rec.positive { border-color: #10b981; background: #ecfdf5; }
  .rec.warning { border-color: #ef4444; background: #fef2f2; }
  .rec.info { border-color: #3b82f6; background: #eff6ff; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <h1>Social Insights Report</h1>
  <p style="color:#64748b;">Generated on ${esc(reportDate)} by Social Insights</p>

  <h2>Summary Statistics</h2>
  <div class="stat-grid">
    <div class="stat-card"><div class="label">Total Posts</div><div class="value" style="color:#1f5be0">${stats.total}</div></div>
    <div class="stat-card"><div class="label">Positive</div><div class="value" style="color:#10b981">${stats.positive}</div></div>
    <div class="stat-card"><div class="label">Neutral</div><div class="value" style="color:#64748b">${stats.neutral}</div></div>
    <div class="stat-card"><div class="label">Negative</div><div class="value" style="color:#ef4444">${stats.negative}</div></div>
    <div class="stat-card"><div class="label">Mixed</div><div class="value" style="color:#f59e0b">${stats.mixed}</div></div>
  </div>
  <p>Average Confidence: <strong>${(stats.avgConfidence * 100).toFixed(1)}%</strong></p>
  <p>Average Emotional Score: <strong>${(stats.avgEmotionalScore * 100).toFixed(1)}%</strong></p>
  <p>Sarcastic Posts: <strong>${stats.sarcasticCount}</strong></p>

  <h2>Sentiment Distribution</h2>
  <table>
    <tr><th>Sentiment</th><th>Count</th><th>Percentage</th></tr>
    <tr><td>Positive</td><td>${stats.positive}</td><td>${stats.total ? ((stats.positive / stats.total) * 100).toFixed(1) : 0}%</td></tr>
    <tr><td>Neutral</td><td>${stats.neutral}</td><td>${stats.total ? ((stats.neutral / stats.total) * 100).toFixed(1) : 0}%</td></tr>
    <tr><td>Negative</td><td>${stats.negative}</td><td>${stats.total ? ((stats.negative / stats.total) * 100).toFixed(1) : 0}%</td></tr>
    <tr><td>Mixed</td><td>${stats.mixed}</td><td>${stats.total ? ((stats.mixed / stats.total) * 100).toFixed(1) : 0}%</td></tr>
  </table>

  <h2>Emotion Breakdown</h2>
  <table>
    <tr><th>Emotion</th><th>Count</th></tr>
    ${emotionData.map((e) => `<tr><td>${esc(e.name)}</td><td>${e.value}</td></tr>`).join('')}
  </table>

  <h2>Intent Breakdown</h2>
  <table>
    <tr><th>Intent</th><th>Count</th></tr>
    ${intentData.map((i) => `<tr><td>${esc(i.name)}</td><td>${i.value}</td></tr>`).join('')}
  </table>

  <h2>Risk Level Distribution</h2>
  <table>
    <tr><th>Risk Level</th><th>Count</th></tr>
    ${riskData.map((r) => `<tr><td>${esc(r.name)}</td><td>${r.value}</td></tr>`).join('')}
  </table>

  <h2>Top Topics</h2>
  <table>
    <tr><th>Topic</th><th>Count</th></tr>
    ${topicData.map(([topic, count]) => `<tr><td>${esc(topic)}</td><td>${count}</td></tr>`).join('')}
  </table>

  <h2>Top Keywords</h2>
  <table>
    <tr><th>Keyword</th><th>Frequency</th></tr>
    ${topKeywords.map(([kw, count]) => `<tr><td>${esc(kw)}</td><td>${count}</td></tr>`).join('')}
  </table>

  <h2>Recommendations</h2>
  ${recommendations.map((r) => `<div class="rec ${r.type}">${esc(r.text)}</div>`).join('')}

  <div class="footer">Generated by Social Insights - Social Media Post Analysis Platform</div>
</body>
</html>`;

    reportWindow.document.write(html);
    reportWindow.document.close();
    reportWindow.focus();
    setTimeout(() => reportWindow.print(), 500);
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report header */}
      <div className="card flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand-600 p-3">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Social Insights Report
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <button onClick={exportPDFReport} className="btn-primary">
          <Download className="h-4 w-4" /> Export PDF Report
        </button>
      </div>

      {stats.total === 0 ? (
        <div className="card flex h-48 items-center justify-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            No data available. Analyze some posts first to generate a report.
          </p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <div className="card">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Posts</p>
              <p className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400">{stats.total}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500 dark:text-slate-400">Positive</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.positive}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500 dark:text-slate-400">Neutral</p>
              <p className="mt-1 text-2xl font-bold text-slate-500 dark:text-slate-400">{stats.neutral}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500 dark:text-slate-400">Negative</p>
              <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{stats.negative}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500 dark:text-slate-400">Mixed</p>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.mixed}</p>
            </div>
          </div>

          {/* Additional stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="card">
              <p className="text-sm text-slate-500 dark:text-slate-400">Avg Confidence</p>
              <p className="mt-1 text-2xl font-bold text-slate-700 dark:text-slate-300">
                {(stats.avgConfidence * 100).toFixed(0)}%
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500 dark:text-slate-400">Avg Emotional Score</p>
              <p className="mt-1 text-2xl font-bold text-slate-700 dark:text-slate-300">
                {(stats.avgEmotionalScore * 100).toFixed(0)}%
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500 dark:text-slate-400">Sarcastic Posts</p>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.sarcasticCount}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500 dark:text-slate-400">High Risk Posts</p>
              <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{riskCounts.high}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
                Sentiment Distribution
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={50} outerRadius={90} paddingAngle={3}>
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
            </div>

            <div className="card">
              <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
                Emotion Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={emotionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {emotionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Intent and Risk charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
                Intent Distribution
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={intentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#1f5be0" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
                Risk Level Distribution
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {riskData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top topics */}
          {topicData.length > 0 && (
            <div className="card">
              <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
                Top Discussed Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {topicData.map(([topic, count]) => (
                  <span
                    key={topic}
                    className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                  >
                    {topic} <span className="text-slate-400">({count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Top keywords */}
          <div className="card">
            <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
              Top Keywords
            </h3>
            {topKeywords.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">No keywords detected.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topKeywords.map(([kw, count]) => (
                  <span
                    key={kw}
                    className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                    style={{ fontSize: `${Math.min(1.2, 0.8 + count * 0.1)}rem` }}
                  >
                    {kw} <span className="text-slate-400">({count})</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="card">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                AI-Powered Recommendations
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
        </>
      )}
    </div>
  );
}
