export default function RoundDone({ message, reasons, aiLabel = null, onBack }) {
  return (
    <main className="screen">
      <h1>Round saved</h1>
      <div className="card">
        {aiLabel && <div className="ai-label">{aiLabel}</div>}
        <p>{message}</p>
      </div>
      {reasons.map((r, i) => (
        <p className="reason" key={i}>{r.text} <em>({r.source})</em></p>
      ))}
      <button type="button" className="btn primary" onClick={onBack}>Back to today</button>
    </main>
  );
}
