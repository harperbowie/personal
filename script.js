// ====================
// 输入 & 状态
// ====================
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

let useGyro = false;
let angX = 0;  // 累计的角度
let angY = 0;
let lastTimestamp = null;

let currentTiltX = 0;
let currentTiltY = 0;

// DOM
const cardFlip = document.getElementById('cardFlip');
const cardTilt = document.getElementById('cardTilt');
const cardScaleWrapper = document.getElementById('cardScaleWrapper');
const aboutSection = document.getElementById('aboutSection');
const inputGroup = document.getElementById('inputGroup');
const secretInput = document.getElementById('secretInput');
const secretButton = document.getElementById('secretButton');
const heartContainer = document.getElementById('heartContainer');
const fireworksContainer = document.getElementById('fireworksContainer');

// ====================
// 鼠标
// ====================
window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// ====================
// 设备运动（真正陀螺仪）
// ====================
function handleMotion(e) {
    const r = e.rotationRate;
    if (!r || (r.alpha === null && r.beta === null && r.gamma === null)) return;

    useGyro = true;
    if (lastTimestamp === null) {
        lastTimestamp = e.timeStamp;
        return;
    }
    const dt = (e.timeStamp - lastTimestamp) / 1000;
    lastTimestamp = e.timeStamp;

    // beta -> X 俯仰，gamma -> Y 横滚
    // 乘以 dt 得到度数
    angX += (r.beta || 0) * dt;
    angY += (r.gamma || 0) * dt;

    // 限制范围
    angX = Math.max(-60, Math.min(60, angX));
    angY = Math.max(-60, Math.min(60, angY));
}

// Safari / iOS 需要权限
function enableGyro() {
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
        document.addEventListener('click', () => {
            DeviceMotionEvent.requestPermission()
                .then(res => {
                    if (res === 'granted') {
                        window.addEventListener('devicemotion', handleMotion, true);
                    }
                }).catch(console.error);
        }, { once: true });
    } else {
        window.addEventListener('devicemotion', handleMotion, true);
    }
}
enableGyro();

// ====================
// 渲染循环
// ====================
function renderLoop() {
    let targetX = 0;
    let targetY = 0;

    if (useGyro) {
        targetX = angX;
        targetY = angY;
    } else {
        const rect = cardFlip.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mouseX - cx;
        const dy = mouseY - cy;

        targetX = (-dy / (rect.height / 2)) * 6;
        targetY = (dx / (rect.width / 2)) * 6;
    }

    currentTiltX += (targetX - currentTiltX) * 0.1;
    currentTiltY += (targetY - currentTiltY) * 0.1;

    cardTilt.style.transform = `rotateX(${currentTiltX}deg) rotateY(${currentTiltY}deg)`;
    requestAnimationFrame(renderLoop);
}
renderLoop();

// ====================
// 翻转
// ====================
let flipAngle = 0;
cardFlip.addEventListener('click', () => {
    flipAngle += 180;
    cardFlip.style.transform = `rotateY(${flipAngle}deg)`;
});

// ====================
// Scroll 和 Easter Egg 保持原样（无需修改）
// ====================
