import vaderLexiconRaw from '@/lib/vader_lexicon.txt?raw';

// VADER Sentiment Analysis - TypeScript port
// Based on: Hutto, C.J. & Gilbert, E.E. (2014). VADER: A Parsimonious Rule-based
// Model for Sentiment Analysis of Social Media Text. ICWSM-14.

const B_INCR = 0.293;
const B_DECR = -0.293;
const C_INCR = 0.733;
const N_SCALAR = -0.74;

const NEGATE_SET = new Set([
  'aint', 'arent', 'cannot', 'cant', 'couldnt', 'darent', 'didnt', 'doesnt',
  "ain't", "aren't", "can't", "couldn't", "daren't", "didn't", "doesn't",
  'dont', 'hadnt', 'hasnt', 'havent', 'isnt', 'mightnt', 'mustnt', 'neither',
  "don't", "hadn't", "hasn't", "haven't", "isn't", "mightn't", "mustn't",
  'neednt', "needn't", 'never', 'none', 'nope', 'nor', 'not', 'nothing', 'nowhere',
  'oughtnt', 'shant', 'shouldnt', 'uhuh', 'wasnt', 'werent',
  "oughtn't", "shan't", "shouldn't", 'uh-uh', "wasn't", "weren't",
  'without', 'wont', 'wouldnt', "won't", "wouldn't", 'rarely', 'seldom', 'despite',
]);

const BOOSTER_DICT: Record<string, number> = {
  absolutely: B_INCR, amazingly: B_INCR, awfully: B_INCR,
  completely: B_INCR, considerable: B_INCR, considerably: B_INCR,
  decidedly: B_INCR, deeply: B_INCR, effing: B_INCR, enormous: B_INCR, enormously: B_INCR,
  entirely: B_INCR, especially: B_INCR, exceptional: B_INCR, exceptionally: B_INCR,
  extreme: B_INCR, extremely: B_INCR,
  fabulously: B_INCR, flipping: B_INCR, flippin: B_INCR, frackin: B_INCR, fracking: B_INCR,
  fricking: B_INCR, frickin: B_INCR, frigging: B_INCR, friggin: B_INCR, fully: B_INCR,
  fuckin: B_INCR, fucking: B_INCR, fuggin: B_INCR, fugging: B_INCR,
  greatly: B_INCR, hella: B_INCR, highly: B_INCR, hugely: B_INCR,
  incredible: B_INCR, incredibly: B_INCR, intensely: B_INCR,
  major: B_INCR, majorly: B_INCR, more: B_INCR, most: B_INCR, particularly: B_INCR,
  purely: B_INCR, quite: B_INCR, really: B_INCR, remarkably: B_INCR,
  so: B_INCR, substantially: B_INCR,
  thoroughly: B_INCR, total: B_INCR, totally: B_INCR, tremendous: B_INCR, tremendously: B_INCR,
  uber: B_INCR, unbelievably: B_INCR, unusually: B_INCR, utter: B_INCR, utterly: B_INCR,
  very: B_INCR,
  almost: B_DECR, barely: B_DECR, hardly: B_DECR, 'just enough': B_DECR,
  'kind of': B_DECR, kinda: B_DECR, kindof: B_DECR, 'kind-of': B_DECR,
  less: B_DECR, little: B_DECR, marginal: B_DECR, marginally: B_DECR,
  occasional: B_DECR, occasionally: B_DECR, partly: B_DECR,
  scarce: B_DECR, scarcely: B_DECR, slight: B_DECR, slightly: B_DECR, somewhat: B_DECR,
  'sort of': B_DECR, sorta: B_DECR, sortof: B_DECR, 'sort-of': B_DECR,
};

const SPECIAL_CASES: Record<string, number> = {
  'the shit': 3, 'the bomb': 3, 'bad ass': 1.5, badass: 1.5, 'bus stop': 0.0,
  'yeah right': -2, 'kiss of death': -1.5, 'to die for': 3,
  'beating heart': 3.1, 'broken heart': -2.9,
};

const PUNCTUATION = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

function parseLexicon(raw: string): Map<string, number> {
  const lex = new Map<string, number>();
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length < 2) continue;
    const word = parts[0];
    const score = parseFloat(parts[1]);
    if (!isNaN(score)) lex.set(word, score);
  }
  return lex;
}

const LEXICON = parseLexicon(vaderLexiconRaw);

function isNegated(words: string[]): boolean {
  for (const w of words) {
    if (NEGATE_SET.has(w.toLowerCase())) return true;
    if (w.toLowerCase().includes("n't")) return true;
  }
  return false;
}

function normalize(score: number, alpha = 15): number {
  const norm = score / Math.sqrt(score * score + alpha);
  if (norm < -1) return -1;
  if (norm > 1) return 1;
  return norm;
}

