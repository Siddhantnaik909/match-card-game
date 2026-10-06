/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { GameMode } from './types/game';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { GameSelectorModal } from './components/GameSelectorModal';
import { JoinCreateModal } from './components/JoinCreateModal';
import { LobbyView } from './components/LobbyView';
import { MatchCollectBoard } from './components/MatchCollectBoard';
import { ChorChitthiBoard } from './components/ChorChitthiBoard';
import { WinnerModal } from './components/WinnerModal';
import { ResultsPanel } from './components/ResultsPanel';
import { HowToPlayModal } from './components/HowToPlayModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { CinematicStartOverlay } from './components/CinematicStartOverlay';
import { Toast } from './components/Toast';

export default function App() {
  const {
    isConnected,
    isReconnecting,
    room,
    privatePlayer,
    toasts,
    lastReceivedCard,
    isPassingAnim,
    createRoom,
    joinRoom,
    toggleReady,
    startGame,
    selectCard,
    passCard,
    policeAccuse,
    nextRound,
    updateSettings,
    removePlayer,
    lockRoom,
    leaveRoom,
  } = useGameSocket();

  // Modal states
  const [isGameSelectorOpen, setIsGameSelectorOpen] = useState(false);
  const [isJoinCreateOpen, setIsJoinCreateOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [defaultGameMode, setDefaultGameMode] = useState<GameMode>('match-and-collect');

  const [urlRoomCode, setUrlRoomCode] = useState('');

  // Check URL query params for ?room=MATCH-XXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code && !room) {
      setUrlRoomCode(code.toUpperCase().trim());
      setIsJoinCreateOpen(true);
    }
  }, [room]);

  const handleSelectGameMode = (mode: GameMode) => {
    setDefaultGameMode(mode);
    setIsGameSelectorOpen(false);
    setIsJoinCreateOpen(true);
  };

  const handlePlayNow = () => {
    setIsJoinCreateOpen(true);
  };

  const isHost = Boolean(room && privatePlayer && room.hostId === privatePlayer.id);

  return (
    <div className="min-h-screen bg-[#0b101b] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        isConnected={isConnected}
        isReconnecting={isReconnecting}
        room={room}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenResults={() => setIsResultsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLeaveRoom={leaveRoom}
        isHost={isHost}
        onPlayNow={handlePlayNow}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {!room ? (
          <LandingHero
            onPlayNow={handlePlayNow}
            onHowToPlay={() => setIsHowToPlayOpen(true)}
            onChooseGame={() => setIsGameSelectorOpen(true)}
            onSelectMode={handleSelectGameMode}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
          />
        ) : room.status === 'lobby' || room.status === 'countdown' ? (
          <LobbyView
            room={room}
            currentPlayerId={privatePlayer?.id || ''}
            onToggleReady={toggleReady}
            onStartGame={startGame}
            onRemovePlayer={removePlayer}
            onLockRoom={lockRoom}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        ) : room.gameMode === 'match-and-collect' ? (
          <MatchCollectBoard
            room={room}
            privatePlayer={privatePlayer}
            lastReceivedCard={lastReceivedCard}
            isPassingAnim={isPassingAnim}
            onSelectCard={selectCard}
            onPassCard={passCard}
          />
        ) : (
          <ChorChitthiBoard
            room={room}
            privatePlayer={privatePlayer}
            onAccuse={policeAccuse}
            onNextRound={nextRound}
            isHost={isHost}
          />
        )}
      </main>

      {/* Cinematic Start Overlay */}
      {room?.cinematicState && (
        <CinematicStartOverlay
          step={room.cinematicState.step}
          playerCount={room.cinematicState.playerCount}
        />
      )}

      {/* Winner Celebration Modal */}
      {room?.winner && (
        <WinnerModal
          winner={room.winner}
          results={room.lastMatchResults || []}
          onViewResults={() => setIsResultsOpen(true)}
          onBackToLobby={nextRound}
          isHost={isHost}
        />
      )}

      {/* Modals */}
      <GameSelectorModal
        isOpen={isGameSelectorOpen}
        onClose={() => setIsGameSelectorOpen(false)}
        onSelectGame={handleSelectGameMode}
      />

      <JoinCreateModal
        isOpen={isJoinCreateOpen}
        onClose={() => {
          setIsJoinCreateOpen(false);
          setUrlRoomCode('');
        }}
        defaultMode={defaultGameMode}
        initialRoomCode={urlRoomCode}
        initialTab={urlRoomCode ? 'join' : 'create'}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      <ResultsPanel
        isOpen={isResultsOpen}
        onClose={() => setIsResultsOpen(false)}
      />

      {room && (
        <AdminSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          room={room}
          onUpdateSettings={updateSettings}
          onLockRoom={lockRoom}
        />
      )}

      {/* Reconnecting banner if temporarily disconnected */}
      {isReconnecting && (
        <div className="fixed bottom-4 left-4 z-50 bg-amber-500 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs shadow-xl animate-pulse flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
          <span>Reconnecting to game server...</span>
        </div>
      )}

      {/* Toast Notification Container */}
      <Toast toasts={toasts} />
    </div>
  );
}
