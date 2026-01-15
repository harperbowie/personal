// State
var rotation = 0;
var isRotating = false;
var isHovering = false;
var tilt = { x: 0, y: 0 };
var targetTilt = { x: 0, y: 0 };
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

// Mouse movement - 实时更新
window.addEventListener('mousemove', function(e) {
    mousePos = { x: e.clientX, y: e.clientY };
});

// Device orientation - iOS陀螺仪
function handleOrientation(e) {
    if (e.beta !== null && e.gamma !== null) {
        hasGyroscope = true;
        var beta = e.beta;
        var gamma = e.gamma;
        
        // 增强陀螺仪效果
        deviceTilt = { 
            x: Math.max(-25, Math.min(25, beta / 1.5)),
            y: Math.max(-25, Math.min(25, gamma / 1.5))
        };
    }
}

// 请求iOS陀螺仪权限
function requestGyroPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(function(response) {
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                    hasGyroscope = true;
                    console.log('陀螺仪已启用');
                }
            })
            .catch(function(error) {
                console.log('陀螺仪权限被拒绝:', error);
            });
    } else if (window.DeviceOrientationEvent) {
        // 非iOS设备直接启用
        window.addEventListener('deviceorientation', handleOrientation);
    }
}

// iOS需要用户交互才能请求权限
if (isMobile) {
    document.body.addEventListener('touchstart', function() {
        requestGyroPermission();
    }, { once: true });
}

// 计算鼠标距离名片的影响
function getMouseInfluence() {
    var rect = cardContainer.getBoundingClientRect();
    var cardCenterX = rect.left + rect.width / 2;
    var cardCenterY = rect.top + rect.height / 2;
    
    var deltaX = mousePos.x - cardCenterX;
    var deltaY = mousePos.y - cardCenterY;
    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 扩大影响距离到1000像素
    var maxDistance = 1000;
    var influence = Math.max(0, 1 - (distance / maxDistance));
    
    // 距离名片的实际像素距离
    var cardDistance = Math.max(0, distance - (rect.width / 2));
    
    return {
        x: deltaX,
        y: deltaY,
        influence: influence,
        distance: distance,
        cardDistance: cardDistance
    };
}

// 主动画循环 - 实时计算和更新
function animate() {
    if (!isRotating) {
        var finalTiltX = 0;
        var finalTiltY = 0;
        
        // 如果有陀螺仪数据，优先使用
        if (hasGyroscope && isMobile && (Math.abs(deviceTilt.x) > 0.5 || Math.abs(deviceTilt.y) > 0.5)) {
            // 陀螺仪模式
            finalTiltX = deviceTilt.x;
            finalTiltY = deviceTilt.y;
        } else {
            // 鼠标模式
            var mouseInfluence = getMouseInfluence();
            
            if (isHovering) {
                // 在名片上：最大15度
                var rect = cardContainer.getBoundingClientRect();
                var relativeX = mousePos.x - rect.left;
                var relativeY = mousePos.y - rect.top;
                var centerX = rect.width / 2;
                var centerY = rect.height / 2;
                
                finalTiltX = -((relativeY - centerY) / centerY) * 15;
                finalTiltY = ((relativeX - centerX) / centerX) * 15;
            } else {
                // 不在名片上：根据距离计算
                // 基础角度：远处10度
                var baseTilt = 10;
                
                // 距离衰减，但保持明显
                var distanceFactor = Math.pow(mouseInfluence.influence, 0.5); // 平方根衰减，更缓和
                
                finalTiltX = -(mouseInfluence.y / 300) * baseTilt * (0.3 + distanceFactor * 0.7);
                finalTiltY = (mouseInfluence.x / 300) * baseTilt * (0.3 + distanceFactor * 0.7);
            }
        }
        
        // 实时更新，快速响应
        var smoothness = isHovering ? 0.3 : 0.15;
        tilt.x += (finalTiltX - tilt.x) * smoothness;
        tilt.y += (finalTiltY - tilt.y) * smoothness;
        
        // 立即应用
        cardInner.style.transform = 'rotateX(' + tilt.x + 'deg) rotateY(' + (tilt.y + rotation) + 'deg)';
    }
    
    animationFrameId = requestAnimationFrame(animate);
}
animate();

// Card hover
cardContainer.addEventListener('mouseenter', function() {
    isHovering = true;
});

cardContainer.addEventListener('mousemove', function(e) {
    if (isRotating) return;
    
    // 更新鼠标位置，动画循环会自动处理
    var rect = cardContainer.getBoundingClientRect();
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
});

cardContainer.addEventListener('mouseleave', function() {
    isHovering = false;
});

// Card click
cardContainer.addEventListener('click', function() {
    isRotating = true;
    rotation += 180;
    
    cardInner.style.transform = 'rotateX(' + tilt.x + 'deg) rotateY(' + (tilt.y + rotation) + 'deg)';
    
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

// 显示陀螺仪状态（调试用）
if (isMobile) {
    console.log('移动设备检测到，等待触摸以启用陀螺仪...');
}
