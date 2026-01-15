// 纯输入数据
var mouseX = window.innerWidth / 2;
var mouseY = window.innerHeight / 2;
var gyroX = 0;
var gyroY = 0;
var useGyro = false;
var cardRotation = 0; // 翻转累计角度

var cardContainer = document.getElementById('cardContainer');
var cardInner = document.getElementById('cardInner');
var aboutSection = document.getElementById('aboutSection');
var inputGroup = document.getElementById('inputGroup');
var secretInput = document.getElementById('secretInput');
var secretButton = document.getElementById('secretButton');
var heartContainer = document.getElementById('heartContainer');
var fireworksContainer = document.getElementById('fireworksContainer');

// Scroll handling
function handleScroll() {
    var scrollY = window.scrollY;
    var cardOpacity = Math.max(0, 1 - scrollY / 400);
    var cardScale = Math.max(0.8, 1 - scrollY / 1000);
    cardContainer.style.opacity = cardOpacity;
    cardContainer.style.transform = 'scale(' + cardScale + ')';

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
}

window.addEventListener('scroll', handleScroll);

// 输入1: 鼠标位置（持续更新）
window.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// 输入2: 陀螺仪（持续更新）
function handleOrientation(event) {
    if (event.beta !== null && event.gamma !== null) {
        useGyro = true;
        gyroX = Math.max(-25, Math.min(25, event.beta / 2));
        gyroY = Math.max(-25, Math.min(25, event.gamma / 2));
    }
}

// 尝试启动陀螺仪
if (typeof DeviceOrientationEvent !== 'undefined') {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+
        document.addEventListener('touchstart', function() {
            DeviceOrientationEvent.requestPermission()
                .then(function(response) {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                        console.log('陀螺仪已启用');
                    }
                })
                .catch(console.error);
        }, { once: true });
    } else {
        // 其他设备
        window.addEventListener('deviceorientation', handleOrientation, true);
    }
}

// 核心：每一帧重新计算 transform
function renderLoop() {
    var tiltX = 0;
    var tiltY = 0;
    
    // 优先使用陀螺仪
    if (useGyro && (Math.abs(gyroX) > 0.1 || Math.abs(gyroY) > 0.1)) {
        tiltX = gyroX;
        tiltY = gyroY;
    } else {
        // 否则用鼠标
        var rect = cardContainer.getBoundingClientRect();
        var cardCenterX = rect.left + rect.width / 2;
        var cardCenterY = rect.top + rect.height / 2;
        
        var deltaX = mouseX - cardCenterX;
        var deltaY = mouseY - cardCenterY;
        
        // 检查鼠标是否在名片内
        var isInside = (
            mouseX >= rect.left && 
            mouseX <= rect.right && 
            mouseY >= rect.top && 
            mouseY <= rect.bottom
        );
        
        if (isInside) {
            // 在名片上：最大15度
            var relativeX = mouseX - rect.left;
            var relativeY = mouseY - rect.top;
            var centerX = rect.width / 2;
            var centerY = rect.height / 2;
            
            tiltX = -((relativeY - centerY) / centerY) * 15;
            tiltY = ((relativeX - centerX) / centerX) * 15;
        } else {
            // 不在名片上：距离影响
            var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            var maxDistance = 1000;
            var influence = Math.max(0, 1 - (distance / maxDistance));
            
            var baseTilt = 10;
            tiltX = -(deltaY / 500) * baseTilt * (0.3 + influence * 0.7);
            tiltY = (deltaX / 500) * baseTilt * (0.3 + influence * 0.7);
        }
    }
    
    // 直接应用 transform，包含翻转角度
    cardInner.style.transform = 'rotateX(' + tiltX + 'deg) rotateY(' + (tiltY + cardRotation) + 'deg)';
    
    requestAnimationFrame(renderLoop);
}

// 启动渲染循环
renderLoop();

// 点击翻转：只改变 cardRotation 数值
cardContainer.addEventListener('click', function() {
    cardRotation += 180;
});

// Fireworks
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

console.log('动画循环已启动 - 名片会持续响应输入');