function allcapDifferential(words: string[]): boolean {
  let allcapCount = 0;
  for (const w of words) {
    if (w === w.toUpperCase() && w.length > 1) allcapCount++;
  }
  const capDiff = words.length - allcapCount;
  return capDiff > 0 && capDiff < words.length;
}

function stripPuncIfWord(token: string): string {
  const stripped = token.replace(new RegExp(`^[${PUNCTUATION}]+|[${PUNCTUATION}]+$`, 'g'), '');
  if (stripped.length <= 2) return token;
  return stripped;
}

function scalarIncDec(word: string, valence: number, isCapDiff: boolean): number {
  let scalar = 0;
  const wordLower = word.toLowerCase();
  if (wordLower in BOOSTER_DICT) {
    scalar = BOOSTER_DICT[wordLower];
    if (valence < 0) scalar *= -1;
    if (word === word.toUpperCase() && isCapDiff && word.length > 1) {
      if (valence > 0) scalar += C_INCR;
      else scalar -= C_INCR;
    }
  }
  return scalar;
}

function negationCheck(
  valence: number,
  wordsLower: string[],
  startI: number,
  i: number
): number {
  if (startI === 0) {
    if (isNegated([wordsLower[i - 1]])) valence *= N_SCALAR;
  }
  if (startI === 1) {
    if (wordsLower[i - 2] === 'never' && (wordsLower[i - 1] === 'so' || wordsLower[i - 1] === 'this')) {
      valence *= 1.25;
    } else if (wordsLower[i - 2] === 'without' && wordsLower[i - 1] === 'doubt') {
      // keep valence
    } else if (isNegated([wordsLower[i - 2]])) {
      valence *= N_SCALAR;
    }
  }
  if (startI === 2) {
    if (wordsLower[i - 3] === 'never' &&
        (wordsLower[i - 2] === 'so' || wordsLower[i - 2] === 'this' ||
         wordsLower[i - 1] === 'so' || wordsLower[i - 1] === 'this')) {
      valence *= 1.25;
    } else if (wordsLower[i - 3] === 'without' &&
        (wordsLower[i - 2] === 'doubt' || wordsLower[i - 1] === 'doubt')) {
      // keep valence
    } else if (isNegated([wordsLower[i - 3]])) {
      valence *= N_SCALAR;
    }
  }
  return valence;
}

function specialIdiomsCheck(
  valence: number,
  wordsLower: string[],
  i: number
): number {
  const onezero = `${wordsLower[i - 1]} ${wordsLower[i]}`;
  const twoonezero = `${wordsLower[i - 2]} ${wordsLower[i - 1]} ${wordsLower[i]}`;
  const twoone = `${wordsLower[i - 2]} ${wordsLower[i - 1]}`;
  const threetwoone = `${wordsLower[i - 3]} ${wordsLower[i - 2]} ${wordsLower[i - 1]}`;
  const threetwo = `${wordsLower[i - 3]} ${wordsLower[i - 2]}`;

  const sequences = [onezero, twoonezero, twoone, threetwoone, threetwo];
  for (const seq of sequences) {
    if (seq in SPECIAL_CASES) {
      valence = SPECIAL_CASES[seq];
      break;
    }
  }

  if (wordsLower.length - 1 > i) {
    const zeroone = `${wordsLower[i]} ${wordsLower[i + 1]}`;
    if (zeroone in SPECIAL_CASES) valence = SPECIAL_CASES[zeroone];
  }
  if (wordsLower.length - 1 > i + 1) {
    const zeroonetwo = `${wordsLower[i]} ${wordsLower[i + 1]} ${wordsLower[i + 2]}`;
    if (zeroonetwo in SPECIAL_CASES) valence = SPECIAL_CASES[zeroonetwo];
  }

  const nGrams = [threetwoone, threetwo, twoone];
  for (const ng of nGrams) {
    if (ng in BOOSTER_DICT) valence += BOOSTER_DICT[ng];
  }
  return valence;
}

function leastCheck(valence: number, wordsLower: string[], i: number): number {
  if (i > 1 && !LEXICON.has(wordsLower[i - 1]) && wordsLower[i - 1] === 'least') {
    if (wordsLower[i - 2] !== 'at' && wordsLower[i - 2] !== 'very') {
      valence *= N_SCALAR;
    }
  } else if (i > 0 && !LEXICON.has(wordsLower[i - 1]) && wordsLower[i - 1] === 'least') {
    valence *= N_SCALAR;
  }
  return valence;
}

