import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from '../features/Dashboard';
import './tailwind.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Dashboard />
  </StrictMode>
);
