/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
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
    lastJoinError,
    clearJoinError,
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
    globalPlayers,
    incomingInvite,
    registerGlobal,
    sendInvite,
    respondInvite,
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

  // Close the modal when room join is confirmed by server
  useEffect(() => {
    if (room && isJoinCreateOpen) {
      setIsJoinCreateOpen(false);
      setUrlRoomCode('');
      clearJoinError();
    }
  }, [room, isJoinCreateOpen, clearJoinError]);

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
            joinError={lastJoinError}
            globalPlayers={globalPlayers}
            onRegisterGlobal={registerGlobal}
            onSendInvite={sendInvite}
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
          clearJoinError();
        }}
        defaultMode={defaultGameMode}
        initialRoomCode={urlRoomCode}
        initialTab={urlRoomCode ? 'join' : 'create'}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        joinError={lastJoinError}
        onClearJoinError={clearJoinError}
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

      {/* Incoming Invite Toast/Modal */}
      {incomingInvite && !room && (
        <div className="fixed bottom-4 right-4 z-[60] bg-[#11192e] border border-amber-500/50 rounded-xl p-4 shadow-2xl flex flex-col gap-3 max-w-sm animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">Play Request</p>
              <p className="text-xs text-slate-400 mt-0.5">
                <span className="text-amber-400 font-semibold">{incomingInvite.fromPlayerName}</span> invited you to a game!
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => {
                respondInvite(incomingInvite.id, true);
                joinRoom(incomingInvite.roomCode, privatePlayer?.displayName || 'Guest');
              }}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-3 rounded-lg text-xs transition"
            >
              Accept &amp; Join
            </button>
            <button
              onClick={() => respondInvite(incomingInvite.id, false)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-3 rounded-lg text-xs transition"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <Toast toasts={toasts} />
    </div>
  );
}
