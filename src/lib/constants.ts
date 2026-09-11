import type { SentimentLabel, EmotionLabel, IntentLabel, RiskLevel } from '@/lib/sentiment';

export const SENTIMENT_COLORS: Record<SentimentLabel, string> = {
  positive: '#10b981',
  neutral: '#64748b',
  negative: '#ef4444',
  mixed: '#f59e0b',
};

export const SENTIMENT_BG: Record<SentimentLabel, string> = {
  positive: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400',
  negative: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  mixed: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
};

export const EMOTION_COLORS: Record<EmotionLabel, string> = {
  joy: '#f59e0b',
  happiness: '#fbbf24',
  excitement: '#f97316',
  love: '#ec4899',
  trust: '#14b8a6',
  anger: '#ef4444',
  frustration: '#dc2626',
  fear: '#8b5cf6',
  sadness: '#3b82f6',
  anxiety: '#6366f1',
  surprise: '#ec4899',
  disappointment: '#78716c',
  neutral: '#64748b',
};

export const EMOTION_BG: Record<EmotionLabel, string> = {
  joy: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  happiness: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  excitement: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  love: 'bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400',
  trust: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
  anger: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  frustration: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  fear: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  sadness: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  anxiety: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
  surprise: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-400',
  disappointment: 'bg-stone-50 text-stone-700 dark:bg-stone-500/10 dark:text-stone-400',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400',
};

export const SENTIMENT_LABELS: Record<SentimentLabel, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  mixed: 'Mixed',
};

export const EMOTION_LABELS: Record<EmotionLabel, string> = {
  joy: 'Joy',
  happiness: 'Happiness',
  excitement: 'Excitement',
  love: 'Love',
  trust: 'Trust',
  anger: 'Anger',
  frustration: 'Frustration',
  fear: 'Fear',
  sadness: 'Sadness',
  anxiety: 'Anxiety',
  surprise: 'Surprise',
  disappointment: 'Disappointment',
  neutral: 'Neutral',
};

export const INTENT_LABELS: Record<IntentLabel, string> = {
  praise: 'Praise',
  complaint: 'Complaint',
  concern: 'Concern',
  recommendation: 'Recommendation',
  question: 'Question',
  general: 'General',
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
};

export const RISK_BG: Record<RiskLevel, string> = {
  low: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  high: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
};

export type Platform = 'x' | 'facebook' | 'instagram' | 'linkedin' | 'reddit' | 'youtube' | 'tiktok';

export const PLATFORMS: { value: Platform; label: string; color: string; bg: string }[] = [
  { value: 'x', label: 'X (Twitter)', color: '#1a1a1a', bg: 'bg-slate-100 text-slate-800 dark:bg-slate-700/40 dark:text-slate-200' },
  { value: 'facebook', label: 'Facebook', color: '#1877f2', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
  { value: 'instagram', label: 'Instagram', color: '#e1306c', bg: 'bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400' },
  { value: 'linkedin', label: 'LinkedIn', color: '#0a66c2', bg: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400' },
  { value: 'reddit', label: 'Reddit', color: '#ff4500', bg: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' },
  { value: 'youtube', label: 'YouTube', color: '#ff0000', bg: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' },
  { value: 'tiktok', label: 'TikTok', color: '#010101', bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' },
];

export const PLATFORM_MAP: Record<Platform, { label: string; color: string; bg: string }> = Object.fromEntries(
  PLATFORMS.map((p) => [p.value, { label: p.label, color: p.color, bg: p.bg }])
) as Record<Platform, { label: string; color: string; bg: string }>;
