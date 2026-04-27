/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Map, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative inline-block">
          <Map className="w-24 h-24 text-zinc-900 absolute -top-4 -left-4 animate-pulse opacity-20" />
          <h1 className="text-9xl font-black text-white/5 tracking-tighter">404</h1>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Out of Bounds</h2>
          <p className="text-zinc-500 text-sm font-medium">You have ventured into unmapped territory. Re-establish contact with the main sector.</p>
        </div>

        <Link 
          to="/" 
          className="inline-flex items-center gap-3 px-8 py-4 bg-garrison-blue text-white font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
        >
          <ArrowLeft className="w-3 h-3" />
          Return to HQ
        </Link>
      </div>
    </div>
  );
}
