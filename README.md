🖌️ InkedIn

InkedIn is a modern, production-ready real-time collaborative whiteboard web application. It allows multiple users to join a shared room and draw synchronously with extremely low latency. Built with a focus on performance and a visually stunning UI, InkedIn features smooth stroke rendering, real-time custom cursor tracking, and a sleek glassmorphic design.

🌐 Live Deployment: InkedIn is fully deployed on Render, enabling instant access without any local setup.
Users simply enter their name, open a shared room link, and start drawing together in real time. The host only needs to create a room and share the link — collaboration begins immediately.

✨ Features
Real-Time Sync: Instantaneous drawing updates across clients via WebSockets (Socket.io).
Frictionless Collaboration: No signups required. Enter your name and join a room directly through a shared link.
Smart Rooms: Unique session links generated instantly (e.g., ?room=abc) for seamless multi-user access.
Live Multiplayer Experience: Multiple users can draw simultaneously with real-time updates and zero manual refresh.
Host & Share Flow: A user can start a room and simply share the link for others to join instantly.
Smooth Stroke Rendering: Implements mathematical bezier curves (perfect-freehand) mapped natively over the HTML Canvas context to draw incredibly smooth, pressure-simulated lines at 60fps.
Custom Collaborative Cursors: Every user gets a uniquely colored, named, and smooth-trailing custom cursor overlapping the workspace.
Glassmorphism UI: Beautiful floating overlays constructed with Tailwind CSS v4, utilizing responsive backdrop-blur techniques.
Advanced Tools: Support for multiple brush sizes, custom color picking, isolated undo mechanics (you undo your strokes, not others'), whole-board erasing, and full canvas image exportation.
Adaptive Dark Mode: Toggles cleanly between light and dark variants to ease eye strain, intelligently reverting strokes to white against a dark background or black against light.
🛠️ Technology Stack
Frontend: React (Vite)
Styling: Tailwind CSS v4, Lucide React (Icons)
Engine: Native HTML5 Canvas 2D + perfect-freehand
Backend API: Node.js + Express
Real-time Protocol: Socket.io
Deployment: Render
🚀 Getting Started

This repository is structured as a monorepo. It requires both the backend and frontend servers to be running simultaneously to achieve real-time synchronization.

1. Backend Setup (WebSocket Server)
cd backend
npm install
npm start

The backend server will instantiate on http://localhost:3001
.

2. Frontend Setup (React App)

Open a new terminal window:

cd frontend
npm install
npm run dev

The frontend Vite server typically runs on http://localhost:5173
.

3. Start Collaborating

Open the frontend URL in your browser. A unique ?room=XXX ID will be generated automatically.
Share this link with others or open it in multiple tabs to experience real-time collaboration instantly.

🧠 Architecture Highlights
React Re-rendering Bypass: To ensure optimal drawing capabilities, standard React useState hooks are bypassed inside the core 60fps drawing event loop. Complex multi-point paths are managed internally through useRef and mapped over requestAnimationFrame.
Stateless Broadcasting: The backend retains drawing context memory allowing late-joiners to adopt full board states seamlessly, while avoiding payload bloating by only explicitly exchanging newly drawn lines to active rooms over Socket.io.

Live Link:  https://inked-in.onrender.com
