const band = (n) => (n <= 3 ? 'green' : n <= 5 ? 'amber' : 'red');

export default function PainScale({ value, onChange }) {
  return (
    <div className="pain-grid" role="radiogroup" aria-label="Pain from 0 to 10">
      {Array.from({ length: 11 }, (_, n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          className={`pain ${band(n)} ${value === n ? 'selected' : ''}`}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
