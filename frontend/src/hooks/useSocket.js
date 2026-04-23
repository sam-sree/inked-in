import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:3001';

export const useSocket = (roomId, user) => {
  const socketRef = useRef();
  const [roomState, setRoomState] = useState({ strokes: [], users: {} });
  const [remoteCursors, setRemoteCursors] = useState({});

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    socketRef.current.emit('join-room', { roomId, user });

    socketRef.current.on('room-state', (state) => {
      setRoomState(state);
    });

    socketRef.current.on('draw-stroke', (stroke) => {
      setRoomState((prev) => ({
        ...prev,
        strokes: [...prev.strokes, stroke],
      }));
    });

    socketRef.current.on('cursor-move', ({ userId, position }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [userId]: position,
      }));
    });

    socketRef.current.on('clear-canvas', () => {
      setRoomState((prev) => ({ ...prev, strokes: [] }));
    });

    socketRef.current.on('user-joined', (newUser) => {
      setRoomState((prev) => ({
        ...prev,
        users: { ...prev.users, [newUser.id]: newUser },
      }));
    });

    socketRef.current.on('user-left', (userId) => {
      setRoomState((prev) => {
        const newUsers = { ...prev.users };
        delete newUsers[userId];
        return { ...prev, users: newUsers };
      });
      setRemoteCursors((prev) => {
        const newCursors = { ...prev };
        delete newCursors[userId];
        return newCursors;
      });
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId, user.id]);

  const drawStroke = (stroke) => {
    socketRef.current.emit('draw-stroke', stroke);
    setRoomState((prev) => ({
      ...prev,
      strokes: [...prev.strokes, stroke],
    }));
  };

  const moveCursor = (position) => {
    socketRef.current?.emit('cursor-move', position);
  };

  const undo = () => {
    socketRef.current.emit('undo');
  };

  const clearCanvas = () => {
    socketRef.current.emit('clear-canvas');
    setRoomState((prev) => ({ ...prev, strokes: [] }));
  };

  return {
    socket: socketRef.current,
    roomState,
    remoteCursors,
    drawStroke,
    moveCursor,
    undo,
    clearCanvas,
  };
};
