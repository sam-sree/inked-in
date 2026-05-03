import React, { useEffect, useRef, useState } from 'react';
import { drawStroke } from '../../utils/drawing';

export function Canvas({
  strokes,
  onStrokeEnd,
  onDrawingChange,
  activeColor,
  brushSize,
  isEraser,
  isDarkMode,
  userId,
  viewMatrix,
  setViewMatrix
}) {
  const bgCanvasRef = useRef(null);
  const fgCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const currentStrokeRef = useRef([]);

  // Resize both canvases to window size
  useEffect(() => {
    const handleResize = () => {
      const bgCanvas = bgCanvasRef.current;
      const fgCanvas = fgCanvasRef.current;
      if (!bgCanvas || !fgCanvas) return;
      
      bgCanvas.width = window.innerWidth;
      bgCanvas.height = window.innerHeight;
      fgCanvas.width = window.innerWidth;
      fgCanvas.height = window.innerHeight;
      
      drawBackground(strokes);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial sizing
    
    return () => window.removeEventListener('resize', handleResize);
  }, [strokes, isDarkMode, viewMatrix]);

  const drawGrid = (ctx, width, height) => {
    const gridSize = 36;
    const dotRadius = 1.6; // slightly larger for clarity
    const color = isDarkMode ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.18)';

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = isDarkMode ? '#08080c' : '#f4f4f8';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    ctx.fillStyle = color;

    const startX = Math.floor(-viewMatrix.x / (gridSize * viewMatrix.scale)) * gridSize;
    const startY = Math.floor(-viewMatrix.y / (gridSize * viewMatrix.scale)) * gridSize;
    const endX = startX + Math.ceil(width / (gridSize * viewMatrix.scale)) * gridSize + gridSize;
    const endY = startY + Math.ceil(height / (gridSize * viewMatrix.scale)) * gridSize + gridSize;

    // Clamp dot radius so it stays visible when zoomed out but not huge when zoomed in
    const clampedRadius = Math.max(0.8, Math.min(dotRadius, dotRadius / viewMatrix.scale));

    for (let x = startX; x <= endX; x += gridSize) {
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, clampedRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Draw background all committed strokes
  const drawBackground = (currentStrokes) => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext('2d');
    
    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    ctx.save();
    ctx.translate(viewMatrix.x, viewMatrix.y);
    ctx.scale(viewMatrix.scale, viewMatrix.scale);
    
    drawGrid(ctx, bgCanvas.width, bgCanvas.height);

    currentStrokes.forEach((stroke) => {
      drawStroke(ctx, stroke.points, stroke.color, stroke.size, stroke.isEraser, isDarkMode);
    });
    ctx.restore();
  };

  // Draw foreground active stroke
  const drawForeground = () => {
    const fgCanvas = fgCanvasRef.current;
    if (!fgCanvas) return;
    const ctx = fgCanvas.getContext('2d');
    
    ctx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);
    
    if (currentStrokeRef.current.length > 0) {
      ctx.save();
      ctx.translate(viewMatrix.x, viewMatrix.y);
      ctx.scale(viewMatrix.scale, viewMatrix.scale);
      drawStroke(ctx, currentStrokeRef.current, activeColor, brushSize, isEraser, isDarkMode);
      ctx.restore();
    }
  };

  // Re-render background on committed strokes change or theme change
  useEffect(() => {
    drawBackground(strokes);
  }, [strokes, isDarkMode, viewMatrix]);

  // Re-render foreground if active settings change mid-stroke
  useEffect(() => {
    drawForeground();
  }, [activeColor, brushSize, isEraser, viewMatrix]);

  // Helper to convert screen to world coordinates
  const screenToWorld = (x, y) => {
    return {
      x: (x - viewMatrix.x) / viewMatrix.scale,
      y: (y - viewMatrix.y) / viewMatrix.scale
    };
  };

  const handlePointerDown = (e) => {
    // Check for panning (middle click or space+left click or right click)
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey)) {
      isPanningRef.current = true;
      lastPositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button !== 0) return;

    isDrawingRef.current = true;
    if (onDrawingChange) onDrawingChange(true);

    const worldPos = screenToWorld(e.clientX, e.clientY);
    
    const point = { x: worldPos.x, y: worldPos.y, pressure: e.pressure || 0.5 };
    currentStrokeRef.current = [point];
    drawForeground();
  };

  const handlePointerMove = (e) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);

    if (isPanningRef.current) {
      const dx = e.clientX - lastPositionRef.current.x;
      const dy = e.clientY - lastPositionRef.current.y;
      
      setViewMatrix(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      lastPositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!isDrawingRef.current) return;

    currentStrokeRef.current.push({ x: worldPos.x, y: worldPos.y, pressure: e.pressure || 0.5 });
    
    requestAnimationFrame(() => {
      drawForeground();
    });
  };

  const handlePointerUp = () => {
    isPanningRef.current = false;

    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (onDrawingChange) onDrawingChange(false);
    
    if (currentStrokeRef.current.length > 0) {
      const strokeData = {
        userId,
        points: [...currentStrokeRef.current],
        color: activeColor,
        size: brushSize,
        isEraser
      };
      onStrokeEnd(strokeData);
    }
    
    currentStrokeRef.current = [];
    drawForeground();
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(viewMatrix.scale * (1 + scaleAmount), 0.1), 10);
    
    // Zoom around cursor
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    const worldX = (mouseX - viewMatrix.x) / viewMatrix.scale;
    const worldY = (mouseY - viewMatrix.y) / viewMatrix.scale;
    
    setViewMatrix({
      scale: newScale,
      x: mouseX - worldX * newScale,
      y: mouseY - worldY * newScale
    });
  };

  useEffect(() => {
    const canvas = fgCanvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [viewMatrix, setViewMatrix]);

  return (
    <>
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 pointer-events-none"
      />
      <canvas
        ref={fgCanvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className="absolute inset-0 touch-none cursor-crosshair"
      />
    </>
  );
}
