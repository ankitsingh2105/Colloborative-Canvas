export function smoothDrawUsingLast3(ctx, path, strokeSize, color) {
  ctx.lineWidth = strokeSize;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (path.points.length < 3) {
    const last = path.points[path.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    return;
  }

  const p0 = path.points[path.points.length - 3];
  const p1 = path.points[path.points.length - 2];
  const p2 = path.points[path.points.length - 1];

  const m0 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
  const m1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

  ctx.beginPath();
  ctx.moveTo(m0.x, m0.y);
  ctx.quadraticCurveTo(p1.x, p1.y, m1.x, m1.y);
  ctx.stroke();
}
