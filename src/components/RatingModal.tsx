/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Star, CheckCircle2, X } from 'lucide-react';
import { useService } from '../ServiceContext';
import { useLanguage } from '../LanguageContext';
import { useUser } from '../UserContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function RatingModal() {
  const { mission, resetAll } = useService();
  const { role } = useUser();
  const { t } = useLanguage();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!mission.id || !mission.assignedWorkshopId) return;
    setIsSubmitting(true);
    try {
      // 1. Update Mission
      await updateDoc(doc(db, 'missions', mission.id), {
        rating,
        reviewComment: comment,
        status: 'completed',
        completedAt: serverTimestamp()
      });

      // 2. Update Workshop Rating
      const wsRef = doc(db, 'users', mission.assignedWorkshopId);
      const wsSnap = await getDoc(wsRef);
      if (wsSnap.exists()) {
        const data = wsSnap.data();
        const oldCount = data.ratingCount || 0;
        const oldRating = data.rating || 0;
        const newCount = oldCount + 1;
        const newRating = (oldRating * oldCount + rating) / newCount;
        
        await updateDoc(wsRef, {
          rating: newRating,
          ratingCount: newCount
        });
      }

      setIsSubmitted(true);
      setTimeout(() => {
        resetAll();
      }, 2000);
    } catch (e) {
      console.error("Failed to submit rating", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show only if status is arrived (before reset)
  // ONLY for DRIVERS rating the Workshop
  if (mission.status !== 'arrived' || role !== 'driver') return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card max-w-sm w-full p-8 text-center space-y-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-garrison-blue animate-pulse" />
        
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div 
              key="rating-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">Mission Success</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-black">Finalize Service Protocol</p>
              </div>

              <div className="flex justify-center gap-3 py-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform active:scale-125"
                  >
                    <Star 
                      size={32} 
                      className={cn(
                        "transition-all duration-300",
                        star <= rating ? "text-garrison-blue fill-garrison-blue drop-shadow-[0_0_10px_rgba(0,242,255,0.5)]" : "text-zinc-800"
                      )} 
                    />
                  </button>
                ))}
              </div>

              <p className="text-xs text-zinc-400 font-medium">How was your interaction with the mechanic?</p>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t.reviewPlaceholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-garrison-blue transition-colors min-h-[80px]"
              />

              <button
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="garrison-btn-primary w-full py-4 text-xs tracking-widest font-black uppercase flex items-center justify-center gap-3"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Rate & Finish'}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="success-msg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-12 space-y-6"
            >
              <div className="w-16 h-16 bg-garrison-blue/20 rounded-full flex items-center justify-center mx-auto border border-garrison-blue/30">
                <CheckCircle2 size={32} className="text-garrison-blue" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase">Protocol Finalized</h3>
                <p className="text-xs text-zinc-500">Thank you for using Garrison. Drive safe.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
