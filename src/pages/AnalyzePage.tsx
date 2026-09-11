import { useState, useMemo, type FormEvent } from 'react';
import { analyzeSentiment, type SentimentResult } from '@/lib/sentiment';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { SentimentBadge, EmotionBadge, IntentBadge, RiskBadge, PlatformBadge } from '@/components/Badges';
import {
  SENTIMENT_COLORS, EMOTION_COLORS, SENTIMENT_LABELS, EMOTION_LABELS,
  INTENT_LABELS, RISK_LABELS, PLATFORMS, type Platform,
} from '@/lib/constants';
import {
  Sparkles, Save, Hash, Gauge, Loader2, CheckCircle2,
  Brain, MessageSquareReply, AlertTriangle, Tag, HeartPulse,
  Eye, EyeOff, Copy, Smile, Globe,
} from 'lucide-react';

export function AnalyzePage() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [platform, setPlatform] = useState<Platform>('x');
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [copied, setCopied] = useState(false);

  const livePreview = useMemo(() => {
    if (text.trim().length < 5) return null;
    return analyzeSentiment(text);
  }, [text]);

  const displayResult = result ?? livePreview;

  function handleAnalyze(e: FormEvent) {
    e.preventDefault();
    if (text.trim().length < 5) return;
    setResult(analyzeSentiment(text));
    setSaved(false);
    setShowResponse(false);
  }

  async function handleSave() {
    if (!displayResult || !user) return;
    setSaving(true);
    const { error } = await supabase.from('posts').insert({
      content: text,
      sentiment: displayResult.sentiment,
      confidence_score: displayResult.confidence,
      emotion: displayResult.emotion,
      secondary_emotion: displayResult.secondaryEmotion,
      emotional_score: displayResult.emotionalScore,
      keywords: displayResult.keywords,
      detected_emojis: displayResult.detectedEmojis,
      emoji_meanings: displayResult.emojiMeanings,
      topic: displayResult.topic,
      intent: displayResult.intent,
      risk_level: displayResult.riskLevel,
      is_sarcastic: displayResult.isSarcastic,
      ai_explanation: displayResult.aiExplanation,
      suggested_response: displayResult.suggestedResponse,
      platform: platform,
      user_id: user.id,
    });
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  function copyResponse() {
    if (!displayResult) return;
    navigator.clipboard.writeText(displayResult.suggestedResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const confidenceColor =
    displayResult && displayResult.confidence >= 0.75
      ? 'text-emerald-600 dark:text-emerald-400'
      : displayResult && displayResult.confidence >= 0.55
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-slate-500 dark:text-slate-400';

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-500" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            Analyze a Social Media Post
          </h3>
        </div>

        <form onSubmit={handleAnalyze}>
          <div className="mb-3">
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">
              <Globe className="h-4 w-4" /> Platform
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
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste a social media post here... e.g. 'The new update looks great, but it keeps crashing every time I use it.'"
            rows={5}
            className="input-field resize-none"
            maxLength={2000}
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {text.length} / 2000 characters
            </span>
            <button
              type="submit"
              disabled={text.trim().length < 5}
              className="btn-primary"
            >
              <Sparkles className="h-4 w-4" />
              Analyze Post
            </button>
          </div>
        </form>

        {livePreview && !result && (
          <div className="mt-4 rounded-xl bg-surface-light-subtle p-4 dark:bg-surface-dark">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500" />
              <span>Live preview:</span>
              <SentimentBadge sentiment={livePreview.sentiment} />
              <EmotionBadge emotion={livePreview.emotion} />
              {livePreview.isSarcastic && (
                <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  Sarcasm Detected
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                Confidence
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-light dark:bg-surface-dark-subtle">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${livePreview.confidence * 100}%`,
                    backgroundColor: SENTIMENT_COLORS[livePreview.sentiment],
                  }}
                />
              </div>
              <span className={`text-sm font-bold tabular-nums ${
                livePreview.confidence >= 0.75
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : livePreview.confidence >= 0.55
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {Math.round(livePreview.confidence * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {displayResult && (
        <div className="space-y-6 animate-scale-in">
          {/* Main result cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Sentiment */}
            <div className="card">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Gauge className="h-4 w-4" /> Sentiment
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-1.5 rounded-full"
                  style={{ backgroundColor: SENTIMENT_COLORS[displayResult.sentiment] }}
                />
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {SENTIMENT_LABELS[displayResult.sentiment]}
                  </p>
                  <SentimentBadge sentiment={displayResult.sentiment} />
                </div>
              </div>
            </div>

            {/* Confidence */}
            <div className="card">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Gauge className="h-4 w-4" /> Confidence
              </div>
              <p className={`text-3xl font-bold ${confidenceColor}`}>
                {Math.round(displayResult.confidence * 100)}%
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-light-subtle dark:bg-surface-dark">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${displayResult.confidence * 100}%`,
                    backgroundColor: SENTIMENT_COLORS[displayResult.sentiment],
                  }}
                />
              </div>
            </div>

            {/* Emotion */}
            <div className="card">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <HeartPulse className="h-4 w-4" /> Primary Emotion
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {EMOTION_LABELS[displayResult.emotion]}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                <EmotionBadge emotion={displayResult.emotion} />
                {displayResult.secondaryEmotion && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    + {EMOTION_LABELS[displayResult.secondaryEmotion]}
                  </span>
                )}
              </div>
            </div>

            {/* Risk Level */}
            <div className="card">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <AlertTriangle className="h-4 w-4" /> Risk Level
              </div>
              <div className="mt-2">
                <RiskBadge risk={displayResult.riskLevel} />
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-light-subtle dark:bg-surface-dark">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: displayResult.riskLevel === 'high' ? '100%' : displayResult.riskLevel === 'medium' ? '60%' : '30%',
                    backgroundColor: displayResult.riskLevel === 'high' ? '#ef4444' : displayResult.riskLevel === 'medium' ? '#f59e0b' : '#10b981',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Context cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Topic */}
            <div className="card">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Tag className="h-4 w-4" /> Main Topic
              </div>
              <p className="text-lg font-semibold text-slate-800 dark:text-white">
                {displayResult.topic || 'No specific topic detected'}
              </p>
            </div>

            {/* Intent */}
            <div className="card">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Sparkles className="h-4 w-4" /> Intent
              </div>
              <div className="mt-1">
                <IntentBadge intent={displayResult.intent} />
              </div>
            </div>

            {/* Emotional Score */}
            <div className="card">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <HeartPulse className="h-4 w-4" /> Emotional Score
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {Math.round(displayResult.emotionalScore * 100)}%
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-light-subtle dark:bg-surface-dark">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${displayResult.emotionalScore * 100}%`,
                    backgroundColor: EMOTION_COLORS[displayResult.emotion],
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sarcasm flag */}
          {displayResult.isSarcastic && (
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4 dark:bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Sarcasm detected.</strong> The surface-level positivity may mask underlying dissatisfaction. The AI has adjusted the analysis accordingly.
              </p>
            </div>
          )}

          {/* AI Explanation */}
          <div className="card border-l-4 border-l-brand-500">
            <div className="mb-3 flex items-center gap-2">
              <Brain className="h-5 w-5 text-brand-500" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                AI Explanation
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {displayResult.aiExplanation}
            </p>
          </div>

          {/* Suggested Response */}
          <div className="card border-l-4 border-l-teal-500">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquareReply className="h-5 w-5 text-teal-500" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                  Suggested Brand Response
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResponse(!showResponse)}
                  className="btn-ghost text-xs"
                >
                  {showResponse ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showResponse ? 'Hide' : 'Show'}
                </button>
                <button onClick={copyResponse} className="btn-ghost text-xs">
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            {showResponse ? (
              <p className="rounded-xl bg-teal-50 p-4 text-sm leading-relaxed text-slate-700 dark:bg-teal-500/10 dark:text-slate-300">
                {displayResult.suggestedResponse}
              </p>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Click "Show" to reveal the AI-generated response suggestion.
              </p>
            )}
          </div>

          {/* Emoji Analysis */}
          {displayResult.detectedEmojis.length > 0 && (
            <div className="card">
              <div className="mb-3 flex items-center gap-2">
                <Smile className="h-5 w-5 text-brand-500" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                  Detected Emojis
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-3">
                  {displayResult.detectedEmojis.map((emoji, i) => (
                    <span key={i} className="text-3xl">{emoji}</span>
                  ))}
                </div>
                {displayResult.emojiMeanings.length > 0 && (
                  <div className="flex flex-wrap gap-2 border-t border-surface-light-border pt-3 dark:border-surface-dark-border">
                    {displayResult.emojiMeanings.map((meaning, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                      >
                        {meaning}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Keywords */}
          <div className="card">
            <div className="mb-3 flex items-center gap-2">
              <Hash className="h-5 w-5 text-brand-500" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                Detected Keywords
              </h3>
            </div>
            {displayResult.keywords.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">
                No significant keywords detected in this post.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {displayResult.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving || saved} className="btn-primary">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Saved to Dashboard
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save to Dashboard
                </>
              )}
            </button>
            <button
              onClick={() => { setText(''); setResult(null); setShowResponse(false); setPlatform('x'); }}
              className="btn-secondary"
            >
              Analyze Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
