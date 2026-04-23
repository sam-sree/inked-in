import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory store
// rooms[roomId] = { strokes: [], users: {} }
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', ({ roomId, user }) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { strokes: [], users: {} });
    }
    
    const room = rooms.get(roomId);
    room.users[socket.id] = { id: socket.id, ...user };

    // Send current state to the joined user
    socket.emit('room-state', {
      strokes: room.strokes,
      users: room.users
    });

    // Notify others
    socket.to(roomId).emit('user-joined', room.users[socket.id]);
    
    // Store roomId in socket for easy access on disconnect
    socket.roomId = roomId;
  });

  socket.on('draw-stroke', (stroke) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;

    room.strokes.push(stroke);
    // Broadcast to others
    socket.to(roomId).emit('draw-stroke', stroke);
  });

  socket.on('cursor-move', (position) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room || !room.users[socket.id]) return;

    socket.to(roomId).emit('cursor-move', {
      userId: room.users[socket.id].id,
      position
    });
  });

  socket.on('undo', () => {
    const roomId = socket.roomId;
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;

    const userObj = room.users[socket.id];
    if (!userObj) return;

    // Find the last stroke by this user and remove it
    for (let i = room.strokes.length - 1; i >= 0; i--) {
      if (room.strokes[i].userId === userObj.id) {
        room.strokes.splice(i, 1);
        break;
      }
    }
    
    // Broadcast entire state on undo for simplicity
    io.to(roomId).emit('room-state', { strokes: room.strokes, users: room.users });
  });

  socket.on('clear-canvas', () => {
    const roomId = socket.roomId;
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;

    room.strokes = [];
    io.to(roomId).emit('clear-canvas');
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const roomId = socket.roomId;
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      const userObj = room.users[socket.id];
      if (userObj) {
        delete room.users[socket.id];
        socket.to(roomId).emit('user-left', userObj.id);
      }
      
      if (Object.keys(room.users).length === 0) {
        // Optional: clean up empty rooms after some time, 
        // for now we'll keep the board alive until memory resets
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
