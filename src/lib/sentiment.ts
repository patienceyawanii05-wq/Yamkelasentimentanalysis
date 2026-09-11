import { vaderPolarityScores } from '@/lib/vader';

export type SentimentLabel = 'positive' | 'neutral' | 'negative' | 'mixed';
export type EmotionLabel =
  | 'joy' | 'happiness' | 'excitement' | 'love' | 'trust'
  | 'anger' | 'frustration' | 'fear' | 'sadness' | 'anxiety'
  | 'surprise' | 'disappointment' | 'neutral';
export type IntentLabel = 'praise' | 'complaint' | 'concern' | 'recommendation' | 'question' | 'general';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface SentimentResult {
  sentiment: SentimentLabel;
  confidence: number;
  emotion: EmotionLabel;
  secondaryEmotion: EmotionLabel | null;
  emotionalScore: number;
  keywords: string[];
  detectedEmojis: string[];
  emojiMeanings: string[];
  topic: string | null;
  intent: IntentLabel;
  riskLevel: RiskLevel;
  isSarcastic: boolean;
  aiExplanation: string;
  suggestedResponse: string;
}

const EMOJI_MAP: Record<string, { emotion: EmotionLabel; sentiment: SentimentLabel; meaning: string }> = {
  // Joy / Happiness
  '😀': { emotion: 'joy', sentiment: 'positive', meaning: 'grinning face — joy' },
  '😃': { emotion: 'joy', sentiment: 'positive', meaning: 'grinning face with big eyes — joy' },
  '😄': { emotion: 'joy', sentiment: 'positive', meaning: 'grinning face with smiling eyes — joy' },
  '😁': { emotion: 'joy', sentiment: 'positive', meaning: 'beaming face with smiling eyes — joy' },
  '😊': { emotion: 'happiness', sentiment: 'positive', meaning: 'smiling face with smiling eyes — happiness' },
  '☺️': { emotion: 'happiness', sentiment: 'positive', meaning: 'smiling face — happiness' },
  '🙂': { emotion: 'happiness', sentiment: 'positive', meaning: 'slightly smiling face — mild happiness' },
  '😆': { emotion: 'joy', sentiment: 'positive', meaning: 'grinning squinting face — laughter' },
  '😂': { emotion: 'joy', sentiment: 'positive', meaning: 'face with tears of joy — intense joy' },
  '🤣': { emotion: 'joy', sentiment: 'positive', meaning: 'rolling on the floor laughing — intense joy' },
  '😋': { emotion: 'joy', sentiment: 'positive', meaning: 'face savoring food — enjoyment' },
  '😎': { emotion: 'joy', sentiment: 'positive', meaning: 'smiling face with sunglasses — cool confidence' },
  '🤗': { emotion: 'joy', sentiment: 'positive', meaning: 'hugging face — warmth and affection' },
  '🤩': { emotion: 'excitement', sentiment: 'positive', meaning: 'star-struck face — excitement and wonder' },
  // Excitement
  '🎉': { emotion: 'excitement', sentiment: 'positive', meaning: 'party popper — celebration and excitement' },
  '🎊': { emotion: 'excitement', sentiment: 'positive', meaning: 'confetti ball — celebration' },
  '🥳': { emotion: 'excitement', sentiment: 'positive', meaning: 'partying face — celebration' },
  '🔥': { emotion: 'excitement', sentiment: 'positive', meaning: 'fire — excitement, hype, or intensity' },
  '⚡': { emotion: 'excitement', sentiment: 'positive', meaning: 'lightning — energy and excitement' },
  '✨': { emotion: 'excitement', sentiment: 'positive', meaning: 'sparkles — excitement and positivity' },
  '💯': { emotion: 'excitement', sentiment: 'positive', meaning: 'hundred points — total agreement or excellence' },
  // Love
  '❤️': { emotion: 'love', sentiment: 'positive', meaning: 'red heart — love and affection' },
  '🧡': { emotion: 'love', sentiment: 'positive', meaning: 'orange heart — warmth and care' },
  '💛': { emotion: 'love', sentiment: 'positive', meaning: 'yellow heart — friendship and joy' },
  '💚': { emotion: 'love', sentiment: 'positive', meaning: 'green heart — growth and care' },
  '💙': { emotion: 'love', sentiment: 'positive', meaning: 'blue heart — trust and loyalty' },
  '💜': { emotion: 'love', sentiment: 'positive', meaning: 'purple heart — compassion' },
  '🖤': { emotion: 'love', sentiment: 'positive', meaning: 'black heart — dark humor or deep affection' },
  '💕': { emotion: 'love', sentiment: 'positive', meaning: 'two hearts — love and affection' },
  '💖': { emotion: 'love', sentiment: 'positive', meaning: 'sparkling heart — intense love' },
  '💗': { emotion: 'love', sentiment: 'positive', meaning: 'growing heart — growing affection' },
  '💘': { emotion: 'love', sentiment: 'positive', meaning: 'heart with arrow — romantic love' },
  '💝': { emotion: 'love', sentiment: 'positive', meaning: 'heart with ribbon — love as a gift' },
  '😍': { emotion: 'love', sentiment: 'positive', meaning: 'smiling face with heart-eyes — adoration' },
  '🥰': { emotion: 'love', sentiment: 'positive', meaning: 'smiling face with hearts — being in love' },
  '😘': { emotion: 'love', sentiment: 'positive', meaning: 'face blowing a kiss — affection' },
  '🤝': { emotion: 'trust', sentiment: 'positive', meaning: 'handshake — trust and agreement' },
  // Trust
  '👍': { emotion: 'trust', sentiment: 'positive', meaning: 'thumbs up — approval and trust' },
  '👌': { emotion: 'trust', sentiment: 'positive', meaning: 'OK hand — approval and agreement' },
  '🙏': { emotion: 'trust', sentiment: 'positive', meaning: 'folded hands — gratitude or prayer' },
  '💪': { emotion: 'trust', sentiment: 'positive', meaning: 'flexed biceps — strength and support' },
  '👏': { emotion: 'trust', sentiment: 'positive', meaning: 'clapping hands — applause and praise' },
  // Anger
  '😠': { emotion: 'anger', sentiment: 'negative', meaning: 'angry face — anger' },
  '😡': { emotion: 'anger', sentiment: 'negative', meaning: 'pouting face — intense anger' },
  '🤬': { emotion: 'anger', sentiment: 'negative', meaning: 'face with symbols on mouth — extreme anger' },
  '😤': { emotion: 'anger', sentiment: 'negative', meaning: 'face with steam from nose — frustration and anger' },
  '👿': { emotion: 'anger', sentiment: 'negative', meaning: 'angry face with horns — anger' },
  // Frustration
  '🙄': { emotion: 'frustration', sentiment: 'negative', meaning: 'face with rolling eyes — frustration and annoyance' },
  '😑': { emotion: 'frustration', sentiment: 'negative', meaning: 'expressionless face — frustration or boredom' },
  '😐': { emotion: 'frustration', sentiment: 'negative', meaning: 'neutral face — frustration or indifference' },
  '😒': { emotion: 'frustration', sentiment: 'negative', meaning: 'unamused face — annoyance and frustration' },
  '😣': { emotion: 'frustration', sentiment: 'negative', meaning: 'persevering face — frustration and struggle' },
  '😖': { emotion: 'frustration', sentiment: 'negative', meaning: 'confounded face — intense frustration' },
  '🙍': { emotion: 'frustration', sentiment: 'negative', meaning: 'person frowning — frustration' },
  '🙎': { emotion: 'frustration', sentiment: 'negative', meaning: 'person pouting — frustration and displeasure' },
  // Fear
  '😨': { emotion: 'fear', sentiment: 'negative', meaning: 'fearful face — fear and worry' },
  '😱': { emotion: 'fear', sentiment: 'negative', meaning: 'face screaming in fear — extreme fear' },
  '😰': { emotion: 'fear', sentiment: 'negative', meaning: 'anxious face with sweat — fear and anxiety' },
  '👻': { emotion: 'fear', sentiment: 'negative', meaning: 'ghost — spooky or scary' },
  // Sadness
  '😢': { emotion: 'sadness', sentiment: 'negative', meaning: 'crying face — sadness' },
  '😭': { emotion: 'sadness', sentiment: 'negative', meaning: 'loudly crying face — intense sadness' },
  '😞': { emotion: 'sadness', sentiment: 'negative', meaning: 'disappointed face — sadness and letdown' },
  '😔': { emotion: 'sadness', sentiment: 'negative', meaning: 'pensive face — sadness and reflection' },
  '😟': { emotion: 'sadness', sentiment: 'negative', meaning: 'worried face — sadness and concern' },
  '💔': { emotion: 'sadness', sentiment: 'negative', meaning: 'broken heart — heartbreak and grief' },
  '🥺': { emotion: 'sadness', sentiment: 'negative', meaning: 'pleading face — sadness and vulnerability' },
  '😓': { emotion: 'sadness', sentiment: 'negative', meaning: 'sad but relieved face — sadness and relief' },
  // Anxiety
  '😬': { emotion: 'anxiety', sentiment: 'negative', meaning: 'grimacing face — anxiety and discomfort' },
  // Surprise
  '😮': { emotion: 'surprise', sentiment: 'positive', meaning: 'face with open mouth — surprise' },
  '😯': { emotion: 'surprise', sentiment: 'positive', meaning: 'hushed face — surprise' },
  '😲': { emotion: 'surprise', sentiment: 'positive', meaning: 'astonished face — great surprise' },
  '😦': { emotion: 'surprise', sentiment: 'neutral', meaning: 'frowning face with open mouth — surprise and concern' },
  '🤯': { emotion: 'surprise', sentiment: 'positive', meaning: 'exploding head — mind blown, extreme surprise' },
  // Disappointment
  '👎': { emotion: 'disappointment', sentiment: 'negative', meaning: 'thumbs down — disapproval and disappointment' },
  '🤦': { emotion: 'disappointment', sentiment: 'negative', meaning: 'person facepalming — disappointment and frustration' },
  '🤷': { emotion: 'disappointment', sentiment: 'negative', meaning: 'person shrugging — indifference or disappointment' },
  '💩': { emotion: 'disappointment', sentiment: 'negative', meaning: 'pile of poo — strong disapproval' },
  '🚩': { emotion: 'disappointment', sentiment: 'negative', meaning: 'red flag — warning sign or disappointment' },
  // Neutral / misc
  '🤔': { emotion: 'neutral', sentiment: 'neutral', meaning: 'thinking face — contemplation or questioning' },
  '😴': { emotion: 'neutral', sentiment: 'neutral', meaning: 'sleeping face — boredom or tiredness' },
  '🤐': { emotion: 'neutral', sentiment: 'neutral', meaning: 'zipper-mouth face — silence or secrecy' },
  '😶': { emotion: 'neutral', sentiment: 'neutral', meaning: 'face without mouth — speechless or neutral' },
  // Warning / concern
  '⚠️': { emotion: 'fear', sentiment: 'negative', meaning: 'warning sign — concern and caution' },
  '🚨': { emotion: 'fear', sentiment: 'negative', meaning: 'police car light — alarm and urgency' },
  '❌': { emotion: 'disappointment', sentiment: 'negative', meaning: 'cross mark — rejection or failure' },
  '⛔': { emotion: 'frustration', sentiment: 'negative', meaning: 'no entry — blocked or denied' },
  '🛑': { emotion: 'frustration', sentiment: 'negative', meaning: 'stop sign — halt or frustration' },
};

