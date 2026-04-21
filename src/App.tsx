/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RequestForm from './components/RequestForm';
import MapSection from './components/MapSection';
import ChatSystem from './components/ChatSystem';
import SafetyInstructions from './components/SafetyInstructions';
import WorkshopDashboard from './components/WorkshopDashboard';
import { useLanguage } from './LanguageContext';
import { useUser } from './UserContext';
import React from 'react';

import Profile from './components/Profile';

function Home() {
  const { t } = useLanguage();
  const { role } = useUser();
  
  if (role === 'workshop') {
    return <WorkshopDashboard />;
  }

  return (
    <div className="space-y-12 animate-slide-up">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        <div className="lg:col-span-12 space-y-2 mb-8">
           <h1 className="text-4xl md:text-7xl font-black text-white leading-[0.8] tracking-tighter text-glow">
              {t.homeTitle.split(' ')[0]} <br/>
              <span className="text-garrison-blue italic">{t.homeTitle.split(' ')[1] || ''}</span>
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
         <div className="glass-card p-8 bg-garrison-blue/5 border-garrison-blue/20 flex flex-col justify-center gap-4 group">
            <h3 className="font-black uppercase tracking-[0.3em] text-[10px] text-garrison-blue">{t.hotlineTitle}</h3>
            <p className="text-zinc-500 font-medium text-xs uppercase tracking-widest">{t.hotlineSub}</p>
            <div className="text-2xl font-black tracking-tighter text-glow">+62 21 GARRISON</div>
         </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/safety" element={<SafetyInstructions />} />
          <Route path="/chat" element={<ChatSystem />} />
          <Route path="/dashboard" element={<WorkshopDashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </Router>
  );
}
