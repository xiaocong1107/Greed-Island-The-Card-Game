import React, { useState, useEffect, useRef } from 'react';
import { MapPin, BookOpen, Activity, RefreshCw, Skull, Shield, Sword, Trophy, AlertTriangle } from 'lucide-react';
import { LOCATIONS, INITIAL_SPELLS, getSpecifiedCard } from './constants';
import { PlayerState, GameLog, Card, CardType, CardRank, GameState, Scenario, Choice, ActionResolution } from './types';
import { startScenario, resolveAction } from './services/geminiService';
import { Binder } from './components/Binder';

const MAX_FREE_SLOTS = 50;
const MAX_SPEC_SLOTS = 100; 

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [isBinderOpen, setIsBinderOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [combatAnim, setCombatAnim] = useState<'idle' | 'flash' | 'shake' | 'reward'>('idle');
  
  // RPG Elements
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [endingSelection, setEndingSelection] = useState<Card[]>([]);

  const [player, setPlayer] = useState<PlayerState>({
    name: "Gon (小杰)",
    currentLocation: LOCATIONS[0],
    specifiedSlots: Array(MAX_SPEC_SLOTS).fill(null),
    freeSlots: [],
    spellCards: [...INITIAL_SPELLS],
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    maxXp: 100,
    attack: 10,
    defense: 5
  });

  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    addLog("SYSTEM", `欢迎来到贪婪之岛 (Greed Island)。当前位置: ${player.currentLocation.name}`);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Win/Loss Check
  useEffect(() => {
    if (gameState === GameState.GAME_OVER || gameState === GameState.VICTORY || gameState === GameState.CHOOSING_REWARDS) return;

    if (player.hp <= 0) {
        setGameState(GameState.GAME_OVER);
    }

    const collectedCount = player.specifiedSlots.filter(Boolean).length;
    if (collectedCount >= 100) {
        setGameState(GameState.VICTORY);
        addLog("SYSTEM", "恭喜！你已经收集了所有指定口袋卡片！");
    }
  }, [player.hp, player.specifiedSlots, gameState]);

  // --- Helpers ---
  const addLog = (sender: 'SYSTEM' | 'GM' | 'PLAYER', text: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      text,
      sender,
      timestamp: Date.now()
    }]);
  };

  const updateHp = (amount: number) => {
    setPlayer(prev => {
      let newHp = prev.hp + amount;
      if (newHp > prev.maxHp) newHp = prev.maxHp;
      return { ...prev, hp: newHp };
    });
  };

  const gainXp = (amount: number) => {
      if (amount <= 0) return;
      setPlayer(prev => {
          let newXp = prev.xp + amount;
          let newLevel = prev.level;
          let newMaxXp = prev.maxXp;
          let newMaxHp = prev.maxHp;
          let newAtk = prev.attack;
          let newDef = prev.defense;
          let currentHp = prev.hp;

          // Level Up Logic
          if (newXp >= newMaxXp) {
              newXp -= newMaxXp;
              newLevel += 1;
              newMaxXp = Math.floor(newMaxXp * 1.5);
              newMaxHp += 20;
              currentHp = newMaxHp; // Full heal on level up
              newAtk += 5;
              newDef += 2;
              addLog("SYSTEM", `升级了! Lv.${newLevel}!! HP全恢复, 属性提升。`);
          }

          return {
              ...prev,
              xp: newXp,
              level: newLevel,
              maxXp: newMaxXp,
              maxHp: newMaxHp,
              hp: currentHp,
              attack: newAtk,
              defense: newDef
          };
      });
  };

  const addCardToBinder = (card: Card) => {
    setPlayer(prev => {
      const newPlayer = { ...prev };
      
      if (card.type === CardType.SPECIFIED && card.number < 100) {
        // Specified slot logic
        if (newPlayer.specifiedSlots[card.number] === null) {
            newPlayer.specifiedSlots[card.number] = card;
            addLog("SYSTEM", `卡片 [No.${card.number}] ${card.name} 已收入指定口袋！`);
        } else {
            addLog("SYSTEM", `发现重复的指定卡片 [No.${card.number}]。移至自由口袋。`);
            if (newPlayer.freeSlots.length < MAX_FREE_SLOTS) {
                newPlayer.freeSlots.push(card);
            } else {
                addLog("SYSTEM", "自由口袋已满！卡片消失变成了粉末。");
            }
        }
      } else if (card.type === CardType.SPELL) {
         newPlayer.spellCards.push(card);
         addLog("SYSTEM", `获得咒语卡: ${card.name}。`);
      } else {
        // Free slot
        if (newPlayer.freeSlots.length < MAX_FREE_SLOTS) {
          newPlayer.freeSlots.push(card);
          addLog("SYSTEM", `${card.type === CardType.MONSTER ? '怪兽' : '道具'}卡 ${card.name} 已收入自由口袋。`);
        } else {
          addLog("SYSTEM", "自由口袋已满！卡片消失变成了粉末。");
        }
      }
      return newPlayer;
    });
  };

  // --- Core Game Loop ---

  // 1. Start Encounter
  const handleExplore = async () => {
    if (gameState !== GameState.IDLE) return;
    
    setIsLoading(true);
    setCombatAnim('idle');
    addLog("PLAYER", "开始探索...");

    try {
        const scenario = await startScenario(player);
        setCurrentScenario(scenario);
        setGameState(GameState.DECISION);
        addLog("GM", scenario.description);
    } catch (e) {
        addLog("SYSTEM", "连接中断。");
        setGameState(GameState.IDLE);
    } finally {
        setIsLoading(false);
    }
  };

  // 2. Make Choice
  const handleChoice = async (choiceId: string) => {
    if (!currentScenario) return;
    setGameState(GameState.RESOLVING);
    setIsLoading(true);

    try {
        const result: ActionResolution = await resolveAction(player, currentScenario, choiceId);

        // Narrative
        addLog("GM", result.narrative);

        // Animations
        if (result.damageTaken > 0) setCombatAnim('shake');
        if (result.xpGained > 0) setCombatAnim('reward');

        // Updates
        if (result.damageTaken > 0) {
             updateHp(-result.damageTaken);
             addLog("SYSTEM", `受到 ${result.damageTaken} 点伤害!`);
        }
        
        if (result.hpRestored > 0) {
            updateHp(result.hpRestored);
            addLog("SYSTEM", `恢复了 ${result.hpRestored} 点 HP。`);
        }

        if (result.xpGained > 0) {
            gainXp(result.xpGained);
            addLog("SYSTEM", `获得了 ${result.xpGained} XP。`);
        }

        if (result.newStatBuff) {
            setPlayer(prev => ({
                ...prev,
                [result.newStatBuff!.stat]: prev[result.newStatBuff!.stat] + result.newStatBuff!.amount
            }));
            addLog("SYSTEM", `属性提升: ${result.newStatBuff.sourceName} (${result.newStatBuff.stat} +${result.newStatBuff.amount})`);
        }

        // Card Reward
        if (result.rewardCard) {
             // If API gives a specified card number, look up the real lore data
             let finalCard: Card;
             if (result.rewardCard.type === 'SPECIFIED' && typeof result.rewardCard.number === 'number') {
                 finalCard = getSpecifiedCard(result.rewardCard.number);
             } else {
                 finalCard = {
                   id: `gen-${Date.now()}`,
                   number: result.rewardCard.number,
                   name: result.rewardCard.name,
                   rank: result.rewardCard.rank as CardRank,
                   type: result.rewardCard.type as CardType,
                   description: result.rewardCard.description,
                   limit: 20
                 };
             }
             addLog("SYSTEM", `GAIN! 获得了卡片: ${finalCard.name}`);
             addCardToBinder(finalCard);
        }

        // Reset
        setTimeout(() => {
            setCombatAnim('idle');
            setGameState(GameState.IDLE);
            setCurrentScenario(null);
        }, 1500);

    } catch (e) {
        addLog("SYSTEM", "判定时发生错误。");
        setGameState(GameState.IDLE);
    } finally {
        setIsLoading(false);
    }
  };

  const handleTravel = () => {
    const currentIndex = LOCATIONS.findIndex(l => l.name === player.currentLocation.name);
    const nextIndex = (currentIndex + 1) % LOCATIONS.length;
    const nextLoc = LOCATIONS[nextIndex];
    
    setPlayer(prev => ({ ...prev, currentLocation: nextLoc }));
    addLog("SYSTEM", `移动到了 ${nextLoc.name}。`);
  };

  // --- Item Usage ---
  const handleUseCard = (card: Card) => {
      if (card.type === CardType.SPELL) {
          if (card.name.includes('同行') || card.name.includes('Accompany')) {
              handleTravel();
          }
          addLog("PLAYER", `使用了咒语: ${card.name}`);
          setPlayer(prev => ({
              ...prev,
              spellCards: prev.spellCards.filter(c => c.id !== card.id)
          }));
      } else if (card.type === CardType.ITEM) {
          updateHp(20);
          addLog("PLAYER", `使用了 ${card.name}，恢复体力。`);
           setPlayer(prev => ({
              ...prev,
              freeSlots: prev.freeSlots.filter(c => c && c.id !== card.id)
          }));
      }
      setSelectedCard(null);
      setIsBinderOpen(false);
  };

  // --- Ending Logic ---
  const handleRetry = () => {
      window.location.reload();
  };

  const handleVictoryProceed = () => {
      setGameState(GameState.CHOOSING_REWARDS);
      setIsBinderOpen(true);
  };

  const handleEndingCardSelect = (card: Card) => {
      if (endingSelection.find(c => c.id === card.id)) {
          setEndingSelection(prev => prev.filter(c => c.id !== card.id));
      } else {
          if (endingSelection.length < 3) {
              setEndingSelection(prev => [...prev, card]);
          }
      }
  };

  const finishGame = () => {
      alert(`恭喜！你带回了: ${endingSelection.map(c => c.name).join(', ')}。游戏结束！`);
      window.location.reload();
  };

  const getScore = () => {
      const cardScore = player.specifiedSlots.filter(Boolean).length * 100;
      const xpScore = player.xp + (player.level * 500);
      return cardScore + xpScore;
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col md:flex-row overflow-hidden relative">
      
      {/* Background Scene Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden transition-all duration-1000 ease-in-out">
         <div className="absolute inset-0 bg-black/60 z-10"></div>
         <img 
            src={player.currentLocation.imageUrl} 
            alt="Scene" 
            className={`w-full h-full object-cover opacity-40 scale-105 transition-all duration-700 ${gameState === GameState.DECISION ? 'blur-sm grayscale-[50%]' : 'blur-[2px]'}`}
         />
         <div className="absolute inset-0 opacity-20 pointer-events-none z-20" 
           style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
         </div>
      </div>

      {/* Combat/Action Animation Overlay */}
      {combatAnim !== 'idle' && (
        <div className={`absolute inset-0 z-30 pointer-events-none flex items-center justify-center
            ${combatAnim === 'flash' ? 'animate-pulse bg-red-900/30' : ''}
            ${combatAnim === 'shake' ? 'animate-bounce bg-red-600/20' : ''}
            ${combatAnim === 'reward' ? 'bg-yellow-500/10' : ''}
        `}>
            {combatAnim === 'shake' && <div className="text-6xl font-digital text-red-500 font-bold animate-bounce">DAMAGE!</div>}
            {combatAnim === 'reward' && <div className="text-6xl font-digital text-yellow-400 font-bold animate-bounce">GAIN!</div>}
        </div>
      )}

      {/* DECISION OVERLAY */}
      {gameState === GameState.DECISION && currentScenario && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in zoom-in duration-300 p-6">
              <h2 className="text-3xl font-digital text-white mb-4 tracking-wider border-b-2 border-green-500 pb-2">
                  {currentScenario.title}
              </h2>
              <p className="text-gray-300 max-w-2xl text-center mb-8 text-lg leading-relaxed">
                  {currentScenario.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
                  {currentScenario.choices.map((choice, idx) => (
                      <button
                        key={choice.id}
                        onClick={() => handleChoice(choice.id)}
                        disabled={isLoading}
                        className={`
                            p-6 rounded-lg border-2 transition-all transform hover:scale-105 hover:shadow-lg relative overflow-hidden group
                            ${choice.type === 'AGGRESSIVE' ? 'border-red-500 bg-red-900/20 hover:bg-red-800/40' : ''}
                            ${choice.type === 'DEFENSIVE' ? 'border-blue-500 bg-blue-900/20 hover:bg-blue-800/40' : ''}
                            ${choice.type === 'RISKY' ? 'border-yellow-500 bg-yellow-900/20 hover:bg-yellow-800/40' : ''}
                            ${choice.type === 'NEUTRAL' ? 'border-gray-500 bg-gray-900/20 hover:bg-gray-800/40' : ''}
                        `}
                      >
                          <div className="font-bold text-xl mb-1 text-white">{choice.text}</div>
                          <div className="text-xs uppercase tracking-widest opacity-60">{choice.type}</div>
                      </button>
                  ))}
              </div>
          </div>
      )}

      {/* GAME OVER OVERLAY */}
      {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 z-[100] bg-red-950/90 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
              <Skull size={120} className="text-red-500 mb-6 animate-pulse" />
              <h1 className="text-6xl font-digital text-white mb-4">GAME OVER</h1>
              <p className="text-xl text-red-300 mb-8">你的旅程在贪婪之岛结束了...</p>
              
              <div className="bg-black/50 p-6 rounded-lg border border-red-800 mb-8 w-full max-w-md">
                  <div className="flex justify-between mb-2"><span>等级 (Level)</span><span>{player.level}</span></div>
                  <div className="flex justify-between mb-2"><span>卡片收集 (Cards)</span><span>{player.specifiedSlots.filter(Boolean).length}/100</span></div>
                  <div className="border-t border-red-900 my-2"></div>
                  <div className="flex justify-between text-xl font-bold text-white"><span>最终得分 (SCORE)</span><span>{getScore()}</span></div>
              </div>

              <button onClick={handleRetry} className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                  重新开始 (RETRY)
              </button>
          </div>
      )}

      {/* VICTORY OVERLAY */}
      {gameState === GameState.VICTORY && (
          <div className="absolute inset-0 z-[100] bg-white/90 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
              <Trophy size={120} className="text-yellow-500 mb-6 animate-bounce" />
              <h1 className="text-6xl font-digital text-black mb-4">CONGRATULATIONS!</h1>
              <p className="text-2xl text-gray-800 mb-8 font-bold">你已集齐 100 张指定口袋卡片，通关了贪婪之岛！</p>
              
              <p className="text-gray-600 mb-8 max-w-xl">
                  作为通关奖励，你可以选择 3 张卡片带回现实世界。请仔细选择。
              </p>

              <button onClick={handleVictoryProceed} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xl shadow-xl">
                  选择奖励 (SELECT REWARDS)
              </button>
          </div>
      )}
      
      {/* Left Panel: Game View & Logs */}
      <div className="flex-1 flex flex-col h-screen p-4 relative z-40 pointer-events-none">
        <div className="pointer-events-auto h-full flex flex-col">
            
            {/* Top HUD */}
            <div className="bg-gray-900/90 backdrop-blur border-2 border-green-700 p-4 mb-4 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.2)] flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-green-900 flex items-center justify-center border border-green-500 overflow-hidden relative">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=gon" alt="avatar" className="w-full h-full" />
                    <div className="absolute bottom-0 right-0 bg-black text-white text-xs px-1 font-bold">Lv.{player.level}</div>
                </div>
                <div>
                    <h1 className="font-digital text-xl text-white flex items-center gap-2">
                        {player.name}
                        <span className="text-xs bg-green-800 px-2 py-0.5 rounded text-green-200 border border-green-600">1-Star Hunter</span>
                    </h1>
                    <div className="flex gap-3 text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1"><Sword size={12}/> ATK: {player.attack}</span>
                        <span className="flex items-center gap-1"><Shield size={12}/> DEF: {player.defense}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end w-1/3">
                {/* HP Bar */}
                <div className="w-full flex justify-between text-xs text-gray-400 mb-1">
                    <span>HP</span>
                    <span>{player.hp}/{player.maxHp}</span>
                </div>
                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-green-900 relative mb-2">
                    <div 
                        className={`h-full transition-all duration-500 ${player.hp < player.maxHp * 0.3 ? 'bg-red-600' : 'bg-green-500'}`} 
                        style={{ width: `${(player.hp / player.maxHp) * 100}%`}}
                    ></div>
                </div>
                
                {/* XP Bar */}
                <div className="w-full flex justify-between text-xs text-gray-400 mb-1">
                    <span>XP</span>
                    <span>{player.xp}/{player.maxXp}</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden border border-blue-900 relative">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-500" 
                        style={{ width: `${(player.xp / player.maxXp) * 100}%`}}
                    ></div>
                </div>
            </div>
            </div>

            {/* Location View (Mid) */}
            <div className="flex-1 bg-gray-950/80 backdrop-blur-sm border-2 border-green-800 rounded-lg p-6 relative overflow-hidden flex flex-col shadow-lg">
            <div className="absolute top-2 right-2 bg-black/80 px-3 py-1 text-xs border border-green-500 text-green-300 flex items-center gap-2 rounded-full shadow-green-900 shadow-md">
                <MapPin size={14} /> {player.currentLocation.name} (Lv.{player.currentLocation.difficulty})
            </div>

            {/* Log Window */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar mb-4">
                {logs.length === 0 && <div className="text-gray-500 italic text-center mt-20">系统启动... 念能力加载完毕。</div>}
                {logs.map(log => (
                    <div key={log.id} className={`p-3 rounded border-l-4 animate-in fade-in slide-in-from-left-2 duration-300 shadow-sm ${
                        log.sender === 'GM' ? 'bg-gray-900/90 border-purple-500 text-gray-200' : 
                        log.sender === 'PLAYER' ? 'bg-green-900/30 border-green-500 text-green-100' :
                        'bg-black/80 border-gray-600 text-gray-400 text-sm font-mono'
                    }`}>
                    <span className="font-bold text-[10px] opacity-70 mb-1 block uppercase tracking-wider">{log.sender}</span>
                    <p className="leading-relaxed">{log.text}</p>
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
            </div>

            {/* Action Bar (Bottom) */}
            <div className="mt-4 grid grid-cols-4 gap-3 h-20">
            <button 
                onClick={() => setIsBinderOpen(true)}
                disabled={gameState !== GameState.IDLE}
                className="bg-gray-900/90 border border-green-600 hover:bg-green-900/80 hover:text-white transition-all flex flex-col items-center justify-center rounded-lg group shadow-[0_0_10px_rgba(34,197,94,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <BookOpen size={24} className="mb-1 group-hover:scale-110 transition-transform text-green-400" />
                <span className="text-xs font-digital tracking-wider">BOOK (书)</span>
            </button>
            
            <button 
                onClick={handleExplore}
                disabled={gameState !== GameState.IDLE || player.hp <= 0}
                className={`col-span-2 bg-green-700 text-white font-digital text-xl tracking-widest border-2 border-green-400 hover:bg-green-600 hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 rounded-lg relative overflow-hidden ${gameState !== GameState.IDLE ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isLoading ? <RefreshCw className="animate-spin" /> : <Activity size={28} />}
                <span>{isLoading ? "等待响应..." : "探索 (EXPLORE)"}</span>
            </button>

            <button 
                onClick={handleTravel}
                disabled={gameState !== GameState.IDLE}
                className="bg-gray-900/90 border border-green-600 hover:bg-green-900/80 hover:text-white transition-all flex flex-col items-center justify-center rounded-lg group shadow-[0_0_10px_rgba(34,197,94,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <MapPin size={24} className="mb-1 group-hover:scale-110 transition-transform text-green-400" />
                <span className="text-xs font-digital tracking-wider">移动 (WALK)</span>
            </button>
            </div>
        </div>
      </div>

      {/* Binder Overlay (Handles both regular viewing and Victory Selection) */}
      <Binder 
        isOpen={isBinderOpen} 
        onClose={() => { setIsBinderOpen(false); setSelectedCard(null); }} 
        player={player} 
        onCardSelect={(card) => {
            if (gameState === GameState.CHOOSING_REWARDS) {
                handleEndingCardSelect(card);
            } else {
                setSelectedCard(card);
            }
        }}
        selectionMode={gameState === GameState.CHOOSING_REWARDS}
        selectedCardsForEnding={endingSelection}
      />

      {/* VICTORY CONFIRMATION MODAL */}
      {gameState === GameState.CHOOSING_REWARDS && isBinderOpen && endingSelection.length === 3 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
               <button 
                 onClick={finishGame}
                 className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-12 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.8)] text-xl border-4 border-white"
               >
                 完成选择，回到现实！
               </button>
          </div>
      )}

      {/* Selected Card Modal Detail (Only in Normal Mode) */}
      {selectedCard && isBinderOpen && gameState !== GameState.CHOOSING_REWARDS && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="bg-black/90 border-2 border-white p-6 rounded-lg shadow-2xl max-w-sm w-full pointer-events-auto flex flex-col gap-4 animate-in zoom-in duration-200">
             <h3 className="text-xl font-digital text-center text-white border-b border-gray-700 pb-2">{selectedCard.name}</h3>
             <div className="text-sm text-gray-300 italic leading-relaxed">{selectedCard.description}</div>
             
             <div className="grid grid-cols-2 gap-3 text-xs font-mono text-gray-500 mt-2 bg-gray-900 p-3 rounded">
                <div>等级: <span className={`font-bold ${['SS', 'S'].includes(selectedCard.rank) ? 'text-yellow-400' : 'text-white'}`}>{selectedCard.rank}</span></div>
                <div>类型: <span className="text-white">{selectedCard.type}</span></div>
                <div>编号: <span className="text-white">{selectedCard.number > -1 ? selectedCard.number : '---'}</span></div>
                <div>限度: <span className="text-white">{selectedCard.limit || 10}</span></div>
             </div>

             <div className="flex gap-2 mt-4">
               <button 
                 onClick={() => handleUseCard(selectedCard)}
                 className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded font-digital text-sm border border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
               >
                 使用 (GAIN)
               </button>
               <button 
                 onClick={() => setSelectedCard(null)}
                 className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-digital text-sm border border-gray-500"
               >
                 取消 (CANCEL)
               </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