const EMOTION_KEYWORDS: Record<Exclude<EmotionLabel, 'neutral'>, Set<string>> = {
  joy: new Set([
    'joy', 'joyful', 'joyous', 'delighted', 'blissful', 'cheer', 'cheerful',
    'glad', 'pleased', 'content', 'contented', 'celebrate', 'celebrated',
    'smile', 'smiling', 'laugh', 'laughing', 'yay', 'hooray',
    'playful', 'wholesome', 'vibrant', 'warm', 'sunny',
    'good', 'great', 'nice', 'lovely', 'delightful', 'enjoyable',
    'pleasant', 'pleasure', 'fun', 'amusing', 'funny', 'hilarious',
  ]),
  happiness: new Set([
    'happy', 'happiness', 'thrilled', 'ecstatic', 'elated',
    'enjoy', 'enjoyed', 'enjoying', 'wonderful', 'fantastic',
    'grateful', 'thankful', 'blessed', 'proud', 'satisfied',
    'inspired', 'motivated', 'optimistic', 'hopeful', 'rejuvenated',
    'uplifting', 'refreshing', 'fine', 'okay', 'ok', 'decent',
    'good-vibes', 'positive', 'blessed', 'fortunate', 'luck', 'lucky',
  ]),
  excitement: new Set([
    'excited', 'excitement', 'enthusiastic', 'eager', 'pumped',
    'stoked', 'hyped', 'electrified', 'buzzing', 'anticipation',
    'counting', 'cannot-wait', 'finally', 'launch', 'announcing',
    'unveiling', 'sneak-peek', 'teaser', 'countdown',
    'awesome', 'epic', 'rad', 'cool', 'sweet', 'hell-yeah',
    'woohoo', 'lets-go', 'fire', 'lit', 'gonna-be-amazing',
  ]),
  love: new Set([
    'love', 'loved', 'loving', 'adore', 'adored', 'cherish',
    'heart', 'hearts', 'romantic', 'passionate', 'passion',
    'affection', 'devotion', 'beloved', 'darling', 'sweetheart',
    'crush', 'infatuated', 'smitten', 'treasure', 'embrace',
    'adore', 'care', 'caring', 'tender', 'fond', 'fondly',
    'hug', 'hugs', 'cuddle', 'kiss', 'xoxo',
  ]),
  trust: new Set([
    'trust', 'trusted', 'trusting', 'reliable', 'dependable',
    'honest', 'honesty', 'transparent', 'authentic', 'genuine',
    'loyal', 'loyalty', 'faithful', 'credible', 'integrity',
    'reputable', 'secure', 'confident', 'assured',
    'recommend', 'recommended', 'endorse', 'endorsed', 'approved',
    'safe', 'guaranteed', 'tested', 'proven', 'legitimate',
  ]),
  anger: new Set([
    'angry', 'anger', 'furious', 'rage', 'mad', 'outrage', 'outraged',
    'livid', 'hostile', 'aggressive', 'aggression', 'hate', 'hated',
    'resent', 'resentment', 'bitter', 'bitterly', 'disgusted',
    'disgusting', 'offended', 'offensive', 'provoked', 'vexed',
    'exasperated', 'indignant', 'wrath', 'wrathful', 'hostility',
    'fume', 'fuming', 'spiteful', 'malicious',
    'pissed', 'pissed-off', 'damn', 'crap', 'suck', 'sucks', 'sucked',
    'fed-up', 'done-with', 'had-it', 'enough', ' intolerable',
  ]),
  frustration: new Set([
    'frustrated', 'frustrating', 'frustration', 'annoyed', 'annoying',
    'irritated', 'irritating', 'irritate', 'infuriate', 'infuriated',
    'infuriating', 'cranky', 'grumpy', 'stuck', 'broken', 'crashing',
    'useless', 'unacceptable', 'again', 'still', 'keeps', 'every-time',
    'never', 'always-fails', 'not-working', 'glitch', 'bug',
    'slow', 'laggy', 'freeze', 'freezing', 'crash', 'hang', 'hanging',
    'wait', 'waiting', 'late', 'delayed', 'delay', 'down', 'offline',
    'ugh', 'sigh', 'seriously', 'really', 'come-on', 'typical',
  ]),
  fear: new Set([
    'fear', 'afraid', 'scared', 'scary', 'terrified', 'terrifying',
    'frightened', 'frightening', 'panic', 'panicked', 'panicking',
    'dread', 'dreadful', 'dreaded', 'horrified', 'horror', 'horrific',
    'threat', 'threatened', 'threatening', 'intimidated', 'creepy',
    'nightmare', 'ominous', 'sinister', 'danger', 'dangerous',
    'alarming', 'shocking', 'disturbing', 'warning', 'warn', 'caution',
  ]),
  sadness: new Set([
    'sad', 'unhappy', 'depressed', 'depression', 'sorrow', 'sorrowful',
    'grief', 'grieving', 'mourn', 'mourned', 'mourning', 'heartbroken',
    'heartbreaking', 'devastated', 'devastating', 'miserable', 'lonely',
    'loneliness', 'alone', 'despair', 'desperate', 'hopeless', 'helpless',
    'tears', 'crying', 'cry', 'cried', 'weep', 'weeping', 'gloomy',
    'melancholy', 'melancholic', 'dismal', 'blue', 'down', 'downcast',
    'forlorn', 'wretched', 'anguish', 'agony', 'torment', 'suffering',
    'suffer', 'suffered', 'shattered', 'empty', 'emptiness', 'hollow',
    'regret', 'regrets', 'regretful', 'remorse', 'guilt', 'guilty',
    'ashamed', 'shame',
    'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'miss', 'missing',
    'sorry', 'apologize', 'apologies', 'unfortunate', 'tragic', 'tragedy',
  ]),
  anxiety: new Set([
    'anxious', 'anxiety', 'worried', 'worry', 'worrying', 'nervous',
    'nervousness', 'apprehensive', 'alarmed', 'alarming', 'uneasy',
    'restless', 'foreboding', 'stressed', 'stress', 'overwhelmed',
    'pressure', 'tense', 'on-edge', 'unsettled', 'disturbed',
    'disturbing', 'vulnerable', 'insecure', 'unsafe', 'uncertain',
    'concerned', 'concern', 'bothered', 'troubled', 'uncomfortable',
  ]),
  surprise: new Set([
    'surprised', 'surprise', 'surprising', 'surprisingly', 'shocked',
    'shocking', 'shock', 'astonished', 'astonishing', 'amazed',
    'amazing', 'amaze', 'stunned', 'stunning', 'startled', 'startling',
    'dumbfounded', 'flabbergasted', 'unexpected', 'unexpectedly',
    'unbelievable', 'unimaginable', 'whoa', 'wow', 'gosh', 'golly',
    'incredible', 'incredibly', 'remarkable', 'remarkably',
    'extraordinary', 'phenomenal', 'unprecedented', 'sudden', 'suddenly',
    'unforeseen', 'breathtaking',
  ]),
  disappointment: new Set([
    'disappointed', 'disappointing', 'disappointment', 'let-down',
    'underwhelming', 'underwhelmed', 'unsatisfied', 'dissatisfied',
    'poor', 'subpar', 'mediocre', 'lacking', 'fell-short', 'expected-more',
    'not-what-i-expected', 'fails-to', 'doesnt-deliver',
    'waste', 'wasted', 'wasting', 'rip-off', 'scam', 'misleading',
    'let-down', 'unsatisfactory', 'not-good', 'not-worth', 'overpriced',
    'overrated', 'underwhelming', 'meh', 'displeased', 'unimpressed',
  ]),
};

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'is', 'are', 'was',
  'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
  'shall', 'can', 'need', 'this', 'that', 'these', 'those', 'i', 'me',
  'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
  'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her',
  'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'whose',
  'am', 'if', 'then', 'than', 'so', 'no', 'not', 'nor', 'only', 'own',
  'same', 'too', 'very', 'just', 'also', 'as', 'such', 'because',
  'while', 'where', 'when', 'how', 'why', 'there', 'here', 'all', 'any',
  'both', 'each', 'few', 'more', 'most', 'other', 'some',
  's', 't', 'don', 'now', 're', 've', 'll', 'm', 'd',
]);

