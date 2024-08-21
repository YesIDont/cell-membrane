const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('contextmenu', (e) => e.preventDefault());

const infoMessage = document.getElementById('info');

const minRadius = 5;
const margin = 16;
const outlineThickness = 4;
const outlineColor = '#55cc99';
const circleThickness = 3;
const circleColor = '#55ccee';

const circles = [
  { x: 97, y: 178, r: 5 },
  { x: 217, y: 128, r: 36.87817782917155 },
  { x: 90, y: 88, r: 48.16637831516918 },
  { x: 168, y: 164, r: 5.0990195135927845 },
  { x: 238, y: 190, r: 5 },
  { x: 169, y: 76, r: 14.866068747318506 },
  { x: 207, y: 224, r: 12.727922061357855 },
  { x: 144, y: 200, r: 20 },
  { x: 161, y: 132, r: 8.48528137423857 },
  { x: 85, y: 155, r: 13.038404810405298 },
  { x: 286, y: 125, r: 5 },
  { x: 264, y: 234, r: 22.67156809750927 },
  { x: 280, y: 162, r: 9.219544457292887 },
  { x: 316, y: 159, r: 17.804493814764857 },
  { x: 338, y: 222, r: 33.015148038438355 },
];

document.addEventListener('mouseup', () => {
  console.log({ circles });
});

document.addEventListener('mousedown', (e) => {
  if (infoMessage && infoMessage.style.display !== 'none') {
    infoMessage.style.display = 'none';
  }

  // check if mouse point is inside any circle
  const mouseX = e.clientX;
  const mouseY = e.clientY;
  const circle = circles.find((circle) => {
    const dx = circle.x - mouseX;
    const dy = circle.y - mouseY;
    return dx * dx + dy * dy < circle.r * circle.r;
  });
  // if mouse is inside a circle, move the circle
  if (circle) {
    // if right click remove the circle
    if (e.button === 2) {
      const index = circles.indexOf(circle);
      circles.splice(index, 1);
      return;
    }
    const offsetX = mouseX - circle.x;
    const offsetY = mouseY - circle.y;
    const mouseMoveHandler = (e) => {
      circle.x = e.clientX - offsetX;
      circle.y = e.clientY - offsetY;
    };
    const mouseUpHandler = () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    return;
  }

  // if mouse is not inside any circle, create a new circle allowing to resize it on drag
  const newCircle = { x: mouseX, y: mouseY, r: minRadius };
  circles.push(newCircle);
  const mouseMoveHandler = (e) => {
    const dx = e.clientX - newCircle.x;
    const dy = e.clientY - newCircle.y;
    newCircle.r = Math.max(Math.sqrt(dx * dx + dy * dy), minRadius);
  };
  const mouseUpHandler = () => {
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
  };
  document.addEventListener('mousemove', mouseMoveHandler);
  document.addEventListener('mouseup', mouseUpHandler);
});

/// Function to calculate the convex hull using the Andrew's monotone chain algorithm
function convexHull(points) {
  points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const cross = (o, a, b) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower = [];
  for (let p of points) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    )
      lower.pop();
    lower.push(p);
  }

  const upper = [];
  for (let p of points.reverse()) {
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    )
      upper.pop();
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

// Function to approximate a circle with points
function getCirclePoints(centerX, centerY, radius, numPoints = 100) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const x = centerX + (radius + margin) * Math.cos(angle);
    const y = centerY + (radius + margin) * Math.sin(angle);
    points.push([x, y]);
  }
  return points;
}

function loop() {
  // Collect points from all circles
  let points = [];
  for (const circle of circles) {
    points = points.concat(getCirclePoints(circle.x, circle.y, circle.r, 50)); // 50 points per circle
  }

  // Calculate the convex hull
  const hull = convexHull(points);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the circles (for demonstration)
  ctx.fillStyle = 'blue';
  for (const circle of circles) {
    ctx.lineWidth = circleThickness;
    ctx.strokeStyle = circleColor;
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Now draw the rounded convex hull (the membrane outline)
  ctx.beginPath();

  // Define a curve smoothing factor
  const curveFactor = 0.5;

  for (let i = 0; i < hull.length; i++) {
    const start = hull[i];
    const end = hull[(i + 1) % hull.length];
    const next = hull[(i + 2) % hull.length];

    const midX1 = (start[0] + end[0]) / 2;
    const midY1 = (start[1] + end[1]) / 2;
    const midX2 = (end[0] + next[0]) / 2;
    const midY2 = (end[1] + next[1]) / 2;

    if (i === 0) {
      ctx.moveTo(midX1, midY1);
    }

    ctx.quadraticCurveTo(end[0], end[1], midX2, midY2);
  }

  ctx.closePath();

  // Set outline style
  ctx.lineJoin = 'round'; // Smooth corners
  ctx.strokeStyle = outlineColor; // Outline color
  ctx.lineWidth = outlineThickness; // Outline thickness

  ctx.stroke();

  requestAnimationFrame(loop);
}

loop();
