/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import RequestForm from './components/RequestForm';
import MapSection from './components/MapSection';
import ChatSystem from './components/ChatSystem';
import SafetyInstructions from './components/SafetyInstructions';
import WorkshopDashboard from './components/WorkshopDashboard';
import { useLanguage } from './LanguageContext';
import { useUser } from './UserContext';
import React from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';

import Profile from './components/Profile';
import LoginPage from './pages/Login';
import ErrorBoundary from './components/ErrorBoundary';
import RatingModal from './components/RatingModal';

import { useService } from './ServiceContext';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

function Home() {
  const { t } = useLanguage();
  const { role } = useUser();
  const { mission } = useService();
  const [notify, setNotify] = useState<string | null>(null);

  useEffect(() => {
    if (mission.id && mission.status !== 'idle' && mission.status !== 'searching') {
        setNotify(mission.status.toUpperCase());
        const timer = setTimeout(() => setNotify(null), 5000);
        return () => clearTimeout(timer);
    }
  }, [mission.status, mission.id]);

  // [KRITIS-5] Role redirect using Navigate
  if (role === 'workshop' || role === 'fuel-partner') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-12 animate-slide-up relative">
      <RatingModal />
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notify && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] glass-card px-6 py-3 border-garrison-blue/40 flex items-center gap-3 bg-black/80 backdrop-blur-xl shadow-[0_0_30px_rgba(0,242,255,0.2)]"
          >
            <Bell size={14} className="text-garrison-blue animate-bounce" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Update: {notify}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        <div className="lg:col-span-12 space-y-2 mb-8">
           <h1 className="text-4xl md:text-7xl font-black text-white leading-[0.8] tracking-tighter text-glow uppercase">
              {t.homeTitleLine1} <br/>
              <span className="text-garrison-blue italic">{t.homeTitleLine2}</span>
           </h1>
           <p className="text-zinc-500 font-medium text-sm md:text-md max-w-sm tracking-tight leading-relaxed">{t.homeSubtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7">
           <RequestForm />
        </div>
        <div className="lg:col-span-5 h-[400px] lg:h-full">
           <MapSection />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="glass-card p-8 flex flex-col justify-center gap-4 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-garrison-blue opacity-50" />
            <h3 className="font-black uppercase tracking-[0.3em] text-[10px] text-garrison-blue opacity-60">{t.heritageTitle}</h3>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed">{t.heritageText}</p>
            <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 font-black">{t.coverage}</div>
         </div>
         <a 
           href="tel:+628112345678" 
           className="glass-card p-8 bg-garrison-blue/5 border-garrison-blue/20 flex flex-col justify-center gap-4 group hover:bg-garrison-blue/10 transition-colors no-underline block"
         >
            <h3 className="font-black uppercase tracking-[0.3em] text-[10px] text-garrison-blue">{t.hotlineTitle}</h3>
            <p className="text-zinc-500 font-medium text-xs uppercase tracking-widest">{t.hotlineSub}</p>
            <div className="text-2xl font-black tracking-tighter text-glow text-white">+62 811 2345 678</div>
         </a>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <Layout>
          <Outlet />
        </Layout>
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'safety',
        element: (
          <ProtectedRoute allowedRoles={['driver']}>
            <SafetyInstructions />
          </ProtectedRoute>
        ),
      },
      {
        path: 'chat',
        element: (
          <ProtectedRoute>
            <ChatSystem />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute allowedRoles={['workshop', 'fuel-partner']}>
            <WorkshopDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}