const SARCASM_INDICATORS = [
  /\boh great\b/i, /\bgreat.*another\b/i, /\bjust what i needed\b/i,
  /\bthanks.*lot\b/i, /\bthanks.*nothing\b/i, /\bso much fun\b/i,
  /\byeah right\b/i, /\bsure.*love\b/i, /\bcan't wait.*again\b/i,
  /\bwow.*amazing.*not\b/i, /\bhow wonderful\b/i, /\blove.*when.*crash/i,
  /\bfantastic.*broken\b/i, /\bperfect.*wrong\b/i, /\bawesome.*another bug\b/i,
  /\byay.*more\b/i, /\bso excited.*wait/i, /\bsure thing\b/i,
  /\bobviously\b/i, /\bclearly\b/i,
];

const INTENT_PATTERNS: { intent: IntentLabel; patterns: RegExp[] }[] = [
  {
    intent: 'recommendation',
    patterns: [
      /\b(highly recommend|must try|should try|definitely|worth it|game changer|love this|get this|buy this)\b/i,
      /\b(best|favorite|go-to|cannot go wrong)\b/i,
    ],
  },
  {
    intent: 'complaint',
    patterns: [
      /\b(worst|terrible|awful|horrible|disappointed|unacceptable|never again|rip.?off|scam|waste)\b/i,
      /\b(charged twice|refund|not working|broken|crashing|useless|frustrated)\b/i,
      /\b(customer support|service).*(never|no|useless|terrible|worst|doesn't respond)\b/i,
    ],
  },
  {
    intent: 'praise',
    patterns: [
      /\b(amazing|fantastic|incredible|wonderful|brilliant|love|excellent|outstanding|superb)\b/i,
      /\b(great job|well done|keep up|kudos|congratulations|proud of)\b/i,
    ],
  },
  {
    intent: 'question',
    patterns: [
      /\?\s*$/, /\b(how do|how can|what is|when will|where is|why does|can you|will you|is there)\b/i,
    ],
  },
  {
    intent: 'concern',
    patterns: [
      /\b(worried|concerned|scared|afraid|hope this|fingers crossed|hope they)\b/i,
      /\b(dangerous|risk|safety|security|privacy|data breach)\b/i,
    ],
  },
];

const TOPIC_KEYWORDS: Record<string, Set<string>> = {
  'Product Update': new Set(['update', 'version', 'upgrade', 'patch', 'release', 'feature', 'features', 'changelog', 'rollback']),
  'Customer Service': new Set(['support', 'service', 'help', 'response', 'respond', 'ticket', 'agent', 'representative', 'waiting', 'waited']),
  'Product Quality': new Set(['quality', 'broken', 'defective', 'flaw', 'poor', 'cheap', 'durable', 'build', 'material', 'workmanship']),
  'Delivery & Shipping': new Set(['delivery', 'shipping', 'package', 'arrived', 'late', 'delayed', 'courier', 'tracking', 'dispatched', 'order']),
  'Pricing & Billing': new Set(['price', 'pricing', 'cost', 'expensive', 'cheap', 'charged', 'refund', 'billing', 'invoice', 'payment', 'subscription']),
  'User Experience': new Set(['interface', 'ui', 'ux', 'design', 'layout', 'navigation', 'usability', 'intuitive', 'clunky', 'smooth']),
  'Performance': new Set(['slow', 'fast', 'speed', 'lag', 'crash', 'crashing', 'freeze', 'freezing', 'bug', 'glitch', 'loading']),
  'Food & Dining': new Set(['food', 'restaurant', 'meal', 'taste', 'delicious', 'coffee', 'latte', 'menu', 'chef', 'dish']),
  'Travel': new Set(['flight', 'hotel', 'airline', 'vacation', 'trip', 'booking', 'beach', 'sunset', 'destination']),
  'Event': new Set(['concert', 'conference', 'workshop', 'event', 'festival', 'seminar', 'meetup', 'gathering']),
  'Employment': new Set(['job', 'career', 'work', 'team', 'colleague', 'boss', 'salary', 'workplace', 'office', 'coworker']),
  'Health & Wellness': new Set(['health', 'doctor', 'vet', 'sick', 'medicine', 'hospital', 'treatment', 'wellness', 'symptom']),
  'Technology': new Set(['phone', 'software', 'app', 'laptop', 'device', 'gadget', 'tech', 'digital', 'online', 'platform']),
  'Weather': new Set(['weather', 'storm', 'rain', 'sunny', 'forecast', 'temperature', 'climate']),
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length > 1);
}

