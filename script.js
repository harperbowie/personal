// ============================================
// 1. 纯输入数据
// ============================================
var mouseX = window.innerWidth/2;
var mouseY = window.innerHeight/2;
var gyroTargetX = 0;
var gyroTargetY = 0;
var gyroCurrentX = 0;
var gyroCurrentY = 0;
var inputMode = 'mouse';
var flipRotation = 0;

// 每次触摸时更新的零点
var baselineBeta = 0;
var baselineGamma = 0;

// ============================================
// DOM 引用
// ============================================
var cardScaleWrapper = document.getElementById('cardScaleWrapper');
var cardFlip = document.getElementById('cardFlipContainer');
var cardTilt = document.getElementById('cardTiltX'); // tilt 层
var aboutSection = document.getElementById('aboutSection');
var inputGroup = document.getElementById('inputGroup');
var secretInput = document.getElementById('secretInput');
var secretButton = document.getElementById('secretButton');
var heartContainer = document.getElementById('heartContainer');
var fireworksContainer = document.getElementById('fireworksContainer');

var currentTiltX = 0;
var currentTiltY = 0;

// ============================================
// 2. 输入层
// ============================================

// 鼠标移动
window.addEventListener('mousemove', e => {
    if(inputMode==='mouse'){
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

// 陀螺仪事件
function handleOrientation(event){
    if(event.beta!==null && event.gamma!==null){
        inputMode='gyro';

        // 当前角度减去 baseline 就是 tilt 偏移
        gyroTargetX = Math.max(-24, Math.min(24, (event.beta - baselineBeta)/2));
        gyroTargetY = Math.max(-24, Math.min(24, (event.gamma - baselineGamma)/2));
    }
}

// 不同浏览器兼容 + Safari 请求权限
if(typeof DeviceOrientationEvent !== 'undefined'){
    if(typeof DeviceOrientationEvent.requestPermission==='function'){
        document.addEventListener('touchstart', function requestSafariPermission(){
            DeviceOrientationEvent.requestPermission()
                .then(response=>{
                    if(response==='granted'){
                        window.addEventListener('deviceorientation', handleOrientation, true);
                        console.log('✅ Safari 陀螺仪已启用');
                    }
                }).catch(console.error);
        }, {once:true});
    }else{
        window.addEventListener('deviceorientation', handleOrientation, true);
    }
}

// ============================================
// 3. 每次用户触碰屏幕就重新校准零点
// ============================================
function recalibrateZeroPoint(e){
    // 如果陀螺仪没有数据则不操作
    if(inputMode!=='gyro') return;

    // 使用当前的 gyroCurrentX/Y 作为新的零点
    baselineBeta += gyroCurrentX * 2;  // 因为我们在 handleOrientation 除以2
    baselineGamma += gyroCurrentY * 2;

    // 重置 tilt 插值
    currentTiltX = 0;
    currentTiltY = 0;
}
window.addEventListener('touchstart', recalibrateZeroPoint, {passive:true});
window.addEventListener('mousedown', recalibrateZeroPoint); // 鼠标也可以

// ============================================
// 4. 唯一 rAF 循环
// ============================================
function renderLoop(){
    var targetTiltX=0, targetTiltY=0;

    if(inputMode==='gyro'){
        // 陀螺仪低通滤波
        gyroCurrentX += (gyroTargetX - gyroCurrentX)*0.1;
        gyroCurrentY += (gyroTargetY - gyroCurrentY)*0.1;

        targetTiltX = gyroCurrentX;
        targetTiltY = gyroCurrentY;
    }else{
        // 鼠标 tilt
        const rect = cardFlip.getBoundingClientRect();
        const cx = rect.left + rect.width/2;
        const cy = rect.top + rect.height/2;
        const dx = mouseX - cx;
        const dy = mouseY - cy;
        const nx = Math.max(-1, Math.min(1, dx/(rect.width/2)));
        const ny = Math.max(-1, Math.min(1, dy/(rect.height/2)));
        targetTiltX = -ny*12;
        targetTiltY = nx*12;
    }

    // 插值
    currentTiltX += (targetTiltX - currentTiltX)*0.1;
    currentTiltY += (targetTiltY - currentTiltY)*0.1;

    // tilt 层只负责视觉偏移
    cardTilt.style.transform = `rotateX(${currentTiltX}deg) rotateY(${currentTiltY}deg)`;

    requestAnimationFrame(renderLoop);
}
renderLoop();

// ============================================
// 5. 翻转
// ============================================
cardFlip.addEventListener('click', ()=>{
    flipRotation += 180;
    cardFlip.style.transform = `rotateY(${flipRotation}deg)`;

    // 点击翻转也重置 tilt 插值，避免闪动
    currentTiltX=0;
    currentTiltY=0;
});
