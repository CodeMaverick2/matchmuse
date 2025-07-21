import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Talents } from './pages/Talents';
import { Clients } from './pages/Clients';
import { Gigs } from './pages/Gigs';
import { Matchmaking } from './pages/Matchmaking';
import { AnalyticsPage } from './pages/Analytics';
import { ROUTES } from './utils/constants';
import ErrorBoundary from './components/ErrorBoundary';
import { DataInitializer } from './components/DataInitializer';

function App() {
  return (
    <ErrorBoundary>
      <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Initialize app data */}
        <DataInitializer />
        
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <Layout>
          <Routes>
            <Route path={ROUTES.HOME} element={<Home />} />
            <Route path={ROUTES.TALENTS} element={<Talents />} />
            <Route path={ROUTES.CLIENTS} element={<Clients />} />
            <Route path={ROUTES.GIGS} element={<Gigs />} />
            <Route path={ROUTES.MATCHMAKING} element={<Matchmaking />} />
            <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />
          </Routes>
        </Layout>
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#374151',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
            },
          }}
        />
      </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;