# 🖋️ InkedIn



<p align="center">
  <b>A premium, real-time collaborative whiteboard for seamless visual thinking.</b>
</p>

---

## 🚀 Overview

**InkedIn** is a high-performance, real-time collaborative whiteboard designed for fluid brainstorming and creative teamwork.

Built with a sleek **glassmorphic interface** and powered by low-latency communication, it enables multiple users to draw, chat, and interact on an **infinite canvas** as if they were in the same room.

---

## ✨ Features

- ⚡ **Real-Time Collaboration**  
  Instant stroke synchronization powered by WebSockets.

- 🎯 **Live Spatial Cursors**  
  See exactly where others are pointing, with names and unique colors.

- 💬 **Live Chat**  
  A smooth, slide-out chat panel to collaborate without leaving the canvas.

- ♾️ **Infinite Canvas**  
  Seamless panning and zooming with a clean dot-grid system.

- 👥 **Presence & Status**  
  Know who’s online with real-time *“drawing…”* indicators.

- 🎨 **Premium Aesthetics**  
  Dark-mode-first UI with glassmorphism, glow effects, and micro-interactions.

- 📤 **Export to PNG**  
  Download your canvas instantly in high quality.

- 🔗 **Instant Sharing**  
  Generate secure room links and invite collaborators in one click.

---

## 🛠️ Tech Stack

### Frontend
- **React.js (Vite)** — fast, modern UI
- **HTML5 Canvas API** — high-performance rendering
- **Lucide React** — clean, consistent icons
- **Custom CSS** — glassmorphism + animations

### Backend
- **Node.js + Express** — scalable server architecture
- **Socket.IO** — real-time, bi-directional communication

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm

---

### Installation

```bash
# Clone the repository
git clone https://github.com/sam-sree/inked-in.git
cd inked-in
```

```bash
# Install backend dependencies
cd backend
npm install
```

```bash
# Install frontend dependencies
cd ../frontend
npm install
```

---

### Running Locally

Run both servers simultaneously:

```bash
# Start backend (port 3001)
cd backend
npm start
```

```bash
# Start frontend (port 5173)
cd frontend
npm run dev
```

Open 👉 `http://localhost:5173`

To test real-time collaboration:
- Open the app in another tab  
- Or send the link to a friend  
- Watch the canvas come alive

---

## 🎮 Usage

| Action        | Control |
|--------------|--------|
| Draw         | Left-click + drag |
| Pan          | `Shift` + drag OR Middle-click + drag |
| Zoom         | Scroll / trackpad pinch |
| Chat         | Bottom-right message icon |
| Undo         | Toolbar undo button |
| Clear Canvas | Trash icon (with confirmation) |

---


<p align="center">
  built for ideas that refuse to stay still ✨
</p>
