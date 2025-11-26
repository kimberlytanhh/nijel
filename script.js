/* Kiss Cam — Final Version with Mask + REC Style */

const video = document.getElementById("video");
const canvas = document.getElementById("cameraCanvas");
const ctx = canvas.getContext("2d");

const overlayCanvas = document.getElementById("overlayCanvas");
const octx = overlayCanvas.getContext("2d");

const message = document.getElementById("message");
const searchBtn = document.getElementById("searchBtn");
const kissBtn = document.getElementById("kissBtn");
const particles = document.getElementById("particles");

/***************************
    FULLSCREEN CANVAS
****************************/
function resizeCanvas(){
    const DPR = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * DPR;
    overlayCanvas.width = window.innerWidth * DPR;
    overlayCanvas.height = window.innerHeight * DPR;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/***************************
    START CAMERA
****************************/
async function startCamera(){
    try{
        const stream = await navigator.mediaDevices.getUserMedia({
            video:{
                facingMode:{ exact:"environment" },
                width:{ ideal:3840 },
                height:{ ideal:2160 }
            },
            audio:false
        });
        video.srcObject = stream;
        await video.play();
    }catch(e){
        const stream2 = await navigator.mediaDevices.getUserMedia({video:true,audio:false});
        video.srcObject = stream2;
        await video.play();
    }
    requestAnimationFrame(drawLoop);
}

/***************************
    DRAW CAMERA (NO ROTATION)
****************************/
let currentScale=1, lastScale=1, startDist=null;

function drawLoop(){
    requestAnimationFrame(drawLoop);
    if(video.readyState < 2) return;

    const DPR = window.devicePixelRatio || 1;
    const cw = canvas.width/DPR;
    const ch = canvas.height/DPR;

    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,cw,ch);

    ctx.save();
    ctx.translate(cw/2, ch/2);
    ctx.scale(currentScale, currentScale);

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if(vw && vh){
        const videoAspect = vw/vh;
        const canvasAspect = cw/ch;

        let drawW, drawH;

        if(videoAspect > canvasAspect){
            drawW = cw * currentScale;
            drawH = drawW / videoAspect;
        }else{
            drawH = ch * currentScale;
            drawW = drawH * videoAspect;
        }

        ctx.drawImage(video, -drawW/2, -drawH/2, drawW, drawH);
    }

    ctx.restore();
}

/***************************
    TOUCH ZOOM
****************************/
function dist(a,b){ return Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY); }

document.addEventListener("touchstart", e=>{
    if(e.touches.length===2){
        startDist = dist(e.touches[0], e.touches[1]);
        lastScale = currentScale;
    }
});

document.addEventListener("touchmove", e=>{
    if(e.touches.length===2 && startDist){
        const newDist = dist(e.touches[0], e.touches[1]);
        currentScale = Math.min(4, Math.max(1, lastScale*(newDist/startDist)));
        e.preventDefault();
    }
});

/***************************
    RED OUTSIDE HEART MASK
****************************/
function drawRedMask(){
    const DPR = window.devicePixelRatio || 1;
    octx.setTransform(DPR,0,0,DPR,0,0);

    const w = window.innerWidth;
    const h = window.innerHeight;

    octx.clearRect(0,0,w,h);

    // Fill whole screen
    octx.fillStyle = "#750014";
    octx.fillRect(0,0,w,h);

    // Cutout heart
    octx.globalCompositeOperation = "destination-out";

    const x = w/2;
    const y = h*0.63;
    const size = Math.min(w*0.70, h*0.70);

    drawHeartPath(octx, x, y, size, size);

    octx.fill();
    octx.globalCompositeOperation = "source-over";
}

function drawHeartPath(ctx, x,y,w,h){
    const top = h*0.28;

    ctx.beginPath();
    ctx.moveTo(x, y+top);

    ctx.bezierCurveTo(x-w/2, y-top, x-w, y+h/3, x, y+h*0.72);
    ctx.bezierCurveTo(x+w, y+h/3, x+w/2, y-top, x, y+top);
}

