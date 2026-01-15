// ============================================
// 1. 纯输入数据
// ============================================
var mouseX = window.innerWidth / 2;
var mouseY = window.innerHeight / 2;

var gyroTargetX = 0;
var gyroTargetY = 0;
var gyroCurrentX = 0;
var gyroCurrentY = 0;

var gyroOffsetX = 0; // 校准偏移
var gyroOffsetY = 0;

var inputMode = 'mouse'; // 默认鼠标
var flipRotation = 0;

var currentTiltX = 0;
var currentTiltY = 0;

// ============================================
// 2. DOM 引用
// ============================================
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

// ============================================
// 3. 输入层
// ============================================

// 鼠标：只在 mouse 模式下有效
window.addEventListener('mousemove', function(e) {
    if (inputMode === 'mouse') {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

// ============================================
// 4. 陀螺仪
// ============================================
function handleOrientation(event) {
    if (event.beta !== null && event.gamma !== null) {
        // 自动切换到陀螺仪
        inputMode = 'gyro';

        // 取校准偏移
        if (!gyroOffsetX && !gyroOffsetY) {
            gyroOffsetX = event.beta;
            gyroOffsetY = event.gamma;
        }

        // 增幅处理，让幅度明显
        gyroTargetX = Math.max(-25, Math.min(25, (event.beta - gyroOffsetX) * 1.5));
        gyroTargetY = Math.max(-25, Math.min(25, (event.gamma - gyroOffsetY) * 1.5));
    }
}

// Safari/iOS 权限处理
function enableGyroForIOS(callback) {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+
        let info = document.createElement('div');
        info.style.position = 'fixed';
        info.style.top = '0';
        info.style.left = '0';
        info.style.width = '100%';
        info.style.height = '100%';
        info.style.background = 'rgba(255,255,255,0.95)';
        info.style.zIndex = '10000';
        info.style.display = 'flex';
        info.style.alignItems = 'center';
        info.style.justifyContent = 'center';
        info.style.textAlign = 'center';
        info.style.padding = '20px';
        info.innerHTML = '<p>为了体验 3D 名片，请点击允许使用陀螺仪</p><button style="margin-top:20px;padding:12px 24px;font-size:16px;">启用陀螺仪</button>';
        document.body.appendChild(info);
        info.querySelector('button').addEventListener('click', function() {
            DeviceOrientationEvent.requestPermission()
                .then(function(response) {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                        document.body.removeChild(info);
                        console.log('✅ iOS 陀螺仪已启用');
                    }
                })
                .catch(console.error);
        });
    } else {
        // 其他浏览器直接监听
        window.addEventListener('deviceorientation', handleOrientation, true);
    }
}

// 自动尝试启用陀螺仪
enableGyroForIOS();

// ============================================
// 5. rAF 循环
// ============================================
function renderLoop() {
    var targetTiltX = 0;
    var targetTiltY = 0;

    if (inputMode === 'gyro') {
        // 低通滤波
        gyroCurrentX += (gyroTargetX - gyroCurrentX) * 0.1;
        gyroCurrentY += (gyroTargetY - gyroCurrentY) * 0.1;
        targetTiltX = gyroCurrentX;
        targetTiltY = gyroCurrentY;
    } else {
        // 鼠标模式
        var rect = cardFlipContainer.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = mouseX - cx;
        var dy = mouseY - cy;
        var nx = dx / (rect.width / 2);
        var ny = dy / (rect.height / 2);
        nx = Math.max(-1, Math.min(1, nx));
        ny = Math.max(-1, Math.min(1, ny));
        targetTiltX = -ny * 12;
        targetTiltY = nx * 12;
    }

    // 插值
    currentTiltX += (targetTiltX - currentTiltX) * 0.1;
    currentTiltY += (targetTiltY - currentTiltY) * 0.1;

    // 分层写入
    cardTiltX.style.transform = 'rotateX(' + currentTiltX + 'deg)';
    cardTiltY.style.transform = 'rotateY(' + currentTiltY + 'deg)';

    requestAnimationFrame(renderLoop);
}
renderLoop();

// ============================================
// 6. 点击翻转
// ============================================
cardFlipContainer.addEventListener('click', function() {
    flipRotation += 180; 
    cardFlipContainer.style.transform = 'rotateY(' + flipRotation + 'deg)';
});

// ============================================
// 7. Scroll
// ============================================
window.addEventListener('scroll', function() {
    var scrollY = window.scrollY;
    var cardOpacity = Math.max(0, 1 - scrollY / 400);
    var cardScale = Math.max(0.8, 1 - scrollY / 1000);
    cardScaleWrapper.style.opacity = cardOpacity;
    cardScaleWrapper.style.transform = 'scale(' + cardScale + ')';

    var aboutScrollStart = 200;
    var aboutScrollEnd = 500;
    var aboutFadeOut = 1200;
    var aboutOpacity = scrollY < aboutFadeOut 
        ? Math.min(1, Math.max(0, (scrollY - aboutScrollStart) / (aboutScrollEnd - aboutScrollStart)))
        : Math.max(0, 1 - (scrollY - aboutFadeOut) / 300);
    var aboutTranslateY = scrollY < aboutFadeOut
        ? Math.max(0, 50 - (scrollY - aboutScrollStart) / 8)
        : Math.max(0, -30 + (scrollY - aboutFadeOut) / 10);
    aboutSection.style.opacity = aboutOpacity;
    aboutSection.style.transform = 'translateY(' + aboutTranslateY + 'px)';

    var secretOpacity = Math.min(1, Math.max(0, (scrollY - 1400) / 300));
    var secretTranslateY = Math.max(0, 30 - (scrollY - 1400) / 10);
    inputGroup.style.opacity = secretOpacity;
    inputGroup.style.transform = 'translateY(' + secretTranslateY + 'px)';
});

// ============================================
// 8. Easter Egg
// ============================================
function createFirework() { /* ... 保持你原来的代码 ... */ }
function launchFireworks() { /* ... */ }
function handleEasterEgg() { /* ... */ }
secretButton.addEventListener('click', handleEasterEgg);
secretInput.addEventListener('keypress', function(e) { if(e.key==='Enter'){handleEasterEgg();} });
