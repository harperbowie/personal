// ===================
// 1. 输入数据
// ===================
let mouseX = window.innerWidth/2;
let mouseY = window.innerHeight/2;
let gyroTargetX=0, gyroTargetY=0, gyroCurrentX=0, gyroCurrentY=0;
let inputMode = 'mouse';
let flipAngle = 0;
let currentTiltX=0, currentTiltY=0;

// DOM
const cardFlip = document.getElementById('cardFlip');
const cardTilt = document.getElementById('cardTilt');
const cardScaleWrapper = document.getElementById('cardScaleWrapper');
const aboutSection = document.getElementById('aboutSection');
const inputGroup = document.getElementById('inputGroup');
const secretInput = document.getElementById('secretInput');
const secretButton = document.getElementById('secretButton');
const heartContainer = document.getElementById('heartContainer');
const fireworksContainer = document.getElementById('fireworksContainer');

// ===================
// 2. 输入监听
// ===================
window.addEventListener('mousemove', e=>{
    if(inputMode==='mouse'){
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

function handleOrientation(e){
    if(e.beta!==null && e.gamma!==null){
        inputMode='gyro';
        gyroTargetX = Math.max(-12,Math.min(12,e.beta/3));
        gyroTargetY = Math.max(-12,Math.min(12,e.gamma/3));
    }
}

if(typeof DeviceOrientationEvent!=='undefined'){
    if(typeof DeviceOrientationEvent.requestPermission==='function'){
        document.addEventListener('touchstart',()=>{
            DeviceOrientationEvent.requestPermission()
            .then(resp=>{
                if(resp==='granted'){
                    window.addEventListener('deviceorientation',handleOrientation,true);
                    console.log('✅ 陀螺仪已启用');
                }
            })
            .catch(console.error);
        },{once:true});
    }else{
        window.addEventListener('deviceorientation',handleOrientation,true);
    }
}

// ===================
// 3. rAF 循环
// ===================
function renderLoop(){
    let targetX=0,targetY=0;
    if(inputMode==='gyro'){
        gyroCurrentX+=(gyroTargetX-gyroCurrentX)*0.1;
        gyroCurrentY+=(gyroTargetY-gyroCurrentY)*0.1;
        targetX=gyroCurrentX;
        targetY=gyroCurrentY;
    }else{
        const rect = cardFlip.getBoundingClientRect();
        const dx = mouseX-(rect.left+rect.width/2);
        const dy = mouseY-(rect.top+rect.height/2);
        targetX = (-dy/rect.height)*12;
        targetY = (dx/rect.width)*12;
    }

    currentTiltX += (targetX-currentTiltX)*0.1;
    currentTiltY += (targetY-currentTiltY)*0.1;

    cardTilt.style.transform = `rotateX(${currentTiltX}deg) rotateY(${currentTiltY}deg)`;

    requestAnimationFrame(renderLoop);
}
renderLoop();

// ===================
// 4. 翻转
// ===================
cardFlip.addEventListener('click',()=>{
    flipAngle += 180;
    cardFlip.style.transform = `rotateY(${flipAngle}deg)`;
});

// ===================
// 5. Scroll（只影响 scale/opacity）
// ===================
window.addEventListener('scroll',()=>{
    let scrollY = window.scrollY;
    let cardOpacity = Math.max(0,1-scrollY/400);
    let cardScale = Math.max(0.8,1-scrollY/1000);
    cardScaleWrapper.style.opacity = cardOpacity;
    cardScaleWrapper.style.transform = `scale(${cardScale})`;

    let aboutScrollStart=200, aboutScrollEnd=500, aboutFadeOut=1200;
    let aboutOpacity = scrollY<aboutFadeOut ? Math.min(1,Math.max(0,(scrollY-aboutScrollStart)/(aboutScrollEnd-aboutScrollStart))) : Math.max(0,1-(scrollY-aboutFadeOut)/300);
    let aboutTranslateY = scrollY<aboutFadeOut ? Math.max(0,50-(scrollY-aboutScrollStart)/8) : Math.max(0,-30+(scrollY-aboutFadeOut)/10);
    aboutSection.style.opacity = aboutOpacity;
    aboutSection.style.transform = `translateY(${aboutTranslateY}px)`;

    let secretOpacity = Math.min(1,Math.max(0,(scrollY-1400)/300));
    let secretTranslateY = Math.max(0,30-(scrollY-1400)/10);
    inputGroup.style.opacity = secretOpacity;
    inputGroup.style.transform = `translateY(${secretTranslateY}px)`;
});

// ===================
// 6. Easter Egg
// ===================
function createFirework(){
    let x=Math.random()*window.innerWidth;
    let y=Math.random()*(window.innerHeight*0.7)+100;
    let hue=Math.random()*360;
    for(let i=0;i<40;i++){
        let particle=document.createElement('div');
        particle.className='firework-particle';
        particle.style.left=x+'px';
        particle.style.top=y+'px';
        let angle=(Math.PI*2*i)/40;
        let velocity=1.5+Math.random()*1.5;
        let distance = velocity*150;
        let tx=Math.cos(angle)*distance;
        let ty=Math.sin(angle)*distance;
        particle.style.backgroundColor = `hsl(${hue},100%,60%)`;
        particle.style.boxShadow = `0 0 15px hsl(${hue},100%,60%)`;
        fireworksContainer.appendChild(particle);

        (function(p,targetX,targetY){
            let start=null;
            function anim(ts){
                if(!start) start=ts;
                let prog=(ts-start)/1500;
                if(prog<1){
                    let cx=targetX*prog;
                    let cy=targetY*prog;
                    let scale = 1-prog;
                    let opacity = 1-prog;
                    p.style.transform = `translate(${cx}px,${cy}px) scale(${scale})`;
                    p.style.opacity = opacity;
                    requestAnimationFrame(anim);
                }else{ p.remove(); }
            }
            requestAnimationFrame(anim);
        })(particle,tx,ty);
    }
}
function launchFireworks(){for(let i=0;i<6;i++){setTimeout(createFirework,i*150);}}
function handleEasterEgg(){
    let val = secretInput.value.toLowerCase().trim();
    if(val==='sherman'){
        secretInput.value='';
        heartContainer.classList.add('show');
        launchFireworks();
        let timer=setInterval(launchFireworks,1200);
        setTimeout(()=>{
            heartContainer.classList.remove('show');
            clearInterval(timer);
            fireworksContainer.innerHTML='';
        },6000);
    }
}
secretButton.addEventListener('click',handleEasterEgg);
secretInput.addEventListener('keypress',e=>{
    if(e.key==='Enter'){handleEasterEgg();}
});
