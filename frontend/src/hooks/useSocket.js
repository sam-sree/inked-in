import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.PROD 
  ? window.location.origin 
  : 'http://localhost:3001';

export const useSocket = (roomId, user) => {
  const socketRef = useRef();
  const [roomState, setRoomState] = useState({ strokes: [], users: {} });
  const userRef = useRef(user);
  const [remoteCursors, setRemoteCursors] = useState({});

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
    });

    socketRef.current.emit('join-room', { roomId, user });

    // Immediately add local user so online count is correct from the start
    setRoomState(prev => ({ ...prev, users: { ...prev.users, [user.id]: user } }));

    socketRef.current.on('room-state', (state) => {
      const transformedUsers = {};
      Object.values(state.users || {}).forEach((u) => {
        transformedUsers[u.id] = u;
      });
      // Ensure local user is always present
      transformedUsers[userRef.current.id] = userRef.current;
      setRoomState({ ...state, users: transformedUsers });
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

    socketRef.current.on('undo', (strokes) => {
      setRoomState((prev) => ({ ...prev, strokes: strokes ?? prev.strokes.slice(0, -1) }));
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

  const drawStroke = useCallback((stroke) => {
    socketRef.current?.emit('draw-stroke', stroke);
    setRoomState((prev) => ({
      ...prev,
      strokes: [...prev.strokes, stroke],
    }));
  }, []);

  const moveCursor = useCallback((position) => {
    socketRef.current?.emit('cursor-move', position);
  }, []);

  const undo = useCallback(() => {
    socketRef.current?.emit('undo');
  }, []);

  const clearCanvas = useCallback(() => {
    socketRef.current?.emit('clear-canvas');
    setRoomState((prev) => ({ ...prev, strokes: [] }));
  }, []);

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
