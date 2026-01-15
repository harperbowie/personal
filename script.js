// ======================
// 陀螺仪输入 - 修正版本
// ======================
function handleOrientation(event) {
    if (event.beta === null || event.gamma === null) return;

    inputMode = 'gyro';

    // 第一次触发时记录当前方向作为零点
    if (initialGyroX === null || initialGyroY === null) {
        // 使用 beta 和 gamma 的当前值作为零点
        initialGyroX = event.beta;
        initialGyroY = event.gamma;
        
        // 立即应用这个零点，防止跳转
        gyroCurrentX = 0;
        gyroCurrentY = 0;
        gyroTargetX = 0;
        gyroTargetY = 0;
        
        console.log('📱 记录零点方向：beta=' + initialGyroX.toFixed(1) + '°, gamma=' + initialGyroY.toFixed(1) + '°');
        
        // 立即更新名片旋转到零点
        currentTiltX = 0;
        currentTiltY = 0;
        cardTilt.style.transform = `rotateX(0deg) rotateY(0deg)`;
        
        return; // 第一次只记录零点，不进行偏移计算
    }

    // 计算相对于初始零点的偏移
    const betaOffset = event.beta - initialGyroX;
    const gammaOffset = event.gamma - initialGyroY;
    
    // 调试信息
    // console.log('当前beta:', event.beta.toFixed(1), '初始beta:', initialGyroX.toFixed(1), '偏移:', betaOffset.toFixed(1));
    // console.log('当前gamma:', event.gamma.toFixed(1), '初始gamma:', initialGyroY.toFixed(1), '偏移:', gammaOffset.toFixed(1));
    
    // 调整映射关系 - 根据设备方向
    const isPortrait = window.innerHeight > window.innerWidth;
    
    // 重新映射坐标系，使名片的旋转更自然
    // 对于手机陀螺仪，beta通常是前后倾斜，gamma是左右倾斜
    // 但我们需要将其映射到卡片的rotateX和rotateY
    let xTilt, yTilt;
    
    if (isPortrait) {
        // 竖屏模式
        xTilt = -betaOffset * 0.6; // 前后倾斜 -> 卡片绕X轴旋转
        yTilt = gammaOffset * 0.6;  // 左右倾斜 -> 卡片绕Y轴旋转
    } else {
        // 横屏模式
        xTilt = -gammaOffset * 0.6;
        yTilt = -betaOffset * 0.6;
    }
    
    // 限制旋转角度范围
    gyroTargetX = Math.max(-20, Math.min(20, xTilt));
    gyroTargetY = Math.max(-20, Math.min(20, yTilt));
}

// ======================
// 重置陀螺仪零点
// ======================
function resetGyroZeroPoint() {
    initialGyroX = null;
    initialGyroY = null;
    isGyroInitialized = false;
    calibrationSamples = [];
    gyroCurrentX = 0;
    gyroCurrentY = 0;
    gyroTargetX = 0;
    gyroTargetY = 0;
    
    // 重置名片旋转
    currentTiltX = 0;
    currentTiltY = 0;
    cardTilt.style.transform = `rotateX(0deg) rotateY(0deg)`;
    
    console.log('🔄 陀螺仪零点已重置，等待下次设备方向事件...');
}

// ======================
// 页面加载时的特殊处理
// ======================
document.addEventListener('DOMContentLoaded', function() {
    // 添加一个延迟，确保页面完全加载
    setTimeout(function() {
        console.log('📱 页面加载完成，等待设备方向数据...');
        
        // 重置零点，确保每次刷新都重新校准
        resetGyroZeroPoint();
        
        // 添加一个指示器，显示陀螺仪状态
        const gyroStatus = document.createElement('div');
        gyroStatus.id = 'gyroStatus';
        gyroStatus.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            color: #fff;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 9999;
            display: none;
        `;
        document.body.appendChild(gyroStatus);
        
        // 监听设备方向事件，显示状态
        let lastUpdate = 0;
        const updateInterval = 1000; // 每秒更新一次
        
        const originalHandleOrientation = handleOrientation;
        handleOrientation = function(event) {
            originalHandleOrientation(event);
            
            const now = Date.now();
            if (now - lastUpdate > updateInterval) {
                if (event.beta !== null && event.gamma !== null) {
                    const statusText = initialGyroX === null ? 
                        '校准中...' : 
                        `已校准 | beta:${event.beta.toFixed(1)}° gamma:${event.gamma.toFixed(1)}°`;
                    
                    gyroStatus.textContent = statusText;
                    gyroStatus.style.display = 'block';
                    lastUpdate = now;
                }
            }
        };
    }, 500);
});

// ======================
// 设备方向变化处理
// ======================
let lastWidth = window.innerWidth;
let lastHeight = window.innerHeight;

function checkOrientationChange() {
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    
    if (Math.abs(currentWidth - lastWidth) > 50 || Math.abs(currentHeight - lastHeight) > 50) {
        // 屏幕方向可能已改变
        console.log('🔄 屏幕方向改变，重置陀螺仪零点');
        resetGyroZeroPoint();
    }
    
    lastWidth = currentWidth;
    lastHeight = currentHeight;
}

// 监听resize事件，但不要太频繁
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(checkOrientationChange, 500);
});

// ======================
// 添加校准按钮
// ======================
document.addEventListener('DOMContentLoaded', function() {
    const calibrateBtn = document.createElement('button');
    calibrateBtn.id = 'calibrateGyroBtn';
    calibrateBtn.textContent = '校准陀螺仪';
    calibrateBtn.style.cssText = `
        position: fixed;
        bottom: 60px;
        right: 20px;
        z-index: 1000;
        padding: 8px 16px;
        background: rgba(0,0,0,0.7);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.3s;
    `;
    
    calibrateBtn.addEventListener('mouseover', function() {
        this.style.background = 'rgba(0,0,0,0.9)';
    });
    
    calibrateBtn.addEventListener('mouseout', function() {
        this.style.background = 'rgba(0,0,0,0.7)';
    });
    
    calibrateBtn.addEventListener('click', function() {
        resetGyroZeroPoint();
        
        // 添加反馈效果
        this.textContent = '校准中...';
        this.style.background = '#4CAF50';
        
        setTimeout(() => {
            this.textContent = '校准陀螺仪';
            this.style.background = 'rgba(0,0,0,0.7)';
        }, 1000);
    });
    
    document.body.appendChild(calibrateBtn);
});
