import React, { useEffect, useState } from 'react';
import { useGame } from './store/useGame';
import { Home } from './screens/Home';
import { CreateRoom } from './screens/CreateRoom';
import { JoinRoom } from './screens/JoinRoom';
import { Lobby } from './screens/Lobby';
import { Game } from './screens/Game';
import { extractInviteRoomCode } from './utils/invite';

export const App: React.FC = () => {
  const { screen, rejoin } = useGame();
  const inviteCode = extractInviteRoomCode();
  const [subView, setSubView] = useState<'HOME' | 'CREATE' | 'JOIN'>(() => {
    return inviteCode ? 'JOIN' : 'HOME';
  });

  // Handle session restoration OR invite link on initial mount
  useEffect(() => {
    if (inviteCode) {
      // If user opened an invite link, do not restore an old session from a different room
      try {
        localStorage.removeItem('skribbl_session');
      } catch {}
      setSubView('JOIN');
      return;
    }

    try {
      const raw = localStorage.getItem('skribbl_session');
      if (raw) {
        const { roomCode, token } = JSON.parse(raw);
        if (roomCode && token) {
          rejoin(roomCode, token);
        }
      }
    } catch {}
  }, [inviteCode, rejoin]);

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
