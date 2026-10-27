import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './pwa';
import AuthGate from './AuthGate';
import Dashboard from './Dashboard';

createRoot(document.getElementById('root')).render(<AuthGate>{account => <Dashboard key={account.user.id} account={account} />}</AuthGate>);
