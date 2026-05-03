import React, { useState, useRef } from 'react';
import { Pencil, Eraser, Undo2, Trash2, Sun, Moon, Download, ChevronUp } from 'lucide-react';

const COLORS = [
  { hex: '#ef4444', label: 'Red' },
  { hex: '#f97316', label: 'Orange' },
  { hex: '#eab308', label: 'Yellow' },
  { hex: '#22c55e', label: 'Green' },
  { hex: '#3b82f6', label: 'Blue' },
  { hex: '#a855f7', label: 'Purple' },
  { hex: '#ec4899', label: 'Pink' },
  { hex: '#fafafa', label: 'White' },
  { hex: '#09090b', label: 'Black' },
];

export function FloatingToolbar({
  activeColor, setActiveColor,
  brushSize, setBrushSize,
  isEraser, setIsEraser,
  onUndo, onClear, onExport,
  isDarkMode, toggleDarkMode,
}) {
  const [expanded, setExpanded] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const clearTimer = useRef(null);

  const handleClear = () => {
    if (clearConfirm) {
      onClear();
      setClearConfirm(false);
      clearTimer.current && clearTimeout(clearTimer.current);
    } else {
      setClearConfirm(true);
      clearTimer.current = setTimeout(() => setClearConfirm(false), 2000);
    }
  };

  const pickColor = (hex) => {
    setActiveColor(hex);
    setIsEraser(false);
  };

  // Brush preview circle size (scaled for display)
  const previewSize = Math.max(6, Math.min(22, brushSize * 0.6));

  return (
    <>
      {/* ── Main Toolbar ── */}
      <div
        className="animate-slide-in-bottom"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          borderRadius: '20px',
          background: 'rgba(13, 13, 22, 0.88)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          userSelect: 'none',
          maxWidth: '96vw',
          flexWrap: 'nowrap',
          overflowX: 'auto',
        }}
      >
        {/* Color Swatches */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingRight: '10px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          {COLORS.map(({ hex, label }) => (
            <button
              key={hex}
              title={label}
              className="color-swatch"
              style={{ backgroundColor: hex }}
              onClick={() => pickColor(hex)}
              data-active={activeColor === hex && !isEraser}
              // CSS class handles active state
              onMouseEnter={e => { if (!(activeColor === hex && !isEraser)) e.currentTarget.style.transform = 'scale(1.2)'; }}
              onMouseLeave={e => { if (!(activeColor === hex && !isEraser)) e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {activeColor === hex && !isEraser && (
                <span style={{
                  position: 'absolute', inset: '-3px',
                  borderRadius: '50%',
                  border: '2px solid #fff',
                  boxShadow: `0 0 0 2px ${hex}80, 0 0 10px ${hex}60`,
                  pointerEvents: 'none',
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="toolbar-separator" />

        {/* Brush Size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '10px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{
            width: `${previewSize}px`, height: `${previewSize}px`,
            borderRadius: '50%',
            background: isEraser ? 'rgba(255,255,255,0.15)' : activeColor,
            border: isEraser ? '1.5px solid rgba(255,255,255,0.3)' : 'none',
            boxShadow: !isEraser ? `0 0 8px ${activeColor}80` : 'none',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            minWidth: '6px', minHeight: '6px',
          }} />
          <input
            type="range" min="2" max="48"
            value={brushSize}
            onChange={e => setBrushSize(parseInt(e.target.value))}
            className="brush-slider"
            style={{ width: '72px' }}
          />
        </div>

        {/* Tool Buttons */}
        <button
          title="Pen (P)"
          className={`toolbar-btn${!isEraser ? ' active' : ''}`}
          onClick={() => setIsEraser(false)}
        >
          <Pencil size={16} />
        </button>
        <button
          title="Eraser (E)"
          className={`toolbar-btn${isEraser ? ' active' : ''}`}
          onClick={() => setIsEraser(true)}
        >
          <Eraser size={16} />
        </button>

        <div className="toolbar-separator" />

        <button title="Undo (Ctrl+Z)" className="toolbar-btn" onClick={onUndo}>
          <Undo2 size={16} />
        </button>

        <button
          title={clearConfirm ? 'Click again to confirm' : 'Clear Canvas'}
          className={`toolbar-btn danger`}
          onClick={handleClear}
          style={clearConfirm ? {
            background: 'rgba(239,68,68,0.18)',
            borderColor: 'rgba(239,68,68,0.5)',
            color: '#fca5a5',
            animation: 'inkPulse 0.8s ease infinite',
          } : {}}
        >
          <Trash2 size={16} />
        </button>

        <div className="toolbar-separator" />

        <button title="Export PNG" className="toolbar-btn" onClick={onExport}>
          <Download size={16} />
        </button>

        <button
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="toolbar-btn"
          onClick={toggleDarkMode}
          style={{ color: isDarkMode ? '#fbbf24' : '#a5b4fc' }}
        >
          {isDarkMode
            ? <Sun size={16} />
            : <Moon size={16} />
          }
        </button>
      </div>

      {/* ── Clear Confirm Toast ── */}
      {clearConfirm && (
        <div style={{
          position: 'fixed',
          bottom: '6.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60,
          padding: '0.5rem 1.25rem',
          borderRadius: '100px',
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.3)',
          backdropFilter: 'blur(20px)',
          color: '#fca5a5',
          fontSize: '0.78rem',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          animation: 'fadeInUp 0.2s ease',
          letterSpacing: '0.02em',
        }}>
          ⚠️ Click trash again to clear the board
        </div>
      )}
    </>
  );
}
