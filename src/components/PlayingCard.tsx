/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Laptop,
  Coffee,
  Sprout,
  ClipboardCheck,
  Headphones,
  Smartphone,
  PenTool,
  Mail,
  FolderKanban,
  BadgeCheck,
  Keyboard,
  Mouse,
  Monitor,
  BookOpen,
  Backpack,
  FileText,
  Paperclip,
  BarChart3,
  CupSoda,
  Lightbulb,
  Cookie,
  Clock,
  Armchair,
  Glasses,
  Trophy,
  Calculator,
  HardDrive,
  Wind,
  Printer,
  Calendar,
  Award,
  Mic,
  Briefcase,
  Bell,
  Sparkles,
  Check,
} from 'lucide-react';
import { getCardDef } from '../utils/cards';

interface PlayingCardProps {
  cardId: string;
  cardType: string;
  isSelected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  size?: 'normal' | 'large' | 'compact' | 'mini';
  isNew?: boolean;
  dealIndex?: number;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  cardType,
  isSelected = false,
  onSelect,
  disabled = false,
  size = 'normal',
  isNew = false,
  dealIndex = 0,
}) => {
  const def = getCardDef(cardType);

  const renderIcon = (className: string) => {
    switch (def.iconName) {
      case 'Laptop': return <Laptop className={className} />;
      case 'Coffee': return <Coffee className={className} />;
      case 'Sprout': return <Sprout className={className} />;
      case 'ClipboardCheck': return <ClipboardCheck className={className} />;
      case 'Headphones': return <Headphones className={className} />;
      case 'Smartphone': return <Smartphone className={className} />;
      case 'PenTool': return <PenTool className={className} />;
      case 'Mail': return <Mail className={className} />;
      case 'FolderKanban': return <FolderKanban className={className} />;
      case 'BadgeCheck': return <BadgeCheck className={className} />;
      case 'Keyboard': return <Keyboard className={className} />;
      case 'Mouse': return <Mouse className={className} />;
      case 'Monitor': return <Monitor className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Backpack': return <Backpack className={className} />;
      case 'FileText': return <FileText className={className} />;
      case 'Paperclip': return <Paperclip className={className} />;
      case 'BarChart3': return <BarChart3 className={className} />;
      case 'CupSoda': return <CupSoda className={className} />;
      case 'Lightbulb': return <Lightbulb className={className} />;
      case 'Cookie': return <Cookie className={className} />;
      case 'Clock': return <Clock className={className} />;
      case 'Armchair': return <Armchair className={className} />;
      case 'Glasses': return <Glasses className={className} />;
      case 'Trophy': return <Trophy className={className} />;
      case 'Calculator': return <Calculator className={className} />;
      case 'HardDrive': return <HardDrive className={className} />;
      case 'Wind': return <Wind className={className} />;
      case 'Printer': return <Printer className={className} />;
      case 'Calendar': return <Calendar className={className} />;
      case 'Award': return <Award className={className} />;
      case 'Mic': return <Mic className={className} />;
      case 'Briefcase': return <Briefcase className={className} />;
      case 'Bell': return <Bell className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  const isLarge = size === 'large';
  const isCompact = size === 'compact';
  const isMini = size === 'mini';

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      style={{
        animationDelay: `${dealIndex * 70}ms`,
      }}
      className={`relative group text-left select-none rounded-2xl border transition-all duration-300 transform outline-none ${
        isSelected
          ? '-translate-y-4 scale-[1.03] ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-950 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.45)] z-20'
          : 'border-slate-800 hover:border-slate-600 hover:-translate-y-2 hover:shadow-xl shadow-lg z-10'
      } ${
        disabled ? 'cursor-default' : 'cursor-pointer active:scale-95'
      } ${
        isNew && !isSelected ? 'ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.35)]' : ''
      } bg-gradient-to-b from-[#131b2e] via-[#0d1322] to-[#070b14] overflow-hidden flex flex-col justify-between ${
        isLarge
          ? 'w-full max-w-[240px] sm:w-64 h-72 sm:h-88 p-4 sm:p-5'
          : isMini
          ? 'w-20 sm:w-24 h-28 sm:h-32 p-1.5 sm:p-2'
          : isCompact
          ? 'w-full max-w-[150px] sm:w-40 h-44 sm:h-52 p-2.5 sm:p-3'
          : 'w-full max-w-[175px] sm:max-w-none sm:w-48 lg:w-52 h-52 sm:h-64 lg:h-72 p-3 sm:p-4'
      }`}
    >
      {/* Dynamic corner holographic lighting accent */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${def.bgGradient} opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none`}
      />

      {/* Cybernetic gridline watermark */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5">
          <span className={isMini ? 'text-base sm:text-lg' : 'text-lg sm:text-2xl'}>{def.emoji}</span>
          {!isMini && (
            <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">
              #4SET
            </span>
          )}
        </div>

        {isSelected && (
          <span className="flex items-center gap-1 bg-amber-400 text-slate-950 text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full shadow-lg shadow-amber-400/40">
            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" /> PASS
          </span>
        )}

        {isNew && !isSelected && (
          <span className="bg-emerald-400 text-slate-950 text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full shadow-md">
            NEW
          </span>
        )}
      </div>

      {/* Center Artwork & Icon Emblem */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
        <div
          className={`rounded-2xl bg-slate-900/90 border border-slate-700/60 shadow-inner group-hover:scale-105 transition-transform duration-300 ${
            def.textColor
          } ${
            isMini
              ? 'p-1.5'
              : isCompact
              ? 'p-2 sm:p-3'
              : isLarge
              ? 'p-4 sm:p-5'
              : 'p-2 sm:p-4'
          }`}
        >
          {renderIcon(
            isLarge
              ? 'w-10 h-10 sm:w-14 sm:h-14'
              : isMini
              ? 'w-5 h-5 sm:w-6 sm:h-6'
              : isCompact
              ? 'w-6 h-6 sm:w-8 sm:h-8'
              : 'w-7 h-7 sm:w-10 sm:h-10'
          )}
        </div>
        {!isMini && (
          <h4 className="mt-2 sm:mt-3 font-black text-slate-100 text-xs sm:text-base tracking-tight truncate max-w-full">
            {def.name}
          </h4>
        )}
      </div>

      {/* Bottom Description & Power Bar */}
      {!isMini && (
        <div className="relative z-10 pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium truncate max-w-[80%]">
            {isCompact ? def.name : def.description}
          </span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4].map((dot) => (
              <div
                key={dot}
                className={`w-1 h-2 rounded-full ${
                  isSelected ? 'bg-amber-400' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </button>
  );
};
