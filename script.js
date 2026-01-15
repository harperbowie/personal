// =================
// 输入数据
// =================
var mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
var gyroTargetX=0, gyroTargetY=0, gyroCurrentX=0, gyroCurrentY=0;
var inputMode='mouse';
var flipAngle=0, currentTiltX=0, currentTiltY=0;
var gyroBaseX=null, gyroBaseY=null; // 陀螺仪基准值
var isFlipping=false; // 防止翻转过程中重复触发

// DOM
var cardFlip=document.getElementById('cardFlip');
var cardTilt=document.getElementById('cardTilt');
var cardScaleWrapper=document.getElementById('cardScaleWrapper');
var aboutSection=document.getElementById('aboutSection');
var inputGroup=document.getElementById('inputGroup');
var secretInput=document.getElementById('secretInput');
var secretButton=document.getElementById('secretButton');
var heartContainer=document.getElementById('heartContainer');
var fireworksContainer=document.getElementById('fireworksContainer');

// =================
// 鼠标
// =================
window.addEventListener('mousemove', e=>{
    if(inputMode==='mouse'){ mouseX=e.clientX; mouseY=e.clientY; }
});

// =================
// 陀螺仪
// =================
function handleOrientation(event){
    if(event.beta!==null && event.gamma!==null){
        inputMode='gyro';
        
        // 首次记录基准值
        if(gyroBaseX===null){
            gyroBaseX=event.beta;
            gyroBaseY=event.gamma;
        }
        
        // 相对于基准值计算偏移，限制范围避免剧烈旋转
        let deltaX = (event.beta - gyroBaseX)/3;
        let deltaY = (event.gamma - gyroBaseY)/3;
        gyroTargetX = Math.max(-12, Math.min(12, deltaX));
        gyroTargetY = Math.max(-12, Math.min(12, deltaY));
    }
}

function enableGyro(){
    if(typeof DeviceOrientationEvent !== 'undefined'){
        if(typeof DeviceOrientationEvent.requestPermission === 'function'){
            DeviceOrientationEvent.requestPermission()
            .then(res=>{
                if(res==='granted'){
                    window.addEventListener('deviceorientation', handleOrientation, true);
                    console.log('✅ Safari 陀螺仪已启用');
                }
            })
            .catch(console.error);
        } else {
            window.addEventListener('deviceorientation', handleOrientation, true);
            console.log('✅ 陀螺仪已启用（非Safari）');
        }
    }
}

window.addEventListener('touchstart', enableGyro, {once:true});
window.addEventListener('click', enableGyro, {once:true});

if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
    if(typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission !== 'function'){
        setTimeout(enableGyro, 500);
    }
}

// =================
// renderLoop
// =================
// =================
// renderLoop
// =================
// =================
// renderLoop
// =================
function renderLoop() {
    let targetX = 0, targetY = 0;

    if (inputMode === 'gyro') {
        gyroCurrentX += (gyroTargetX - gyroCurrentX) * 0.1;
        gyroCurrentY += (gyroTargetY - gyroCurrentY) * 0.1;
        targetX = gyroCurrentX;
        targetY = gyroCurrentY;
    } else {
        const rect = cardFlip.getBoundingClientRect();
        const cx = rect.left + rect.width/2;
        const cy = rect.top + rect.height/2;

        // 计算鼠标相对于卡片中心的标准化位置
        let px = (mouseX - cx) / (rect.width / 2);
        let py = (mouseY - cy) / (rect.height / 2);

        px = Math.max(-1, Math.min(1, px));
        py = Math.max(-1, Math.min(1, py));

        const maxAngle = 10;
        
        // ✅ 正确的倾斜逻辑：
        // 鼠标在右上角(px=1, py=-1)时，我们希望右上角抬起
        // 这需要：X轴向上旋转(负值)，Y轴向左旋转(正值)
        // 但注意：rotateY正值是向左，负值是向右
        // 所以：
        // - 鼠标在右侧(px>0) → Y轴应该向左 → rotateY正值
        // - 鼠标在左侧(px<0) → Y轴应该向右 → rotateY负值
      targetX = py * maxAngle;    // 鼠标在上(py负) → rotateX负值 → 向上旋转
      targetY = -px * maxAngle;   // 鼠标在右(px正) → rotateY负值 → 向右旋转
    }

    currentTiltX += (targetX - currentTiltX) * 0.1;
    currentTiltY += (targetY - currentTiltY) * 0.1;

    cardTilt.style.transform = `rotateX(${currentTiltX}deg) rotateY(${currentTiltY}deg)`;

    requestAnimationFrame(renderLoop);
}
renderLoop();

