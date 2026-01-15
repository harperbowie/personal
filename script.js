// ============================================
// 1. 纯输入数据（只存数值，不做判断）
// ============================================
var mouseX = window.innerWidth / 2;
var mouseY = window.innerHeight / 2;
var gyroTargetX = 0;
var gyroTargetY = 0;
var gyroCurrentX = 0;
var gyroCurrentY = 0;
var useGyro = false;
var flipRotation = 0;

// DOM 引用（只在初始化时获取）
var cardContainer = document.getElementById('cardContainer');
var cardInner = document.getElementById('cardInner');
var aboutSection = document.getElementById('aboutSection');
var inputGroup = document.getElementById('inputGroup');
var secretInput = document.getElementById('secretInput');
var secretButton = document.getElementById('secretButton');
var heartContainer = document.getElementById('heartContainer');
var fireworksContainer = document.getElementById('fireworksContainer');

// ============================================
// 2. 输入层：只负责更新数值
// ============================================

// 鼠标输入（viewport 坐标）
window.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// 陀螺仪输入（只更新 target）
function handleOrientation(event) {
    if (event.beta !== null && event.gamma !== null) {
        useGyro = true;
        gyroTargetX = Math.max(-20, Math.min(20, event.beta / 3));
        gyroTargetY = Math.max(-20, Math.min(20, event.gamma / 3));
    }
}

// iOS 权限处理
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
// 3. 唯一的 rAF 循环（纯数学 + transform 写入）
// ============================================
function renderLoop() {
    var tiltX = 0;
    var tiltY = 0;
    
    if (useGyro && (Math.abs(gyroTargetX) > 0.1 || Math.abs(gyroTargetY) > 0.1)) {
        // 陀螺仪模式：低通滤波
        gyroCurrentX += (gyroTargetX - gyroCurrentX) * 0.1;
        gyroCurrentY += (gyroTargetY - gyroCurrentY) * 0.1;
        
        tiltX = gyroCurrentX;
        tiltY = gyroCurrentY;
    } else {
        // 鼠标模式：viewport 归一化坐标
        var nx = (mouseX / window.innerWidth) - 0.5;   // -0.5 到 0.5
        var ny = (mouseY / window.innerHeight) - 0.5;  // -0.5 到 0.5
        
        // Apple 标准角度映射（±12°）
        tiltX = -ny * 12;
        tiltY = nx * 12;
    }
    
    // 唯一 transform 写入点
    cardInner.style.transform = 
        'perspective(1200px) ' +
        'rotateX(' + tiltX + 'deg) ' +
        'rotateY(' + (tiltY + flipRotation) + 'deg)';
    
    requestAnimationFrame(renderLoop);
}

// 启动唯一动画循环
renderLoop();

// ============================================
// 4. 翻转：只修改数值，不中断动画
// ============================================
cardContainer.addEventListener('click', function() {
    flipRotation += 180;
});

// ============================================
// 5. Scroll：独立处理，不影响 tilt
// ============================================
window.addEventListener('scroll', function() {
    var scrollY = window.scrollY;
    
    // Card fade
    var cardOpacity = Math.max(0, 1 - scrollY / 400);
    var cardScale = Math.max(0.8, 1 - scrollY / 1000);
    cardContainer.style.opacity = cardOpacity;
    cardContainer.style.transform = 'scale(' + cardScale + ')';
    
    // About section fade
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
    
    // Secret section fade
    var secretOpacity = Math.min(1, Math.max(0, (scrollY - 1400) / 300));
    var secretTranslateY = Math.max(0, 30 - (scrollY - 1400) / 10);
    inputGroup.style.opacity = secretOpacity;
    inputGroup.style.transform = 'translateY(' + secretTranslateY + 'px)';
});

// ============================================
// 6. Easter Egg（独立逻辑）
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
