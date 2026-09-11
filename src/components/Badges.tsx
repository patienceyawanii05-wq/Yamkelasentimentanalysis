import type { SentimentLabel, EmotionLabel, IntentLabel, RiskLevel } from '@/lib/sentiment';
import type { Platform } from '@/lib/constants';
import {
  SENTIMENT_BG, EMOTION_BG, SENTIMENT_LABELS, EMOTION_LABELS,
  INTENT_LABELS, RISK_BG, RISK_LABELS, PLATFORM_MAP,
} from '@/lib/constants';
import { Smile, Meh, Frown, AlertTriangle, type LucideIcon } from 'lucide-react';

export function SentimentBadge({ sentiment }: { sentiment: SentimentLabel }) {
  const icons: Partial<Record<SentimentLabel, LucideIcon>> = {
    positive: Smile,
    neutral: Meh,
    negative: Frown,
  };
  const Icon = icons[sentiment];
  return (
    <span className={`badge ${SENTIMENT_BG[sentiment]}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {SENTIMENT_LABELS[sentiment]}
    </span>
  );
}

export function EmotionBadge({ emotion }: { emotion: EmotionLabel }) {
  return (
    <span className={`badge ${EMOTION_BG[emotion]}`}>{EMOTION_LABELS[emotion]}</span>
  );
}

export function IntentBadge({ intent }: { intent: IntentLabel }) {
  const styles: Record<IntentLabel, string> = {
    praise: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    complaint: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    concern: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    recommendation: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
    question: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    general: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400',
  };
  return <span className={`badge ${styles[intent]}`}>{INTENT_LABELS[intent]}</span>;
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const icons: Record<RiskLevel, LucideIcon> = {
    low: Smile,
    medium: AlertTriangle,
    high: AlertTriangle,
  };
  const Icon = icons[risk];
  return (
    <span className={`badge ${RISK_BG[risk]}`}>
      <Icon className="h-3.5 w-3.5" />
      {RISK_LABELS[risk]}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  const info = PLATFORM_MAP[platform];
  return (
    <span className={`badge ${info.bg}`}>
      {info.label}
    </span>
  );
}
