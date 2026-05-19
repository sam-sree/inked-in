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

  const activePointersRef = useRef([]);
  const initialDistanceRef = useRef(0);
  const initialCenterRef = useRef({ x: 0, y: 0 });
  const initialViewMatrixRef = useRef({ x: 0, y: 0, scale: 1 });
  const isMultiTouchRef = useRef(false);

  const getDistance = (p1, p2) => {
    const dx = p1.clientX - p2.clientX;
    const dy = p1.clientY - p2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (p1, p2) => {
    return {
      x: (p1.clientX + p2.clientX) / 2,
      y: (p1.clientY + p2.clientY) / 2
    };
  };

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
    // Add pointer to active tracking
    activePointersRef.current.push({
      pointerId: e.pointerId,
      clientX: e.clientX,
      clientY: e.clientY
    });

    // Check for multi-touch (pinch/zoom)
    if (activePointersRef.current.length >= 2) {
      isMultiTouchRef.current = true;
      isPanningRef.current = true;

      // Cancel current drawing if active
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        if (onDrawingChange) onDrawingChange(false);
        currentStrokeRef.current = [];
        drawForeground();
      }

      // Initialize pinch state
      const p1 = activePointersRef.current[0];
      const p2 = activePointersRef.current[1];
      initialDistanceRef.current = getDistance(p1, p2);
      initialCenterRef.current = getCenter(p1, p2);
      initialViewMatrixRef.current = { ...viewMatrix };
      return;
    }

    // Check for mouse-based panning (middle click or right click or space+left click)
    if (e.pointerType === 'mouse' && (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey))) {
      isPanningRef.current = true;
      lastPositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Only allow drawing with the primary pointer button (0)
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    // Do not start drawing if we are already in multi-touch mode
    if (isMultiTouchRef.current) return;

    isDrawingRef.current = true;
    if (onDrawingChange) onDrawingChange(true);

    const worldPos = screenToWorld(e.clientX, e.clientY);
    const point = { x: worldPos.x, y: worldPos.y, pressure: e.pressure || 0.5 };
    currentStrokeRef.current = [point];
    drawForeground();
  };

  const handlePointerMove = (e) => {
    // Update active pointer position
    const idx = activePointersRef.current.findIndex(p => p.pointerId === e.pointerId);
    if (idx !== -1) {
      activePointersRef.current[idx] = {
        pointerId: e.pointerId,
        clientX: e.clientX,
        clientY: e.clientY
      };
    }

    // Handle pinch-to-zoom and two-finger panning
    if (activePointersRef.current.length >= 2) {
      const p1 = activePointersRef.current[0];
      const p2 = activePointersRef.current[1];
      
      const dist = getDistance(p1, p2);
      const center = getCenter(p1, p2);

      if (initialDistanceRef.current > 0) {
        const scaleChange = dist / initialDistanceRef.current;
        let newScale = initialViewMatrixRef.current.scale * scaleChange;
        newScale = Math.min(Math.max(newScale, 0.1), 10);

        // Zoom around the initial center of the two fingers
        const worldX = (initialCenterRef.current.x - initialViewMatrixRef.current.x) / initialViewMatrixRef.current.scale;
        const worldY = (initialCenterRef.current.y - initialViewMatrixRef.current.y) / initialViewMatrixRef.current.scale;

        // Apply two-finger translation (panning)
        const dx = center.x - initialCenterRef.current.x;
        const dy = center.y - initialCenterRef.current.y;

        setViewMatrix({
          scale: newScale,
          x: initialCenterRef.current.x + dx - worldX * newScale,
          y: initialCenterRef.current.y + dy - worldY * newScale
        });
      }
      return;
    }

    // Handle single-pointer mouse/pen panning
    if (isPanningRef.current && !isMultiTouchRef.current) {
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

    // Handle drawing
    if (!isDrawingRef.current || isMultiTouchRef.current) return;

    const worldPos = screenToWorld(e.clientX, e.clientY);
    currentStrokeRef.current.push({ x: worldPos.x, y: worldPos.y, pressure: e.pressure || 0.5 });
    
    requestAnimationFrame(() => {
      drawForeground();
    });
  };

  const handlePointerUp = (e) => {
    // Remove pointer from tracking list
    activePointersRef.current = activePointersRef.current.filter(p => p.pointerId !== e.pointerId);

    // If there are no more fingers on the screen, clear all guest states
    if (activePointersRef.current.length === 0) {
      isPanningRef.current = false;
      isMultiTouchRef.current = false;
      initialDistanceRef.current = 0;
    }

    // If we transitioned from two fingers to one, save the remaining finger's coords to prevent screen jump
    if (activePointersRef.current.length === 1 && isMultiTouchRef.current) {
      const remaining = activePointersRef.current[0];
      lastPositionRef.current = { x: remaining.clientX, y: remaining.clientY };
    }

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
