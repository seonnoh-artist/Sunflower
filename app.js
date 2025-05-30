// ==================== 비밀번호 인증 ====================

let password = '0000'; // 원하는 비밀번호로 수정
let enteredPassword = '';
let startHour = 10; // 전시 시간 설정 
let endHour = 20;

function checkPassword() {
  enteredPassword = document.getElementById('password').value;

  if (enteredPassword === password) {
    // 전시 시간 로직 추가 
    const now = new Date();
    const hour = now.getHours();

    if (startHour <= endHour) {
      if (hour < startHour || hour >= endHour) {
        alert(`현재 시간은 ${hour}시입니다. 전시 시간은 ${startHour}시 ~ ${endHour}시입니다.`);
        return;
      }
    } else {
      // 자정을 넘긴 경우 (예: 22~2시)
      if (hour < startHour && hour >= endHour) {
        alert(`현재 시간은 ${hour}시입니다. 전시 시간은 ${startHour}시 ~ ${endHour}시입니다.`);
        return;
      }
    }

    document.activeElement.blur(); // 키보드 내려가기

    setTimeout(() => {
      const form = document.getElementById('password-form');
      form.style.display = 'none';
      form.innerHTML = '';

      document.getElementById('art-container').style.display = 'block';
      initializeArt();
    }, 50);
  } else {
    alert('Incorrect password');
  }
}

function loadExhibitionTime() {
  const savedStart = localStorage.getItem('startHour');
  const savedEnd = localStorage.getItem('endHour');
  if (savedStart !== null) startHour = parseInt(savedStart);
  if (savedEnd !== null) endHour = parseInt(savedEnd);

  document.getElementById('start-hour').value = startHour;
  document.getElementById('end-hour').value = endHour;
}

function saveExhibitionTime() {
  const s = parseInt(document.getElementById('start-hour').value);
  const e = parseInt(document.getElementById('end-hour').value);

  if (s >= 0 && s <= 23 && e >= 0 && e <= 23) {
    startHour = s;
    endHour = e;
    localStorage.setItem('startHour', startHour);
    localStorage.setItem('endHour', endHour);
    alert('전시 시간이 저장되었습니다.');
  } else {
    alert('0~23 사이의 숫자를 입력해주세요.');
  }
}

function changeHour(type, delta) {
  const input = document.getElementById(`${type}-hour`);
  let val = parseInt(input.value || '0') + delta;
  if (val < 0) val = 23;
  if (val > 23) val = 0;
  input.value = val;
}

// ==================== 전역 변수 ====================

let mic;
let vol = 0;
let started = false;
let t = 0, R = 0, f = 0;
let w = 0, h = 0;
let P = Math.PI / 20; // 씨앗 간격
let petal_curve;
let micSensitivity = 0.02;
let sunflower_scale = 0.7;
let log_str = '';
let lastVol = 0;
let freezeCount = 0;

// ==================== 기기 감지 ====================

function detectDevice() {
  const ua = navigator.userAgent.toLowerCase();
  const isIpad = ua.includes("ipad") || (ua.includes("macintosh") && 'ontouchend' in document);
  const isIphone = ua.includes("iphone");

  if (isIpad) {
    micSensitivity = 0.005;
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

function printLog() {
  fill(255);
  textSize(20);
  text(log_str, 100, 100);
  let volume_str = mic.getLevel();
  text("vol: " + nf(volume_str, 1, 6), 100, 300);
  text("satrtHour: " + startHour, 100, 200);
  text("endHour: " + endHour, 100, 250);
}

// ==================== 작품 초기화 ====================

function initializeArt() {
  colorMode(HSB, 360, 100, 100, 100);

  const cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('art-container');
  cnv.position(0, 0);
  resizeCanvas(windowWidth, windowHeight);

  stroke(255);
  // mic = new p5.AudioIn();
  // mic.start();

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
//=======================마이크 재활성화=====================
function restartMic() {
  if (mic) {
    mic.stop(); //기존 마이크 중지
  }
  mic = new p5.AudioIn();
  mic.start();
  started = true;
}
//======================마이크 모니터링=======================
function monitorMic() {
  let currentVol = mic.getLevel();
  if (currentVol === lastVol) {
    freezeCount++;
  } else {
    freezeCount = 0;
  }
  lastVol = currentVol;

  if (freezeCount > 100 && currentVol < 0.0001) {
    console.warn("마이크 재시작 시도");
    restartMic();
    freezeCount = 0;
  }
}
// ==================== 메인 드로잉 루프 ====================

function draw() {

  // 전시 시간 설정  9시~22시
  let now = hour();

  if (now >= startHour && now < endHour) {
    frameRate(40);
  } else {
    background(0, 0, 0);  // 전력을 가장 낮춘다.
    noStroke();
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text('전시 시간이 아닙니다.', width / 2, height / 2);
    frameRate(1);
    return;
  }


  /*
    //테스트용   
      let now = minute() % 2;
    
      if (now >= 0 && now < 1) {
        frameRate(40);
      } else {
        background(0, 0, 0);  // 전력을 가장 낮춘다. 
        noStroke();
        fill(255);
        textSize(32);
        textAlign(CENTER, CENTER);
        text('전시 시간이 아닙니다.', width / 2, height / 2);
        frameRate(1);
        return;
      }*/

  background(0, 0, 0, 10);

  if (!started) {
    fill(255);
    textSize(32);
    text("마우스를 클릭해주세요.", w, h);
    return;
  }
  monitorMic(); //마이크 모니터링

  vol = mic.getLevel();

  translate(w, h);

  // ===== 조용할 때 숨쉬는 애니메이션 =====
  let breathAnim = 1;
  // if (vol < micSensitivity * 0.05) {
  breathAnim = 1 + sin(frameCount * 0.02) * 0.1;
  //}

  printLog();

  // ===== 꽃잎 =====
  let n = map(vol, 0, micSensitivity, 0.1, 8, true);
  petal_curve = map(vol, 0, 0.3, 1.2, 1.5);
  let petalCount = 250;
  let petalLength = 550 * sunflower_scale;
  let petalWidth = 70 * sunflower_scale;
  let petal_scale = map(vol, 0, micSensitivity, 1, 1.5, true) * breathAnim; //조용할때 숨들이시기.
  let hue = 105 - map(vol, 0, micSensitivity, 40, 60) * breathAnim;

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
  let circleR = map(vol, 0, micSensitivity, 350, 500, true) * sunflower_scale * breathAnim;
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
    for (let r = -30; r < 155 * sunflower_scale; r += 30) {
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
  if (R >= 180) R = 0;
}

// ==================== 서비스 워커 등록 ====================

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(reg => console.log('Service Worker registered:', reg.scope))
    .catch(err => console.log('Service Worker registration failed:', err));
}