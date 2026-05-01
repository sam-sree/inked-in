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
    <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col md:flex-row items-center gap-2 md:gap-4 p-2 md:p-3 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg shadow-2xl border border-slate-200/50 dark:border-white/10 select-none w-[95vw] md:w-auto max-w-4xl">
      
      {/* Colors & Tools Row for Mobile */}
      <div className="flex items-center justify-between w-full md:w-auto gap-2 md:gap-4">
        
        {/* Colors */}
        <div className="flex gap-1.5 md:gap-2 overflow-x-auto no-scrollbar py-1 md:border-r border-slate-300 dark:border-slate-700 md:pr-4">
          {colors.map(color => (
            <button
              key={color}
              className={twMerge(
                "w-7 h-7 md:w-8 md:h-8 rounded-full border-2 flex-shrink-0 transition-transform active:scale-95",
                activeColor === color && !isEraser ? "border-blue-500 scale-110" : "border-slate-300 dark:border-slate-700"
              )}
              style={{ backgroundColor: color }}
              onClick={() => { setActiveColor(color); setIsEraser(false); }}
            />
          ))}
        </div>

        {/* Theme & Export for Mobile (Moved here for better space utilization) */}
        <div className="flex md:hidden items-center gap-1">
          <button onClick={onExport} className={buttonClass}>
            <Download size={18} className="text-slate-700 dark:text-slate-300" />
          </button>
          <button onClick={toggleDarkMode} className={buttonClass}>
            {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Main Tools Row */}
      <div className="flex items-center justify-between w-full md:w-auto gap-2">
        
        {/* Brush Size - Hidden on very small screens or made compact */}
        <div className="hidden sm:flex items-center gap-2 px-2 md:border-r border-slate-300 dark:border-slate-700 md:pr-4">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
          <input
            type="range"
            min="2"
            max="40"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-20 md:w-24 accent-blue-500"
          />
          <div className="w-4 h-4 rounded-full bg-slate-400 dark:bg-slate-500"></div>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-1 md:gap-2 md:border-r border-slate-300 dark:border-slate-700 md:pr-4 flex-1 justify-center md:justify-start">
          <button
            onClick={() => setIsEraser(false)}
            className={twMerge(buttonClass, !isEraser && activeClass)}
          >
            <Pencil size={18} className="text-slate-700 dark:text-slate-300" />
          </button>
          <button
            onClick={() => setIsEraser(true)}
            className={twMerge(buttonClass, isEraser && activeClass)}
          >
            <Eraser size={18} className="text-slate-700 dark:text-slate-300" />
          </button>
          <button onClick={onUndo} className={buttonClass}>
            <Undo size={18} className="text-slate-700 dark:text-slate-300" />
          </button>
          <button onClick={onClear} className={twMerge(buttonClass, "hover:text-red-500")}>
            <Trash2 size={18} className="text-red-500" />
          </button>
        </div>

        {/* Desktop Theme & Export */}
        <div className="hidden md:flex items-center gap-2">
          <button onClick={onExport} className={buttonClass}>
            <Download size={20} className="text-slate-700 dark:text-slate-300" />
          </button>
          <button onClick={toggleDarkMode} className={buttonClass}>
            {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-700" />}
          </button>
        </div>
      </div>

    </div>
  );
}
