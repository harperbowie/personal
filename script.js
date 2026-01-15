// =================
// 输入数据
// =================
var mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
var gyroTargetX = 0, gyroTargetY = 0, gyroCurrentX = 0, gyroCurrentY = 0;
var inputMode = 'mouse';
var flipAngle = 0, currentTiltX = 0, currentTiltY = 0;

// DOM
var cardFlip = document.getElementById('cardFlipContainer');
var cardTiltX = document.getElementById('cardTiltX');
var cardTiltY = document.getElementById('cardTiltY');
var cardScaleWrapper = document.getElementById('cardScaleWrapper');
var aboutSection = document.getElementById('aboutSection');
var inputGroup = document.getElementById('inputGroup');
var secretInput = document.getElementById('secretInput');
var secretButton = document.getElementById('secretButton');
var heartContainer = document.getElementById('heartContainer');
var fireworksContainer = document.getElementById('fireworksContainer');

// =================
// 禁止文字和名片选中
// =================
[cardFlip, cardTiltX, cardTiltY].forEach(el=>{
    el.style.userSelect = 'none';
    el.style.webkitUserSelect = 'none';
    el.style.MozUserSelect = 'none';
    el.style.msUserSelect = 'none';
});

// =================
// 判断Safari
// =================
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// =================
// 鼠标 & 陀螺仪
// =================
window.addEventListener('mousemove', e=>{
    if(inputMode==='mouse'){mouseX=e.clientX; mouseY=e.clientY;}
});

function handleOrientation(event){
    if(event.beta!==null && event.gamma!==null){
        inputMode='gyro';
        // 所有浏览器统一幅度 ±24°
        gyroTargetX = Math.max(-24, Math.min(24, event.beta/2));
        gyroTargetY = Math.max(-24, Math.min(24, event.gamma/2));
    }
}

// =================
// 启用陀螺仪
// =================
function enableGyro(){
    if(isSafari){
        if(typeof DeviceOrientationEvent.requestPermission==='function'){
            // Safari 点击授权
            document.addEventListener('click', function onceClick(){
                DeviceOrientationEvent.requestPermission()
                .then(res=>{
                    if(res==='granted'){
                        window.addEventListener('deviceorientation', handleOrientation, true);
                        console.log('✅ Safari陀螺仪已启用');
                    }
                }).catch(console.error);
            }, {once:true});
        }
    } else {
        // 非Safari：自动绑定
        if(window.DeviceOrientationEvent){
            inputMode='gyro';
            window.addEventListener('deviceorientation', handleOrientation, true);
            console.log('✅ 非Safari移动端陀螺仪自动启用');
        }
    }
}
window.addEventListener('DOMContentLoaded', enableGyro);

// =================
// renderLoop
// =================
function renderLoop(){
    let targetX=0,targetY=0;

    if(inputMode==='gyro'){
        gyroCurrentX+=(gyroTargetX-gyroCurrentX)*0.1;
        gyroCurrentY+=(gyroTargetY-gyroCurrentY)*0.1;
        targetX=gyroCurrentX;
        targetY=gyroCurrentY;
    } else {
        const rect=cardFlip.getBoundingClientRect();
        const cx=rect.left+rect.width/2;
        const cy=rect.top+rect.height/2;
        const dx=mouseX-cx;
        const dy=mouseY-cy;
        const nx=Math.max(-1,Math.min(1,dx/(rect.width/2)));
        const ny=Math.max(-1,Math.min(1,dy/(rect.height/2)));
        targetX=-ny*12;
        targetY=nx*12;
    }

    currentTiltX+=(targetX-currentTiltX)*0.1;
    currentTiltY+=(targetY-currentTiltY)*0.1;

    cardTiltX.style.transform=`rotateX(${currentTiltX}deg)`;
    cardTiltY.style.transform=`rotateY(${currentTiltY+flipAngle}deg)`;

    requestAnimationFrame(renderLoop);
}
renderLoop();

// =================
// 点击翻转 & 重置陀螺仪方向
// =================
function resetGyro(){
    if(inputMode==='gyro'){
        currentTiltX=gyroCurrentX;
        currentTiltY=gyroCurrentY;
    }
}

// 点击名片翻转
cardFlip.addEventListener('click', ()=>{
    flipAngle+=180;
    cardFlip.style.transform=`rotateY(${flipAngle}deg)`;
    resetGyro();
});

// 页面任意点击也重置陀螺仪方向
document.addEventListener('click', resetGyro);

// =================
// scroll
// =================
window.addEventListener('scroll', ()=>{
    const scrollY=window.scrollY;
    cardScaleWrapper.style.opacity=Math.max(0,1-scrollY/400);
    cardScaleWrapper.style.transform=`scale(${Math.max(0.8,1-scrollY/1000)})`;

    const aboutScrollStart=200, aboutScrollEnd=500, aboutFadeOut=1200;
    const aboutOpacity=scrollY<aboutFadeOut?Math.min(1,Math.max(0,(scrollY-aboutScrollStart)/(aboutScrollEnd-aboutScrollStart))):Math.max(0,1-(scrollY-aboutFadeOut)/300);
    const aboutTranslateY=scrollY<aboutFadeOut?Math.max(0,50-(scrollY-aboutScrollStart)/8):Math.max(0,-30+(scrollY-aboutFadeOut)/10);
    aboutSection.style.opacity=aboutOpacity;
    aboutSection.style.transform=`translateY(${aboutTranslateY}px)`;

    const secretOpacity=Math.min(1,Math.max(0,(scrollY-1400)/300));
    const secretTranslateY=Math.max(0,30-(scrollY-1400)/10);
    inputGroup.style.opacity=secretOpacity;
    inputGroup.style.transform=`translateY(${secretTranslateY}px)`;
});

// =================
// Easter Egg
// =================
function createFirework(){
    let x=Math.random()*window.innerWidth;
    let y=Math.random()*window.innerHeight*0.7+100;
    let hue=Math.random()*360;
    for(let i=0;i<40;i++){
        let particle=document.createElement('div');
        particle.className='firework-particle';
        particle.style.left=x+'px';
        particle.style.top=y+'px';
        let angle=(Math.PI*2*i)/40;
        let velocity=1.5+Math.random()*1.5;
        let distance=velocity*150;
        let tx=Math.cos(angle)*distance;
        let ty=Math.sin(angle)*distance;
        particle.style.backgroundColor=`hsl(${hue},100%,60%)`;
        particle.style.boxShadow=`0 0 15px hsl(${hue},100%,60%)`;
        fireworksContainer.appendChild(particle);

        (function(p,targetX,targetY){
            let start=null;
            function animate(ts){
                if(!start)start=ts;
                let progress=(ts-start)/1500;
                if(progress<1){
                    let cx=targetX*progress,cy=targetY*progress,scale=1-progress,opacity=1-progress;
                    p.style.transform=`translate(${cx}px,${cy}px) scale(${scale})`;
                    p.style.opacity=opacity;
                    requestAnimationFrame(animate);
                }else p.remove();
            }
            requestAnimationFrame(animate);
        })(particle,tx,ty);
    }
}

function launchFireworks(){
    for(let i=0;i<6;i++) setTimeout(createFirework,i*150);
}

function handleEasterEgg(){
    const val=secretInput.value.toLowerCase().trim();
    if(val==='sherman'){
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

secretButton.addEventListener('click',handleEasterEgg);
secretInput.addEventListener('keypress',e=>{if(e.key==='Enter')handleEasterEgg();});
