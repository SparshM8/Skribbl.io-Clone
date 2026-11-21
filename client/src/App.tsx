import React, { useEffect, useState } from 'react';
import { useGame } from './store/useGame';
import { Home } from './screens/Home';
import { CreateRoom } from './screens/CreateRoom';
import { JoinRoom } from './screens/JoinRoom';
import { Lobby } from './screens/Lobby';
import { Game } from './screens/Game';

export const App: React.FC = () => {
  const { screen, rejoin } = useGame();
  const [subView, setSubView] = useState<'HOME' | 'CREATE' | 'JOIN'>('HOME');

  // Attempt session restoration on initial mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('skribbl_session');
      if (raw) {
        const { roomCode, token } = JSON.parse(raw);
        if (roomCode && token) {
          rejoin(roomCode, token);
        }
      }
    } catch {}
  }, [rejoin]);

  // Handle URL param ?room=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) {
      setSubView('JOIN');
    }
  }, []);

  if (screen === 'lobby') {
    return <Lobby />;
  }

  if (screen === 'game') {
    return <Game />;
  }

  switch (subView) {
    case 'CREATE':
      return <CreateRoom onBack={() => setSubView('HOME')} />;
    case 'JOIN':
      return <JoinRoom onBack={() => setSubView('HOME')} />;
    case 'HOME':
    default:
      return <Home onNavigate={(v) => setSubView(v)} />;
  }
};

export default App;
