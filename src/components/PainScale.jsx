// The NHS inform pain bands (spec §5.1), shown where she picks her number.
const BANDS = [
  { key: 'low', label: 'Minimal', from: 0, to: 3 },
  { key: 'mid', label: 'Acceptable', from: 4, to: 5 },
  { key: 'high', label: 'Too much', from: 6, to: 10 },
];

export default function PainScale({ value, onChange }) {
  return (
    <div className="pain-scale" role="radiogroup" aria-label="Pain from 0 to 10">
      {BANDS.map((band) => (
        <div key={band.key}>
          <span className="pain-band-label">
            {band.label} <span className="muted">{band.from}–{band.to}</span>
          </span>
          <div className="pain-row">
            {Array.from({ length: band.to - band.from + 1 }, (_, i) => band.from + i).map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={value === n}
                className={`pain ${band.key} ${value === n ? 'selected' : ''}`}
                onClick={() => onChange(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
