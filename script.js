// ======================
// 陀螺仪输入 - 改进版本
// ======================
let isGyroInitialized = false;
let calibrationSamples = [];
const CALIBRATION_SAMPLE_COUNT = 10; // 采集10个样本求平均

function handleOrientation(event) {
    if (event.beta === null || event.gamma === null) return;
    
    inputMode = 'gyro';
    
    // 校准阶段：收集样本
    if (!isGyroInitialized) {
        calibrationSamples.push({
            beta: event.beta,
            gamma: event.gamma
        });
        
        // 收集足够的样本后计算平均初始值
        if (calibrationSamples.length >= CALIBRATION_SAMPLE_COUNT) {
            const avgBeta = calibrationSamples.reduce((sum, s) => sum + s.beta, 0) / calibrationSamples.length;
            const avgGamma = calibrationSamples.reduce((sum, s) => sum + s.gamma, 0) / calibrationSamples.length;
            
            initialGyroX = avgBeta;
            initialGyroY = avgGamma;
            isGyroInitialized = true;
            
            console.log('📱 陀螺仪校准完成，初始方向：', 
                initialGyroX.toFixed(1), initialGyroY.toFixed(1));
        } else {
            // 校准期间不更新目标值
            return;
        }
    }
    
    // 计算相对于初始方向的偏移
    const beta = event.beta || 0;
    const gamma = event.gamma || 0;
    
    // 注意：这里需要根据设备方向调整映射关系
    // 根据设备方向调整坐标系
    const isPortrait = window.innerHeight > window.innerWidth;
    
    let xOffset, yOffset;
    
    if (isPortrait) {
        // 竖屏模式
        xOffset = (beta - initialGyroX) * 0.8;
        yOffset = (gamma - initialGyroY) * 0.8;
    } else {
        // 横屏模式 - 需要调整映射
        xOffset = (gamma - initialGyroY) * 0.8;
        yOffset = -(beta - initialGyroX) * 0.8;
    }
    
    // 限制范围
    gyroTargetX = Math.max(-30, Math.min(30, xOffset));
    gyroTargetY = Math.max(-30, Math.min(30, yOffset));
}

// ======================
// 重新校准陀螺仪（可选）
// ======================
function recalibrateGyroscope() {
    isGyroInitialized = false;
    calibrationSamples = [];
    initialGyroX = null;
    initialGyroY = null;
    gyroCurrentX = 0;
    gyroCurrentY = 0;
    gyroTargetX = 0;
    gyroTargetY = 0;
    
    console.log('🔄 陀螺仪重新校准中...');
}

// ======================
// 页面加载时等待设备稳定
// ======================
let gyroInitTimeout;
let isPageLoaded = false;

window.addEventListener('load', () => {
    isPageLoaded = true;
    
    // 页面加载后延迟一段时间才开始校准
    clearTimeout(gyroInitTimeout);
    gyroInitTimeout = setTimeout(() => {
        if (!isGyroInitialized) {
            console.log('⏳ 设备未稳定，强制结束校准');
            isGyroInitialized = true;
        }
    }, 2000); // 2秒后强制结束校准
});

// ======================
// 添加重新校准按钮（可选）
// ======================
document.addEventListener('DOMContentLoaded', () => {
    const recalibrateBtn = document.createElement('button');
    recalibrateBtn.textContent = '重新校准陀螺仪';
    recalibrateBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        padding: 8px 16px;
        background: rgba(0,0,0,0.7);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    `;
    recalibrateBtn.addEventListener('click', recalibrateGyroscope);
    document.body.appendChild(recalibrateBtn);
});

// ======================
// 处理设备方向变化（横竖屏切换）
// ======================
let lastOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

window.addEventListener('resize', () => {
    const currentOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    
    if (currentOrientation !== lastOrientation) {
        console.log('📱 屏幕方向改变，重新校准陀螺仪');
        recalibrateGyroscope();
        lastOrientation = currentOrientation;
    }
});
