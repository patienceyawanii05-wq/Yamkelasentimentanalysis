import { useState, useRef } from 'react';
import { analyzeSentiment, type SentimentResult } from '@/lib/sentiment';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { SentimentBadge, EmotionBadge, RiskBadge, PlatformBadge } from '@/components/Badges';
import { PLATFORMS, type Platform } from '@/lib/constants';
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, Globe } from 'lucide-react';

interface BulkRow {
  content: string;
  sentiment: SentimentResult['sentiment'];
  confidence: number;
  emotion: SentimentResult['emotion'];
  secondaryEmotion: SentimentResult['secondaryEmotion'];
  emotionalScore: number;
  keywords: string[];
  detectedEmojis: string[];
  emojiMeanings: string[];
  topic: string | null;
  intent: SentimentResult['intent'];
  riskLevel: SentimentResult['riskLevel'];
  isSarcastic: boolean;
  aiExplanation: string;
  suggestedResponse: string;
  platform: Platform;
}

export function BulkPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [platform, setPlatform] = useState<Platform>('x');
  const fileRef = useRef<HTMLInputElement>(null);

  function parseCSV(text: string): string[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const posts: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (i === 0 && /^(content|post|text|message|tweet)/i.test(line)) continue;
      if (line.startsWith('"')) {
        const match = line.match(/^"((?:[^"\\]|\\.)*)"(.*)$/);
        if (match) {
          posts.push(match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'));
          continue;
        }
      }
      const commaIdx = line.indexOf(',');
      posts.push(commaIdx > -1 ? line.substring(0, commaIdx).trim() : line.trim());
    }
    return posts;
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }
    setError(null);
    setFileName(file.name);
    setLoading(true);
    setRows([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const posts = parseCSV(text);
      if (posts.length === 0) {
        setError('No posts found in the CSV file.');
        setLoading(false);
        return;
      }
      const results = posts.map((content) => {
        const r = analyzeSentiment(content);
        return {
          content,
          sentiment: r.sentiment,
          confidence: r.confidence,
          emotion: r.emotion,
          secondaryEmotion: r.secondaryEmotion,
          emotionalScore: r.emotionalScore,
          keywords: r.keywords,
          detectedEmojis: r.detectedEmojis,
          emojiMeanings: r.emojiMeanings,
          topic: r.topic,
          intent: r.intent,
          riskLevel: r.riskLevel,
          isSarcastic: r.isSarcastic,
          aiExplanation: r.aiExplanation,
          suggestedResponse: r.suggestedResponse,
          platform,
        };
      });
      setRows(results);
      setLoading(false);
    };
    reader.onerror = () => {
      setError('Failed to read the file.');
      setLoading(false);
    };
    reader.readAsText(file);
  }

  function exportCSV() {
    const header = 'content,platform,sentiment,confidence,emotion,secondary_emotion,emotional_score,keywords,detected_emojis,emoji_meanings,topic,intent,risk_level,is_sarcastic,ai_explanation,suggested_response\n';
    const body = rows
      .map((r) => {
        const content = `"${r.content.replace(/"/g, '""')}"`;
        const keywords = `"${r.keywords.join('; ')}"`;
        const emojis = `"${r.detectedEmojis.join(' ')}"`;
        const emojiMeanings = `"${r.emojiMeanings.join('; ')}"`;
        const explanation = `"${r.aiExplanation.replace(/"/g, '""')}"`;
        const response = `"${r.suggestedResponse.replace(/"/g, '""')}"`;
        return `${content},${r.platform},${r.sentiment},${r.confidence},${r.emotion},${r.secondaryEmotion || ''},${r.emotionalScore},${keywords},${emojis},${emojiMeanings},${r.topic || ''},${r.intent},${r.riskLevel},${r.isSarcastic},${explanation},${response}`;
      })
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sentiment_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveAll() {
    if (!user || rows.length === 0) return;
    setSaving(true);
    const insertData = rows.map((r) => ({
      content: r.content,
      sentiment: r.sentiment,
      confidence_score: r.confidence,
      emotion: r.emotion,
      secondary_emotion: r.secondaryEmotion,
      emotional_score: r.emotionalScore,
      keywords: r.keywords,
      detected_emojis: r.detectedEmojis,
      emoji_meanings: r.emojiMeanings,
      topic: r.topic,
      intent: r.intent,
      risk_level: r.riskLevel,
      is_sarcastic: r.isSarcastic,
      ai_explanation: r.aiExplanation,
      suggested_response: r.suggestedResponse,
      platform: r.platform,
      user_id: user.id,
    }));
    const { error } = await supabase.from('posts').insert(insertData);
    setSaving(false);
    if (error) {
      setError('Failed to save posts: ' + error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  const stats = {
    total: rows.length,
    positive: rows.filter((r) => r.sentiment === 'positive').length,
    neutral: rows.filter((r) => r.sentiment === 'neutral').length,
    negative: rows.filter((r) => r.sentiment === 'negative').length,
    mixed: rows.filter((r) => r.sentiment === 'mixed').length,
    highRisk: rows.filter((r) => r.riskLevel === 'high').length,
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-brand-500" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            Bulk CSV Analysis
          </h3>
        </div>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Upload a CSV file with a column containing social media posts. The first column will be
          analyzed. Results are processed in real time with full AI analysis including emotions,
          risk levels, topics, and suggested responses.
        </p>

        <div className="mb-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Globe className="h-4 w-4" /> Platform for all posts
          </label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlatform(p.value)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                  platform === p.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-400'
                    : 'border-surface-light-border text-slate-500 hover:border-brand-300 hover:text-slate-700 dark:border-surface-dark-border dark:text-slate-400 dark:hover:border-brand-500/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-light-border p-8 transition-colors hover:border-brand-400 hover:bg-brand-50/30 dark:border-surface-dark-border dark:hover:border-brand-500 dark:hover:bg-brand-500/5"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="hidden"
          />
          {loading ? (
            <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
          ) : (
            <Upload className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          )}
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            {loading ? 'Analyzing posts...' : 'Click to upload a CSV file'}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {fileName || 'Supports .csv files with a post/text column'}
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            {[
              { label: 'Total', value: stats.total, color: 'text-brand-600 dark:text-brand-400' },
              { label: 'Positive', value: stats.positive, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Neutral', value: stats.neutral, color: 'text-slate-500 dark:text-slate-400' },
              { label: 'Negative', value: stats.negative, color: 'text-red-600 dark:text-red-400' },
              { label: 'Mixed', value: stats.mixed, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'High Risk', value: stats.highRisk, color: 'text-red-600 dark:text-red-400' },
            ].map((s) => (
              <div key={s.label} className="card">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
                <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={exportCSV} className="btn-primary">
              <Download className="h-4 w-4" /> Export Results CSV
            </button>
            <button onClick={saveAll} disabled={saving || saved} className="btn-secondary">
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : saved ? (
                <><CheckCircle2 className="h-4 w-4" /> Saved to Dashboard</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Save All to Dashboard</>
              )}
            </button>
          </div>

          <div className="card">
            <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
              Analysis Results ({rows.length} posts)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-light-border text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:border-surface-dark-border dark:text-slate-500">
                    <th className="pb-3 pr-4 font-medium">#</th>
                    <th className="pb-3 pr-4 font-medium">Post</th>
                    <th className="pb-3 pr-4 font-medium">Platform</th>
                    <th className="pb-3 pr-4 font-medium">Sentiment</th>
                    <th className="pb-3 pr-4 font-medium">Emotion</th>
                    <th className="pb-3 pr-4 font-medium">Risk</th>
                    <th className="pb-3 pr-4 font-medium">Topic</th>
                    <th className="pb-3 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-surface-light-border last:border-0 dark:border-surface-dark-border">
                      <td className="py-3 pr-4 text-slate-400">{i + 1}</td>
                      <td className="max-w-sm py-3 pr-4 text-slate-700 dark:text-slate-300">
                        <div className="truncate" title={row.content}>{row.content}</div>
                        {row.detectedEmojis.length > 0 && (
                          <span className="text-base">{row.detectedEmojis.join('')}</span>
                        )}
                        {row.isSarcastic && (
                          <span className="text-xs text-amber-500">Sarcasm</span>
                        )}
                      </td>
                      <td className="py-3 pr-4"><PlatformBadge platform={row.platform} /></td>
                      <td className="py-3 pr-4"><SentimentBadge sentiment={row.sentiment} /></td>
                      <td className="py-3 pr-4"><EmotionBadge emotion={row.emotion} /></td>
                      <td className="py-3 pr-4"><RiskBadge risk={row.riskLevel} /></td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                        {row.topic || '—'}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">
                        {Math.round(row.confidence * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
