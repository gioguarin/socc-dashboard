/**
 * Simple keyword-based sentiment analysis for news items.
 * No external API needed — uses pattern matching against
 * security/business domain keywords.
 */

const POSITIVE_PATTERNS = [
  /\blaunch(?:es|ed|ing)?\b/i,
  /\bpartner(?:ship|ed|ing|s)?\b/i,
  /\bgrowth\b/i,
  /\bimprov(?:e|ed|es|ing|ement)\b/i,
  /\bsuccess(?:ful|fully)?\b/i,
  /\bupgrad(?:e|ed|es|ing)\b/i,
  /\benhance(?:d|s|ment|ments)?\b/i,
  /\binnovati(?:on|ve|ng)\b/i,
  /\bprotect(?:s|ed|ing|ion)?\b/i,
  /\bsecur(?:e|ed|es|ing|ity)\b/i,
  /\bexpand(?:s|ed|ing|sion)?\b/i,
  /\brecord revenue\b/i,
  /\bbeat(?:s|ing)? expectations\b/i,
  /\baward\b/i,
  /\brecogniz(?:e|ed|tion)\b/i,
  /\bmilestone\b/i,
  /\bstronger?\b/i,
  /\bprofit(?:able|ability)?\b/i,
  /\bnew feature/i,
  /\bGA\b/,
  /\bgeneral availability\b/i,
];

const NEGATIVE_PATTERNS = [
  /\bbreach(?:es|ed)?\b/i,
  /\battack(?:s|ed|ing|er)?\b/i,
  /\bvulnerab(?:le|ility|ilities)\b/i,
  /\bexploit(?:s|ed|ing|ation)?\b/i,
  /\bhack(?:s|ed|ing|er)?\b/i,
  /\bmalware\b/i,
  /\bransomware\b/i,
  /\bincident\b/i,
  /\bcompromis(?:e|ed|ing)\b/i,
  /\bdata leak\b/i,
  /\btheft\b/i,
  /\bfraud(?:ulent)?\b/i,
  /\boutage\b/i,
  /\bdowntime\b/i,
  /\bdisrupt(?:ion|ed|s|ing)?\b/i,
  /\bclass action\b/i,
  /\blawsuit\b/i,
  /\bsecurities fraud\b/i,
  /\bdecline\b/i,
  /\bdrop(?:s|ped)?\b/i,
  /\bfail(?:ure|ed|s|ing)?\b/i,
  /\bcritical flaw\b/i,
  /\bzero.?day\b/i,
  /\bphishing\b/i,
  /\bbotnet\b/i,
  /\bbackdoor\b/i,
  /\bDDoS\b/i,
];

export type Sentiment = 'positive' | 'negative' | 'neutral';

/**
 * Analyze sentiment of text using keyword matching.
 * Returns positive/negative/neutral based on keyword density.
 */
export function analyzeSentiment(title: string, summary?: string): Sentiment {
  const text = `${title} ${summary || ''}`;

  let positiveScore = 0;
  let negativeScore = 0;

  for (const pattern of POSITIVE_PATTERNS) {
    if (pattern.test(text)) positiveScore++;
  }

  for (const pattern of NEGATIVE_PATTERNS) {
    if (pattern.test(text)) negativeScore++;
  }

  /* Need at least 1 match to classify; otherwise neutral */
  if (negativeScore > positiveScore && negativeScore >= 1) return 'negative';
  if (positiveScore > negativeScore && positiveScore >= 1) return 'positive';
  return 'neutral';
}

export const SENTIMENT_CONFIG = {
  positive: {
    label: 'Positive',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: '↑',
  },
  negative: {
    label: 'Negative',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: '↓',
  },
  neutral: {
    label: 'Neutral',
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    icon: '—',
  },
} as const;
