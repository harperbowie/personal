var mouseX=window.innerWidth/2,mouseY=window.innerHeight/2;
var gyroTargetX=0,gyroTargetY=0,gyroCurrentX=0,gyroCurrentY=0;
var inputMode='mouse';
var flipAngle=0,currentTiltX=0,currentTiltY=0;

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

// Mouse move
window.addEventListener('mousemove',e=>{
    if(inputMode==='mouse'){mouseX=e.clientX;mouseY=e.clientY;}
});

// Gyro
function handleOrientation(event){
    if(event.beta!==null && event.gamma!==null){
        inputMode='gyro';
        gyroTargetX=Math.max(-12,Math.min(12,event.beta/2));
        gyroTargetY=Math.max(-12,Math.min(12,event.gamma/2));
    }
}

if(typeof DeviceOrientationEvent!=='undefined'){
    if(typeof DeviceOrientationEvent.requestPermission==='function'){
        document.addEventListener('touchstart',function(){
            DeviceOrientationEvent.requestPermission().then(res=>{
                if(res==='granted'){window.addEventListener('deviceorientation',handleOrientation,true);}
            }).catch(console.error);
        },{once:true});
    }else{window.addEventListener('deviceorientation',handleOrientation,true);}
}

// render
function renderLoop(){
    let targetX=0,targetY=0;
    if(inputMode==='gyro'){
        gyroCurrentX+=(gyroTargetX-gyroCurrentX)*0.1;
        gyroCurrentY+=(gyroTargetY-gyroCurrentY)*0.1;
        targetX=gyroCurrentX;
        targetY=gyroCurrentY;
    }else{
        const rect=cardFlip.getBoundingClientRect();
        const cx=rect.left+rect.width/2;
        const cy=rect.top+rect.height/2;
        let dx=mouseX-cx,dy=mouseY-cy;
        let nx=dx/(rect.width/2),ny=dy/(rect.height/2);
        nx=Math.max(-1,Math.min(1,nx));
        ny=Math.max(-1,Math.min(1,ny));
        targetX=-ny*6;
        targetY=nx*6;
    }

    // 背面 tilt 反向
    const facingBack=(flipAngle/180)%2===1?true:false;
    if(facingBack){targetX=-targetX;targetY=-targetY;}

    currentTiltX+=(targetX-currentTiltX)*0.1;
    currentTiltY+=(targetY-currentTiltY)*0.1;
    cardTilt.style.transform=`rotateX(${currentTiltX}deg) rotateY(${currentTiltY}deg)`;

    requestAnimationFrame(renderLoop);
}
renderLoop();

// click flip
cardFlip.addEventListener('click',()=>{
    flipAngle+=180;
    cardFlip.style.transform=`rotateY(${flipAngle}deg)`;
    currentTiltX=0; currentTiltY=0;
});
