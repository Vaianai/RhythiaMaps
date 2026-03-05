import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { ErrorBoundary } from './components/ErrorBoundary'

const rootElement = document.getElementById('root')!;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

requestAnimationFrame(() => {
  const boot = document.getElementById('boot');
  if (boot) {
    boot.remove();
  }
});
