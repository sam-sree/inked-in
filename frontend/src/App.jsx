import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Canvas } from './components/Whiteboard/Canvas';
import { FloatingToolbar } from './components/Toolbar/FloatingToolbar';
import { CursorOverlay } from './components/Whiteboard/CursorOverlay';
import { useSocket } from './hooks/useSocket';
import { Link2, MessageSquare, Send, X } from 'lucide-react';

// Generate distinct color for user cursor
const stringToColor = (str) => {
  const palette = ['#818cf8','#c084fc','#38bdf8','#34d399','#fb923c','#f472b6','#a3e635','#fbbf24'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

const generateUserId = () => {
  let id = localStorage.getItem('inkedin-userId');
  if (!id) { id = uuidv4(); localStorage.setItem('inkedin-userId', id); }
  return id;
};

const getOrGenerateRoomInfo = () => {
  const params = new URLSearchParams(window.location.search);
  let room = params.get('room');
  let isHost = false;
  if (!room) { room = uuidv4().slice(0, 8); window.history.replaceState({}, '', `?room=${room}`); isHost = true; }
  return { roomId: room, isHost };
};

const getOrGenerateUserName = (roomId) => localStorage.getItem(`inkedin-userName-${roomId}`) || '';

function App() {
  const [roomInfo] = useState(getOrGenerateRoomInfo);
  const { roomId, isHost } = roomInfo;

  const [userId] = useState(generateUserId);
  const [userName, setUserName] = useState(() => getOrGenerateUserName(roomId));
  const [showJoinScreen, setShowJoinScreen] = useState(!userName);
  const [copied, setCopied] = useState(false);

  const [activeColor, setActiveColor] = useState('#fafafa');
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);
    if (!isDark) setActiveColor('#09090b');
  }, []);

  const userConfig = { id: userId, name: userName, color: stringToColor(userId + userName) };

  const { roomState, remoteCursors, drawingUsers, messages, drawStroke, moveCursor, setDrawingStatus, sendChatMessage, undo, clearCanvas } = useSocket(roomId || 'default', userConfig);
  const [showUsersPopup, setShowUsersPopup] = useState(false);
  
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isChatOpen, messages]);

  useEffect(() => {
    if (!isChatOpen && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.userId !== userId) {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [messages]);

  const [viewMatrix, setViewMatrix] = useState({ x: 0, y: 0, scale: 1 });
  const viewMatrixRef = useRef(viewMatrix);
  useEffect(() => { viewMatrixRef.current = viewMatrix; }, [viewMatrix]);

  // Window-level cursor tracking (works even over toolbar/badges)
  useEffect(() => {
    let rafId = null;
    const handleMove = (e) => {
      // Extract properties immediately since native events might mutate
      const clientX = e.clientX;
      const clientY = e.clientY;
      
      if (rafId) return; // throttle via RAF
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const vm = viewMatrixRef.current;
        const worldPos = {
          x: (clientX - vm.x) / vm.scale,
          y: (clientY - vm.y) / vm.scale,
        };
        moveCursor(worldPos);
      });
    };
    window.addEventListener('pointermove', handleMove);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [moveCursor]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.background = '#08080c';
      if (activeColor === '#09090b') setActiveColor('#fafafa');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.background = '#f4f4f8';
      if (activeColor === '#fafafa') setActiveColor('#09090b');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(d => !d);

  const handleExport = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const temp = document.createElement('canvas');
    temp.width = canvas.width;
    temp.height = canvas.height;
    const ctx = temp.getContext('2d');
    ctx.fillStyle = isDarkMode ? '#08080c' : '#f4f4f8';
    ctx.fillRect(0, 0, temp.width, temp.height);
    ctx.drawImage(canvas, 0, 0);
    const link = document.createElement('a');
    link.download = `InkedIn-${roomId}.png`;
    link.href = temp.toDataURL('image/png');
    link.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const onlineCount = Math.max(1, Object.keys(roomState.users || {}).length);

  if (!roomId) return null;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>

      {/* ── Join Screen Overlay ── */}
      {showJoinScreen && (
        <div className="join-modal-overlay">
          <div className="join-modal">
            {/* Decorative orbs */}
            <div style={{
              position: 'absolute', top: '-60px', right: '-40px',
              width: '180px', height: '180px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
              animation: 'orbFloat 6s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: '-40px', left: '-30px',
              width: '140px', height: '140px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
              animation: 'orbFloat 8s ease-in-out infinite reverse',
              pointerEvents: 'none',
            }} />

            {/* Logo mark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.75rem' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h1 className="font-display" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#e8e8f0', letterSpacing: '-0.01em' }}>
                  InkedIn
                </h1>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(133,133,168,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
                  Collaborative Board
                </p>
              </div>
            </div>

            <h2 style={{ margin: '0 0 0.375rem', fontSize: '1.5rem', fontWeight: 700, color: '#e8e8f0', letterSpacing: '-0.02em', fontFamily: "'Space Grotesk', sans-serif" }}>
              Join the board
            </h2>
            <p style={{ margin: '0 0 1.75rem', fontSize: '0.875rem', color: 'rgba(133,133,168,0.9)', lineHeight: 1.6 }}>
              Enter your name to start drawing with others in real time.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const name = e.target.name.value.trim() || `Guest-${roomId.slice(0, 4)}`;
              setUserName(name);
              localStorage.setItem(`inkedin-userName-${roomId}`, name);
              setShowJoinScreen(false);
            }}>
              <input
                autoFocus
                name="name"
                type="text"
                placeholder="Your name…"
                maxLength={24}
                className="join-input"
                style={{ marginBottom: '0.875rem', display: 'block' }}
              />
              <button type="submit" className="join-btn">
                Enter Board →
              </button>
            </form>

            <p style={{ margin: '1.25rem 0 0', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(99,99,130,0.7)' }}>
              Room <code style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', letterSpacing: '0.05em' }}>{roomId}</code>
            </p>
          </div>
        </div>
      )}

      {/* ── Canvas Layers ── */}
      <Canvas
        strokes={roomState.strokes}
        onStrokeEnd={drawStroke}
        onDrawingChange={setDrawingStatus}
        activeColor={activeColor}
        brushSize={brushSize}
        isEraser={isEraser}
        isDarkMode={isDarkMode}
        userId={userId}
        viewMatrix={viewMatrix}
        setViewMatrix={setViewMatrix}
      />

      <CursorOverlay remoteCursors={remoteCursors} users={roomState.users} viewMatrix={viewMatrix} />

      {/* ── Toolbar ── */}
      <FloatingToolbar
        activeColor={activeColor} setActiveColor={setActiveColor}
        brushSize={brushSize} setBrushSize={setBrushSize}
        isEraser={isEraser} setIsEraser={setIsEraser}
        onUndo={undo} onClear={clearCanvas}
        onExport={handleExport}
        isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}
      />

      {/* ── Top-left Room Badge ── */}
      <div style={{
        position: 'fixed', top: '1.25rem', left: '1.25rem', zIndex: 50,
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0.5rem 0.875rem',
        borderRadius: '14px',
        background: 'rgba(13,13,22,0.82)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}>
        {/* Logo mark mini */}
        <div style={{
          width: '24px', height: '24px', borderRadius: '6px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
              stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#c4c4d8', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' }}>
          InkedIn
        </span>

        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />

        {/* Online indicator */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowUsersPopup(p => !p)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '2px 4px', borderRadius: '4px'
            }}
          >
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 6px rgba(34,197,94,0.7)',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(180,180,200,0.75)', fontWeight: 500 }}>
              {onlineCount === 1 ? 'just you' : `${onlineCount} online`}
            </span>
          </button>

          {/* Users Popup */}
          {showUsersPopup && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '12px',
              background: 'rgba(20,20,30,0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '8px 0',
              minWidth: '160px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 100,
            }}>
              {Object.values(roomState.users || {}).map(u => (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 16px',
                }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: u.color,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '0.75rem', color: '#e8e8f0', fontWeight: 500, flex: 1 }}>
                    {u.name} {u.id === userId && '(you)'}
                  </span>
                  {drawingUsers[u.id] && (
                    <span style={{ fontSize: '0.65rem', color: '#a5b4fc', fontStyle: 'italic', opacity: 0.8 }}>
                      drawing...
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Copy link button */}
        <button
          onClick={handleCopyLink}
          title="Copy invite link"
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '3px 8px', borderRadius: '8px',
            background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.12)',
            border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.25)'}`,
            color: copied ? '#86efac' : '#a5b4fc',
            fontSize: '0.72rem', fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <Link2 size={11} />
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      {/* ── Zoom Badge ── */}
      <div className="zoom-badge">
        {Math.round(viewMatrix.scale * 100)}%
      </div>
      {/* ── Chat Toggle Button ── */}
      <button
        onClick={() => setIsChatOpen(prev => !prev)}
        className="chat-toggle-btn"
      >
        <MessageSquare size={22} />
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            width: '10px', height: '10px', borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 6px rgba(239,68,68,0.8)'
          }} />
        )}
      </button>

      {/* ── Chat Window ── */}
      <div className={`chat-window ${isChatOpen ? 'open' : ''}`} style={{ overflow: 'hidden' }}>
        {/* Chat Header */}
        <div style={{
          padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e8e8f0', fontFamily: "'Space Grotesk', sans-serif" }}>
            Room Chat
          </span>
          <button 
            onClick={() => setIsChatOpen(false)}
            style={{ background: 'transparent', border: 'none', color: '#8585a8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat Messages */}
        <div style={{
          flex: 1, padding: '1rem', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8585a8', fontSize: '0.8rem', marginTop: 'auto', marginBottom: 'auto' }}>
              No messages yet.<br/>Say hi!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.userId === userId;
              return (
                <div key={msg.id} style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start'
                }}>
                  <span style={{ fontSize: '0.65rem', color: '#8585a8', marginBottom: '4px', marginLeft: isMe ? 0 : '8px', marginRight: isMe ? '8px' : 0 }}>
                    {isMe ? 'You' : msg.userName}
                  </span>
                  <div style={{
                    padding: '8px 12px', borderRadius: '12px',
                    background: isMe ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isMe ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    color: '#e8e8f0', fontSize: '0.85rem',
                    maxWidth: '85%', wordBreak: 'break-word',
                    borderBottomRightRadius: isMe ? '2px' : '12px',
                    borderBottomLeftRadius: isMe ? '12px' : '2px',
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (chatInput.trim()) {
              sendChatMessage(chatInput);
              setChatInput('');
            }
          }}
          style={{
            padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)'
          }}
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '8px 12px', color: '#e8e8f0', fontSize: '0.85rem', outline: 'none'
            }}
          />
          <button 
            type="submit"
            disabled={!chatInput.trim()}
            style={{
              background: chatInput.trim() ? '#6366f1' : 'rgba(255,255,255,0.05)',
              border: 'none', borderRadius: '8px', padding: '8px',
              color: chatInput.trim() ? '#fff' : '#8585a8', cursor: chatInput.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
