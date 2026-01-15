// ============================================
// 1. 纯输入数据
// ============================================
var mouseX = 0;
var mouseY = 0;
var gyroTargetX = 0;
var gyroTargetY = 0;
var gyroCurrentX = 0;
var gyroCurrentY = 0;
var inputMode = 'mouse'; // 'mouse' | 'gyro'
var flipRotation = 0;

// 当前 tilt 值（带插值）
var currentTiltX = 0;
var currentTiltY = 0;

// DOM
var cardContainer = document.getElementById('cardContainer');
var cardInner = document.getElementById('cardInner');
var aboutSection = document.getElementById('aboutSection');
var inputGroup = document.getElementById('inputGroup');
var secretInput = document.getElementById('secretInput');
var secretButton = document.getElementById('secretButton');
var heartContainer = document.getElementById('heartContainer');
var fireworksContainer = document.getElementById('fireworksContainer');

// ============================================
// 2. 输入层
// ============================================

// 鼠标：切换到 mouse 模式
window.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    inputMode = 'mouse';
});

// 陀螺仪：切换到 gyro 模式
function handleOrientation(event) {
    if (event.beta !== null && event.gamma !== null) {
        gyroTargetX = Math.max(-12, Math.min(12, event.beta / 3));
        gyroTargetY = Math.max(-12, Math.min(12, event.gamma / 3));
        inputMode = 'gyro';
    }
}

if (typeof DeviceOrientationEvent !== 'undefined') {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        document.addEventListener('touchstart', function() {
            DeviceOrientationEvent.requestPermission()
                .then(function(response) {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                    }
                })
                .catch(console.error);
        }, { once: true });
    } else {
        window.addEventListener('deviceorientation', handleOrientation, true);
    }
}

// ============================================
// 3. 唯一 rAF 循环
// ============================================
function renderLoop() {
    var targetTiltX = 0;
    var targetTiltY = 0;
    
    if (inputMode === 'gyro') {
        // 陀螺仪模式：低通滤波
        gyroCurrentX += (gyroTargetX - gyroCurrentX) * 0.1;
        gyroCurrentY += (gyroTargetY - gyroCurrentY) * 0.1;
        
        targetTiltX = gyroCurrentX;
        targetTiltY = gyroCurrentY;
    } else {
        // 鼠标模式：相对卡片中心
        var rect = cardContainer.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        
        var dx = mouseX - cx;
        var dy = mouseY - cy;
        
        // normalize 到 [-1, 1]
        var nx = dx / (rect.width / 2);
        var ny = dy / (rect.height / 2);
        
        // clamp
        nx = Math.max(-1, Math.min(1, nx));
        ny = Math.max(-1, Math.min(1, ny));
        
        // Apple 标准：±12°
        targetTiltX = -ny * 12;
        targetTiltY = nx * 12;
    }
    
    // 插值（低通滤波）
    currentTiltX += (targetTiltX - currentTiltX) * 0.1;
    currentTiltY += (targetTiltY - currentTiltY) * 0.1;
    
    // 写入 cardInner（只负责 tilt）
    cardInner.style.transform = 
        'rotateX(' + currentTiltX + 'deg) ' +
        'rotateY(' + currentTiltY + 'deg)';
    
    requestAnimationFrame(renderLoop);
}

renderLoop();

// ============================================
// 4. 翻转（只改 cardContainer）
// ============================================
cardContainer.addEventListener('click', function() {
    flipRotation += 180;
    cardContainer.style.transform = 'rotateY(' + flipRotation + 'deg)';
});

// ============================================
// 5. Scroll（只改 opacity/scale）
// ============================================
window.addEventListener('scroll', function() {
    var scrollY = window.scrollY;
    
    var cardOpacity = Math.max(0, 1 - scrollY / 400);
    var cardScale = Math.max(0.8, 1 - scrollY / 1000);
    cardContainer.style.opacity = cardOpacity;
    // scale 叠加在 rotateY 上
    cardContainer.style.transform = 
        'rotateY(' + flipRotation + 'deg) ' +
        'scale(' + cardScale + ')';
    
    var aboutScrollStart = 200;
    var aboutScrollEnd = 500;
    var aboutFadeOut = 1200;
    var aboutOpacity = scrollY < aboutFadeOut 
        ? Math.min(1, Math.max(0, (scrollY - aboutScrollStart) / (aboutScrollEnd - aboutScrollStart)))
        : Math.max(0, 1 - (scrollY - aboutFadeOut) / 300);
    var aboutTranslateY = scrollY < aboutFadeOut
        ?
