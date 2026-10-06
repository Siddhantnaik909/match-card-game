/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ToastMessage } from '../hooks/useGameSocket';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
}

export const Toast: React.FC<ToastProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-50 flex flex-col gap-2 pointer-events-none max-w-sm sm:w-full">
      {toasts.map((t) => {
        let bg = 'bg-slate-900/95 border-slate-700 text-slate-100';
        let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;

        if (t.variant === 'success') {
          bg = 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        } else if (t.variant === 'warning') {
          bg = 'bg-amber-950/95 border-amber-500/50 text-amber-100';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
        } else if (t.variant === 'error') {
          bg = 'bg-rose-950/95 border-rose-500/50 text-rose-100';
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
        }

        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 pointer-events-auto ${bg}`}
          >
            {icon}
            <div className="text-sm font-medium leading-snug whitespace-pre-line">{t.message}</div>
          </div>
        );
      })}
    </div>
  );
};