/***************************
    PARTICLE HEARTS
****************************/
function createHeart(x,y,big=false){
    const el = document.createElement("div");
    el.className="heartParticle";

    const size = big? (80+Math.random()*90) : (25+Math.random()*25);
    el.style.width=size+"px";
    el.style.height=size+"px";
    el.style.left=x+"px";
    el.style.top=y+"px";

    el.innerHTML=`
        <svg viewBox="0 0 32 29" width="100%" height="100%">
        <path fill="#ff2a2a"
        d="M23.6 2.6c-2.4 0-4.6 1.3-5.6 3.3-1-2-3.2-3.3-5.6-3.3C5.4 2.6 2 6 2 10.1c0 6.1 10.6 12.1 14 16.9
        3.4-4.8 14-10.8 14-16.9 0-4.1-3.4-7.5-6.4-7.5z"/>
        </svg>
    `;
    particles.appendChild(el);

    requestAnimationFrame(()=>{
        el.style.transition="transform 1200ms cubic-bezier(.2,.9,.2,1), opacity 1500ms linear";
        const dx=(Math.random()-0.5)*400;
        const dy=-150 - Math.random()*450;
        el.style.opacity=1;
        el.style.transform=`translate(${dx}px,${dy}px) scale(${1+Math.random()}) rotate(${Math.random()*360}deg)`;
    });

    setTimeout(()=>el.remove(),1700);
}

function burstHearts(cx,cy,count=40,big=false){
    for(let i=0;i<count;i++){
        createHeart(
            cx + (Math.random()-0.5)*220,
            cy + (Math.random()-0.5)*220,
            big
        );
    }
}

/***************************
    BUTTON LOGIC
****************************/
function setSearching(){
    particles.innerHTML="";
    octx.clearRect(0,0,overlayCanvas.width,overlayCanvas.height);
    message.textContent="Who shall be the lucky couple?";
}

function doKiss(){
    particles.innerHTML="";
    message.textContent="KISS!";
    burstHearts(window.innerWidth/2, window.innerHeight/2, 60, true);

    drawRedMask();

    const orig=currentScale;
    currentScale=Math.min(4,orig*1.12);
    setTimeout(()=>currentScale=orig,900);
}

searchBtn.addEventListener("click", setSearching);
kissBtn.addEventListener("click", doKiss);

/***************************
    INIT
****************************/
startCamera();
setSearching();
/* Kiss Cam — Final Version with Mask + REC Style */

const video = document.getElementById("video");
const canvas = document.getElementById("cameraCanvas");
const ctx = canvas.getContext("2d");

const overlayCanvas = document.getElementById("overlayCanvas");
const octx = overlayCanvas.getContext("2d");

const message = document.getElementById("message");
const searchBtn = document.getElementById("searchBtn");
const kissBtn = document.getElementById("kissBtn");
const particles = document.getElementById("particles");

/***************************
    FULLSCREEN CANVAS
****************************/
function resizeCanvas(){
    const DPR = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * DPR;
    overlayCanvas.width = window.innerWidth * DPR;
    overlayCanvas.height = window.innerHeight * DPR;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/***************************
    START CAMERA
****************************/
async function startCamera(){
    try{
        const stream = await navigator.mediaDevices.getUserMedia({
            video:{
                facingMode:{ exact:"environment" },
                width:{ ideal:3840 },
                height:{ ideal:2160 }
            },
            audio:false
        });
        video.srcObject = stream;
        await video.play();
    }catch(e){
        const stream2 = await navigator.mediaDevices.getUserMedia({video:true,audio:false});
        video.srcObject = stream2;
        await video.play();
    }
    requestAnimationFrame(drawLoop);
}

/***************************
    DRAW CAMERA (NO ROTATION)
****************************/
let currentScale=1, lastScale=1, startDist=null;

function drawLoop(){
    requestAnimationFrame(drawLoop);
    if(video.readyState < 2) return;

    const DPR = window.devicePixelRatio || 1;
    const cw = canvas.width/DPR;
    const ch = canvas.height/DPR;

    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,cw,ch);

    ctx.save();
    ctx.translate(cw/2, ch/2);
    ctx.scale(currentScale, currentScale);

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if(vw && vh){
        const videoAspect = vw/vh;
        const canvasAspect = cw/ch;

        let drawW, drawH;

        if(videoAspect > canvasAspect){
            drawW = cw * currentScale;
            drawH = drawW / videoAspect;
        }else{
            drawH = ch * currentScale;
            drawW = drawH * videoAspect;
        }

        ctx.drawImage(video, -drawW/2, -drawH/2, drawW, drawH);
    }

    ctx.restore();
}