function butCheck(wordsLower: string[], sentiments: number[]): number[] {
  if (wordsLower.includes('but')) {
    const bi = wordsLower.indexOf('but');
    for (let si = 0; si < sentiments.length; si++) {
      if (si < bi) sentiments[si] *= 0.5;
      else if (si > bi) sentiments[si] *= 1.5;
    }
  }
  return sentiments;
}

function amplifyEp(text: string): number {
  let epCount = (text.match(/!/g) || []).length;
  if (epCount > 4) epCount = 4;
  return epCount * 0.292;
}

function amplifyQm(text: string): number {
  const qmCount = (text.match(/\?/g) || []).length;
  if (qmCount > 1) {
    if (qmCount <= 3) return qmCount * 0.18;
    return 0.96;
  }
  return 0;
}

function siftSentimentScores(sentiments: number[]): [number, number, number] {
  let posSum = 0, negSum = 0, neuCount = 0;
  for (const s of sentiments) {
    if (s > 0) posSum += s + 1;
    else if (s < 0) negSum += s - 1;
    else neuCount++;
  }
  return [posSum, negSum, neuCount];
}

export interface VaderScores {
  neg: number;
  neu: number;
  pos: number;
  compound: number;
}

export function vaderPolarityScores(text: string): VaderScores {
  const wordsAndEmoticons = text.split(/\s+/).filter(Boolean).map(stripPuncIfWord);
  const isCapDiff = allcapDifferential(wordsAndEmoticons);
  const wordsLower = wordsAndEmoticons.map((w) => w.toLowerCase());

  const sentiments: number[] = [];

  for (let i = 0; i < wordsAndEmoticons.length; i++) {
    let valence = 0;
    const item = wordsAndEmoticons[i];
    const itemLower = wordsLower[i];

    if (itemLower in BOOSTER_DICT) {
      sentiments.push(0);
      continue;
    }
    if (i < wordsAndEmoticons.length - 1 && itemLower === 'kind' && wordsLower[i + 1] === 'of') {
      sentiments.push(0);
      continue;
    }

    if (itemLower in LEXICON) {
      valence = LEXICON.get(itemLower)!;

      // "no" as negation vs standalone
      if (itemLower === 'no' && i !== wordsAndEmoticons.length - 1 && LEXICON.has(wordsLower[i + 1])) {
        valence = 0;
      }
      if (
        (i > 0 && wordsLower[i - 1] === 'no') ||
        (i > 1 && wordsLower[i - 2] === 'no') ||
        (i > 2 && wordsLower[i - 3] === 'no' && (wordsLower[i - 1] === 'or' || wordsLower[i - 1] === 'nor'))
      ) {
        valence = LEXICON.get(itemLower)! * N_SCALAR;
      }

      // ALL CAPS emphasis
      if (item === item.toUpperCase() && isCapDiff && item.length > 1) {
        if (valence > 0) valence += C_INCR;
        else valence -= C_INCR;
      }

      for (let startI = 0; startI < 3; startI++) {
        if (i > startI && !LEXICON.has(wordsLower[i - (startI + 1)])) {
          let s = scalarIncDec(wordsAndEmoticons[i - (startI + 1)], valence, isCapDiff);
          if (startI === 1 && s !== 0) s *= 0.95;
          if (startI === 2 && s !== 0) s *= 0.9;
          valence += s;
          valence = negationCheck(valence, wordsLower, startI, i);
          if (startI === 2) {
            valence = specialIdiomsCheck(valence, wordsLower, i);
          }
        }
      }

      valence = leastCheck(valence, wordsLower, i);
    }

    sentiments.push(valence);
  }

  butCheck(wordsLower, sentiments);

  if (sentiments.length === 0) {
    return { neg: 0, neu: 0, pos: 0, compound: 0 };
  }

  let sumS = sentiments.reduce((a, b) => a + b, 0);
  const punctEmph = amplifyEp(text) + amplifyQm(text);

  if (sumS > 0) sumS += punctEmph;
  else if (sumS < 0) sumS -= punctEmph;

  const compound = normalize(sumS);

  let [posSum, negSum, neuCount] = siftSentimentScores(sentiments);

  if (posSum > Math.abs(negSum)) posSum += punctEmph;
  else if (posSum < Math.abs(negSum)) negSum -= punctEmph;

  const total = posSum + Math.abs(negSum) + neuCount;
  const pos = total > 0 ? Math.abs(posSum / total) : 0;
  const neg = total > 0 ? Math.abs(negSum / total) : 0;
  const neu = total > 0 ? Math.abs(neuCount / total) : 0;

  return {
    neg: Math.round(neg * 1000) / 1000,
    neu: Math.round(neu * 1000) / 1000,
    pos: Math.round(pos * 1000) / 1000,
    compound: Math.round(compound * 10000) / 10000,
  };
}