function extractEmojis(text: string): string[] {
  const emojiRegex = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu;
  const matches = text.match(emojiRegex);
  return matches ? matches : [];
}

function extractKeywords(tokens: string[]): string[] {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    if (STOP_WORDS.has(token) || token.length < 3) continue;
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);
}

function detectEmotions(
  tokens: string[],
  emojis: string[],
  vaderScores: VaderScores,
): { primary: EmotionLabel; secondary: EmotionLabel | null; scores: Record<Exclude<EmotionLabel, 'neutral'>, number> } {
  const scores: Record<Exclude<EmotionLabel, 'neutral'>, number> = {
    joy: 0, happiness: 0, excitement: 0, love: 0, trust: 0,
    anger: 0, frustration: 0, fear: 0, sadness: 0, anxiety: 0,
    surprise: 0, disappointment: 0,
  };

  for (const token of tokens) {
    for (const emotion of Object.keys(EMOTION_KEYWORDS) as Exclude<EmotionLabel, 'neutral'>[]) {
      if (EMOTION_KEYWORDS[emotion].has(token)) scores[emotion]++;
    }
  }

  for (const emoji of emojis) {
    const mapping = EMOJI_MAP[emoji];
    if (mapping && mapping.emotion !== 'neutral') {
      scores[mapping.emotion] = (scores[mapping.emotion] || 0) + 1.5;
    }
  }

  const sorted = (Object.entries(scores) as [Exclude<EmotionLabel, 'neutral'>, number][])
    .sort((a, b) => b[1] - a[1]);

  if (sorted[0][1] <= 0) {
    const compound = vaderScores.compound;
    if (compound >= 0.3) {
      scores.happiness = 0.5;
      return { primary: 'happiness', secondary: null, scores };
    } else if (compound >= 0.05) {
      scores.joy = 0.4;
      return { primary: 'joy', secondary: null, scores };
    } else if (compound <= -0.3) {
      scores.frustration = 0.5;
      return { primary: 'frustration', secondary: null, scores };
    } else if (compound <= -0.05) {
      scores.sadness = 0.4;
      return { primary: 'sadness', secondary: null, scores };
    }
    return { primary: 'neutral', secondary: null, scores };
  }

  const primary = sorted[0][0];
  const secondary = sorted[1][1] > 0 ? sorted[1][0] : null;

  return { primary, secondary, scores };
}

