import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { wakeProductionServices } from './lib/wakeProductionServices.js';

wakeProductionServices();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
