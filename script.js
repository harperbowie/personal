// State
var rotation = 0;
var isRotating = false;
var isHovering = false;
var mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
var deviceTilt = { x: 0, y: 0 };
var hasGyroscope = false;
var gyroPermissionGranted = false;
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

// 检测是否是移动设备
var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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

// 桌面端：实时跟踪鼠标
if (!isMobile) {
    window.addEventListener('mousemove', function(e) {
        mousePos.x = e.clientX;
        mousePos.y = e.clientY;
    });
}

// 移动端：陀螺仪
if (isMobile) {
    console.log('移动设备检测到');
    
    function handleOrientation(event) {
        if (event.beta !== null && event.gamma !== null) {
            hasGyroscope = true;
            // beta: 前后倾斜 (-180 to 180)
            // gamma: 左右倾斜 (-90 to 90)
            deviceTilt.x = Math.max(-20, Math.min(20, event.beta / 2));
            deviceTilt.y = Math.max(-20, Math.min(20, event.gamma / 2));
        }
    }
    
    // iOS 13+ 需要请求权限
    function requestPermission() {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(function(response) {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                        gyroPermissionGranted = true;
                        console.log('✅ 陀螺仪权限已授予');
                    } else {
                        console.log('❌ 陀螺仪权限被拒绝');
                    }
                })
                .catch(function(error) {
                    console.error('陀螺仪权限请求失败:', error);
                });
        } else {
            // 安卓或旧版iOS
            window.addEventListener('deviceorientation', handleOrientation, true);
            gyroPermissionGranted = true;
            console.log('✅ 陀螺仪已启用（无需权限）');
        }
    }
    
    // 用户首次触摸屏幕时请求权限
    var permissionRequested = false;
    document.addEventListener('touchstart', function() {
        if (!permissionRequested) {
            permissionRequested = true;
            requestPermission();
        }
    }, { once: true });
}

// 计算鼠标影响（桌面端）
function calculateMouseTilt() {
    var rect = cardContainer.getBoundingClientRect();
    var cardCenterX = rect.left + rect.width / 2;
    var cardCenterY = rect.top + rect.height / 2;
    
    var deltaX = mousePos.x - cardCenterX;
    var deltaY = mousePos.y - cardCenterY;
    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    var tiltX = 0;
    var tiltY = 0;
    
    if (isHovering) {
        // 在名片上：最大15度
        var relativeX = mousePos.x - rect.left;
        var relativeY = mousePos.y - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;
        
        tiltX = -((relativeY - centerY) / centerY) * 15;
        tiltY = ((relativeX - centerX) / centerX) * 15;
    } else {
        // 不在名片上：根据距离
        var maxDistance = 800;
        var influence = Math.max(0, 1 - (distance / maxDistance));
        
        // 基础倾斜角度
        var baseTilt = 8;
        
        tiltX = -(deltaY / 400) * baseTilt * (0.4 + influence * 0.6);
        tiltY = (deltaX / 400) * baseTilt * (0.4 + influence * 0.6);
    }
    
    return { x: tiltX, y: tiltY };
}

// 主动画循环 - 每一帧都计算并立即应用
function animate() {
    if (!isRotating) {
        var tiltX = 0;
        var tiltY = 0;
        
        if (isMobile && hasGyroscope) {
            // 移动端使用陀螺仪
            tiltX = deviceTilt.x;
            tiltY = deviceTilt.y;
        } else if (!isMobile) {
            // 桌面端使用鼠标，实时计算
            var mouseTilt = calculateMouseTilt();
            tiltX = mouseTilt.x;
            tiltY = mouseTilt.y;
        }
        
        // 直接应用，无延迟
        cardInner.style.transform = 'rotateX(' + tiltX + 'deg) rotateY(' + (tiltY + rotation) + 'deg)';
    }
    
    requestAnimationFrame(animate);
}

// 启动动画循环
animate();

// Card hover
cardContainer.addEventListener('mouseenter', function() {
    isHovering = true;
});

cardContainer.addEventListener('mouseleave', function() {
    isHovering = false;
});

// Card click
cardContainer.addEventListener('click', function() {
    isRotating = true;
    rotation += 180;
    
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

// 调试信息
console.log('设备类型:', isMobile ? '移动设备（将使用陀螺仪）' : '桌面设备（将使用鼠标）');
if (isMobile) {
    console.log('请触摸屏幕以启用陀螺仪');
}
