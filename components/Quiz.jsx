'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function Quiz() {
  const [questions, setQuestions] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [round, setRound] = useState([]);
  const [index, setIndex] = useState(0);
  const [state, setState] = useState({});
  const [finished, setFinished] = useState(false);
  const [isRetryRound, setIsRetryRound] = useState(false);

  const startedAt = useRef(Date.now());
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let alive = true;
    fetch('/api/questions')
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const list = data.questions || [];
        if (list.length === 0) {
          setLoadError('No questions are available yet. Ask your class admin to add items.');
          setQuestions([]);
          return;
        }
        setQuestions(list);
        setRound(list.map((q) => q.id));
        startedAt.current = Date.now();
      })
      .catch(() => {
        if (!alive) return;
        setLoadError('Could not load questions. Please refresh the page.');
        setQuestions([]);
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('tsm2a_name');
    if (saved) setName(saved);
  }, []);

  const byId = useMemo(() => {
    const map = new Map();
    (questions || []).forEach((q) => map.set(q.id, q));
    return map;
  }, [questions]);

  const currentQuestion = byId.get(round[index]);
  const currentState = currentQuestion ? state[currentQuestion.id] : undefined;

  const score = round.filter((id) => state[id]?.firstTry === true).length;
  const answered = round.filter((id) => state[id]).length;
  const progress = round.length ? Math.round(((index + (currentState?.solved ? 1 : 0)) / round.length) * 100) : 0;

  function choose(choice) {
    const q = currentQuestion;
    if (!q) return;
    const existing = state[q.id];
    if (existing?.locked) return;

    const correct = choice === q.answerIndex;
    setState((prev) => ({
      ...prev,
      [q.id]: {
        firstTry: prev[q.id]?.firstTry !== undefined ? prev[q.id].firstTry : correct,
        solved: correct,
        locked: true,
        choice,
      },
    }));
  }

  function handleNext() {
    if (!currentQuestion) return;
    const s = state[currentQuestion.id];
    if (!s) return;

    if (!s.solved) {
      // Unlock the same question and stay on it.
      setState((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          firstTry: prev[currentQuestion.id]?.firstTry,
          solved: false,
          locked: false,
          choice: undefined,
        },
      }));
      return;
    }

    if (index < round.length - 1) {
      setIndex(index + 1);
    } else {
      setFinished(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function startRound(ids, retry) {
    setState((prev) => {
      const next = { ...prev };
      ids.forEach((id) => delete next[id]);
      return next;
    });
    setRound(ids);
    setIndex(0);
    setFinished(false);
    setIsRetryRound(Boolean(retry));
    setSubmitted(null);
    setSubmitError('');
    startedAt.current = Date.now();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function retakeAll() {
    if (!questions?.length) return;
    startRound(questions.map((q) => q.id), false);
  }

  function retryMissed() {
    const missed = round.filter((id) => state[id]?.firstTry === false);
    if (missed.length === 0) return;
    startRound(missed, true);
  }

  async function submitScore(e) {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    const durationSeconds = Math.round((Date.now() - startedAt.current) / 1000);

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score, total: round.length, durationSeconds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Could not submit your score.');
      } else {
        localStorage.setItem('tsm2a_name', name.trim());
        setSubmitted(data);
      }
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------------------------- render ------------------------------- */

  if (questions === null) {
    return <section className="card"><p className="note">Loading questions…</p></section>;
  }

  if (loadError) {
    return (
      <section className="card">
        <div className="error">{loadError}</div>
        <Link href="/" className="btn btn-ghost">Back to hub</Link>
      </section>
    );
  }

  if (finished) {
    const total = round.length;
    const pct = total ? Math.round((score / total) * 100) : 0;
    const missed = round.filter((id) => state[id]?.firstTry === false);
    const message =
      pct >= 90
        ? 'Excellent work! You answered at least 90% correctly on your first try.'
        : pct >= 75
        ? 'Good job! You have a solid start — review the items you retried.'
        : pct >= 60
        ? 'You are making progress. Revisit the reviewer and study the explanations below.'
        : 'Keep going — this is what practice is for. Review the explanations and retake the quiz.';

    return (
      <section className="card">
        <div className="result">
          <div className="result-icon">✓</div>
          <div className="eyebrow" style={{ color: '#52768b' }}>
            {isRetryRound ? 'Retry round complete' : 'Practice completed'}
          </div>
          <h2>Your result</h2>
          <div className="bigscore">{score}/{total}</div>
          <div className="subscore">
            {pct}% first-try accuracy · {total} items solved
          </div>
          <p className="resultmsg">{message}</p>

          {!isRetryRound && !submitted && (
            <form onSubmit={submitScore} style={{ maxWidth: 360, margin: '0 auto 10px' }}>
              {submitError && <div className="error">{submitError}</div>}
              <div className="field" style={{ textAlign: 'left' }}>
                <label htmlFor="player-name">Your name for the leaderboard</label>
                <input
                  id="player-name"
                  className="input"
                  value={name}
                  maxLength={24}
                  placeholder="e.g. Juan D."
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit to leaderboard'}
              </button>
            </form>
          )}

          {submitted && (
            <div className="success" style={{ maxWidth: 420, margin: '0 auto 14px' }}>
              Score posted! You are currently rank #{submitted.rank} on the class leaderboard.
            </div>
          )}

          <div className="result-actions" style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', margin: '16px 0' }}>
            {missed.length > 0 && (
              <button className="btn btn-primary" onClick={retryMissed}>
                Retry {missed.length} missed item{missed.length === 1 ? '' : 's'}
              </button>
            )}
            <button className="btn btn-ghost" onClick={retakeAll}>Retake all {questions.length}</button>
            <Link href="/leaderboard" className="btn btn-ghost">Leaderboard</Link>
          </div>
        </div>

        <div className="review">
          <h3>
            {missed.length
              ? `Review the ${missed.length} item${missed.length === 1 ? '' : 's'} you needed to retry`
              : 'Perfect first try — all answers correct!'}
          </h3>
          {missed.map((id, i) => {
            const q = byId.get(id);
            if (!q) return null;
            return (
              <div className="review-item" key={id}>
                <div className="rq">{i + 1}. {q.question}</div>
                <div className="ra"><span className="tag-wrong">Your first try:</span> Incorrect</div>
                <div className="ra"><span className="tag-right">Correct answer:</span> {q.options[q.answerIndex]}</div>
                <div className="ra" style={{ marginTop: 5 }}>{q.explanation}</div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (!currentQuestion) {
    return <section className="card"><p className="note">Preparing your round…</p></section>;
  }

  const isCorrect = currentState?.choice === currentQuestion.answerIndex;

  return (
    <>
      <div className="toprow">
        <div className="counter">Question {index + 1} of {round.length}</div>
        <div className="score-mini">First-try correct: {score}</div>
      </div>
      <div className="progress"><div className="bar" style={{ width: `${progress}%` }} /></div>

      <section className="card">
        <div className="meta">
          <span className="topic">{currentQuestion.topic}</span>
          <span className="qnum">ITEM {String(index + 1).padStart(3, '0')}</span>
        </div>

        <h2 className="question">{currentQuestion.question}</h2>

        <div className="options">
          {currentQuestion.options.map((opt, i) => {
            let cls = 'option';
            if (currentState?.locked) {
              if (i === currentQuestion.answerIndex) cls += ' correct';
              else if (i === currentState.choice) cls += ' wrong';
            }
            return (
              <button
                key={i}
                type="button"
                className={cls}
                disabled={Boolean(currentState?.locked)}
                onClick={() => choose(i)}
              >
                <span className="letter">{LETTERS[i]}</span>
                <span className="label">{opt}</span>
              </button>
            );
          })}
        </div>

        {currentState?.locked && (
          <div className={`feedback show ${isCorrect ? 'good' : 'bad'}`}>
            <div className="feedback-title">
              {isCorrect ? '✓ Correct!' : '✕ Not quite — you can try this same question again.'}
            </div>
            <div className="answerline">
              Correct answer: {LETTERS[currentQuestion.answerIndex]}.{' '}
              {currentQuestion.options[currentQuestion.answerIndex]}
            </div>
            <p>{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="actions">
          <span className="muted-note">
            {currentState?.locked
              ? isCorrect ? 'Good work. Continue when ready.' : 'Read the explanation, then retry this item.'
              : 'Choose the best answer.'}
          </span>
          <button className="btn btn-primary" onClick={handleNext} disabled={!currentState?.locked}>
            {!currentState?.locked
              ? 'Choose an answer'
              : !currentState.solved
              ? 'Try this question again ↻'
              : index === round.length - 1
              ? 'See my results'
              : 'Next question →'}
          </button>
        </div>

        <div className="note" style={{ marginTop: 12 }}>
          {answered} of {round.length} items attempted
        </div>
      </section>
    </>
  );
}
