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
var isFlipping = false; // 翻转状态标记

// 陀螺仪校准基准值（用于记录初始姿势）
var gyroBaselineBeta = null;
var gyroBaselineGamma = null;
var gyroCalibrated = false;

// DOM 引用（初始化获取）
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
// 2. 输入层：鼠标 & 陀螺仪
// ============================================

// 鼠标输入
window.addEventListener('mousemove', function(e){
    if(inputMode==='mouse'){
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

// 陀螺仪处理函数（带动态基准校准）
function handleOrientation(event){
    if(event.beta!==null && event.gamma!==null){
        inputMode='gyro';
        
        // 首次读取：将当前姿势设为基准（0度位置）
        if(!gyroCalibrated){
            gyroBaselineBeta = event.beta;
            gyroBaselineGamma = event.gamma;
            gyroCalibrated = true;
            console.log('✅ 陀螺仪已校准 | 初始姿势设为基准: beta=' + gyroBaselineBeta.toFixed(1) + '°, gamma=' + gyroBaselineGamma.toFixed(1) + '°');
            // 首次读取时目标角度为0（当前姿势就是中性位置）
            gyroTargetX = 0;
            gyroTargetY = 0;
            return;
        }
        
        // 后续读取：计算相对于基准的偏移量
        var deltaBeta = event.beta - gyroBaselineBeta;
        var deltaGamma = event.gamma - gyroBaselineGamma;
        
        // 将偏移量映射到倾斜角度（±12度范围）
        gyroTargetX = Math.max(-12, Math.min(12, deltaBeta / 3));
        gyroTargetY = Math.max(-12, Math.min(12, deltaGamma / 3));
    }
}

// iOS设备需要权限请求
function enableGyroIOS(){
    if(typeof DeviceOrientationEvent.requestPermission === 'function'){
        DeviceOrientationEvent.requestPermission()
            .then(function(res){
                if(res === 'granted'){
                    window.addEventListener('deviceorientation', handleOrientation, true);
                    console.log('✅ iOS陀螺仪已启用（权限已授予）');
                } else {
                    console.log('❌ iOS陀螺仪权限被拒绝');
                }
            })
            .catch(function(err){
                console.error('❌ iOS陀螺仪权限请求失败:', err);
            });
    }
}

// 检测设备类型
var isIOS = /iP(hone|od|ad)/.test(navigator.userAgent);
var needsPermission = typeof DeviceOrientationEvent !== 'undefined' && 
                      typeof DeviceOrientationEvent.requestPermission === 'function';

if(isIOS && needsPermission){
    // iOS 13+: 需要用户交互才能请求权限
    console.log('📱 iOS设备检测到，请触摸屏幕以启用陀螺仪');
    window.addEventListener('touchstart', enableGyroIOS, {once: true});
    window.addEventListener('click', enableGyroIOS, {once: true});
} else {
    // 安卓或旧版iOS: 直接启动陀螺仪
    window.addEventListener('deviceorientation', handleOrientation, true);
    console.log('✅ 陀螺仪已直接启用（安卓/标准浏览器）');
}

// ============================================
// 3. 唯一 rAF 循环：Tilt 计算 & 分层写入
// ============================================
function renderLoop(){
    var targetTiltX = 0;
    var targetTiltY = 0;

    // 翻转时不响应输入
    if(!isFlipping){
        if(inputMode === 'gyro'){
            // 陀螺仪：低通滤波（平滑过渡）
            gyroCurrentX += (gyroTargetX - gyroCurrentX) * 0.1;
            gyroCurrentY += (gyroTargetY - gyroCurrentY) * 0.1;
            targetTiltX = gyroCurrentX;
            targetTiltY = gyroCurrentY;
        } else {
            // 鼠标：相对视口中心计算（修复偏移问题）
            var centerX = window.innerWidth / 2;
            var centerY = window.innerHeight / 2;
            
            // 计算鼠标相对于中心的归一化位置 (-1 到 1)
            var nx = (mouseX - centerX) / centerX;
            var ny = (mouseY - centerY) / centerY;
            
            // 限制范围
            nx = Math.max(-1, Math.min(1, nx));
            ny = Math.max(-1, Math.min(1, ny));
            
            // 映射到倾斜角度
            targetTiltX = -ny * 12; // Y轴控制X方向旋转（上下倾斜）
            targetTiltY = nx * 12;  // X轴控制Y方向旋转（左右倾斜）
        }

        // 插值（额外平滑）
        currentTiltX += (targetTiltX - currentTiltX) * 0.1;
        currentTiltY += (targetTiltY - currentTiltY) * 0.1;
    }

    // 分层写入DOM
    cardTiltX.style.transform = 'rotateX(' + currentTiltX + 'deg)';
    cardTiltY.style.transform = 'rotateY(' + currentTiltY + 'deg)';

    requestAnimationFrame(renderLoop);
}
renderLoop();

// ============================================
// 4. 翻转（Y轴累加，始终一个方向，不受点击位置影响）
// ============================================
cardFlipContainer.addEventListener('click', function(e){
    // 防止翻转动画期间重复触发
    if(isFlipping) return;
    
    isFlipping = true;
    flipRotation += 180;
    
    // 设置过渡动画
    cardFlipContainer.style.transition = 'transform 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)';
    cardFlipContainer.style.transform = 'rotateY(' + flipRotation + 'deg)';
    
    // 动画结束后恢复状态
    setTimeout(function(){
        cardFlipContainer.style.transition = '';
        isFlipping = false;
    }, 800);
});

// ============================================
// 5. Scroll（只改 scale/opacity，不碰 rotate）
// ============================================
window.addEventListener('scroll', function(){
    var scrollY = window.scrollY;

    // Card fade & scale
    var cardOpacity = Math.max(0, 1 - scrollY / 400);
    var cardScale = Math.max(0.8, 1 - scrollY / 1000);
    cardScaleWrapper.style.opacity = cardOpacity;
    cardScaleWrapper.style.transform = 'scale(' + cardScale + ')';

    // About section
    var aboutScrollStart = 200;
    var aboutScrollEnd = 500;
    var aboutFadeOut = 1200;
    var aboutOpacity = scrollY < aboutFadeOut ?
        Math.min(1, Math.max(0, (scrollY - aboutScrollStart) / (aboutScrollEnd - aboutScrollStart))) :
        Math.max(0, 1 - (scrollY - aboutFadeOut) / 300);
    var aboutTranslateY = scrollY < aboutFadeOut ?
        Math.max(0, 50 - (scrollY - aboutScrollStart) / 8) :
        Math.max(0, -30 + (scrollY - aboutFadeOut) / 10);
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
function createFirework(){
    var x = Math.random() * window.innerWidth;
    var y = Math.random() * (window.innerHeight * 0.7) + 100;
    var hue = Math.random() * 360;
    for(var i = 0; i < 40; i++){
        var particle = document.createElement('div');
        particle.className = 'firework-particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        var angle = (Math.PI * 2 * i) / 40;
        var velocity = 1.5 + Math.random() * 1.5;
        var distance = velocity * 150;
        var tx = Math.cos(angle) * distance;
        var ty = Math.sin(angle) * distance;
        particle.style.backgroundColor = 'hsl(' + hue + ',100%,60%)';
        particle.style.boxShadow = '0 0 15px hsl(' + hue + ',100%,60%)';
        fireworksContainer.appendChild(particle);
        (function(p, targetX, targetY){
            var start = null;
            function animateParticle(timestamp){
                if(!start) start = timestamp;
                var progress = (timestamp - start) / 1500;
                if(progress < 1){
                    var currentX = targetX * progress;
                    var currentY = targetY * progress;
                    var scale = 1 - progress;
                    var opacity = 1 - progress;
                    p.style.transform = 'translate(' + currentX + 'px,' + currentY + 'px) scale(' + scale + ')';
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

function launchFireworks(){
    for(var i = 0; i < 6; i++){
        (function(index){
            setTimeout(function(){
                createFirework();
            }, index * 150);
        })(i);
    }
}

function handleEasterEgg(){
    var value = secretInput.value.toLowerCase().trim();
    if(value === 'sherman'){
        secretInput.value = '';
        heartContainer.classList.add('show');
        launchFireworks();
        var fireworksTimer = setInterval(launchFireworks, 1200);
        setTimeout(function(){
            heartContainer.classList.remove('show');
            clearInterval(fireworksTimer);
            fireworksContainer.innerHTML = '';
        }, 6000);
    }
}

secretButton.addEventListener('click', handleEasterEgg);
secretInput.addEventListener('keypress', function(e){
    if(e.key === 'Enter') handleEasterEgg();
});
