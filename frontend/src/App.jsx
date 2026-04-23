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

function App() {
  const [userId] = useState(generateUserId());
  const [userName, setUserName] = useState('');
  
  // Settings state
  const [activeColor, setActiveColor] = useState('#fafafa'); // start white/black depending on theme
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Room
  const [roomId, setRoomId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let room = params.get('room');
    if (!room) {
      room = uuidv4().slice(0, 8); // simple room id
      window.history.pushState({}, '', `?room=${room}`);
    }
    setRoomId(room);

    // Prompt for Name loop to ensure it's not empty
    let storedName = localStorage.getItem('inkedin-userName');
    if (!storedName) {
      storedName = prompt('Welcome to InkedIn! Enter your name:') || `User-${room.slice(0,4)}`;
      localStorage.setItem('inkedin-userName', storedName);
    }
    setUserName(storedName);
    
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

  if (!roomId || !userName) return null;

  return (
    <div className="relative w-screen h-screen overflow-hidden">
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
