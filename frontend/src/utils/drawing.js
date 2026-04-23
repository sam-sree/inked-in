import { getStroke } from 'perfect-freehand';

// Generate SVG path string from points
export function getSvgPathFromStroke(stroke) {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );

  d.push('Z');
  return d.join(' ');
}

export function drawStroke(ctx, points, color, size, isEraser = false, isDarkMode = false) {
  if (points.length === 0) return;
  
  if (points.length === 1) {
    // Just a dot
    ctx.fillStyle = isEraser ? (isDarkMode ? '#09090b' : '#fafafa') : color;
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  
  // Convert {x, y, pressure} back to array format for perfect-freehand
  const formattedPoints = points.map(p => [p.x, p.y, p.pressure || 0.5]);
  
  const strokePath = getStroke(formattedPoints, {
    size: size,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    simulatePressure: points[0].pressure === undefined,
  });

  const pathData = getSvgPathFromStroke(strokePath);
  const path = new Path2D(pathData);
  
  if (isEraser) {
    // Use zinc-950 for dark mode background, zinc-50 for light mode
    ctx.fillStyle = isDarkMode ? '#09090b' : '#fafafa';
  } else {
    ctx.fillStyle = color;
  }
  
  ctx.fill(path);
}
