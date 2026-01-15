// =================
// 全局变量
// =================
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
let lastBeta = null, lastGamma = null; // 上一次采样，用于计算 delta
let currentTiltX = 0, currentTiltY = 0;
let inputMode = 'mouse';
let flipAngle = 0;

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

// =================
// 浏览器判断
// =================
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// =================
// 鼠标事件
// =================
window.addEventListener('mousemove', e => {
    if (inputMode === 'mouse') {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

// =================
// 陀螺仪事件（全新方式）
// =================
function handleOrientation(event) {
    if (event.beta === null || event.gamma === null) return;

    inputMode = 'gyro';

    // 第一次初始化 lastBeta/lastGamma
    if (lastBeta === null) {
        lastBeta = event.beta;
        lastGamma = event.gamma;
        return; // 仅初始化，不立即改变 tilt
    }

    // delta 计算
    let deltaBeta = event.beta - lastBeta;
    let deltaGamma = event.gamma - lastGamma;

    // 累加 tilt
    currentTiltX += deltaBeta * 0.7;   // 调大幅度
    currentTiltY += deltaGamma * 0.7;

    // 限制旋转角度
    currentTiltX = Math.max(-45, Math.min(45, currentTiltX));
    currentTiltY = Math.max(-45, Math.min(45, currentTiltY));

    // 更新 last
    lastBeta = event.beta;
    lastGamma = event.gamma;
}

// =================
// Safari 权限处理
// =================
function enableGyroscope() {
    if (typeof DeviceOrientationEvent !== 'undefined') {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            document.addEventListener('click', () => {
                DeviceOrientationEvent.requestPermission()
                    .then(response => {
                        if (response === 'granted') {
                            window.addEventListener('deviceorientation', handleOrientation, true);
                        }
                    }).catch(console.error);
            }, { once: true });
        } else {
            // 非 Safari
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
    }
}
enableGyroscope();

// =================
// renderLoop
// =================
function renderLoop() {
    if (inputMode === 'mouse') {
        const rect = cardFlip.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mouseX - cx;
        const dy = mouseY - cy;

        const targetX = (-dy / (rect.height / 2)) * 6;
        const targetY = (dx / (rect.width / 2)) * 6;

        currentTiltX += (targetX - currentTiltX) * 0.1;
        currentTiltY += (targetY - currentTiltY) * 0.1;
    }

    cardTilt.style.transform = `rotateX(${currentTiltX}deg) rotateY(${currentTiltY}deg)`;
    requestAnimationFrame(renderLoop);
}
renderLoop();

// =================
// 点击翻转
// =================
cardFlip.addEventListener('click', () => {
    flipAngle += 180;
    cardFlip.style.transform = `rotateY(${flipAngle}deg)`;
});

// =================
// Scroll
// =================
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const cardOpacity = Math.max(0, 1 - scrollY / 400);
    const cardScale = Math.max(0.8, 1 - scrollY / 1000);
    cardScaleWrapper.style.opacity = cardOpacity;
    cardScaleWrapper.style.transform = `scale(${cardScale})`;

    const aboutScrollStart = 200, aboutScrollEnd = 500, aboutFadeOut = 1200;
    const aboutOpacity = scrollY < aboutFadeOut ? Math.min(1, Math.max(0, (scrollY - aboutScrollStart) / (aboutScrollEnd - aboutScrollStart))) : Math.max(0, 1 - (scrollY - aboutFadeOut) / 300);
    const aboutTranslateY = scrollY < aboutFadeOut ? Math.max(0, 50 - (scrollY - aboutScrollStart) / 8) : Math.max(0, -30 + (scrollY - aboutFadeOut) / 10);
    aboutSection.style.opacity = aboutOpacity;
    aboutSection.style.transform = `translateY(${aboutTranslateY}px)`;

    const secretOpacity = Math.min(1, Math.max(0, (scrollY - 1400) / 300));
    const secretTranslateY = Math.max(0, 30 - (scrollY - 1400) / 10);
    inputGroup.style.opacity = secretOpacity;
    inputGroup.style.transform = `translateY(${secretTranslateY}px)`;
});

// =================
// Easter Egg
// =================
function createFirework() {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight * 0.7 + 100;
    const hue = Math.random() * 360;
    for (let i = 0; i < 40; i++) {
        const p = document.createElement('div');
        p.className = 'firework-particle';
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        const angle = (Math.PI * 2 * i) / 40;
        const velocity = 1.5 + Math.random() * 1.5;
        const distance = velocity * 150;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        p.style.backgroundColor = `hsl(${hue},100%,60%)`;
        p.style.boxShadow = `0 0 15px hsl(${hue},100%,60%)`;
        fireworksContainer.appendChild(p);

        (function(p, tx, ty) {
            let start = null;
            function animate(ts) {
                if (!start) start = ts;
                const progress = (ts - start) / 1500;
                if (progress < 1) {
                    p.style.transform = `translate(${tx * progress}px,${ty * progress}px) scale(${1 - progress})`;
                    p.style.opacity = 1 - progress;
                    requestAnimationFrame(animate);
                } else p.remove();
            }
            requestAnimationFrame(animate);
        })(p, tx, ty);
    }
}

function launchFireworks() {
    for (let i = 0; i < 6; i++) setTimeout(createFirework, i * 150);
}

function handleEasterEgg() {
    const val = secretInput.value.toLowerCase().trim();
    if (val === 'sherman') {
        secretInput.value = '';
        heartContainer.classList.add('show');
        launchFireworks();
        const timer = setInterval(launchFireworks, 1200);
        setTimeout(() => {
            heartContainer.classList.remove('show');
            clearInterval(timer);
            fireworksContainer.innerHTML = '';
        }, 6000);
    }
}

secretButton.addEventListener('click', handleEasterEgg);
secretInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') handleEasterEgg();
});
