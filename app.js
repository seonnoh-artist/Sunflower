// ==================== 비밀번호 인증 ====================

let password = '0000'; // 원하는 비밀번호로 수정
let enteredPassword = '';

function checkPassword() {
  enteredPassword = document.getElementById('password').value;

  if (enteredPassword === password) {
    document.activeElement.blur(); // 키보드 내려가기

    setTimeout(() => {
      const form = document.getElementById('password-form');
      form.style.display = 'none';
      form.innerHTML = '';

      document.getElementById('art-container').style.display = 'block';
      initializeArt();
    }, 50); // 50~100ms 사이 권장
  } else {
    alert('Incorrect password');
  }
}

// ==================== 전역 변수 ====================

let mic;
let vol = 0;
let petals = 0;
let t = 0;
let started = false;
let R = 0;
let f = 0;
let w = 0;
let h = 0;
let P = Math.PI / 20; // 꽃잎 간격
let petal_curve;
let bg;
let micSensitivity = 0.02;
let log_str = '';

// ==================== 기기 감지 ====================

function detectDevice() {
  const ua = navigator.userAgent.toLowerCase();
  const isIpad = ua.includes("ipad") || (ua.includes("macintosh") && 'ontouchend' in document);
  const isIphone = ua.includes("iphone");

  if (isIpad) {
    micSensitivity = 0.002;
    log_str = "iPad";
  } else if (isIphone) {
    micSensitivity = 0.05;
    log_str = "iPhone";
  } else {
    micSensitivity = 0.3;
    log_str = "ETC";
  }

  console.log("Device detected → micSensitivity:", micSensitivity);
}

// ==================== 작품 초기화 ====================

function initializeArt() {
  colorMode(HSB, 360, 100, 100, 100);

  //화면 크기를 줄인다. 
  canvasWidth = windowWidth*0.7;
  canvasHeight = windowHeight;

  const cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('art-container');
  cnv.position(0, 0);
  resizeCanvas(windowWidth, windowHeight);

  stroke(255);
  mic = new p5.AudioIn();
  mic.start();

  w = width / 2;
  h = height / 2;

  detectDevice();
}

// ==================== 마이크 활성화 ====================

function mousePressed() {
  if (!started) {
    userStartAudio().then(() => {
      mic = new p5.AudioIn();
      mic.start();
      started = true;
    });
  }
}

// ==================== 디버그 로그 ====================

function printlog() {
  // 사용 시 text()를 통해 log_str 출력 가능
}

// ==================== 메인 드로잉 루프 ====================

function draw() {
  background(0, 0, 0, 10);
  printlog();

  if (!started) return;

  vol = mic.getLevel();
  translate(w, h);

  // ===== 꽃잎 =====
  let n = map(vol, 0, micSensitivity, 0.1, 8, true);
  petal_curve = map(vol, 0, 0.3, 1.2, 1.5);
  let petalCount = 250;
  let petalLength = 550;
  let petalWidth = 70;
  let petal_scale = map(vol, 0, micSensitivity, 1, 1.5, true);
  let hue = 105 - map(vol, 0, micSensitivity, 40, 60);

  noStroke();
  fill(hue, 100, 100, 4);

  for (let i = 0; i < petalCount; i++) {
    let angle = i * (360 / petalCount);
    t = (frameCount % 360) * 0.0001;
    let wave = sin(t + i * 10) * 30;

    rotate(angle + wave);
    let scale_random = sin(i) * 50;
    let random_H = random(60, 65);
    fill(random_H, 100, 100, 4);
    ellipse(0, -60, petalWidth * petal_scale, petalLength * petal_scale + scale_random);
  }

  // ===== 해바라기 중심 동그라미 (짙은 원) =====
  let circleR = map(vol, 0, micSensitivity, 350, 500, true);
  let seed_S = 50 + 70 - map(vol, 0, micSensitivity, 50, 70, true);

  noFill();
  for (let i = 0; i < circleR; i++) {
    let alpha = 100 - map(i, 0, circleR, 0, 100);
    stroke(30, seed_S, 70, alpha);
    circle(0, 0, i);
  }

  // ===== 해바라기 중심 동그라미 (연한 원) =====
  circleR *= 0.7;
  seed_S = map(vol, 0, micSensitivity, 50, 70, true);

  for (let i = 0; i < circleR; i++) {
    let alpha = 100 - map(i, 0, circleR, 0, 100);
    stroke(30, 80, 50, alpha);
    circle(0, 0, i);
  }

  // ===== 씨앗/패턴 (사운드 시각화) =====
  strokeWeight(map(vol, 0, micSensitivity, 1, 3));
  let seed_color = map(vol, 0, micSensitivity, 15, 20, true);

  for (let i = 0; i < TAU; i += P) {
    for (let r = -30; r < 155; r += 30) {
      let F = f / 99;
      let Z = i + n - F;
      let K = r + R % 60;
      let x = sin(Z) * K * petal_scale;
      let y = cos(Z) * K * petal_scale;

      let H = i - n - F;
      K += 30;
      let X = sin(H) * K * petal_scale;
      let Y = cos(H) * K * petal_scale;

      let alpha = 80 - map(r, -30, 155, 30, 80);
      stroke(hue, seed_color, 100, alpha);

      let ctrl1x = lerp(x, X, 0.3) * petal_curve;
      let ctrl1y = lerp(y, Y, 0.3) * petal_curve;
      let ctrl2x = lerp(x, X, 0.7) * petal_curve;
      let ctrl2y = lerp(y, Y, 0.7) * petal_curve;

      bezier(x, y, ctrl1x, ctrl1y, ctrl2x, ctrl2y, X, Y);

      n = -n;
    }
    R += 0.02;
  }

  f += P;
  if (R >= 60) R = 0;
}

// ==================== 서비스 워커 등록 ====================

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(reg => console.log('Service Worker registered:', reg.scope))
    .catch(err => console.log('Service Worker registration failed:', err));
}