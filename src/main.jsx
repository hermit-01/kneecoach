import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import { helperSwitchParam, switchHelper } from './ai/helper.js';
import './styles.css';

// A link with ?helper=off (or ?helper=on) sets the helper for this phone before anything can load it.
const helperSwitch = helperSwitchParam(location.search);
if (helperSwitch) {
  switchHelper(helperSwitch === 'on');
  history.replaceState(null, '', location.pathname);
}

registerSW({ immediate: true });
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
