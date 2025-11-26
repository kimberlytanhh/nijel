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
}

function doKiss() {
  particles.innerHTML = '';
  message.className = 'bigText';
  message.textContent = "KISS!";
  burstHearts(window.innerWidth/2, window.innerHeight/2, 64, true);
  const orig=currentScale;
  const pulse = Math.min(MAX_SCALE, orig * 1.12);
  currentScale = pulse;
  setTimeout(()=> currentScale = orig, 900);
}

searchBtn.addEventListener("click", setSearching);
kissBtn.addEventListener("click", doKiss);

// Run
startCamera();
setSearching();
