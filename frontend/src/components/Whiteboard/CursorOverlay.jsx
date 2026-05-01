import React from 'react';

export function CursorOverlay({ remoteCursors, users }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {Object.entries(remoteCursors).map(([userId, position]) => {
        const user = users[userId];
        if (!user || !position) return null;

        return (
          <div
            key={userId}
            className="absolute top-0 left-0 transition-transform duration-75 ease-out flex flex-row items-start"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
            }}
          >
            {/* Custom glowing cursor icon */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-lg"
              style={{ color: user.color, filter: `drop-shadow(0 0 8px ${user.color}80)` }}
            >
              <path
                d="M5.65376 2.02384C5.10906 1.77665 4.49999 2.17437 4.49999 2.77494V20.2115C4.49999 20.8407 5.17646 21.2152 5.67923 20.8647L10.9419 17.1963C11.1611 17.0435 11.4286 16.9733 11.6967 16.9961L18.8953 17.6074C19.5255 17.6609 20.0097 16.9937 19.7431 16.438L5.65376 2.02384Z"
                fill="currentColor"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>

            {/* Label */}
            <div 
              className="ml-1 px-2 py-0.5 rounded-lg text-[12px] text-white font-bold shadow-xl whitespace-nowrap backdrop-blur-md border border-white/20 mt-3"
              style={{ backgroundColor: `${user.color}` }}
            >
              {user.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
