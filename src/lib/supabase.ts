import { createClient } from '@supabase/supabase-js';
import type { SentimentLabel, EmotionLabel, IntentLabel, RiskLevel } from '@/lib/sentiment';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface DatabasePost {
  id: string;
  content: string;
  sentiment: SentimentLabel;
  confidence_score: number;
  emotion: EmotionLabel;
  secondary_emotion: EmotionLabel | null;
  emotional_score: number;
  keywords: string[];
  detected_emojis: string[] | null;
  emoji_meanings: string[] | null;
  topic: string | null;
  intent: IntentLabel;
  risk_level: RiskLevel;
  is_sarcastic: boolean;
  ai_explanation: string | null;
  suggested_response: string | null;
  platform: import('@/lib/constants').Platform;
  created_at: string;
  user_id: string;
}
