// State
var rotation = 0;
var isRotating = false;
var isHovering = false;
var tilt = { x: 0, y: 0 };
var mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
var deviceTilt = { x: 0, y: 0 };
var hasGyroscope = false;
var animationFrameId = null;
var fireworksTimer = null;

var cardContainer = document.getElementById('cardContainer');
var cardInner = document.getElementById('cardInner');
var aboutSection = document.getElementById('aboutSection');
var inputGroup = document.getElementById('inputGroup');
var secretInput = document.getElementById('secretInput');
var secretButton = document.getElementById('secretButton');
var heartContainer = document.getElementById('heartContainer');
var fireworksContainer = document.getElementById('fireworksContainer');

var isMobile = window.innerWidth < 768;

// Scroll handling
function handleScroll() {
    var scrollY = window.scrollY;

    // Card opacity and scale
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
}

window.addEventListener('scroll', handleScroll);

// Mouse movement
window.addEventListener('mousemove', function(e) {
    mousePos = { x: e.clientX, y: e.clientY };
});

// Device orientation - 检测陀螺仪
if (window.DeviceOrientationEvent) {
    // 请求权限（iOS 13+需要）
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(function(permissionState) {
                if (permissionState === 'granted') {
                    hasGyroscope = true;
                    window.addEventListener('deviceorientation', handleOrientation);
                }
            })
            .catch(console.error);
    } else {
        // 非iOS设备直接启用
        hasGyroscope = true;
        window.addEventListener('deviceorientation', handleOrientation);
    }
}

function handleOrientation(e) {
    if (e.beta !== null && e.gamma !== null) {
        hasGyroscope = true;
        var beta = e.beta || 0;
        var gamma = e.gamma || 0;
        deviceTilt = { 
            x: Math.max(-15, Math.min(15, beta / 2)),
            y: Math.max(-15, Math.min(15, gamma / 2))
        };
    }
}

// 计算鼠标距离名片的距离和角度
function getMouseInfluence() {
    var rect = cardContainer.getBoundingClientRect();
    var cardCenterX = rect.left + rect.width / 2;
    var cardCenterY = rect.top + rect.height / 2;
    
    var deltaX = mousePos.x - cardCenterX;
    var deltaY = mousePos.y - cardCenterY;
    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 最大影响距离（像素）
    var maxDistance = 500;
    // 距离越近影响越大，使用平滑曲线
    var influence = Math.max(0, 1 - (distance / maxDistance));
    influence = influence * influence; // 平方使衰减更平滑
    
    return {
        x: deltaX,
        y: deltaY,
        influence: influence,
        distance: distance
    };
}

// 主动画循环
function animate() {
    if (!isRotating) {
        var tiltX = 0;
        var tiltY = 0;
        
        // 如果有陀螺仪且检测到数据，优先使用陀螺仪
        if (hasGyroscope && (deviceTilt.x !== 0 || deviceTilt.y !== 0)) {
            tiltX = deviceTilt.x;
            tiltY = deviceTilt.y;
        } else {
            // 否则使用鼠标位置
            if (isHovering) {
                // 悬停时：使用悬停位置的倾斜
                tiltX = tilt.x;
                tiltY = tilt.y;
            } else {
                // 非悬停时：根据鼠标距离计算影响
                var mouseInfluence = getMouseInfluence();
                
                // 基础倾斜角度（最大6度）
                var baseMaxTilt = 6;
                
                // 计算目标倾斜角度
                var targetTiltX = -(mouseInfluence.y / 200) * baseMaxTilt * mouseInfluence.influence;
                var targetTiltY = (mouseInfluence.x / 200) * baseMaxTilt * mouseInfluence.influence;
                
                // 平滑过渡
                tilt.x += (targetTiltX - tilt.x) * 0.1;
                tilt.y += (targetTiltY - tilt.y) * 0.1;
                
                tiltX = tilt.x;
                tiltY = tilt.y;
            }
        }
        
        cardInner.style.transform = 'rotateX(' + tiltX + 'deg) rotateY(' + (tiltY + rotation) + 'deg)';
    }
    animationFrameId = requestAnimationFrame(animate);
}
animate();

// Card hover - 立即响应
cardContainer.addEventListener('mouseenter', function() {
    isHovering = true;
});

cardContainer.addEventListener('mousemove', function(e) {
    if (isRotating) return;
    
    var rect = cardContainer.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var centerX = rect.width / 2;
    var centerY = rect.height / 2;
    
    // 悬停时最大15度倾斜
    var maxTilt = 15;
    var tiltX = ((y - centerY) / centerY) * -maxTilt;
    var tiltY = ((x - centerX) / centerX) * maxTilt;
    
    // 立即更新，无过渡
    tilt.x = tiltX;
    tilt.y = tiltY;
});

cardContainer.addEventListener('mouseleave', function() {
    isHovering = false;
    // 离开后恢复到全局跟随模式
});

// Card click
cardContainer.addEventListener('click', function() {
    isRotating = true;
    rotation += 180;
    
    var currentTiltX = tilt.x;
    var currentTiltY = tilt.y;
    cardInner.style.transform = 'rotateX(' + currentTiltX + 'deg) rotateY(' + (currentTiltY + rotation) + 'deg)';
    
    setTimeout(function() {
        isRotating = false;
    }, 600);
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
        
        // Animate particle
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
        fireworksTimer = setInterval(launchFireworks, 1200);
        
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

// 移动端触摸时请求陀螺仪权限
if (isMobile) {
    document.addEventListener('touchstart', function requestGyro() {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(function(permissionState) {
                    if (permissionState === 'granted') {
                        hasGyroscope = true;
                    }
                })
                .catch(console.error);
        }
        document.removeEventListener('touchstart', requestGyro);
    }, { once: true });
}
