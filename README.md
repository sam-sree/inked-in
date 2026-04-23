# InkedIn 🖌️ 

InkedIn is a modern, production-ready real-time collaborative whiteboard web application. It allows multiple users to join a shared room and draw synchronously with extremely low latency. Built with a focus on performance and a visually stunning UI, InkedIn features smooth stroke rendering, real-time custom cursor tracking, and a sleek glassmorphic design.

## ✨ Features

- **Real-Time Sync**: Instantaneous drawing updates across clients via WebSockets (`Socket.io`).
- **Smooth Stroke Rendering**: Implements mathematical bezier curves (`perfect-freehand`) mapped natively over the HTML Canvas context to draw incredibly smooth, pressure-simulated lines at 60fps.
- **Custom Collaborative Cursors**: Every user gets a uniquely colored, named, and smooth-trailing custom cursor overlapping the workspace.
- **Smart Rooms**: Unique session links generated instantly (e.g., `?room=abc`) allowing frictionless user joining without complex signups.
- **Glassmorphism UI**: Beautiful floating overlays constructed with Tailwind CSS v4, utilizing responsive `backdrop-blur` techniques.
- **Advanced Tools**: Support for multiple brush sizes, custom color picking, isolated undo mechanics (you undo *your* strokes, not others'), whole-board erasing, and full canvas image exportation.
- **Adaptive Dark Mode**: Toggles cleanly between light and dark variants to ease eye strain, intelligently reverting strokes to white against a dark background or black against light.

## 🛠️ Technology Stack

- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS v4, Lucide React (Icons)
- **Engine**: Native HTML5 Canvas `2d` + `perfect-freehand`
- **Backend API**: Node.js + Express
- **Real-time Protocol**: Socket.io

---

## 🚀 Getting Started

This repository is structured as a monorepo. It requires both the backend and frontend servers to be running simultaneously to achieve real-time synchronization.

### 1. Backend Setup (WebSocket Server)

Navigate to the `backend` directory, install dependencies, and start the local express instance.

```bash
cd backend
npm install
npm start
```
*The backend server will instantiate on `http://localhost:3001`.*

### 2. Frontend Setup (React App)

Open a **new** terminal window, navigate to the `frontend` directory, install dependencies, and start the local Vite development server.

```bash
cd frontend
npm install
npm run dev
```
*The frontend Vite server typically runs on `http://localhost:5173`.*

### 3. Start Collaborating

Open the frontend URL provided by Vite in your browser. Copy the URL (which will include your automatically generated unique `?room=XXX` ID) and send it or open it in a secondary browser window to instantly test real-time collaboration.

## 🧠 Architecture Highlights

- **React Re-rendering Bypass**: To ensure optimal drawing capabilities, standard React `useState` hooks are bypassed inside the core 60fps drawing event loop. Complex multi-point paths are managed internally through `useRef` and mapped over `requestAnimationFrame`.
- **Stateless Broadcasting**: The backend retains drawing context memory allowing late-joiners to adopt full board states seamlessly, while avoiding payload bloating by only explicitly exchanging newly drawn lines to active rooms over Socket.io. 