/***************************
    TOUCH ZOOM
****************************/
function dist(a,b){ return Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY); }

document.addEventListener("touchstart", e=>{
    if(e.touches.length===2){
        startDist = dist(e.touches[0], e.touches[1]);
        lastScale = currentScale;
    }
});

document.addEventListener("touchmove", e=>{
    if(e.touches.length===2 && startDist){
        const newDist = dist(e.touches[0], e.touches[1]);
        currentScale = Math.min(4, Math.max(1, lastScale*(newDist/startDist)));
        e.preventDefault();
    }
});

/***************************
    RED OUTSIDE HEART MASK
****************************/
function drawRedMask(){
    const DPR = window.devicePixelRatio || 1;
    octx.setTransform(DPR,0,0,DPR,0,0);

    const w = window.innerWidth;
    const h = window.innerHeight;

    octx.clearRect(0,0,w,h);

    // Fill whole screen
    octx.fillStyle = "#750014";
    octx.fillRect(0,0,w,h);

    // Cutout heart
    octx.globalCompositeOperation = "destination-out";

    const x = w/2;
    const y = h*0.63;
    const size = Math.min(w*0.70, h*0.70);

    drawHeartPath(octx, x, y, size, size);

    octx.fill();
    octx.globalCompositeOperation = "source-over";
}

function drawHeartPath(ctx, x,y,w,h){
    const top = h*0.28;

    ctx.beginPath();
    ctx.moveTo(x, y+top);

    ctx.bezierCurveTo(x-w/2, y-top, x-w, y+h/3, x, y+h*0.72);
    ctx.bezierCurveTo(x+w, y+h/3, x+w/2, y-top, x, y+top);
}

/***************************
    PARTICLE HEARTS
****************************/
function createHeart(x,y,big=false){
    const el = document.createElement("div");
    el.className="heartParticle";

    const size = big? (80+Math.random()*90) : (25+Math.random()*25);
    el.style.width=size+"px";
    el.style.height=size+"px";
    el.style.left=x+"px";
    el.style.top=y+"px";

    el.innerHTML=`
        <svg viewBox="0 0 32 29" width="100%" height="100%">
        <path fill="#ff2a2a"
        d="M23.6 2.6c-2.4 0-4.6 1.3-5.6 3.3-1-2-3.2-3.3-5.6-3.3C5.4 2.6 2 6 2 10.1c0 6.1 10.6 12.1 14 16.9
        3.4-4.8 14-10.8 14-16.9 0-4.1-3.4-7.5-6.4-7.5z"/>
        </svg>
    `;
    particles.appendChild(el);

    requestAnimationFrame(()=>{
        el.style.transition="transform 1200ms cubic-bezier(.2,.9,.2,1), opacity 1500ms linear";
        const dx=(Math.random()-0.5)*400;
        const dy=-150 - Math.random()*450;
        el.style.opacity=1;
        el.style.transform=`translate(${dx}px,${dy}px) scale(${1+Math.random()}) rotate(${Math.random()*360}deg)`;
    });

    setTimeout(()=>el.remove(),1700);
}

function burstHearts(cx,cy,count=40,big=false){
    for(let i=0;i<count;i++){
        createHeart(
            cx + (Math.random()-0.5)*220,
            cy + (Math.random()-0.5)*220,
            big
        );
    }
}

/***************************
    BUTTON LOGIC
****************************/
function setSearching(){
    particles.innerHTML="";
    octx.clearRect(0,0,overlayCanvas.width,overlayCanvas.height);
    message.textContent="Who shall be the lucky couple?";
}

function doKiss(){
    particles.innerHTML="";
    message.textContent="KISS!";
    burstHearts(window.innerWidth/2, window.innerHeight/2, 60, true);

    drawRedMask();

    const orig=currentScale;
    currentScale=Math.min(4,orig*1.12);
    setTimeout(()=>currentScale=orig,900);
}

searchBtn.addEventListener("click", setSearching);
kissBtn.addEventListener("click", doKiss);

/***************************
    INIT
****************************/
startCamera();
setSearching();
