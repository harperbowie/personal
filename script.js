// ============================================
// 1. 基础输入数据
// ============================================
var mouseX = window.innerWidth / 2;
var mouseY = window.innerHeight / 2;

var gyroTargetX = 0;
var gyroTargetY = 0;
var gyroCurrentX = 0;
var gyroCurrentY = 0;

// 当前零点偏移，用于校准
var gyroOffsetX = 0;
var gyroOffsetY = 0;

var inputMode = 'mouse'; // 'mouse' 或 'gyro'
var flipRotation = 0;

// DOM 引用
var cardScaleWrapper = document.getElementById('cardScaleWrapper');
var cardFlipContainer = document.getElementById('cardFlipContainer');
var cardTiltY = document.getElementById('cardTiltY');
var cardTiltX = document.getElementById('cardTiltX');
var aboutSection = document.getElementById('aboutSection');
var inputGroup = document.getElementById('inputGroup');
var secretInput = document.getElementById('secretInput');
var secretButton = document.getElementById('secretButton');
var heartContainer = document.getElementById('heartContainer');
var fireworksContainer = document.getElementById('fireworksContainer');

var currentTiltX = 0;
var currentTiltY = 0;

// ============================================
// 2. 输入层
// ============================================

// 鼠标
window.addEventListener('mousemove', function(e) {
    if (inputMode === 'mouse') {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

// 校准函数：将当前陀螺仪角度作为零点
function calibrateGyro() {
    gyroOffsetX = gyroCurrentX;
    gyroOffsetY = gyroCurrentY;
}

// 陀螺仪
function handleOrientation(event) {
    if (event.beta !== null && event.gamma !== null) {
        if (inputMode !== 'gyro') inputMode = 'gyro';

        // 放大 tilt 可见
        var beta = event.beta;   // 前后倾斜
        var gamma = event.gamma; // 左右倾斜

        // 范围限制
        beta = Math.max(-30, Math.min(30, beta));
        gamma = Math.max(-30, Math.min(30, gamma));

        gyroTargetX = beta - gyroOffsetX;
        gyroTargetY = gamma - gyroOffsetY;
    }
}

// Safari 检测
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// 启动陀螺仪监听
function initGyro() {
    if (typeof DeviceOrientationEvent !== 'undefined') {
        if (isSafari && typeof DeviceOrientationEvent.requestPermission === 'function') {
            // Safari：用户点击时才请求权限
            var requestOnce = function() {
                DeviceOrientationEvent.requestPermission()
                    .then(function(response) {
                        if (response === 'granted') {
                            window.addEventListener('deviceorientation', handleOrientation, true);
                            calibrateGyro();
                            console.log('✅ Safari 陀螺仪已启用');
                        }
                    })
                    .catch(console.error);
                // 点击一次就移除
                document.removeEventListener('click', requestOnce);
            };
            document.addEventListener('click', requestOnce);
        } else {
            // 其他浏览器：直接监听
            window.addEventListener('deviceorientation', function(e) {
                handleOrientation(e);
                // 首次事件到来立即校准
                if (inputMode !== 'gyro') calibrateGyro();
            }, true);
        }
    }
}
initGyro();

// ============================================
// 3. 渲染循环
// ============================================
function renderLoop() {
    var targetTiltX = 0;
    var targetTiltY = 0;

    if (inputMode === 'gyro') {
        // 陀螺仪：低通滤波
        gyroCurrentX += (gyroTargetX - gyroCurrentX) * 0.15;
        gyroCurrentY += (gyroTargetY - gyroCurrentY) * 0.15;

        targetTiltX = gyroCurrentX;
        targetTiltY = gyroCurrentY;
    } else {
        // 鼠标：相对 cardFlipContainer 中心
        var rect = cardFlipContainer.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = mouseX - cx;
        var dy = mouseY - cy;

        var nx = dx / (rect.width / 2);
        var ny = dy / (rect.height / 2);
        nx = Math.max(-1, Math.min(1, nx));
        ny = Math.max(-1, Math.min(1, ny));

        targetTiltX = -ny * 15; // 放大 tilt
        targetTiltY = nx * 15;
    }

    // 插值
    currentTiltX += (targetTiltX - currentTiltX) * 0.15;
    currentTiltY += (targetTiltY - currentTiltY) * 0.15;

    // 分层写入
    cardTiltX.style.transform = 'rotateX(' + currentTiltX + 'deg)';
    cardTiltY.style.transform = 'rotateY(' + currentTiltY + 'deg)';

    requestAnimationFrame(renderLoop);
}
renderLoop();

// ============================================
// 4. 翻转（单方向累加）
// ============================================
cardFlipContainer.addEventListener('click', function() {
    flipRotation += 180;
    cardFlipContainer.style.transform = 'rotateY(' + flipRotation + 'deg)';

    // 每次点击校准零点
    if (inputMode === 'gyro') calibrateGyro();
});

// 页面任意点击也可校准
document.addEventListener('click', function() {
    if (inputMode === 'gyro') calibrateGyro();
});

// ============================================
// 5. Scroll（只改 scale/opacity）
// ============================================
window.addEventListener('scroll', function() {
    var scrollY = window.scrollY;
    var cardOpacity = Math.max(0, 1 - scrollY / 400);
    var cardScale = Math.max(0.8, 1 - scrollY / 1000);
    cardScaleWrapper.style.opacity = cardOpacity;
    cardScaleWrapper.style.transform = 'scale(' + cardScale + ')';

    // About section
    var aboutScrollStart = 200;
    var aboutScrollEnd = 500;
    var aboutFadeOut = 1200;
    var aboutOpacity = scrollY < aboutFadeOut ? Math.min(1, Math.max(0, (scrollY - aboutScrollStart) / (aboutScrollEnd - aboutScrollStart))) : Math.max(0, 1 - (scrollY - aboutFadeOut) / 300);
    var aboutTranslateY = scrollY < aboutFadeOut ? Math.max(0, 50 - (scrollY - aboutScrollStart) / 8) : Math.max(0, -30 + (scrollY - aboutFadeOut) / 10);
    aboutSection.style.opacity = aboutOpacity;
    aboutSection.style.transform = 'translateY(' + aboutTranslateY + 'px)';

    // Secret section
    var secretOpacity = Math.min(1, Math.max(0, (scrollY - 1400) / 300));
    var secretTranslateY = Math.max(0, 30 - (scrollY - 1400) / 10);
    inputGroup.style.opacity = secretOpacity;
    inputGroup.style.transform = 'translateY(' + secretTranslateY + 'px)';
});

// ============================================
// 6. Easter Egg
// ============================================
function createFirework() {
    var x = Math.random() * window.innerWidth;
    var y = Math.random() * (window.innerHeight * 0.7) + 100;
    var hue = Math.random() * 360;
    for (var i = 0; i < 40; i++) {
        var particle = document.createElement('div');
        particle.className = 'firework-particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        var angle = (Math.PI * 2 * i) / 40;
        var velocity = 1.5 + Math.random() * 1.5;
        var distance = velocity * 150;
        var tx = Math.cos(angle) * distance;
        var ty = Math.sin(angle) * distance;
        particle.style.backgroundColor = 'hsl(' + hue + ', 100%, 60%)';
        particle.style.boxShadow = '0 0 15px hsl(' + hue + ', 100%, 60%)';
        fireworksContainer.appendChild(particle);
        (function(p, targetX, targetY) {
            var start = null;
            function animateParticle(timestamp) {
                if (!start) start = timestamp;
                var progress = (timestamp - start) / 1500;
                if (progress < 1) {
                    var currentX = targetX * progress;
                    var currentY = targetY * progress;
                    var scale = 1 - progress;
                    var opacity = 1 - progress;
                    p.style.transform = 'translate(' + currentX + 'px, ' + currentY + 'px) scale(' + scale + ')';
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
    for (var i = 0; i < 6; i++) {
        (function(index) {
            setTimeout(function() {
                createFirework();
            }, index * 150);
        })(i);
    }
}

function handleEasterEgg() {
    var value = secretInput.value.toLowerCase().trim();
    if (value === 'sherman') {
        secretInput.value = '';
        heartContainer.classList.add('show');
        launchFireworks();
        var fireworksTimer = setInterval(launchFireworks, 1200);
        setTimeout(function() {
            heartContainer.classList.remove('show');
            clearInterval(fireworksTimer);
            fireworksContainer.innerHTML = '';
        }, 6000);
    }
}

secretButton.addEventListener('click', handleEasterEgg);
secretInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') handleEasterEgg();
});
