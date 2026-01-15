// =================
// 输入数据
// =================
var mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
var gyroTargetX = 0, gyroTargetY = 0, gyroCurrentX = 0, gyroCurrentY = 0;
var inputMode = 'mouse';
var flipAngle = 0, currentTiltX = 0, currentTiltY = 0;
var initialBeta = null, initialGamma = null;  // 初始设备方向

// DOM
var cardFlip = document.getElementById('cardFlip');
var cardTilt = document.getElementById('cardTilt');
var cardScaleWrapper = document.getElementById('cardScaleWrapper');
var aboutSection = document.getElementById('aboutSection');
var inputGroup = document.getElementById('inputGroup');
var secretInput = document.getElementById('secretInput');
var secretButton = document.getElementById('secretButton');
var heartContainer = document.getElementById('heartContainer');
var fireworksContainer = document.getElementById('fireworksContainer');

// =================
// 判断浏览器是否为Safari
// =================
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// =================
// 鼠标 & 陀螺仪
// =================
window.addEventListener('mousemove', e => {
    if (inputMode === 'mouse') { mouseX = e.clientX; mouseY = e.clientY; }
});

function handleOrientation(event) {
    if (event.beta !== null && event.gamma !== null) {
        inputMode = 'gyro';
        // 增加幅度，让旋转更明显
        gyroTargetX = Math.max(-24, Math.min(24, event.beta / 2)); // 增加幅度
        gyroTargetY = Math.max(-24, Math.min(24, event.gamma / 2)); // 增加幅度
    }
}

function enableGyroscope() {
    if (isSafari) {
        // Safari 浏览器需要点击后请求权限
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            document.addEventListener('click', function () {
                DeviceOrientationEvent.requestPermission()
                    .then(response => {
                        if (response === 'granted') {
                            window.addEventListener('deviceorientation', handleOrientation, true);
                            console.log('✅ 陀螺仪已启用');
                        } else {
                            console.error('❌ 用户拒绝陀螺仪权限');
                        }
                    })
                    .catch(console.error);
            }, { once: true });
        }
    } else {
        // 非 Safari 浏览器直接启用
        window.addEventListener('deviceorientation', handleOrientation, true);
    }
}

// 页面加载时启用陀螺仪
enableGyroscope();

// =================
// 获取设备初始方向
// =================
function getInitialOrientation(event) {
    if (event.beta !== null && event.gamma !== null) {
        // 仅在第一次获取设备方向时记录
        if (initialBeta === null || initialGamma === null) {
            initialBeta = event.beta;
            initialGamma = event.gamma;
            console.log("初始方向已记录: beta =", initialBeta, "gamma =", initialGamma);
            // 停止继续监听
            window.removeEventListener('deviceorientation', getInitialOrientation);
        }
    }
}

// 只记录初始方向
window.addEventListener('deviceorientation', getInitialOrientation, true);

// =================
// 重置陀螺仪状态
// =================
window.addEventListener('load', () => {
    // 页面加载时重置陀螺仪
    gyroCurrentX = 0;
    gyroCurrentY = 0;
    currentTiltX = 0;
    currentTiltY = 0;
    
    // 使用刷新时记录的初始方向（如果有）
    if (initialBeta !== null && initialGamma !== null) {
        gyroCurrentX = initialBeta;
        gyroCurrentY = initialGamma;
        cardTilt.style.transform = `rotateX(${gyroCurrentX}deg) rotateY(${gyroCurrentY}deg)`;
    }
});

// =================
// renderLoop
// =================
function renderLoop() {
    let targetX = 0, targetY = 0;
    if (inputMode === 'gyro') {
        gyroCurrentX += (gyroTargetX - gyroCurrentX) * 0.1;
        gyroCurrentY += (gyroTargetY - gyroCurrentY) * 0.1;
        targetX = gyroCurrentX;
        targetY = gyroCurrentY;
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

// =================
// 点击翻转
// =================
cardFlip.addEventListener('click', () => {
    flipAngle += 180;
    cardFlip.style.transform = `rotateY(${flipAngle}deg)`;
    currentTiltX = 0;
    currentTiltY = 0; // 重置 tilt 防止跳动
});

// =================
// Scroll
// =================
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    let cardOpacity = Math.max(0, 1 - scrollY / 400);
    let cardScale = Math.max(0.8, 1 - scrollY / 1000);
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
    let x = Math.random() * window.innerWidth;
    let y = Math.random() * window.innerHeight * 0.7 + 100;
    let hue = Math.random() * 360;
    for (let i = 0; i < 40; i++) {
        let particle = document.createElement('div');
        particle.className = 'firework-particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        let angle = (Math.PI * 2 * i) / 40;
        let velocity = 1.5 + Math.random() * 1.5;
        let distance = velocity * 150;
        let tx = Math.cos(angle) * distance;
        let ty = Math.sin(angle) * distance;
        particle.style.backgroundColor = `hsl(${hue},100%,60%)`;
        particle.style.boxShadow = `0 0 15px hsl(${hue},100%,60%)`;
        fireworksContainer.appendChild(particle);

        (function (p, targetX, targetY) {
            let start = null;
            function animateParticle(timestamp) {
                if (!start) start = timestamp;
                let progress = (timestamp - start) / 1500;
                if (progress < 1) {
                    let currentX = targetX * progress;
                    let currentY = targetY * progress;
                    let scale = 1 - progress;
                    let opacity = 1 - progress;
                    p.style.transform = `translate(${currentX}px,${currentY}px) scale(${scale})`;
                    p.style.opacity = opacity;
                    requestAnimationFrame(animateParticle);
                } else {
                    p.remove();
                }
            }
            requestAnimationFrame(animateParticle);
        })(particle, tx, ty);
    }
}

function launchFireworks() {
    for (let i = 0; i < 6; i++) {
        (function (index) {
            setTimeout(() => {
                createFirework();
            }, index * 150);
        })(i);
    }
}

function handleEasterEgg() {
    let value = secretInput.value.toLowerCase().trim();
    if (value === 'sherman') {
        secretInput.value = '';
        heartContainer.classList.add('show');
        launchFireworks();
        let fireworksTimer = setInterval(launchFireworks, 1200);
        setTimeout(() => {
            heartContainer.classList.remove('show');
            clearInterval(fireworksTimer);
            fireworksContainer.innerHTML = '';
        }, 6000);
    }
}

secretButton.addEventListener('click', handleEasterEgg);
secretInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') handleEasterEgg();
});
