import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useGame } from '../store/useGame';
import { Canvas } from '../components/Canvas';
import { Toolbar } from '../components/Toolbar';
import { GameTimer } from '../components/GameTimer';
import { Leaderboard } from '../components/Leaderboard';
import { Chat } from '../components/Chat';
import { WordModal } from '../components/WordModal';
import { GameOver } from '../components/GameOver';
import { PlayerProfileModal } from '../components/PlayerProfileModal';
import { CharacterStudio } from '../components/CharacterStudio';
import type { Tool, PublicPlayer } from '../types';

export const Game: React.FC = () => {
  const {
    room,
    youId,
    round,
    totalRounds,
    drawerId,
    endsAt,
    word,
    wordOptions,
    hint,
    scores,
    guessedIds,
    strokes,
    messages,
    roundEnd,
    gameOver,
    chooseWord,
    sendChat,
    playAgain,
    sendDrawStart,
    sendDrawMove,
    sendDrawEnd,
    sendDrawUndo,
    sendCanvasClear,
    addLocalStroke,
    appendLocalPoints,
    undoLocalStroke,
    clearLocalCanvas,
    avatar,
    leaveRoom,
    mutedPlayerIds,
    kickVotes,
    kickPlayer,
    voteKick,
    toggleMutePlayer,
    setAvatar,
  } = useGame();

  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(7);
  const [selectedPlayer, setSelectedPlayer] = useState<PublicPlayer | null>(null);
  const [showWardrobe, setShowWardrobe] = useState(false);

  const isDrawer = drawerId === youId;
  const hasGuessed = youId ? guessedIds.includes(youId) : false;
  const drawerPlayer = room?.players.find((p) => p.id === drawerId);
  const isHost = room?.hostId === youId;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-3.5 py-3 sm:py-4 px-2 sm:px-4">
      {/* Top Timer & Word Hints Bar */}
      <GameTimer
        round={round}
        totalRounds={totalRounds}
        endsAt={endsAt}
        hints={hint}
        isDrawer={isDrawer}
        drawerWord={word}
        hasGuessed={hasGuessed}
        onLeave={leaveRoom}
      />

      {/* Round End Notification Banner */}
      {roundEnd && (
        <div className="p-4 sm:p-5 rounded-2xl border-[3px] border-black bg-[#FACC15] text-black shadow-[5px_5px_0px_#000] animate-in slide-in-from-top duration-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left select-none">
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-xs uppercase font-fun tracking-wider font-black text-black">
              <Sparkles size={16} className="stroke-[2.5]" />
              <span>ROUND COMPLETE!</span>
            </div>
            <div className="text-base sm:text-lg font-fun font-black text-black">
              THE SECRET WORD WAS:{' '}
              <span className="font-fun font-black uppercase text-black bg-white border-2 border-black px-3 py-1 rounded-xl tracking-wider shadow-[2px_2px_0px_#000] ml-1 inline-block">
                {roundEnd.word}
              </span>
            </div>
          </div>
          {roundEnd.nextDrawerId && (
            <div className="text-xs font-fun font-black text-black bg-white border-2 border-black px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#000]">
              NEXT DRAWER:{' '}
              <span className="text-[#8B5CF6] uppercase">
                {room?.players.find((p) => p.id === roundEnd.nextDrawerId)?.name || 'Player'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-[500px]">
        {/* Leaderboard: order-3 on mobile (below chat), order-1 on desktop */}
        <div className="lg:col-span-3 order-3 lg:order-1 h-56 sm:h-64 lg:h-auto">
          <Leaderboard
            players={room?.players ?? []}
            currentDrawerId={drawerId}
            currentUserId={youId}
            scores={scores}
            guessedIds={guessedIds}
            userAvatar={avatar}
            onSelectPlayer={(p) => setSelectedPlayer(p)}
          />
        </div>

        {/* Center Column: Canvas + Toolbar (order-1 on mobile, order-2 on desktop) */}
        <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col space-y-3">
          <div className="flex-1 min-h-[260px] sm:min-h-[420px]">
            <Canvas
              isDrawer={isDrawer}
              strokes={strokes}
              tool={tool}
              color={color}
              size={size}
              onDrawStart={(strokeId, t, c, s, x, y) => sendDrawStart(strokeId, t, c, s, x, y)}
              onDrawMove={(strokeId, points) => sendDrawMove(strokeId, points)}
              onDrawEnd={(strokeId) => sendDrawEnd(strokeId)}
              onLocalStrokeAdd={addLocalStroke}
              onLocalPointsAppend={appendLocalPoints}
            />
          </div>

          {/* Interactive Toolbar: Active for drawer, helpful status for guessers */}
          {isDrawer ? (
            <Toolbar
              tool={tool}
              color={color}
              size={size}
              onToolChange={setTool}
              onColorChange={setColor}
              onSizeChange={setSize}
              onUndo={() => {
                undoLocalStroke();
                sendDrawUndo();
              }}
              onClear={() => {
                clearLocalCanvas();
                sendCanvasClear();
              }}
            />
          ) : (
            <div className="neo-card p-2.5 sm:p-3 text-center text-xs font-fun font-black text-black flex items-center justify-center space-x-2 select-none">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
              <span>
                <strong>{drawerPlayer?.name || 'Drawer'}</strong> is drawing right now.{' '}
                <span className="hidden lg:inline">Guess in the chat on the right!</span>
                <span className="lg:hidden">Guess in the chat below!</span>
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Chat & Guesses (order-2 on mobile, directly below canvas!) */}
        <div className="lg:col-span-3 order-2 lg:order-3 h-72 sm:h-80 lg:h-auto">
          <Chat
            messages={messages}
            isDrawer={isDrawer}
            hasGuessed={hasGuessed}
            currentUserId={youId}
            mutedPlayerIds={mutedPlayerIds}
            onSendMessage={sendChat}
          />
        </div>
      </div>

      {/* Word Selection Modal (Shown to drawer and guests during SELECTING_WORD) */}
      {wordOptions && wordOptions.length > 0 && (
        <WordModal
          words={wordOptions}
          isDrawer={isDrawer}
          drawerName={drawerPlayer?.name}
          onSelectWord={chooseWord}
        />
      )}

      {/* Game Over Screen with Podium & Confetti */}
      {gameOver && (
        <GameOver
          data={gameOver}
          isHost={isHost}
          onPlayAgain={playAgain}
        />
      )}

      {/* Player Action Popup Modal (skribbl.io style: kick, votekick, mute, kudos) */}
      {selectedPlayer && (
        <PlayerProfileModal
          player={selectedPlayer}
          isSelf={selectedPlayer.id === youId}
          isHost={isHost}
          isMuted={mutedPlayerIds.includes(selectedPlayer.id)}
          kickVotes={kickVotes[selectedPlayer.id]}
          onClose={() => setSelectedPlayer(null)}
          onKick={kickPlayer}
          onVoteKick={voteKick}
          onToggleMute={toggleMutePlayer}
          onSendKudos={(name) => sendChat(`sent kudos to ${name}! 👍`)}
          onOpenWardrobe={() => setShowWardrobe(true)}
        />
      )}

      {/* In-Game Wardrobe Studio (Accessible from profile modal) */}
      {showWardrobe && (
        <CharacterStudio
          config={avatar}
          playerName={room?.players.find((p) => p.id === youId)?.name || 'Artist'}
          onSave={setAvatar}
          onClose={() => setShowWardrobe(false)}
        />
      )}
    </div>
  );
};
