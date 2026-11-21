import { create } from 'zustand';
import type { 
  AvatarConfig, 
  ChatMessage, 
  GameOverData, 
  PublicPlayer, 
  RoomSettings, 
  RoomSnapshot, 
  RoundEndData, 
  Stroke 
} from '../types';
import { socket } from '../net/socket';

const DEFAULT_AVATAR: AvatarConfig = {
  colorIndex: 0,
  eyesIndex: 0,
  mouthIndex: 0,
};

const loadAvatar = (): AvatarConfig => {
  try {
    const raw = localStorage.getItem('skribbl_avatar');
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_AVATAR;
};

interface GameState {
  screen: 'home' | 'lobby' | 'game';
  nickname: string;
  avatar: AvatarConfig;
  youId: string | null;
  token: string | null;
  room: RoomSnapshot | null;
  
  // Turn & Game State
  round: number;
  totalRounds: number;
  turn: number;
  totalTurns: number;
  drawerId: string | null;
  endsAt: number;
  word: string | null;
  wordOptions: string[];
  hint: string;
  scores: Record<string, number>;
  guessedIds: string[];
  
  // Canvas strokes
  strokes: Stroke[];
  
  // Chat
  messages: ChatMessage[];
  
  // Overlays
  roundEnd: RoundEndData | null;
  gameOver: GameOverData | null;
  errorToast: string | null;
  mutedPlayerIds: string[];
  kickVotes: Record<string, { votes: number; needed: number }>;

  // Actions
  setNickname: (name: string) => void;
  setAvatar: (avatar: AvatarConfig) => void;
  setErrorToast: (msg: string | null) => void;
  createRoom: (hostName: string, settings?: Partial<RoomSettings>, customWords?: string[]) => void;
  joinRoom: (roomCode: string, playerName: string) => void;
  rejoin: (roomCode: string, token: string) => void;
  leaveRoom: () => void;
  kickPlayer: (playerId: string) => void;
  voteKick: (playerId: string) => void;
  toggleMutePlayer: (playerId: string) => void;
  setReady: (ready: boolean) => void;
  updateSettings: (settings: Partial<RoomSettings>, customWords?: string[]) => void;
  startGame: () => void;
  chooseWord: (word: string) => void;
  sendChat: (text: string) => void;
  playAgain: () => void;
  
  // Canvas actions
  sendDrawStart: (strokeId: string, tool: 'brush' | 'eraser', color: string, size: number, x: number, y: number) => void;
  sendDrawMove: (strokeId: string, points: { x: number; y: number }[]) => void;
  sendDrawEnd: (strokeId: string) => void;
  sendDrawUndo: () => void;
  sendCanvasClear: () => void;
  
  // Local store mutations
  addLocalStroke: (stroke: Stroke) => void;
  appendLocalPoints: (strokeId: string, points: { x: number; y: number }[]) => void;
  undoLocalStroke: () => void;
  clearLocalCanvas: () => void;
}

export const useGame = create<GameState>((set, get) => {
  // Bind socket events once
  socket.on('room_joined', (p) => {
    localStorage.setItem('skribbl_session', JSON.stringify({ roomCode: p.room.code, token: p.token }));
    set({
      screen: p.room.phase === 'LOBBY' ? 'lobby' : 'game',
      youId: p.you,
      token: p.token,
      room: p.room,
      scores: Object.fromEntries(p.room.players.map((pl: PublicPlayer) => [pl.id, pl.score])),
      messages: [
        { id: Math.random().toString(), text: `Welcome to room ${p.room.code}!`, type: 'system' }
      ]
    });
  });

  socket.on('player_joined', (p) => {
    set((state) => ({
      room: p.room,
      messages: [
        ...state.messages,
        { id: Math.random().toString(), text: `${p.player.name} joined the room`, type: 'join' }
      ]
    }));
  });

  socket.on('player_left', (p) => {
    set((state) => ({
      room: p.room,
      messages: [
        ...state.messages,
        { id: Math.random().toString(), text: p.temporary ? `A player disconnected (reconnect grace)` : `A player left`, type: 'leave' }
      ]
    }));
  });

  socket.on('player_reconnected', (p) => {
    set((state) => ({
      room: p.room,
      messages: [
        ...state.messages,
        { id: Math.random().toString(), text: `Player reconnected`, type: 'join' }
      ]
    }));
  });

  socket.on('lobby_update', (p) => {
    set({ room: p.room, screen: p.room.phase === 'LOBBY' ? 'lobby' : get().screen });
  });

  socket.on('round_start', (p) => {
    set({
      screen: 'game',
      round: p.round,
      totalRounds: p.totalRounds,
      turn: p.turn,
      totalTurns: p.totalTurns,
      drawerId: p.drawerId,
      endsAt: p.endsAt,
      wordOptions: p.wordOptions ?? [],
      word: null,
      hint: '',
      strokes: [],
      guessedIds: [],
      roundEnd: null,
      gameOver: null,
    });
  });

  socket.on('drawing_start', (p) => {
    set({
      drawerId: p.drawerId ?? get().drawerId,
      endsAt: p.endsAt,
      hint: p.hint ?? '',
      word: p.word ?? null,
      wordOptions: [],
      roundEnd: null,
    });
  });

  socket.on('hint_update', (p) => {
    set({ hint: p.hint });
  });

  socket.on('round_end', (p) => {
    set((state) => ({
      word: p.word,
      scores: p.scores,
      roundEnd: p,
      messages: [
        ...state.messages,
        { id: Math.random().toString(), text: `Round ended! The word was "${p.word}"`, type: 'system' }
      ]
    }));
  });

  socket.on('game_over', (p) => {
    set((state) => ({
      gameOver: p,
      messages: [
        ...state.messages,
        { id: Math.random().toString(), text: `Game Over! ${p.winner ? p.winner.name + ' won!' : ''}`, type: 'system' }
      ]
    }));
  });

  socket.on('game_state', (p) => {
    set({
      screen: p.phase === 'LOBBY' ? 'lobby' : 'game',
      round: p.round,
      totalRounds: p.totalRounds,
      turn: p.turn,
      totalTurns: p.totalTurns,
      drawerId: p.drawerId,
      hint: p.hint,
      endsAt: p.endsAt,
      scores: p.scores ?? {},
      guessedIds: p.guessedIds ?? [],
      wordOptions: p.wordOptions ?? [],
      word: p.word ?? null,
    });
  });

  socket.on('chat_message', (p) => {
    set((state) => ({
      messages: [
        ...state.messages,
        { 
          id: Math.random().toString(), 
          playerId: p.playerId, 
          playerName: p.playerName, 
          text: p.text, 
          type: 'chat',
          channel: p.channel 
        }
      ]
    }));
  });

  socket.on('guess_result', (p) => {
    set((state) => {
      const guessed = state.guessedIds.includes(p.playerId) ? state.guessedIds : [...state.guessedIds, p.playerId];
      return {
        scores: p.scores ?? state.scores,
        guessedIds: guessed,
        word: p.word ?? state.word,
        messages: [
          ...state.messages,
          { id: Math.random().toString(), text: `${p.playerName} guessed the word! (+${p.points} pts)`, type: 'guess_correct' }
        ]
      };
    });
  });

  socket.on('close_guess', (p) => {
    set((state) => ({
      messages: [
        ...state.messages,
        { id: Math.random().toString(), text: `"${p.text}" is so close!`, type: 'close' }
      ]
    }));
  });

  socket.on('draw_data', (p) => {
    if (p.op === 'start') {
      set((state) => ({ strokes: [...state.strokes, p.stroke] }));
    } else if (p.op === 'move') {
      set((state) => {
        const strokes = [...state.strokes];
        const last = strokes.find(s => s.id === p.strokeId) ?? strokes[strokes.length - 1];
        if (last) {
          last.points = [...last.points, ...p.points];
        }
        return { strokes };
      });
    }
  });

  socket.on('stroke_undone', (p) => {
    set((state) => ({
      strokes: state.strokes.filter((s) => s.id !== p.strokeId)
    }));
  });

  socket.on('canvas_clear', () => {
    set({ strokes: [] });
  });

  socket.on('canvas_sync', (p) => {
    if (Array.isArray(p.strokes)) {
      set({ strokes: p.strokes });
    }
  });

  socket.on('error', (p) => {
    set({ errorToast: p.message ?? 'An error occurred' });
    setTimeout(() => set({ errorToast: null }), 3500);
  });

  socket.on('rejoin_failed', () => {
    localStorage.removeItem('skribbl_session');
    set({ screen: 'home', youId: null, token: null, room: null });
  });

  socket.on('vote_kick_update', (p) => {
    set((state) => ({
      kickVotes: {
        ...state.kickVotes,
        [p.targetId]: { votes: p.votes, needed: p.needed },
      },
      messages: [
        ...state.messages,
        {
          id: Math.random().toString(),
          text: `Vote to kick ${p.targetName}: ${p.votes}/${p.needed} votes`,
          type: 'system',
        },
      ],
    }));
  });

  socket.on('kicked', (p) => {
    localStorage.removeItem('skribbl_session');
    set({
      screen: 'home',
      youId: null,
      token: null,
      room: null,
      errorToast: p?.message || 'You were kicked from the room.',
    });
    window.history.replaceState({}, document.title, window.location.pathname);
  });

  return {
    screen: 'home',
    nickname: localStorage.getItem('skribbl_name') || '',
    avatar: loadAvatar(),
    youId: null,
    token: null,
    room: null,
    round: 1,
    totalRounds: 3,
    turn: 1,
    totalTurns: 3,
    drawerId: null,
    endsAt: 0,
    word: null,
    wordOptions: [],
    hint: '',
    scores: {},
    guessedIds: [],
    strokes: [],
    messages: [],
    roundEnd: null,
    gameOver: null,
    errorToast: null,
    mutedPlayerIds: [],
    kickVotes: {},

    setNickname: (name: string) => {
      localStorage.setItem('skribbl_name', name);
      set({ nickname: name });
    },

    setAvatar: (avatar: AvatarConfig) => {
      localStorage.setItem('skribbl_avatar', JSON.stringify(avatar));
      const { room, youId } = get();
      if (room && youId) {
        const updatedPlayers = room.players.map((p) =>
          p.id === youId ? { ...p, avatar } : p
        );
        set({
          avatar,
          room: { ...room, players: updatedPlayers },
        });
        if (socket.isOpen) {
          socket.send('update_avatar', { avatar });
        }
      } else {
        set({ avatar });
      }
    },

    leaveRoom: () => {
      localStorage.removeItem('skribbl_session');
      try {
        if (socket.isOpen) {
          socket.send('leave_room', {});
        }
      } catch {}
      set({
        screen: 'home',
        youId: null,
        token: null,
        room: null,
        strokes: [],
        messages: [],
        roundEnd: null,
        gameOver: null,
        word: null,
        wordOptions: [],
        hint: '',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    },

    setErrorToast: (msg: string | null) => set({ errorToast: msg }),

    createRoom: async (hostName: string, settings?: Partial<RoomSettings>, customWords?: string[]) => {
      await socket.connect();
      socket.send('create_room', { hostName, settings, customWords, avatar: get().avatar });
    },

    joinRoom: async (roomCode: string, playerName: string) => {
      await socket.connect();
      socket.send('join_room', { roomCode, playerName, avatar: get().avatar });
    },

    rejoin: async (roomCode: string, token: string) => {
      await socket.connect();
      socket.send('rejoin', { roomCode, token });
    },

    setReady: (ready: boolean) => socket.send('set_ready', { ready }),
    updateSettings: (settings: Partial<RoomSettings>, customWords?: string[]) => socket.send('update_settings', { settings, customWords }),
    startGame: () => socket.send('start_game', {}),
    kickPlayer: (playerId: string) => socket.send('kick_player', { playerId }),
    voteKick: (playerId: string) => socket.send('vote_kick', { playerId }),
    toggleMutePlayer: (playerId: string) => {
      set((state) => {
        const isMuted = state.mutedPlayerIds.includes(playerId);
        return {
          mutedPlayerIds: isMuted
            ? state.mutedPlayerIds.filter((id) => id !== playerId)
            : [...state.mutedPlayerIds, playerId],
        };
      });
    },
    chooseWord: (word: string) => socket.send('word_chosen', { word }),
    sendChat: (text: string) => socket.send('chat', { text }),
    playAgain: () => socket.send('play_again', {}),

    sendDrawStart: (strokeId, tool, color, size, x, y) => {
      socket.send('draw_start', { strokeId, tool, color, size, x, y });
    },
    sendDrawMove: (strokeId, points) => {
      socket.send('draw_move', { strokeId, points });
    },
    sendDrawEnd: (strokeId) => {
      socket.send('draw_end', { strokeId });
    },
    sendDrawUndo: () => socket.send('draw_undo', {}),
    sendCanvasClear: () => socket.send('canvas_clear', {}),

    addLocalStroke: (stroke) => set((s) => ({ strokes: [...s.strokes, stroke] })),
    appendLocalPoints: (strokeId, points) => set((s) => {
      const strokes = [...s.strokes];
      const target = strokes.find(st => st.id === strokeId) ?? strokes[strokes.length - 1];
      if (target) target.points = [...target.points, ...points];
      return { strokes };
    }),
    undoLocalStroke: () => set((s) => ({ strokes: s.strokes.slice(0, -1) })),
    clearLocalCanvas: () => set({ strokes: [] }),
  };
});
