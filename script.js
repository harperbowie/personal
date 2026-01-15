// 纯数据（只存数值，不读 DOM）
var mouseX = window.innerWidth / 2;
var mouseY = window.innerHeight / 2;
var gyroX = 0;
var gyroY = 0;
var gyroTargetX = 0;
var gyroTargetY = 0;
var useGyro = false;
var cardRotation = 0;

// 缓存的几何信息（只在 resize 时更新）
var cardGeometry = {
    left: 0,
    top: 0,
    width: 380,
    height: 240,
    centerX: 0,
    centerY: 0
};

var cardContainer = document.getElementById('cardContainer');
var cardInner = document.getElementById('cardInner');
var aboutSection = document.getElementById('aboutSection');
var inputGroup = document.getElementById('inputGroup');
var secretInput = document.getElementById('secretInput');
var secretButton = document.getElementById('secretButton');
var heartContainer = document.getElementById('heartContainer');
var fireworksContainer = document.getElementById('fireworksContainer');

// 初始化和 resize 时更新几何信息
function updateCardGeometry() {
    var rect = cardContainer.getBoundingClientRect();
    cardGeometry.left = rect.left;
    cardGeometry.top = rect.top;
    cardGeometry.width = rect.width;
    cardGeometry.height = rect.height;
    cardGeometry.centerX = rect.left + rect.width / 2;
    cardGeometry.centerY = rect.top + rect.height / 2;
}

updateCardGeometry();

var resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateCardGeometry, 100);
});

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
    
    // scroll 会改变卡片位置，需要更新几何信息
    updateCardGeometry();
}

window.addEventListener('scroll', handleScroll);

// 输入1: 鼠标（只存数值）
window.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// 输入2: 陀螺仪 + 低通滤波
function handleOrientation(event) {
    if (event.beta !== null && event.gamma !== null) {
        useGyro = true;
        // 存储目标值，在 rAF 中插值
        gyroTargetX = Math.max(-25, Math.min(25, event.beta / 2));
        gyroTargetY = Math.max(-25, Math.min(25, event.gamma / 2));
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

// 纯数学计算 transform（无 DOM 读取）
function renderLoop() {
    var tiltX = 0;
    var tiltY = 0;
    
    if (useGyro && (Math.abs(gyroTargetX) > 0.1 || Math.abs(gyroTargetY) > 0.1)) {
        // 低通滤波：平滑陀螺仪数据
        var smoothFactor = 0.15;
        gyroX += (gyroTargetX - gyroX) * smoothFactor;
        gyroY += (gyroTargetY - gyroY) * smoothFactor;
        
        tiltX = gyroX;
        tiltY = gyroY;
    } else {
        // 鼠标模式：使用缓存的几何信息
        var deltaX = mouseX - cardGeometry.centerX;
        var deltaY = mouseY - cardGeometry.centerY;
        
        // 判断是否在名片内（纯数学，无 DOM 读取）
        var isInside = (
            mouseX >= cardGeometry.left && 
            mouseX <= cardGeometry.left + cardGeometry.width && 
            mouseY >= cardGeometry.top && 
            mouseY <= cardGeometry.top + cardGeometry.height
        );
        
        if (isInside) {
            // 在名片上
            var relativeX = mouseX - cardGeometry.left;
            var relativeY = mouseY - cardGeometry.top;
            var centerX = cardGeometry.width / 2;
            var centerY = cardGeometry.height / 2;
            
            tiltX = -((relativeY - centerY) / centerY) * 15;
            tiltY = ((relativeX - centerX) / centerX) * 15;
        } else {
            // 不在名片上
            var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            var maxDistance = 1000;
            var influence = Math.max(0, 1 - (distance / maxDistance));
            
            var baseTilt = 10;
            tiltX = -(deltaY / 500) * baseTilt * (0.3 + influence * 0.7);
            tiltY = (deltaX / 500) * baseTilt * (0.3 + influence * 0.7);
        }
    }
    
    // 只写入 transform，无任何读取
    cardInner.style.transform = 'rotateX(' + tiltX + 'deg) rotateY(' + (tiltY + cardRotation) + 'deg)';
    
    requestAnimationFrame(renderLoop);
}

renderLoop();

// 点击翻转
cardContainer.addEventListener('click', function() {
    cardRotation += 180;
    updateCardGeometry(); // 翻转可能改变视觉位置
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

console.log('✅ 优化的动画循环已启动');
console.log('- 几何信息缓存：只在 resize/scroll 时更新');
console.log('- rAF 中：纯数学计算 + transform 写入');
console.log('- 陀螺仪：低通滤波 + 插值');
