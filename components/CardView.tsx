import React from 'react';
import { Card } from '../types';

interface CardViewProps {
  card: Card | null;
  slotNumber?: number;
  isFreeSlot?: boolean;
  onClick?: () => void;
}

export const CardView: React.FC<CardViewProps> = ({ card, slotNumber, isFreeSlot, onClick }) => {
  if (!card) {
    return (
      <div 
        className="w-32 h-48 bg-gray-900 border-2 border-gray-700 flex flex-col items-center justify-center m-2 relative opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
        onClick={onClick}
      >
        <span className="text-gray-600 font-digital text-xs absolute top-2 left-2">
          {slotNumber !== undefined ? `#${slotNumber.toString().padStart(3, '0')}` : '---'}
        </span>
        <span className="text-gray-600 text-sm">空 (Empty)</span>
      </div>
    );
  }

  const getBorderColor = (rank: string) => {
    if (['SS', 'S'].includes(rank)) return 'border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]';
    if (['A', 'B'].includes(rank)) return 'border-red-500';
    return 'border-green-500'; // Standard Greed Island green
  };

  return (
    <div 
      onClick={onClick}
      className={`w-32 h-48 bg-slate-800 ${getBorderColor(card.rank)} border-2 m-2 flex flex-col relative cursor-pointer transform hover:scale-105 transition-transform group overflow-hidden`}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-1 bg-black/40 text-[10px] font-digital text-white h-6">
        <span>{card.number > -1 ? `NO.${card.number.toString().padStart(3, '0')}` : '---'}</span>
        <span className={`${['SS', 'S'].includes(card.rank) ? 'text-yellow-400' : 'text-green-400'}`}>
          {card.rank}
        </span>
      </div>

      {/* Image Placeholder */}
      <div className="flex-1 bg-gray-700 overflow-hidden relative">
         <img 
           src={`https://picsum.photos/seed/${card.id || card.name}/128/192`} 
           alt={card.name}
           className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
         />
         <div className="absolute bottom-0 w-full bg-black/60 text-white text-[10px] text-center py-1 truncate px-1">
            {card.name}
         </div>
      </div>

      {/* Footer / Limit */}
      <div className="h-6 bg-black/80 flex items-center justify-between px-2 text-[9px] text-gray-300">
         <span>{card.type === 'SPECIFIED' ? '指定' : card.type === 'SPELL' ? '咒语' : card.type === 'ITEM' ? '道具' : '怪兽'}</span>
         <span>L-{card.limit || 10}</span>
      </div>
    </div>
  );
};