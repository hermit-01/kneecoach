import { useHelper } from '../ai/useHelper.js';
import { prepareHelper, clearCrashFlag } from '../ai/helper.js';

// Plain words only: she never sees "model", "download size in bytes" or "GPU".
export default function HelperStatus({ db }) {
  const h = useHelper();
  const start = (options = {}) => prepareHelper({ db, startDownload: true, ...options });
  const percent = Math.round(h.progress * 100);
  switch (h.status) {
    case 'ready':
      return <p className="helper ok">Your helper is ready. It runs on this phone, even offline.</p>;
    case 'loading':
      return <p className="helper">Getting your helper ready…</p>;
    case 'downloading':
      return (
        <div className="helper">
          <p>Getting your helper: {percent}%. Your exercises work as normal meanwhile.</p>
          <progress max="1" value={h.progress} />
        </div>
      );
    case 'paused':
      return (
        <div className="helper">
          <p>Getting your helper paused at {percent}%. It will carry on from there.</p>
          <button type="button" className="btn" onClick={() => start()}>Carry on</button>
        </div>
      );
    case 'needs-wifi':
      return (
        <div className="helper">
          <p>Your helper is a one-time download of about 800 MB. Please connect to Wi-Fi first.</p>
          <button type="button" className="btn" onClick={() => start({ allowMobileData: true })}>Use mobile data anyway</button>
        </div>
      );
    case 'no-space':
      return <p className="helper">Your phone needs about 2.5 GB of free space for the helper. Your exercises work as normal without it.</p>;
    case 'crashed':
      // A fresh page is the only sure way to get a working graphics chip back.
      return (
        <div className="helper">
          <p>Your helper stopped working on this phone, so the app is running without it for now. Your exercises work as normal.</p>
          <button type="button" className="btn" onClick={() => { clearCrashFlag(); location.reload(); }}>Try again</button>
        </div>
      );
    case 'unavailable':
      return <p className="helper">Your helper isn't available on this phone yet. Your exercises work as normal.</p>;
    default:
      return (
        <div className="helper">
          <p>Get your exercise helper: a private assistant that runs on this phone. It's a one-time download of about 800 MB, so please use Wi-Fi.</p>
          <button type="button" className="btn primary" onClick={() => start()}>Get my helper</button>
        </div>
      );
  }
}
