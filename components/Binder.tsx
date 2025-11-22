import React, { useState } from 'react';
import { Card, PlayerState } from '../types';
import { CardView } from './CardView';
import { X, ShieldCheck, Box, Zap, CheckCircle } from 'lucide-react';

interface BinderProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerState;
  onCardSelect: (card: Card) => void;
  selectionMode?: boolean; // New prop for the victory phase
  selectedCardsForEnding?: Card[]; // Cards currently selected to take home
}

export const Binder: React.FC<BinderProps> = ({ 
  isOpen, 
  onClose, 
  player, 
  onCardSelect, 
  selectionMode = false,
  selectedCardsForEnding = []
}) => {
  const [activeTab, setActiveTab] = useState<'specified' | 'free' | 'spell'>('specified');

  if (!isOpen) return null;

  const isCardSelected = (card: Card) => {
    return selectedCardsForEnding.some(c => c.id === card.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 md:p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-6xl h-[90vh] bg-gray-900 border-4 ${selectionMode ? 'border-yellow-400' : 'border-green-600'} rounded-lg flex flex-col shadow-[0_0_30px_rgba(34,197,94,0.3)] relative overflow-hidden`}>
        
        {/* Decor */}
        <div className={`absolute top-0 left-0 w-full h-1 ${selectionMode ? 'bg-yellow-400' : 'bg-green-500'} shadow-[0_0_10px_#22c55e]`}></div>
        <div className="scanline"></div>

        {/* Header */}
        <div className="flex justify-between items-center p-3 bg-gray-800 border-b border-green-800 relative z-20">
          <h2 className={`text-xl md:text-2xl font-digital tracking-widest flex items-center gap-2 ${selectionMode ? 'text-yellow-400' : 'text-green-400'}`}>
             <div className={`w-3 h-3 rounded-full animate-pulse ${selectionMode ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
             {selectionMode ? 'SELECT REWARDS (选择带回的卡片)' : 'BINDER (集卡书)'}
          </h2>
          
          {selectionMode && (
            <div className="text-yellow-300 font-bold font-digital text-lg">
               已选: {selectedCardsForEnding.length} / 3
            </div>
          )}

          {!selectionMode && (
            <div className="flex gap-4 font-mono text-xs md:text-sm text-green-200">
              <div className="flex items-center gap-2">
                  <ShieldCheck size={16} />
                  <span className="hidden md:inline">指定:</span>
                  <span>{player.specifiedSlots.filter(c => c !== null).length}/100</span>
              </div>
              <div className="flex items-center gap-2">
                  <Box size={16} />
                  <span className="hidden md:inline">自由:</span>
                  <span>{player.freeSlots.filter(c => c !== null).length}/50</span>
              </div>
            </div>
          )}
          
          {!selectionMode && (
            <button onClick={onClose} className="text-green-500 hover:text-white hover:bg-red-600 rounded p-1 transition-colors">
              <X size={24} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-green-800 bg-gray-900 relative z-20">
           <button 
             className={`flex-1 py-3 font-digital text-sm tracking-wider transition-colors ${activeTab === 'specified' ? 'bg-green-700 text-white' : 'text-green-600 hover:bg-gray-800'}`}
             onClick={() => setActiveTab('specified')}
           >
             指定口袋
           </button>
           <button 
             className={`flex-1 py-3 font-digital text-sm tracking-wider transition-colors ${activeTab === 'free' ? 'bg-green-700 text-white' : 'text-green-600 hover:bg-gray-800'}`}
             onClick={() => setActiveTab('free')}
           >
             自由口袋
           </button>
           {!selectionMode && (
             <button 
               className={`flex-1 py-3 font-digital text-sm tracking-wider transition-colors ${activeTab === 'spell' ? 'bg-green-700 text-white' : 'text-green-600 hover:bg-gray-800'}`}
               onClick={() => setActiveTab('spell')}
             >
               咒语卡
             </button>
           )}
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-black/50 relative z-10 custom-scrollbar">
           {selectionMode && (
              <div className="text-center text-yellow-200 mb-4 font-mono text-sm">
                 点击卡片进行选择。必须是实体化的卡片（自由口袋或指定口袋）。
              </div>
           )}
           
           <div className="flex flex-wrap justify-center content-start gap-3">
             
             {activeTab === 'specified' && (
               <>
                {player.specifiedSlots.map((card, idx) => {
                   return (
                     <div key={`spec-${idx}`} className="relative">
                        <CardView 
                          card={card} 
                          slotNumber={idx}
                          onClick={() => card && onCardSelect(card)}
                        />
                        {selectionMode && card && isCardSelected(card) && (
                          <div className="absolute inset-0 bg-yellow-500/40 border-4 border-yellow-400 z-10 flex items-center justify-center pointer-events-none">
                            <CheckCircle className="text-white drop-shadow-md" size={48} />
                          </div>
                        )}
                     </div>
                   );
                })}
               </>
             )}

             {activeTab === 'free' && (
               <>
                {player.freeSlots.map((card, idx) => (
                  <div key={`free-${idx}`} className="relative">
                    <CardView 
                      card={card} 
                      slotNumber={idx + 1000} 
                      isFreeSlot
                      onClick={() => card && onCardSelect(card)}
                    />
                    {selectionMode && card && isCardSelected(card) && (
                       <div className="absolute inset-0 bg-yellow-500/40 border-4 border-yellow-400 z-10 flex items-center justify-center pointer-events-none">
                          <CheckCircle className="text-white drop-shadow-md" size={48} />
                       </div>
                    )}
                  </div>
                ))}
                {/* Placeholders */}
                 {Array.from({ length: Math.max(0, 10 - player.freeSlots.length) }).map((_, idx) => (
                   <div key={`empty-free-${idx}`} className="w-32 h-48 border border-dashed border-gray-800 bg-gray-900/30 rounded flex items-center justify-center opacity-30">
                      <span className="text-[10px] text-gray-500">自由 (空)</span>
                   </div>
                 ))}
               </>
             )}

             {activeTab === 'spell' && !selectionMode && (
                player.spellCards.map((card, idx) => (
                  <CardView 
                    key={`spell-${idx}`} 
                    card={card} 
                    slotNumber={card.number}
                    onClick={() => onCardSelect(card)}
                  />
                ))
             )}
             
             {activeTab === 'spell' && player.spellCards.length === 0 && !selectionMode && (
                <div className="flex flex-col items-center text-gray-500 font-mono mt-10">
                    <Zap size={48} className="mb-4 opacity-20" />
                    <p>未获得任何咒语卡。</p>
                </div>
             )}

           </div>
        </div>

        {/* Footer Info */}
        <div className="h-8 bg-gray-800 border-t border-green-800 flex items-center justify-between px-4 text-[10px] md:text-xs text-green-500 font-mono">
           <span>G.I. OPERATING SYSTEM V3.0</span>
           <span>{selectionMode ? 'FINAL PHASE (最终阶段)' : 'SYSTEM READY (系统正常)'}</span>
        </div>

      </div>
    </div>
  );
};