// =================
// 点击翻转
// =================
cardFlip.addEventListener('click', ()=>{
    if(isFlipping) return;
    isFlipping=true;
    flipAngle += 180;
    cardFlip.style.transform=`rotateY(${flipAngle}deg)`;
    currentTiltX=0; currentTiltY=0;
    setTimeout(()=>{ isFlipping=false; }, 800);
});

cardFlip.addEventListener('touchend', (e)=>{
    if(isFlipping) return;
    e.preventDefault();
    isFlipping=true;
    flipAngle += 180;
    cardFlip.style.transform=`rotateY(${flipAngle}deg)`;
    currentTiltX=0; currentTiltY=0;
    setTimeout(()=>{ isFlipping=false; }, 800);
});

// =================
// Scroll 动画
// =================
let ticking = false;
window.addEventListener('scroll', ()=>{
    if(!ticking){
        window.requestAnimationFrame(()=>{
            const scrollY=window.scrollY;
            let cardOpacity=Math.max(0,1-scrollY/400);
            let cardScale=Math.max(0.8,1-scrollY/1000);
            cardScaleWrapper.style.opacity=cardOpacity;
            cardScaleWrapper.style.transform=`scale(${cardScale})`;

            const aboutScrollStart=200, aboutScrollEnd=500, aboutFadeOut=1200;
            const aboutOpacity=scrollY<aboutFadeOut?Math.min(1,Math.max(0,(scrollY-aboutScrollStart)/(aboutScrollEnd-aboutScrollStart))):Math.max(0,1-(scrollY-aboutFadeOut)/300);
            const aboutTranslateY=scrollY<aboutFadeOut?Math.max(0,50-(scrollY-aboutScrollStart)/8):Math.max(0,-30+(scrollY-aboutFadeOut)/10);
            aboutSection.style.opacity=aboutOpacity;
            aboutSection.style.transform=`translateY(${aboutTranslateY}px)`;

            const secretOpacity=Math.min(1,Math.max(0,(scrollY-1400)/300));
            const secretTranslateY=Math.max(0,30-(scrollY-1400)/10);
            inputGroup.style.opacity=secretOpacity;
            inputGroup.style.transform=`translateY(${secretTranslateY}px)`;
            
            ticking=false;
        });
        ticking=true;
    }
});

// =================
// Easter Egg
// =================
function createFirework(){
    let x=Math.random()*window.innerWidth;
    let y=Math.random()*window.innerHeight*0.7+100;
    let hue=Math.random()*360;
    for(let i=0;i<40;i++){
        let p=document.createElement('div');
        p.className='firework-particle';
        p.style.left=x+'px';
        p.style.top=y+'px';
        let angle=(Math.PI*2*i)/40;
        let velocity=1.5+Math.random()*1.5;
        let distance=velocity*150;
        let tx=Math.cos(angle)*distance;
        let ty=Math.sin(angle)*distance;
        p.style.backgroundColor=`hsl(${hue},100%,60%)`;
        p.style.boxShadow=`0 0 15px hsl(${hue},100%,60%)`;
        fireworksContainer.appendChild(p);

        (function(p,targetX,targetY){
            let start=null;
            function animate(timestamp){
                if(!start) start=timestamp;
                let progress=(timestamp-start)/1500;
                if(progress<1){
                    let cx=targetX*progress, cy=targetY*progress, scale=1-progress, opacity=1-progress;
                    p.style.transform=`translate(${cx}px,${cy}px) scale(${scale})`;
                    p.style.opacity=opacity;
                    requestAnimationFrame(animate);
                } else { p.remove(); }
            }
            requestAnimationFrame(animate);
        })(p,tx,ty);
    }
}

function launchFireworks(){
    for(let i=0;i<6;i++){ setTimeout(createFirework,i*150); }
}

function handleEasterEgg(){
    const value=secretInput.value.toLowerCase().trim();
    if(value==='sherman'){
        secretInput.value='';
        heartContainer.classList.add('show');
        launchFireworks();
        const timer=setInterval(launchFireworks,1200);
        setTimeout(()=>{
            heartContainer.classList.remove('show');
            clearInterval(timer);
            fireworksContainer.innerHTML='';
        },6000);
    }
}

secretButton.addEventListener('click', handleEasterEgg);
secretInput.addEventListener('keypress', e=>{ if(e.key==='Enter') handleEasterEgg(); });
