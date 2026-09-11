import { supabase } from '@/lib/supabase';
import { analyzeSentiment } from '@/lib/sentiment';

const SAMPLE_POSTS = [
  'Absolutely love the new product update! The interface is so smooth and intuitive. Great job team! 😍🎉',
  'This is the worst customer service I have ever experienced. Waiting for 2 hours and no response. Terrible! 😡👎',
  'Just tried the new restaurant downtown. The food was okay, nothing special. Average experience overall. 🤷',
  'I am so excited about the upcoming product launch! The teaser looks incredible and amazing! 🤩🔥',
  'Feeling really disappointed with my recent purchase. The quality is poor and it broke after one day. 😞',
  'The conference was fantastic! Met so many wonderful people and learned a lot. Truly inspiring event! ✨',
  'My flight got cancelled again. This airline is a nightmare. So frustrated with their terrible service! 😤',
  'The weather today is nice. Going for a walk in the park later. Should be a pleasant afternoon. ☀️',
  'I am absolutely thrilled with my new job! The team is amazing and the work is so rewarding. Love it! ❤️',
  'This new phone is a complete disaster. Battery dies in 2 hours and the screen keeps freezing. Awful! 🤬',
  'Had a wonderful time at the beach yesterday. The sunset was beautiful and the water was perfect! 🏖️',
  'The delivery was late and the package was damaged. Really disappointed with this purchase experience. 📦👎',
  'Just finished reading this book and it was incredible! Could not put it down. Highly recommend it! 📚💯',
  'The meeting was fine. We discussed the quarterly results and the new project timeline. Standard stuff. 🤔',
  'I am scared about the upcoming storm. The news says it could be really dangerous. Stay safe everyone! 😨⚠️',
  'Best concert ever! The music was phenomenal and the atmosphere was electric. What an unforgettable night! 🎉🤯',
  'My internet has been down for 3 days. Customer support is useless. This is absolutely unacceptable! 😡🚨',
  'Tried the new coffee shop on Main Street. The latte was delicious and the staff were so friendly! ☕😊',
  'Feeling really sad today. My cat is sick and I am worried about the vet visit tomorrow. Tough day. 😢',
  'The new software update is a game changer! So much faster and the new features are brilliant. Love it! ❤️🔥',
  'Ordered food delivery and it took over an hour. The food was cold and the order was wrong. Frustrating! 😒',
  'What a surprise! The company just announced free healthcare for all employees. This is incredible news! 😲🎉',
  'The hotel was decent. Clean room, good location, average breakfast. Nothing to complain about really. 🙂',
  'I am so angry at this company. They charged me twice and now refuse to refund. Absolutely furious! 😡❌',
  'The workshop was eye-opening! Learned so many new techniques and met wonderful people. Joyful experience! 🤗✨',
  'Oh great, another update that breaks everything. Just what I needed today. Thanks for nothing. 🙄',
  'The new update looks great, but it keeps crashing every time I use it. So frustrating! 😤💔',
  'Your customer support never responds. Very disappointed with the lack of help. 😞👎',
  'I trust this brand completely. Their products are reliable and the quality is always consistent. 👍💪',
  'I am worried about the security of my data after the recent breach. Is my information safe? 😰🚨',
];

export async function seedSamplePosts(userId: string) {
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (count && count > 0) return;

  const rows = SAMPLE_POSTS.map((content) => {
    const result = analyzeSentiment(content);
    const daysAgo = Math.floor(Math.random() * 14);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

    return {
      content,
      sentiment: result.sentiment,
      confidence_score: result.confidence,
      emotion: result.emotion,
      secondary_emotion: result.secondaryEmotion,
      emotional_score: result.emotionalScore,
      keywords: result.keywords,
      detected_emojis: result.detectedEmojis,
      emoji_meanings: result.emojiMeanings,
      topic: result.topic,
      intent: result.intent,
      risk_level: result.riskLevel,
      is_sarcastic: result.isSarcastic,
      ai_explanation: result.aiExplanation,
      suggested_response: result.suggestedResponse,
      user_id: userId,
      created_at: date.toISOString(),
    };
  });

  await supabase.from('posts').insert(rows);
}
