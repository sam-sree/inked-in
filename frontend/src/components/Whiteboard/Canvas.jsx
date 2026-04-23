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
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef([]);

  // Resize canvas to window size
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redraw(strokes);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial sizing
    
    return () => window.removeEventListener('resize', handleResize);
  }, [strokes, isDarkMode]); // Needs redraw on dark mode change due to eraser color

  // Redraw all strokes
  const redraw = (currentStrokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    currentStrokes.forEach((stroke) => {
      drawStroke(ctx, stroke.points, stroke.color, stroke.size, stroke.isEraser, isDarkMode);
    });

    // Draw current stroke being drawn by local user
    if (currentStrokeRef.current.length > 0) {
      drawStroke(ctx, currentStrokeRef.current, activeColor, brushSize, isEraser, isDarkMode);
    }
  };

  useEffect(() => {
    redraw(strokes);
  }, [strokes, isDarkMode, activeColor, brushSize, isEraser]);

  const handlePointerDown = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add pressure if available
    const point = { x, y, pressure: e.pressure || 0.5 };
    currentStrokeRef.current = [point];
    redraw(strokes);
  };

  const handlePointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onCursorMove({ x, y });

    if (!isDrawing) return;

    currentStrokeRef.current.push({ x, y, pressure: e.pressure || 0.5 });
    
    // Use requestAnimationFrame for smooth drawing
    requestAnimationFrame(() => {
      redraw(strokes);
    });
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
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
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute inset-0 touch-none"
    />
  );
}
