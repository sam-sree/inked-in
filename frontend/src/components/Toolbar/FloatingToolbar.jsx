import React from 'react';
import { Pencil, Eraser, Undo, Trash2, Sun, Moon, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function FloatingToolbar({
  activeColor,
  setActiveColor,
  brushSize,
  setBrushSize,
  isEraser,
  setIsEraser,
  onUndo,
  onClear,
  onExport,
  isDarkMode,
  toggleDarkMode,
}) {
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#fafafa', '#09090b'];

  const buttonClass = "p-2 rounded-xl transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center";
  const activeClass = "bg-slate-200 dark:bg-slate-800 shadow-sm";

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-3 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-2xl border border-slate-200/50 dark:border-white/10 select-none">
      
      {/* Colors */}
      <div className="flex gap-2 border-r border-slate-300 dark:border-slate-700 pr-4">
        {colors.map(color => {
          let displayColor = color;
          if (color === '#fafafa' && isDarkMode) displayColor = '#fafafa'; // Keep it white in dark mode
          if (color === '#09090b' && !isDarkMode) displayColor = '#09090b';

          return (
            <button
              key={color}
              className={twMerge(
                "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                activeColor === color && !isEraser ? "border-blue-500 scale-110" : "border-slate-300 dark:border-slate-700"
              )}
              style={{ backgroundColor: color }}
              onClick={() => { setActiveColor(color); setIsEraser(false); }}
              aria-label={`Color ${color}`}
            />
          );
        })}
      </div>

      <div className="flex gap-2 border-r border-slate-300 dark:border-slate-700 pr-4">
        {/* Brush Size */}
        <div className="flex items-center gap-2 px-2">
          <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"></div>
          <input
            type="range"
            min="2"
            max="40"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24 accent-blue-500"
          />
          <div className="w-5 h-5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
        </div>
      </div>

      {/* Tools */}
      <div className="flex items-center gap-2 border-r border-slate-300 dark:border-slate-700 pr-4">
        <button
          onClick={() => setIsEraser(false)}
          className={twMerge(buttonClass, !isEraser && activeClass)}
          title="Pencil"
        >
          <Pencil size={20} className="text-slate-700 dark:text-slate-300" />
        </button>
        <button
          onClick={() => setIsEraser(true)}
          className={twMerge(buttonClass, isEraser && activeClass)}
          title="Eraser"
        >
          <Eraser size={20} className="text-slate-700 dark:text-slate-300" />
        </button>
        <button onClick={onUndo} className={buttonClass} title="Undo">
          <Undo size={20} className="text-slate-700 dark:text-slate-300" />
        </button>
        <button onClick={onClear} className={twMerge(buttonClass, "hover:text-red-500")} title="Clear Canvas">
          <Trash2 size={20} className="text-red-500" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onExport} className={buttonClass} title="Export as Image">
          <Download size={20} className="text-slate-700 dark:text-slate-300" />
        </button>
        <button onClick={toggleDarkMode} className={buttonClass} title="Toggle Theme">
          {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-700" />}
        </button>
      </div>

    </div>
  );
}