function detectSarcasm(text: string, scores: VaderScores, emojis: string[]): boolean {
  for (const pattern of SARCASM_INDICATORS) {
    if (pattern.test(text)) return true;
  }

  const hasPositiveWords = scores.pos > 0.3;
  const hasNegativeCues = /\b(crash|broken|fail|worst|terrible|awful|late|delay|wrong|bug|glitch|freeze)\b/i.test(text);
  if (hasPositiveWords && hasNegativeCues) return true;

  const hasPositiveEmoji = emojis.some((e) => {
    const m = EMOJI_MAP[e];
    return m && m.sentiment === 'positive';
  });
  if (hasPositiveEmoji && hasNegativeCues) return true;

  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount >= 2 && scores.compound < -0.3) return false;
  if (exclamationCount >= 2 && /\b(oh|wow|great|fantastic|love)\b/i.test(text) && scores.compound < 0) return true;

  return false;
}

function detectTopic(tokens: string[]): string | null {
  const topicScores: Record<string, number> = {};
  for (const token of tokens) {
    for (const [topic, words] of Object.entries(TOPIC_KEYWORDS)) {
      if (words.has(token)) {
        topicScores[topic] = (topicScores[topic] || 0) + 1;
      }
    }
  }
  const sorted = Object.entries(topicScores).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 && sorted[0][1] > 0 ? sorted[0][0] : null;
}

