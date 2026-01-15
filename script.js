// =================
// 输入数据
// =================
var mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
var gyroTargetX = 0, gyroTargetY = 0, gyroCurrentX = 0, gyroCurrentY = 0;
var inputMode = 'mouse';
var flipAngle = 0, currentTiltX = 0, currentTiltY = 0;

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
        gyroTargetX = Math.max(-12, Math.min(12, event.beta / 3));
        gyroTargetY = Math.max(-12, Math.min(12, event.gamma / 3));
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

// 页面加载后调用该方法来启用陀螺仪
enableGyroscope();

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
            function animate(timestamp) {
                if (!start) start = timestamp;
                let progress = (timestamp - start) / 1500;
                if (progress < 1) {
                    let cx = targetX * progress, cy = targetY * progress, scale = 1 - progress, opacity = 1 - progress;
                    p.style.transform = `translate(${cx}px,${cy}px) scale(${scale})`;
                    p.style.opacity = opacity;
                    requestAnimationFrame(animate);
                } else { p.remove(); }
            }
            requestAnimationFrame(animate);
        })(particle, tx, ty);
    }
}

function launchFireworks() {
    for (let i = 0; i < 6; i++) {
        setTimeout(createFirework, i * 150);
    }
}

function handleEasterEgg() {
    const value = secretInput.value.toLowerCase().trim();
    if (value === 'sherman') {
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
