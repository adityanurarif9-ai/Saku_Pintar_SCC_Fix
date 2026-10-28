import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './pwa';
import AuthGate from './AuthGate';
import Dashboard from './Dashboard';
import useRuntimeStatus from './useRuntimeStatus';

function App() {
  const runtime = useRuntimeStatus();
  return <AuthGate runtime={runtime}>{account => <Dashboard key={account.user.id} account={account} runtime={runtime}/>}</AuthGate>;
}
createRoot(document.getElementById('root')).render(<App/>);
