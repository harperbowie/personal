// ============================================
// 1. 全局变量
// ============================================
let cardTilt = document.getElementById('cardTilt');
let cardFlip = document.getElementById('cardFlip');
let flipRotation = 0;

let inputMode = 'mouse'; // mouse / gyro
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

let currentTiltX = 0;
let currentTiltY = 0;

// 陀螺仪目标值
let gyroTargetX = 0;
let gyroTargetY = 0;
let gyroCurrentX = 0;
let gyroCurrentY = 0;

// 初始偏移量（刷新时记录当前方向）
let initialBeta = null;
let initialGamma = null;

// 是否已经启用陀螺仪
let gyroEnabled = false;

// ============================================
// 2. 鼠标输入
// ============================================
window.addEventListener('mousemove', e => {
    if (inputMode === 'mouse') {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

// ============================================
// 3. 陀螺仪输入（Safari + 其他浏览器）
// ============================================
function handleOrientation(event) {
    if (!gyroEnabled) return;
    if (event.beta === null || event.gamma === null) return;

    // 仅首次触发时记录初始方向
    if (initialBeta === null) initialBeta = event.beta;
    if (initialGamma === null) initialGamma = event.gamma;

    inputMode = 'gyro';

    // 相对初始偏移量
    let betaOffset = event.beta - initialBeta;
    let gammaOffset = event.gamma - initialGamma;

    // 限幅度 ±24
    gyroTargetX = Math.max(-24, Math.min(24, betaOffset));
    gyroTargetY = Math.max(-24, Math.min(24, gammaOffset));
}

// iOS Safari 授权
function enableGyro() {
    if (gyroEnabled) return; // 已启用就不重复
    gyroEnabled = true;

    if (typeof DeviceOrientationEvent !== 'undefined') {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            // Safari
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                        console.log('✅ 陀螺仪已启用（Safari）');
                    }
                })
                .catch(console.error);
        } else {
            // 其他浏览器
            window.addEventListener('deviceorientation', handleOrientation, true);
            console.log('✅ 陀螺仪已启用（非 Safari）');
        }
    }
}

// 页面首次触摸/点击就激活陀螺仪
window.addEventListener('touchstart', enableGyro, { once: true });
window.addEventListener('click', enableGyro, { once: true });

// ============================================
// 4. rAF 循环
// ============================================
function renderLoop() {
    let targetTiltX = 0;
    let targetTiltY = 0;

    if (inputMode === 'gyro') {
        // 陀螺仪低通滤波
        gyroCurrentX += (gyroTargetX - gyroCurrentX) * 0.1;
        gyroCurrentY += (gyroTargetY - gyroCurrentY) * 0.1;

        targetTiltX = gyroCurrentX;
        targetTiltY = gyroCurrentY;
    } else {
        // 鼠标
        let rect = cardFlip.getBoundingClientRect();
        let cx = rect.left + rect.width / 2;
        let cy = rect.top + rect.height / 2;

        let dx = mouseX - cx;
        let dy = mouseY - cy;

        let nx = dx / (rect.width / 2);
        let ny = dy / (rect.height / 2);

        nx = Math.max(-1, Math.min(1, nx));
        ny = Math.max(-1, Math.min(1, ny));

        targetTiltX = -ny * 12;
        targetTiltY = nx * 12;
    }

    currentTiltX += (targetTiltX - currentTiltX) * 0.1;
    currentTiltY += (targetTiltY - currentTiltY) * 0.1;

    cardTilt.style.transform = `rotateX(${currentTiltX}deg) rotateY(${currentTiltY}deg)`;

    requestAnimationFrame(renderLoop);
}
renderLoop();

// ============================================
// 5. 点击翻转（不会影响陀螺仪初始方向）
// ============================================
cardFlip.addEventListener('click', () => {
    flipRotation += 180;
    cardFlip.style.transform = `rotateY(${flipRotation}deg)`;
});
