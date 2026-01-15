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
var flipAngle = 0;
var currentTiltX = 0;
var currentTiltY = 0;

// 首次捕获设备方向
var initialBeta = 0;
var initialGamma = 0;
var initialOrientationCaptured = false;

// ============================================
// 2. DOM 引用
// ============================================
var cardScaleWrapper = document.getElementById('cardScaleWrapper');
var cardFlip = document.getElementById('cardFlipContainer');
var cardTilt = document.getElementById('cardTiltX'); // tilt层统一处理X/Y
var aboutSection = document.getElementById('aboutSection');
var inputGroup = document.getElementById('inputGroup');
var secretInput = document.getElementById('secretInput');
var secretButton = document.getElementById('secretButton');
var heartContainer = document.getElementById('heartContainer');
var fireworksContainer = document.getElementById('fireworksContainer');

// ============================================
// 3. 输入层
// ============================================

// 鼠标
window.addEventListener('mousemove', function(e){
    if(inputMode === 'mouse'){
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

// 陀螺仪
function handleOrientation(event){
    if(event.beta === null || event.gamma === null) return;

    // 首次捕获作为初始方向
    if(!initialOrientationCaptured){
        initialBeta = event.beta;
        initialGamma = event.gamma;
        initialOrientationCaptured = true;
        console.log("📌 初始方向捕获:", initialBeta, initialGamma);
    }

    inputMode = 'gyro';

    // 相对初始方向
    let relativeBeta = event.beta - initialBeta;
    let relativeGamma = event.gamma - initialGamma;

    // 放大幅度，让视觉明显
    gyroTargetX = Math.max(-24, Math.min(24, relativeBeta / 2));
    gyroTargetY = Math.max(-24, Math.min(24, relativeGamma / 2));
}

// Safari 适配 + 其他浏览器
function enableGyro(){
    if(typeof DeviceOrientationEvent !== 'undefined'){
        if(typeof DeviceOrientationEvent.requestPermission === 'function'){
            // Safari / iOS
            DeviceOrientationEvent.requestPermission()
            .then(response => {
                if(response === 'granted'){
                    window.addEventListener('deviceorientation', handleOrientation, true);
                    console.log("✅ Safari 陀螺仪已启用");
                }
            })
            .catch(console.error);
        } else {
            // 其他浏览器
            window.addEventListener('deviceorientation', handleOrientation, true);
            console.log("✅ 陀螺仪已启用 (非Safari)");
        }
    }
}

// 点击启用陀螺仪（iOS Safari 必须用户触发）
document.addEventListener('click', enableGyro, { once:true });

// ============================================
// 4. 唯一 rAF 循环
// ============================================
function renderLoop(){
    let targetX=0, targetY=0;

    if(inputMode === 'gyro'){
        // 陀螺仪低通滤波
        gyroCurrentX += (gyroTargetX - gyroCurrentX) * 0.1;
        gyroCurrentY += (gyroTargetY - gyroCurrentY) * 0.1;
        targetX = gyroCurrentX;
        targetY = gyroCurrentY;
    } else {
        // 鼠标 tilt
        const rect = cardFlip.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mouseX - cx;
        const dy = mouseY - cy;
        let nx = dx / (rect.width / 2);
        let ny = dy / (rect.height / 2);
        nx = Math.max(-1, Math.min(1, nx));
        ny = Math.max(-1, Math.min(1, ny));
        targetX = -ny * 12;
        targetY = nx * 12;
    }

    // 插值平滑
    currentTiltX += (targetX - currentTiltX) * 0.1;
    currentTiltY += (targetY - currentTiltY) * 0.1;

    // tilt层只控制视觉偏移
    cardTilt.style.transform = `rotateX(${currentTiltX}deg) rotateY(${currentTiltY}deg)`;

    requestAnimationFrame(renderLoop);
}
renderLoop();

// ============================================
// 5. 点击翻转
// ============================================
cardFlip.addEventListener('click', ()=>{
    flipAngle += 180; // 单方向累加
    cardFlip.style.transform = `rotateY(${flipAngle}deg)`;

    // 重置 tilt，防止翻转跳动
    currentTiltX = 0;
    currentTiltY = 0;
});

// ============================================
// 6. Scroll（只改 scale/opacity）
// ============================================
window.addEventListener('scroll', function(){
    var scrollY = window.scrollY;
    var cardOpacity = Math.max(0, 1 - scrollY / 400);
    var cardScale = Math.max(0.8, 1 - scrollY / 1000);
    cardScaleWrapper.style.opacity = cardOpacity;
    cardScaleWrapper.style.transform = 'scale(' + cardScale + ')';

    var aboutScrollStart = 200;
    var aboutScrollEnd = 500;
    var aboutFadeOut = 1200;
    var aboutOpacity = scrollY < aboutFadeOut ? Math.min(1, Math.max(0, (scrollY - aboutScrollStart) / (aboutScrollEnd - aboutScrollStart))) : Math.max(0, 1 - (scrollY - aboutFadeOut) / 300);
    var aboutTranslateY = scrollY < aboutFadeOut ? Math.max(0, 50 - (scrollY - aboutScrollStart) / 8) : Math.max(0, -30 + (scrollY - aboutFadeOut) / 10);
    aboutSection.style.opacity = aboutOpacity;
    aboutSection.style.transform = 'translateY(' + aboutTranslateY + 'px)';

    var secretOpacity = Math.min(1, Math.max(0, (scrollY - 1400) / 300));
    var secretTranslateY = Math.max(0, 30 - (scrollY - 1400) / 10);
    inputGroup.style.opacity = secretOpacity;
    inputGroup.style.transform = 'translateY(' + secretTranslateY + 'px)';
});

// ============================================
// 7. Easter Egg
// ============================================
function createFirework(){
    var x = Math.random() * window.innerWidth;
    var y = Math.random() * (window.innerHeight * 0.7) + 100;
    var hue = Math.random() * 360;

    for(var i=0;i<40;i++){
        var particle = document.createElement('div');
        particle.className='firework-particle';
        particle.style.left = x+'px';
        particle.style.top = y+'px';
        var angle = (Math.PI*2*i)/40;
        var velocity = 1.5+Math.random()*1.5;
        var distance = velocity*150;
        var tx = Math.cos(angle)*distance;
        var ty = Math.sin(angle)*distance;
        particle.style.backgroundColor = `hsl(${hue},100%,60%)`;
        particle.style.boxShadow = `0 0 15px hsl(${hue},100%,60%)`;
        fireworksContainer.appendChild(particle);

        (function(p, targetX, targetY){
            var start = null;
            function animateParticle(timestamp){
                if(!start) start = timestamp;
                var progress = (timestamp - start)/1500;
                if(progress<1){
                    var currentX = targetX*progress;
                    var currentY = targetY*progress;
                    var scale = 1-progress;
                    var opacity = 1-progress;
                    p.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
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
    for(var i=0;i<6;i++){
        (function(index){
            setTimeout(()=>{ createFirework(); }, index*150);
        })(i);
    }
}

function handleEasterEgg(){
    var value = secretInput.value.toLowerCase().trim();
    if(value==='sherman'){
        secretInput.value='';
        heartContainer.classList.add('show');
        launchFireworks();
        var fireworksTimer = setInterval(launchFireworks, 1200);
        setTimeout(()=>{
            heartContainer.classList.remove('show');
            clearInterval(fireworksTimer);
            fireworksContainer.innerHTML='';
        },6000);
    }
}

secretButton.addEventListener('click', handleEasterEgg);
secretInput.addEventListener('keypress', e=>{
    if(e.key==='Enter') handleEasterEgg();
});
