/* Kiss Cam — Landscape, 90° Anticlockwise Rotation + Fullscreen Cover */

const video = document.getElementById('video');
const canvas = document.getElementById('cameraCanvas');
const ctx = canvas.getContext('2d');
const searchBtn = document.getElementById('searchBtn');
const kissBtn = document.getElementById('kissBtn');
const message = document.getElementById('message');
const particles = document.getElementById('particles');

// ZOOM variables
let currentScale = 1;
let lastScale = 1;
let startDist = null;
let pointerMap = new Map();
const MIN_SCALE = 1;
const MAX_SCALE = 4;

/* ---------------------- CANVAS SIZE (FIX PWA STRETCH) ---------------------- */

function fixCanvasSize() {
  const DPR = window.devicePixelRatio || 1;

  let w = window.innerWidth;
  let h = window.innerHeight;

  // Force LANDSCAPE layout inside iPhone PWA
  if (h > w) [w, h] = [h, w];

  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  canvas.width = w * DPR;
  canvas.height = h * DPR;
}

window.addEventListener('resize', fixCanvasSize);
fixCanvasSize();

/* ---------------------- CAMERA START (HIGH RES) ---------------------- */

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { exact: "environment" },
        width: { ideal: 3840 },
        height: { ideal: 2160 },
        aspectRatio: { ideal: 16/9 }
      },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

  } catch (err) {
    const fallback = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    video.srcObject = fallback;
    await video.play();
  }

  requestAnimationFrame(drawLoop);
}

/* ---------------------- DRAW LOOP (ROTATION + COVER) ---------------------- */

function drawLoop() {
  requestAnimationFrame(drawLoop);
  if (video.readyState < 2) return;

  const DPR = window.devicePixelRatio || 1;
  const cw = canvas.width / DPR;
  const ch = canvas.height / DPR;

  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width, canvas.height);

  ctx.save();
  ctx.scale(DPR, DPR);

  // center canvas
  ctx.translate(cw/2, ch/2);

  /* FINAL — rotate video 90° ANTICLOCKWISE */
  ctx.rotate(-90 * Math.PI / 180);

  // apply zoom
  ctx.scale(currentScale, currentScale);

  const vw = video.videoWidth;
  const vh = video.videoHeight;

  if (vw && vh) {
    const rotatedW = vh;
    const rotatedH = vw;

    const canvasAspect = cw / ch;
    const videoAspect = rotatedW / rotatedH;

    let drawW, drawH;

    // FULLSCREEN COVER
    if (videoAspect > canvasAspect) {
      drawH = ch;
      drawW = ch * videoAspect;
    } else {
      drawW = cw;
      drawH = cw / videoAspect;
    }

    ctx.drawImage(video, -drawW/2, -drawH/2, drawW, drawH);
  }

  ctx.restore();
}

/* ---------------------- PINCH-TO-ZOOM ---------------------- */

function distance(a,b) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

document.addEventListener('pointerdown', e => {
  pointerMap.set(e.pointerId, e);
  if (pointerMap.size === 2) {
    const [p1, p2] = Array.from(pointerMap.values());
    startDist = distance(p1, p2);
    lastScale = currentScale;
  }
});

document.addEventListener('pointermove', e => {
  if (pointerMap.has(e.pointerId)) {
    pointerMap.set(e.pointerId, e);
    if (pointerMap.size === 2 && startDist) {
      const [p1, p2] = Array.from(pointerMap.values());
      const factor = distance(p1, p2) / startDist;
      currentScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, lastScale * factor));
    }
  }
});

document.addEventListener('pointerup', e => {
  pointerMap.delete(e.pointerId);
  if (pointerMap.size < 2) startDist = null;
});

/* Double-tap reset */
let lastTap = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTap < 300) currentScale = 1;
  lastTap = now;
});

/* ---------------------- HEARTS ---------------------- */

function createHeart(x,y,large=false){
  const el = document.createElement('div');
  el.className = 'heartParticle';
  const size = large ? (80 + Math.random()*80) : (28 + Math.random()*28);
  el.style.width = size + 'px';
  el.style.height = size + 'px';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.innerHTML = `
    <svg viewBox="0 0 32 29" width="100%" height="100%">
      <path d="M23.6 2.6c-2.4 0-4.6 1.3-5.6 3.3-1-2-3.2-3.3-5.6-3.3C5.4 2.6 2 6 2 10.1c0 6.1 10.6 12.1 14 16.9 3.4-4.8 14-10.8 14-16.9 0-4.1-3.4-7.5-6.4-7.5z"
      fill="#ff2a2a"/>
    </svg>`;

  particles.appendChild(el);

  requestAnimationFrame(() => {
    el.style.transition = "transform 1200ms cubic-bezier(.2,.9,.2,1), opacity 1400ms linear";
    const dx = (Math.random()-0.5)*500;
    const dy = -150 - Math.random()*560;
    const scale = 0.9 + Math.random()*1.4;
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${scale}) rotate(${Math.random()*360}deg)`;
    el.style.opacity = '1';
  });

  setTimeout(() => el.remove(), 2000 + Math.random()*600);
}

function burstHearts(cx,cy,count=20,large=false){
  for(let i=0;i<count;i++){
    createHeart(
      cx + (Math.random()-0.5)*320,
      cy + (Math.random()-0.5)*320,
      large
    );
  }
}

/* ---------------------- BUTTON LOGIC ---------------------- */

function setSearching() {
  particles.innerHTML = "";
  message.textContent = "Who shall be the lucky couple?";
}

function doKiss() {
  particles.innerHTML = "";
  message.className = "bigText";
  message.textContent = "KISS!";

  burstHearts(window.innerWidth/2, window.innerHeight/2, 64, true);

  const orig = currentScale;
  const pulse = Math.min(MAX_SCALE, orig * 1.12);
  currentScale = pulse;

  setTimeout(() => currentScale = orig, 900);
}

searchBtn.addEventListener("click", setSearching);
kissBtn.addEventListener("click", doKiss);

/* ---------------------- INIT ---------------------- */
startCamera();
setSearching();
