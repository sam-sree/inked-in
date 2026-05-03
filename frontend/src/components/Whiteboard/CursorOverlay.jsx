import React, { useEffect, useRef, useState } from 'react';

export function CursorOverlay({ remoteCursors, users, viewMatrix }) {
  // Track last-seen timestamp per userId to auto-hide stale cursors
  const timestampsRef = useRef({});
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    Object.keys(remoteCursors).forEach(id => {
      timestampsRef.current[id] = Date.now();
    });
    // Re-check every second to hide stale cursors
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, [remoteCursors]);

  const now = Date.now();

  return (
    <div style={{ pointerEvents: 'none', position: 'fixed', inset: 0, zIndex: 40, overflow: 'hidden' }}>
      {Object.entries(remoteCursors).map(([userId, position]) => {
        const user = users[userId];
        if (!position) return null;
        // Hide if no cursor update for 3 seconds
        const lastSeen = timestampsRef.current[userId] || 0;
        if (now - lastSeen > 3000) return null;

        const displayName = user?.name || 'Guest';
        const displayColor = user?.color || '#6366f1';

        // Safe fallbacks to prevent NaN breaking the CSS translate
        const safePosX = typeof position.x === 'number' ? position.x : 0;
        const safePosY = typeof position.y === 'number' ? position.y : 0;
        const safeScale = typeof viewMatrix.scale === 'number' ? viewMatrix.scale : 1;
        
        const screenX = safePosX * safeScale + (viewMatrix.x || 0);
        const screenY = safePosY * safeScale + (viewMatrix.y || 0);
        const cursorScale = Math.max(0.6, Math.min(1.4, safeScale));

        return (
          <div
            key={userId}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              translate: `${screenX}px ${screenY}px`,
              transition: 'translate 60ms linear',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              animation: 'cursorFadeIn 0.25s ease forwards',
            }}
          >
            {/* Glowing cursor SVG */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                color: displayColor,
                filter: `drop-shadow(0 0 6px ${displayColor}bb) drop-shadow(0 2px 4px rgba(0,0,0,0.5))`,
                transform: `scale(${cursorScale})`,
                transformOrigin: 'top left',
                flexShrink: 0,
              }}
            >
              <path
                d="M5.65376 2.02384C5.10906 1.77665 4.49999 2.17437 4.49999 2.77494V20.2115C4.49999 20.8407 5.17646 21.2152 5.67923 20.8647L10.9419 17.1963C11.1611 17.0435 11.4286 16.9733 11.6967 16.9961L18.8953 17.6074C19.5255 17.6609 20.0097 16.9937 19.7431 16.438L5.65376 2.02384Z"
                fill="currentColor"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>

            {/* Name label */}
            <div
              style={{
                marginLeft: '4px',
                marginTop: `${cursorScale * 14}px`,
                padding: '2px 8px 3px',
                borderRadius: '8px',
                background: displayColor,
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                boxShadow: `0 2px 8px ${displayColor}60, 0 1px 3px rgba(0,0,0,0.4)`,
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                userSelect: 'none',
              }}
            >
              {displayName}
            </div>
          </div>
        );
      })}
    </div>
  );
}
