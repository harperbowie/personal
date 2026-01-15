let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let gyroTargetX = 0, gyroTargetY = 0;
let gyroCurrentX = 0, gyroCurrentY = 0;

let inputMode = 'mouse';
let flipAngle = 0;
let currentTiltX = 0;
let currentTiltY = 0;

const cardFlip = document.getElementById('cardFlip');
const cardTilt = document.getElementById('cardTilt');

/* ===== 输入 ===== */
window.addEventListener('mousemove', e => {
    if (inputMode === 'mouse') {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

/* Safari 陀螺仪 */
function handleOrientation(e) {
    if (e.beta == null || e.gamma == null) return;
    inputMode = 'gyro';
    gyroTargetX = Math.max(-12, Math.min(12, e.beta / 3));
    gyroTargetY = Math.max(-12, Math.min(12, e.gamma / 3));
}

if (window.DeviceOrientationEvent) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        document.addEventListener('touchstart', () => {
            DeviceOrientationEvent.requestPermission().then(p => {
                if (p === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation, true);
                }
            });
        }, { once: true });
    } else {
        window.addEventListener('deviceorientation', handleOrientation, true);
    }
}

/* ===== 核心循环 ===== */
function renderLoop() {
    let targetX = 0;
    let targetY = 0;

    if (inputMode === 'gyro') {
        gyroCurrentX += (gyroTargetX - gyroCurrentX) * 0.1;
        gyroCurrentY += (gyroTargetY - gyroCurrentY) * 0.1;
        targetX = gyroCurrentX;
        targetY = gyroCurrentY;
    } else {
        const rect = cardFlip.getBoundingClientRect();
        const cx = rect.left + rect.width /
