// State
var rotation = 0;
var isRotating = false;
var isHovering = false;
var tilt = { x: 0, y: 0 };
var mousePos = { x: 0, y: 0 };
var deviceTilt = { x: 0, y: 0 };
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

// Mouse movement
window.addEventListener('mousemove', function(e) {
    mousePos = { x: e.clientX, y: e.clientY };
});

// Device orientation
if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', function(e) {
        var beta = e.beta || 0;
        var gamma = e.gamma || 0;
        deviceTilt = { 
            x: Math.max(-15, Math.min(15, beta / 3)),
            y: Math.max(-15, Math.min(15, gamma / 3))
        };
    });
}

// Ambient animation
function animate() {
    if (!isHovering && !isRotating && rotation % 360 === 0) {
        var centerX = window.innerWidth / 2;
        var centerY = window.innerHeight / 2;
        var deltaX = (mousePos.x - centerX) / centerX;
        var deltaY = (mousePos.y - centerY) / centerY;
        
        tilt.x += (deltaY * -3 - tilt.x) * 0.05;
        tilt.y += (deltaX * 3 - tilt.y) * 0.05;

        var finalTilt = isMobile ? deviceTilt : tilt;
        cardInner.style.transform = 'rotateX(' + finalTilt.x + 'deg) rotateY(' + (finalTilt.y + rotation) + 'deg)';
    }
    animationFrameId = requestAnimationFrame(animate);
}
animate();

// Card hover
cardContainer.addEventListener('mouseenter', function() {
    isHovering = true;
});

cardContainer.addEventListener('mousemove', function(e) {
    if (isRotating || rotation % 360 !== 0) return;
    
    var rect = cardContainer.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var centerX = rect.width / 2;
    var centerY = rect.height / 2;
    var tiltX = ((y - centerY) / centerY) * -12;
    var tiltY = ((x - centerX) / centerX) * 12;
    
    cardInner.style.transform = 'rotateX(' + tiltX + 'deg) rotateY(' + (tiltY + rotation) + 'deg)';
});

cardContainer.addEventListener('mouseleave', function() {
    isHovering = false;
    if (!isRotating && rotation % 360 === 0) {
        tilt = { x: 0, y: 0 };
    }
});

// Card click
cardContainer.addEventListener('click', function() {
    isRotating = true;
    rotation += 180;
    tilt = { x: 0, y: 0 };
    
    var finalTilt = isMobile ? deviceTilt : tilt;
    cardInner.style.transform = 'rotateX(' + finalTilt.x + 'deg) rotateY(' + (finalTilt.y + rotation) + 'deg)';
    
    setTimeout(function() {
        isRotating = false;
    }, 800);
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
