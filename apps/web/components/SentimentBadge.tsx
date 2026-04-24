type Sentiment = 'positive' | 'neutral' | 'negative';

const NEGATIVE_SIGNALS = ['angry', 'hate', 'terrible', 'awful', 'scam', 'refund', 'broken', 'where is', 'never again', '???', '!!'];
const POSITIVE_SIGNALS = ['love', 'amazing', 'great', 'awesome', 'perfect', '❤', '😍', '🔥', '💯', 'best'];

export function detectSentiment(message: string): Sentiment {
  const lower = message.toLowerCase();
  if (NEGATIVE_SIGNALS.some(s => lower.includes(s))) return 'negative';
  if (POSITIVE_SIGNALS.some(s => lower.includes(s))) return 'positive';
  return 'neutral';
}

const styles: Record<Sentiment, { bg: string; color: string; label: string }> = {
  positive: { bg: 'rgba(0, 214, 143, 0.12)', color: 'var(--success)', label: '+' },
  neutral: { bg: 'rgba(136, 136, 170, 0.12)', color: 'var(--text-secondary)', label: '?' },
  negative: { bg: 'rgba(255, 77, 109, 0.12)', color: 'var(--danger)', label: '−' },
};

export function SentimentBadge({ message }: { message: string }) {
  const sentiment = detectSentiment(message);
  const s = styles[sentiment];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 18,
      height: 18,
      borderRadius: '50%',
      fontSize: 11,
      fontWeight: 700,
      backgroundColor: s.bg,
      color: s.color,
      flexShrink: 0,
    }} title={sentiment}>
      {s.label}
    </span>
  );
}