function detectIntent(text: string, emojis: string[]): IntentLabel {
  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) return intent;
    }
  }

  if (emojis.some((e) => e === '👍' || e === '👌' || e === '👏' || e === '💯')) return 'praise';
  if (emojis.some((e) => e === '👎' || e === '💩' || e === '🚩')) return 'complaint';
  if (emojis.some((e) => e === '🤔')) return 'question';
  if (emojis.some((e) => e === '⚠️' || e === '🚨')) return 'concern';

  return 'general';
}

function calculateRiskLevel(
  emotion: EmotionLabel,
  sentiment: SentimentLabel,
  isSarcastic: boolean,
  scores: VaderScores,
  emojis: string[],
): RiskLevel {
  const highRiskEmotions: EmotionLabel[] = ['anger', 'frustration', 'disappointment'];
  const mediumRiskEmotions: EmotionLabel[] = ['sadness', 'anxiety', 'fear'];

  if (highRiskEmotions.includes(emotion) && scores.compound < -0.3) return 'high';
  if (sentiment === 'negative' && scores.compound < -0.5) return 'high';

  const hasHighRiskEmoji = emojis.some((e) => {
    const m = EMOJI_MAP[e];
    return m && (m.emotion === 'anger' || m.emotion === 'frustration' || m.emotion === 'disappointment');
  });
  if (hasHighRiskEmoji && scores.compound < -0.2) return 'high';
  if (hasHighRiskEmoji) return 'medium';

  const hasUrgentEmoji = emojis.some((e) => e === '🚨' || e === '⚠️' || e === '❌' || e === '⛔');
  if (hasUrgentEmoji) return 'high';

  if (mediumRiskEmotions.includes(emotion) && scores.compound < -0.2) return 'medium';
  if (sentiment === 'negative' || (isSarcastic && scores.compound < 0)) return 'medium';
  return 'low';
}

