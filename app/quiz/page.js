function QuizCard({ quiz, isPractice }) {
  const isExam = quiz.type === 'Mock Examination';
  const [copied, setCopied] = React.useState(false);

  let borderColor = 'var(--blue)';
  let tagBg = 'var(--sky)';
  let tagColor = 'var(--blue)';
  let icon = '📝';

  if (isExam) {
    borderColor = 'var(--red)';
    tagBg = 'var(--redbg)';
    tagColor = 'var(--red)';
    icon = '🎓';
  } else if (isPractice) {
    borderColor = 'var(--green)';
    tagBg = 'var(--greenbg)';
    tagColor = 'var(--green)';
    icon = '💡';
  }

  // Build the shareable URL
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/quiz/${quiz.examId}`
    : `/quiz/${quiz.examId}`;

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Could not copy. Please copy manually: ' + shareUrl);
    }
  };

  return (
    <div style={{ 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      padding: '12px', 
      border: '1px solid var(--line)', borderRadius: 10,
      borderLeft: `4px solid ${borderColor}`,
      background: 'var(--paper)',
      gap: 12,
    }}>
      <Link href={`/quiz/${quiz.examId}`} style={{ 
        flex: 1, textDecoration: 'none', color: 'inherit',
      }}>
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <span className="tag" style={{ background: tagBg, color: tagColor }}>
              {icon} {quiz.type}
            </span>
            <span className="note" style={{ fontWeight: 700 }}>{quiz.topic}</span>
          </div>
          
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--navy)' }}>{quiz.title}</h3>
          
          {quiz.date && (
            <div className="note" style={{ marginTop: 4, fontWeight: 600 }}>
              🕒 {new Date(quiz.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
          )}
        </div>
      </Link>

      <div style={{ textAlign: 'right', minWidth: 60, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy)' }}>{quiz.count}</div>
          <div className="note" style={{ fontSize: '.75rem', textTransform: 'uppercase' }}>Items</div>
        </div>
        <button 
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy link'}
          style={{
            background: copied ? 'var(--greenbg)' : 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            color: copied ? 'var(--green)' : 'var(--muted)',
          }}
        >
          {copied ? '✓' : '🔗'}
        </button>
      </div>
    </div>
  );
}
