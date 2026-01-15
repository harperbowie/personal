// ============================================
// 1. 纯输入数据
// ============================================
var mouseX = window.innerWidth / 2;
var mouseY = window.innerHeight / 2;
var gyroTargetX = 0;
var gyroTargetY = 0;
var gyroCurrentX = 0;
var gyroCurrentY = 0;
var inputMode = 'mouse';
var flipRotation = 0;

var currentTiltX = 0;
var currentTiltY = 0;

// DOM（4层结构）
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
// 2. 输入层
// ============================================

// 鼠标：只在 mouse 模式下有效
window.addEventListener('mousemove', function(e) {
    if (inputMode === 'mouse') {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

// 陀螺仪：一触发就接管
function handleOrientation(event) {
    if (event.beta !== null && event.gamma !== null) {
        inputMode = 'gyro';
        gyroTargetX = Math.max(-12, Math.min(12, event.beta / 3));
        gyroTargetY = Math.max(-12, Math.min(12, event.gamma / 3));
    }
}

if (typeof DeviceOrientationEvent !== 'undefined') {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        document.addEventListener('touchstart', function() {
            DeviceOrientationEvent.requestPermission()
                .then(function(response) {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                        console.log('✅ 陀螺仪已启用');
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
        // 陀螺仪：低通滤波
        gyroCurrentX += (gyroTargetX - gyroCurrentX) * 0.1;
        gyroCurrentY += (gyroTargetY - gyroCurrentY) * 0.1;
        
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
        
        targetTiltX = -ny * 12;
        targetTiltY = nx * 12;
    }
    
    // 插值
    currentTiltX += (targetTiltX - currentTiltX) * 0.1;
    currentTiltY += (targetTiltY - currentTiltY) * 0.1;
    
    // 分层写入：X轴和Y轴分离
    cardTiltX.style.transform = 'rotateX(' + currentTiltX + 'deg)';
    cardTiltY.style.transform = 'rotateY(' + currentTiltY + 'deg)';
    
    requestAnimationFrame(renderLoop);
}

renderLoop();

// ============================================
// 4. 翻转（单独一层，单方向累加）
// ============================================
cardFlipContainer.addEventListener('click', function() {
    flipRotation += 180; // 单方向累加
    cardFlipContainer.style.transform = 'rotateY(' + flipRotation + 'deg)';
});

// ============================================
// 5. Scroll（只改 scale/opacity，不碰 rotate）
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
    if (e.key === 'Enter') {
        handleEasterEgg();
    }
});