function generateExplanation(
  text: string,
  sentiment: SentimentLabel,
  emotion: EmotionLabel,
  secondaryEmotion: EmotionLabel | null,
  confidence: number,
  topic: string | null,
  intent: IntentLabel,
  isSarcastic: boolean,
  emojis: string[],
  emojiMeanings: string[],
): string {
  const confPct = Math.round(confidence * 100);
  const parts: string[] = [];

  const emotionDesc: Record<EmotionLabel, string> = {
    joy: 'joy', happiness: 'happiness', excitement: 'excitement',
    love: 'love', trust: 'trust', anger: 'anger',
    frustration: 'frustration', fear: 'fear', sadness: 'sadness',
    anxiety: 'anxiety', surprise: 'surprise', disappointment: 'disappointment',
    neutral: 'neutrality',
  };

  if (sentiment === 'mixed') {
    parts.push('The user expresses both positive and negative feelings, creating a mixed sentiment.');
  } else if (sentiment === 'positive') {
    parts.push(`The user expresses a positive sentiment, primarily driven by ${emotionDesc[emotion]}.`);
  } else if (sentiment === 'negative') {
    parts.push(`The user expresses a negative sentiment, primarily driven by ${emotionDesc[emotion]}.`);
  } else {
    parts.push('The user expresses a largely neutral sentiment with no strong emotional leaning.');
  }

  if (secondaryEmotion && secondaryEmotion !== 'neutral') {
    parts.push(`A secondary emotion of ${emotionDesc[secondaryEmotion]} is also present.`);
  }

  if (emojis.length > 0 && emojiMeanings.length > 0) {
    parts.push(`The post contains ${emojis.length} emoji${emojis.length !== 1 ? 's' : ''} (${emojiMeanings.join(', ')}), which reinforce the detected emotional tone.`);
  }

  if (topic) {
    parts.push(`The main topic appears to be ${topic.toLowerCase()}.`);
  }

  const intentDesc: Record<IntentLabel, string> = {
    praise: 'praising a product or experience',
    complaint: 'lodging a complaint',
    concern: 'raising a concern',
    recommendation: 'making a recommendation',
    question: 'asking a question',
    general: 'sharing a general opinion',
  };
  parts.push(`The user appears to be ${intentDesc[intent]}.`);

  if (isSarcastic) {
    parts.push('Sarcasm was detected — the surface-level positivity may mask underlying dissatisfaction.');
  }

  parts.push(`Confidence in this analysis is ${confPct}%.`);

  return parts.join(' ');
}

function generateSuggestedResponse(
  sentiment: SentimentLabel,
  emotion: EmotionLabel,
  intent: IntentLabel,
  riskLevel: RiskLevel,
  isSarcastic: boolean,
): string {
  if (riskLevel === 'high' || emotion === 'anger' || emotion === 'frustration' || emotion === 'disappointment') {
    if (intent === 'complaint') {
      return "We sincerely apologize for your experience. This is not the standard we hold ourselves to. Please send us a direct message with your account details so we can resolve this immediately and make it right.";
    }
    return "We're truly sorry to hear about your experience. Your feedback is important to us — please reach out directly so we can address this issue personally and ensure it doesn't happen again.";
  }

  if (sentiment === 'mixed') {
    return "Thank you for your balanced feedback. We're glad you appreciate the positive aspects, and we hear your concerns. We're actively working on the issues you mentioned and appreciate your patience as we improve.";
  }

  if (sentiment === 'positive' || intent === 'praise') {
    return "Thank you so much for your kind words! We're thrilled that you're enjoying the experience. Your support means the world to our team, and we'll keep working hard to deliver great results.";
  }

  if (intent === 'question') {
    return "Great question! We'd be happy to help. Please check our help center or send us a direct message with more details, and our team will get back to you with a thorough answer as soon as possible.";
  }

  if (intent === 'recommendation') {
    return "Thank you for the recommendation! We love hearing what works well for our users. We'll definitely take your feedback into account as we continue to improve.";
  }

  if (intent === 'concern') {
    return "We understand your concern and want to assure you that we take this seriously. We're actively looking into the matter and will share updates as soon as we have more information.";
  }

  if (isSarcastic) {
    return "We hear you, and we understand the frustration behind the humor. We're committed to fixing the underlying issues and would love to hear more specifics so we can improve.";
  }

  return "Thank you for sharing your thoughts with us! We value your feedback and are always looking for ways to improve. Feel free to reach out anytime.";
}

