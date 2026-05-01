import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Canvas } from './components/Whiteboard/Canvas';
import { FloatingToolbar } from './components/Toolbar/FloatingToolbar';
import { CursorOverlay } from './components/Whiteboard/CursorOverlay';
import { useSocket } from './hooks/useSocket';

// Generate distinct color for user cursor
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// Simple ID setup
const generateUserId = () => {
  let id = localStorage.getItem('inkedin-userId');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('inkedin-userId', id);
  }
  return id;
};

const getOrGenerateRoomInfo = () => {
  const params = new URLSearchParams(window.location.search);
  let room = params.get('room');
  let isHost = false;
  if (!room) {
    room = uuidv4().slice(0, 8);
    window.history.replaceState({}, '', `?room=${room}`);
    isHost = true;
  }
  return { roomId: room, isHost };
};

const getOrGenerateUserName = (roomId) => {
  return localStorage.getItem(`inkedin-userName-${roomId}`) || '';
};

function App() {
  const [roomInfo] = useState(getOrGenerateRoomInfo);
  const roomId = roomInfo.roomId;
  const isHost = roomInfo.isHost;
  
  const [userId] = useState(generateUserId);
  const [userName, setUserName] = useState(() => getOrGenerateUserName(roomId));
  const [showJoinScreen, setShowJoinScreen] = useState(!userName && !isHost);
  
  // Set default name for host if not set
  useEffect(() => {
    if (isHost && !userName) {
      const name = "Host";
      setUserName(name);
      localStorage.setItem(`inkedin-userName-${roomId}`, name);
    }
  }, [isHost, roomId, userName]);
  
  // Settings state
  const [activeColor, setActiveColor] = useState('#fafafa'); // start white/black depending on theme
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Theme sync
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);
    if (!isDark) setActiveColor('#09090b');
  }, []);

  const userConfig = {
    id: userId,
    name: userName,
    color: stringToColor(userId + userName)
  };

  const {
    roomState,
    remoteCursors,
    drawStroke,
    moveCursor,
    undo,
    clearCanvas
  } = useSocket(roomId || 'default', userConfig);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      if (activeColor === '#09090b') setActiveColor('#fafafa');
    } else {
      document.documentElement.classList.remove('dark');
      if (activeColor === '#fafafa') setActiveColor('#09090b');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleExport = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Create a temporary canvas to draw the background
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const ctx = tempCanvas.getContext('2d');
      
      // Fill background
      ctx.fillStyle = isDarkMode ? '#09090b' : '#fafafa';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw original canvas on top
      ctx.drawImage(canvas, 0, 0);

      const link = document.createElement('a');
      link.download = `InkedIn-${roomId}.png`;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
    }
  };

  if (!roomId) return null;

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Join Screen Overlay */}
      {showJoinScreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md px-4">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl border border-white/10 w-full max-w-md animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome to InkedIn</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Enter your name to join the collaborative board.</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const name = e.target.name.value.trim() || `Guest-${roomId.slice(0,4)}`;
              setUserName(name);
              localStorage.setItem(`inkedin-userName-${roomId}`, name);
              setShowJoinScreen(false);
            }}>
              <input
                autoFocus
                name="name"
                type="text"
                placeholder="Your name..."
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white mb-4 outline-none transition-all"
              />
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
              >
                Join Board
              </button>
            </form>
          </div>
        </div>
      )}

      <Canvas
        strokes={roomState.strokes}
        onStrokeEnd={drawStroke}
        onCursorMove={moveCursor}
        activeColor={activeColor}
        brushSize={brushSize}
        isEraser={isEraser}
        isDarkMode={isDarkMode}
        userId={userId}
      />
      <CursorOverlay remoteCursors={remoteCursors} users={roomState.users} />
      <FloatingToolbar
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        isEraser={isEraser}
        setIsEraser={setIsEraser}
        onUndo={undo}
        onClear={clearCanvas}
        onExport={handleExport}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
    </div>
  );
}

export default App;
