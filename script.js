/* Kiss Cam — Corrected Rotation + True Fullscreen Camera (Cover Mode) */

const video = document.getElementById('video');
const canvas = document.getElementById('cameraCanvas');
const ctx = canvas.getContext('2d');
const searchBtn = document.getElementById('searchBtn');
const kissBtn = document.getElementById('kissBtn');
const message = document.getElementById('message');
const particles = document.getElementById('particles');

// -----------------------
// FORCE FULLSCREEN CANVAS
// -----------------------
function resizeCanvas() {
  const DPR = window.devicePixelRatio || 1;

  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.style.width = w + "px";
  canvas.style.height = h + "px";

  canvas.width = w * DPR;
  canvas.height = h * DPR;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// -----------------------
// START CAMERA (HIGH RES)
// -----------------------
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { exact: "environment" },
        width: { ideal: 3840 },
        height: { ideal: 2160 },
      },
      audio: false
    });
    video.srcObject = stream;
    await video.play();

  } catch (err) {
    const streamFallback = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
    video.srcObject = streamFallback;
    await video.play();
  }

  requestAnimationFrame(drawLoop);
}

// -----------------------
// DRAW LOOP (ROTATE + COVER)
// -----------------------
function drawLoop() {
  requestAnimationFrame(drawLoop);
  if (video.readyState < 2) return;

  const DPR = window.devicePixelRatio || 1;
  const cw = canvas.width / DPR;
  const ch = canvas.height / DPR;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(DPR, DPR);

  // Center everything
  ctx.translate(cw / 2, ch / 2);

  // -----------------------
  // FIX: 90° ANTICLOCKWISE
  // -----------------------
  ctx.rotate(0 * Math.PI / 180);

  // Zoom scale (from pinch gesture)
  ctx.scale(currentScale, currentScale);

  const vw = video.videoWidth;
  const vh = video.videoHeight;

  if (vw && vh) {
    // After rotation width and height swap
    const videoW = vh;
    const videoH = vw;

    const canvasAspect = cw / ch;
    const videoAspect = videoW / videoH;

    let drawW, drawH;

    // -----------------------
    // FIX: FULLSCREEN "COVER"
    // -----------------------
    if (videoAspect > canvasAspect) {
      // Video is wider → scale height to fill, crop sides
      drawH = ch * currentScale;
      drawW = drawH * videoAspect;
    } else {
      // Video is taller → scale width to fill, crop top/bottom
      drawW = cw * currentScale;
      drawH = drawW / videoAspect;
    }

    ctx.drawImage(video, -drawW / 2, -drawH / 2, drawW, drawH);
  }

  ctx.restore();
}

// -----------------------
// ZOOM GESTURES
// -----------------------
let currentScale = 1;
let lastScale = 1;
let startDist = null;

function dist(a, b) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

document.addEventListener("touchstart", e => {
  if (e.touches.length === 2) {
    startDist = dist(e.touches[0], e.touches[1]);
    lastScale = currentScale;
  }
});

document.addEventListener("touchmove", e => {
  if (e.touches.length === 2 && startDist) {
    const newDist = dist(e.touches[0], e.touches[1]);
    currentScale = Math.min(4, Math.max(1, lastScale * (newDist / startDist)));
    e.preventDefault();
  }
});

document.addEventListener("touchend", () => {
  if (event.touches.length < 2) startDist = null;
});

// -----------------------
// HEARTS + BUTTON LOGIC
// -----------------------
function setSearching() {
  particles.innerHTML = "";
  message.textContent = "Who shall be the lucky couple?";
  document.getElementById("maskOverlay").style.display="block";
}

function doKiss() {
  particles.innerHTML = "";
  message.className = "bigText";
  message.textContent = "KISS!";

  burstHearts(window.innerWidth / 2, window.innerHeight / 2, 60, true);

  const orig = currentScale;
  const pulse = Math.min(4, orig * 1.1);
  currentScale = pulse;

  setTimeout(() => (currentScale = orig), 800);
  document.getElementById("maskOverlay").style.display="block";
}


searchBtn.addEventListener("click", setSearching);
kissBtn.addEventListener("click", doKiss);

// -----------------------
// HEART PARTICLES
// -----------------------
function createHeart(x, y, big = false) {
  const el = document.createElement("div");
  el.className = "heartParticle";

  const size = big ? 80 + Math.random() * 90 : 25 + Math.random() * 25;
  el.style.width = size + "px";
  el.style.height = size + "px";

  el.style.left = x + "px";
  el.style.top = y + "px";

  el.innerHTML = `
    <svg viewBox="0 0 32 29" width="100%" height="100%">
      <path d="M23.6 2.6c-2.4 0-4.6 1.3-5.6 3.3-1-2-3.2-3.3-5.6-3.3
      C5.4 2.6 2 6 2 10.1c0 6.1 10.6 12.1 14 16.9
      3.4-4.8 14-10.8 14-16.9 0-4.1-3.4-7.5-6.4-7.5z"
      fill="#ff2a2a"/>
    </svg>`;

  particles.appendChild(el);

  requestAnimationFrame(() => {
    el.style.transition =
      "transform 1200ms cubic-bezier(.2,.9,.2,1), opacity 1500ms linear";
    const dx = (Math.random() - 0.5) * 400;
    const dy = -150 - Math.random() * 500;
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${1 + Math.random()}) rotate(${Math.random() * 360}deg)`;
    el.style.opacity = "1";
  });

  setTimeout(() => el.remove(), 1800);
}

function burstHearts(cx, cy, count = 40, big = false) {
  for (let i = 0; i < count; i++) {
    createHeart(
      cx + (Math.random() - 0.5) * 200,
      cy + (Math.random() - 0.5) * 200,
      big
    );
  }
}

// Run
startCamera();
setSearching();