interface VaderScores {
  neg: number;
  neu: number;
  pos: number;
  compound: number;
}

export function analyzeSentiment(text: string): SentimentResult {
  const tokens = tokenize(text);
  const emojis = extractEmojis(text);

  if (tokens.length === 0 && emojis.length === 0) {
    return {
      sentiment: 'neutral', confidence: 0.5, emotion: 'neutral',
      secondaryEmotion: null, emotionalScore: 0, keywords: [],
      detectedEmojis: [], emojiMeanings: [],
      topic: null, intent: 'general', riskLevel: 'low', isSarcastic: false,
      aiExplanation: 'No text provided for analysis.',
      suggestedResponse: 'Thank you for reaching out!',
    };
  }

  const scores = vaderPolarityScores(text);
  const compound = scores.compound;
  const { primary: emotion, secondary: secondaryEmotion, scores: emotionScores } = detectEmotions(tokens, emojis, scores);
  const keywords = extractKeywords(tokens);
  const topic = detectTopic(tokens);
  const intent = detectIntent(text, emojis);
  const isSarcastic = detectSarcasm(text, scores, emojis);

  const emojiMeanings = emojis
    .map((e) => EMOJI_MAP[e]?.meaning)
    .filter((m): m is string => !!m);

  let sentiment: SentimentLabel;
  let confidence: number;

  const hasStrongPos = scores.pos > 0.2;
  const hasStrongNeg = scores.neg > 0.2;

  const emojiSentiments = emojis.map((e) => EMOJI_MAP[e]?.sentiment).filter(Boolean);
  const hasPositiveEmoji = emojiSentiments.includes('positive');
  const hasNegativeEmoji = emojiSentiments.includes('negative');

  if (hasStrongPos && hasStrongNeg) {
    sentiment = 'mixed';
    confidence = Math.min(0.99, Math.abs(compound) + 0.2);
  } else if (hasPositiveEmoji && hasNegativeEmoji) {
    sentiment = 'mixed';
    confidence = Math.min(0.99, Math.abs(compound) + 0.15);
  } else if (hasPositiveEmoji && hasNegativeEmoji && hasStrongPos && hasStrongNeg) {
    sentiment = 'mixed';
    confidence = Math.min(0.99, Math.abs(compound) + 0.25);
  } else if (compound >= 0.05 || (hasPositiveEmoji && compound >= 0)) {
    sentiment = 'positive';
    confidence = Math.min(0.99, Math.max(Math.abs(compound), hasPositiveEmoji ? 0.65 : 0));
  } else if (compound <= -0.05 || (hasNegativeEmoji && compound <= 0)) {
    sentiment = 'negative';
    confidence = Math.min(0.99, Math.max(Math.abs(compound), hasNegativeEmoji ? 0.65 : 0));
  } else {
    sentiment = 'neutral';
    confidence = Math.max(0.5, Math.min(0.99, 1 - Math.abs(compound)));
  }

  const totalEmotionHits = Object.values(emotionScores).reduce((a, b) => a + b, 0);
  const emotionalScore = tokens.length > 0 || emojis.length > 0
    ? Math.min(1, totalEmotionHits / Math.max(1, Math.floor((tokens.length + emojis.length) / 3)))
    : 0;

  const riskLevel = calculateRiskLevel(emotion, sentiment, isSarcastic, scores, emojis);

  const aiExplanation = generateExplanation(
    text, sentiment, emotion, secondaryEmotion, confidence, topic, intent, isSarcastic,
    emojis, emojiMeanings,
  );

  const suggestedResponse = generateSuggestedResponse(
    sentiment, emotion, intent, riskLevel, isSarcastic,
  );

  return {
    sentiment,
    confidence: Math.round(confidence * 100) / 100,
    emotion,
    secondaryEmotion,
    emotionalScore: Math.round(emotionalScore * 100) / 100,
    keywords,
    detectedEmojis: emojis,
    emojiMeanings,
    topic,
    intent,
    riskLevel,
    isSarcastic,
    aiExplanation,
    suggestedResponse,
  };
}
