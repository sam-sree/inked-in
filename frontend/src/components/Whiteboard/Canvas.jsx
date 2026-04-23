import React, { useEffect, useRef, useState } from 'react';
import { drawStroke } from '../../utils/drawing';

export function Canvas({
  strokes,
  onStrokeEnd,
  onCursorMove,
  activeColor,
  brushSize,
  isEraser,
  isDarkMode,
  userId
}) {
  const bgCanvasRef = useRef(null);
  const fgCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
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
  }, [strokes, isDarkMode]);

  // Draw background all committed strokes
  const drawBackground = (currentStrokes) => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext('2d');
    
    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    currentStrokes.forEach((stroke) => {
      drawStroke(ctx, stroke.points, stroke.color, stroke.size, stroke.isEraser, isDarkMode);
    });
  };

  // Draw foreground active stroke
  const drawForeground = () => {
    const fgCanvas = fgCanvasRef.current;
    if (!fgCanvas) return;
    const ctx = fgCanvas.getContext('2d');
    
    ctx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);
    
    if (currentStrokeRef.current.length > 0) {
      drawStroke(ctx, currentStrokeRef.current, activeColor, brushSize, isEraser, isDarkMode);
    }
  };

  // Re-render background on committed strokes change or theme change
  useEffect(() => {
    drawBackground(strokes);
  }, [strokes, isDarkMode]);

  // Re-render foreground if active settings change mid-stroke
  useEffect(() => {
    drawForeground();
  }, [activeColor, brushSize, isEraser]);

  const handlePointerDown = (e) => {
    isDrawingRef.current = true;
    const canvas = fgCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add pressure if available
    const point = { x, y, pressure: e.pressure || 0.5 };
    currentStrokeRef.current = [point];
    drawForeground();
  };

  const handlePointerMove = (e) => {
    const canvas = fgCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onCursorMove({ x, y });

    if (!isDrawingRef.current) return;

    currentStrokeRef.current.push({ x, y, pressure: e.pressure || 0.5 });
    
    requestAnimationFrame(() => {
      drawForeground();
    });
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    
    if (currentStrokeRef.current.length > 0) {
      const strokeData = {
        userId,
        points: [...currentStrokeRef.current],
        color: activeColor,
        size: brushSize,
        isEraser
      };
      // Send to server
      onStrokeEnd(strokeData);
    }
    
    // Clear foreground
    currentStrokeRef.current = [];
    drawForeground();
  };

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
        className="absolute inset-0 touch-none"
      />
    </>
  );
}
