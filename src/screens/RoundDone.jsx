export default function RoundDone({ message, reasons, onBack }) {
  return (
    <main className="screen">
      <h1>Round saved</h1>
      <div className="card">
        <p>{message}</p>
      </div>
      {reasons.map((r, i) => (
        <p className="reason" key={i}>{r.text} <em>({r.source})</em></p>
      ))}
      <button type="button" className="btn primary" onClick={onBack}>Back to today</button>
    </main>
  );
}
