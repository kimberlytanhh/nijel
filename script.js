/* Kiss Cam v10 — Landscape (R2,T2) */
/* Camera on left, top toward floor => rotation -90° by default */
/* Canvas drawing, high-DPI scaling, centered pinch-to-zoom, heart bursts, L2 buttons */

const video = document.getElementById('video');
const canvas = document.getElementById('cameraCanvas');
const ctx = canvas.getContext('2d');
const searchBtn = document.getElementById('searchBtn');
const kissBtn = document.getElementById('kissBtn');
const message = document.getElementById('message');
const particles = document.getElementById('particles');
const rotationSelect = document.getElementById('rotationSelect');

let rotationDeg = parseInt(rotationSelect.value || "-90", 10); // default -90 for R2,T2
let currentScale = 1;
let lastScale = 1;
let startDist = null;
let pointerMap = new Map();
const MIN_SCALE = 1;
const MAX_SCALE = 4;

// high-DPI canvas sizing
function resizeCanvasHighDPI(){
  const DPR = window.devicePixelRatio || 1;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  canvas.width = Math.round(window.innerWidth * DPR);
  canvas.height = Math.round(window.innerHeight * DPR);
  // we'll draw with context transforms per DPR inside drawLoop
}
window.addEventListener('resize', resizeCanvasHighDPI);
resizeCanvasHighDPI();

// camera start with 1080p hint
async function startCamera(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
  }catch(err){
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio:false });
      video.srcObject = stream;
      await video.play();
    }catch(e){
      console.error('camera error', e);
    }
  }
  requestAnimationFrame(drawLoop);
}

// draw with rotation and centered scale
function drawLoop(){
  requestAnimationFrame(drawLoop);
  if(video.readyState < 2) return;
  const DPR = window.devicePixelRatio || 1;
  const cw = canvas.width / DPR;
  const ch = canvas.height / DPR;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width, canvas.height);

  // we'll work in CSS pixels for placement
  ctx.save();
  // scale for DPR
  ctx.scale(DPR, DPR);

  // move origin to center of canvas
  ctx.translate(cw/2, ch/2);

  // apply rotation (degrees)
  const rad = rotationDeg * Math.PI / 180;
  ctx.rotate(rad);

  // apply scale (centered)
  ctx.scale(currentScale, currentScale);

  // draw video centered
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if(vw && vh){
    // draw at natural pixel size but centered
    ctx.drawImage(video, -vw/2, -vh/2, vw, vh);
  }

  ctx.restore();
}

// pointer-based pinch to zoom (centered)
function distance(a,b){ return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }

document.addEventListener('pointerdown', e=>{
  pointerMap.set(e.pointerId, e);
  if(pointerMap.size === 2){
    const [p1,p2] = Array.from(pointerMap.values());
    startDist = distance(p1,p2);
    lastScale = currentScale;
  }
});

document.addEventListener('pointermove', e=>{
  if(pointerMap.has(e.pointerId)){
    pointerMap.set(e.pointerId, e);
    if(pointerMap.size === 2 && startDist){
      const [p1,p2] = Array.from(pointerMap.values());
      const d = distance(p1,p2);
      const factor = d / startDist;
      currentScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, lastScale * factor));
    }
  }
});

document.addEventListener('pointerup', e=>{
  pointerMap.delete(e.pointerId);
  if(pointerMap.size < 2) startDist = null;
});

// double-tap reset zoom
let lastTap = 0;
document.addEventListener('touchend', e=>{
  const now = Date.now();
  if(now - lastTap < 300) currentScale = 1;
  lastTap = now;
});

// heart particle creation
function createHeart(x,y,large=false){
  const el = document.createElement('div');
  el.className = 'heartParticle';
  const size = large ? (80 + Math.random()*80) : (28 + Math.random()*28);
  el.style.width = size + 'px';
  el.style.height = size + 'px';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.innerHTML = `<svg viewBox="0 0 32 29" width="100%" height="100%"><path d="M23.6 2.6c-2.4 0-4.6 1.3-5.6 3.3-1-2-3.2-3.3-5.6-3.3C5.4 2.6 2 6 2 10.1c0 6.1 10.6 12.1 14 16.9 3.4-4.8 14-10.8 14-16.9 0-4.1-3.4-7.5-6.4-7.5z" fill="#ff2a2a"/></svg>`;
  particles.appendChild(el);
  requestAnimationFrame(()=>{
    el.style.transition = 'transform 1200ms cubic-bezier(.2,.9,.2,1), opacity 1400ms linear';
    const dx = (Math.random()-0.5)*500;
    const dy = -150 - Math.random()*560;
    const scale = 0.9 + Math.random()*1.4;
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${scale}) rotate(${Math.random()*360}deg)`;
    el.style.opacity = '1';
  });
  setTimeout(()=> el.remove(), 2000 + Math.random()*600);
}

function burstHearts(cx,cy,count=20,large=false){
  for(let i=0;i<count;i++) createHeart(cx + (Math.random()-0.5)*320, cy + (Math.random()-0.5)*320, large);
}

// Searching and Kiss handlers
function setSearching(){
  particles.innerHTML = '';
  message.textContent = 'Who shall be the lucky couple?';
}

function doKiss(){
  particles.innerHTML = '';
  message.className = 'bigText';
  message.textContent = 'KISS!';
  // burst near center of screen
  burstHearts(window.innerWidth/2, window.innerHeight/2, 64, true);
  const orig = currentScale;
  const pulse = Math.min(MAX_SCALE, orig * 1.12);
  currentScale = pulse;
  setTimeout(()=> currentScale = orig, 900);
  // do not auto-return; press Searching to return
}

// rotation select control for quick fix if orientation off
rotationSelect.addEventListener('change', ()=>{
  rotationDeg = parseInt(rotationSelect.value, 10) || -90;
});

// attach buttons
searchBtn.addEventListener('click', setSearching);
kissBtn.addEventListener('click', doKiss);

// init
startCamera();
setSearching();
