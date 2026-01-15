// ==========================
// Gyro Relative Orientation
// ==========================

let card = document.querySelector('.card'); // 你的名片元素
let enabled = false;

// 基准（刷新那一刻的姿态）
let baseQuat = null;

// 当前相对旋转
let currentQuat = { x: 0, y: 0, z: 0, w: 1 };

// 幅度调节（越大越明显）
const INTENSITY = 1.8;

// ---------- Quaternion 工具 ----------
function degToRad(d) {
  return d * Math.PI / 180;
}

function quatFromEuler(alpha, beta, gamma) {
  // Z-X-Y 顺序（这是浏览器 deviceorientation 正确用法）
  let _x = degToRad(beta);
  let _y = degToRad(gamma);
  let _z = degToRad(alpha);

  let cX = Math.cos(_x / 2);
  let cY = Math.cos(_y / 2);
  let cZ = Math.cos(_z / 2);
  let sX = Math.sin(_x / 2);
  let sY = Math.sin(_y / 2);
  let sZ = Math.sin(_z / 2);

  return {
    x: sX * cY * cZ + cX * sY * sZ,
    y: cX * sY * cZ - sX * cY * sZ,
    z: cX * cY * sZ + sX * sY * cZ,
    w: cX * cY * cZ - sX * sY * sZ
  };
}

function quatInvert(q) {
  return { x: -q.x, y: -q.y, z: -q.z, w: q.w };
}

function quatMultiply(a, b) {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
  };
}

function quatToEuler(q) {
  return {
    x: Math.atan2(2 * (q.w * q.x + q.y * q.z), 1 - 2 * (q.x * q.x + q.y * q.y)),
    y: Math.asin(Math.max(-1, Math.min(1, 2 * (q.w * q.y - q.z * q.x)))),
    z: Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z))
  };
}

// ---------- 核心逻辑 ----------
function handleOrientation(e) {
  if (e.alpha === null) return;

  const q = quatFromEuler(e.alpha, e.beta, e.gamma);

  // 第一次读到数据：锁定“刷新时的姿态”为零点
  if (!baseQuat) {
    baseQuat = quatInvert(q);
    return;
  }

  // 相对旋转 = 基准 × 当前
  currentQuat = quatMultiply(baseQuat, q);

  const euler = quatToEuler(currentQuat);

  // 放大幅度 + 映射到名片
  const rx = euler.x * INTENSITY;
  const ry = euler.y * INTENSITY;

  card.style.transform = `
    perspective(1000px)
    rotateX(${rx}rad)
    rotateY(${ry}rad)
  `;
}

// ---------- 权限 ----------
function enableGyro() {
  if (enabled) return;
  enabled = true;

  window.addEventListener('deviceorientation', handleOrientation, true);
}

// iOS Safari 必须用户手势
document.body.addEventListener('click', () => {
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    DeviceOrientationEvent.requestPermission().then(res => {
      if (res === 'granted') enableGyro();
    });
  } else {
    enableGyro();
  }
}, { once: true });
