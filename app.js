let password = '0000'; // 원하는 비밀번호로 수정
let enteredPassword = '';

function checkPassword() {
  enteredPassword = document.getElementById('password').value;

  if (enteredPassword === password) {
    //포커스 해제해서 키보드 내려가게 함 
    document.activeElement.blur();

    //다음 프레임에 화면을 고정
    setTimeout(() => {
      document.getElementById('password-form').style.display = 'none';
      document.getElementById('password-form').innerHTML = ''; //html구조제거 
      document.getElementById('art-container').style.display = 'block';

      initializeArt();
    }, 50); //50~100ms사이 안전 
  } else {
    alert('Incorrect password');
  }
}

let mic;
let vol = 0;
let petals = 0;
let t = 0;
let started = false;
let R = 0;
let f = 0;
let w = 0;
let h = 0;
let P = Math.PI / 20;// 꽃잎수다.
let petal_curve;
let bg;
let ipad_mic = 0.03;  //컴퓨터에서는 0.3 아이패드도 일단 동일하게. 아이폰폰 입력 민감도가 낮다.0~0.05 //REDME!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

function initializeArt() { 
  colorMode(HSB, 360,100, 100, 100); // hue saturation brightness  alpha
  const cnv = createCanvas(windowWidth, windowHeight); // 원래 setup()의 createCanvas() 부분만 여기
  cnv.parent('art-container');
  cnv.position(0, 0); //좌표 틀어짐 방지 
  resizeCanvas(windowWidth, windowHeight); //강제 크기 재설정

  stroke(255);
  mic = new p5.AudioIn();
  mic.start();
  w = width / 2;
  h = height / 2;
}

function mousePressed() {
  if (!started) {
    userStartAudio().then(() => {
      mic = new p5.AudioIn();
      mic.start();
      started = true;
    });
  }
  console.log("mouseX" + mouseX + "mouseY" + mouseY);   //555 542
}

function draw() {
  background(0, 0, 0, 10);

  if (!started) {
    fill(255, 0, 100);
    stroke(255, 0, 100);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("클릭해서 마이크 활성화", w, h);
    return;
  }

  // 마이크 입력값 받아오기
  vol = mic.getLevel();
  //해바라기 그리는 부분으로 좌표 이동 
  translate(w, h);

  // 소리가 커질수록 꽃잎 수 증가
  let n = map(vol, 0, ipad_mic, 0.1, 8, true);  //초기 n = 0.1;
  petal_curve = map(vol, 0, 0.3, 1.2, 1.5);
  let N = 360 / 10;
  N = 30; //map(vol, 0, ipad_mic, 30, 60, true);
  let noise = map(vol, 0, 0.3, 1, 1.5, true);

  //꽃잎 그리기
  let petalCount = 250;
  let petalLength = 550;
  let petalWidth = 70;
  let petal_scale_before = map(vol, 0, ipad_mic, 1, 1.5, true);
  hue = map(vol, 0, ipad_mic, 40, 60);
  hue = 105 - hue;  // 40+65에서 빼기    //꽃잎 노랑 진하기를 결정한다 60 연두 40 주황황
  // alpha = map(vol, 0, ipad_mic, 5, 10, true);
  fill(hue, 100, 100, 4);
  noStroke();
  for (i = 0; i < petalCount; i++) {
    let angle = i * (360 / petalCount);
    t = frameCount % 360;
    t = t * 0.0001;
    //파동 요소 : 시간과 꽃잎 번호를 활용한 진동
    let wave = sin(t + i * 10) * 30;
    rotate(angle + wave);
    // stroke(255,200, 0, 100);
    let scale_random = sin(i) * 50;
    let random_H = random(60, 65);
    fill(random_H, 100, 100, 4);
    ellipse(0, -60, petalWidth * petal_scale_before, petalLength * petal_scale_before + scale_random);
  }

  //해바라기의 동그라미 짙음음
  hue = map(vol, 0, ipad_mic, 40, 60);
  hue = 105 - hue;  // 40+65에서 빼기    //꽃잎 노랑 진하기를 결정한다 60 연두 40 주황황
  alpha = map(vol, 0, ipad_mic, 1, 10, true);

  noFill();
  let ciricle_R = map(vol, 0, ipad_mic, 350, 500, true);
  let seed_S = map(vol, 0, ipad_mic, 50, 70, true); //갈색 색상  50 지튼 갈색 70 따뜻갈색 
  seed_S = 50 + 70 - seed_S;
  for (i = 0; i < ciricle_R; i++) {
    alpha = map(i, 0, ciricle_R, 0, 100);
    alpha = 100 - alpha;
    stroke(30, seed_S, 70, alpha); //갈색
    circle(0, 0, i);
  }

  //해바라기 동그라미 연함 
  noFill();
  ciricle_R = ciricle_R * 0.7; //70프로로 줄인다. 
  seed_S = map(vol, 0, ipad_mic, 50, 70, true); //갈색 색상  50 지튼 갈색 70 따뜻갈색 
  for (i = 0; i < ciricle_R; i++) {
    alpha = map(i, 0, ciricle_R, 0, 100);
    alpha = 100 - alpha;
    stroke(30, 80, 50, alpha); //갈색
    circle(0, 0, i);
  }

  // 해바라기 씨앗 패턴턴- 사운드 시각화 
  noFill();
  strokeWeight(map(vol, 0, ipad_mic, 1, 3));
  let petal_scale = map(vol, 0, ipad_mic, 1, 1.5, true);
  let seed_color = map(vol, 0, ipad_mic, 15, 20, true);

  for (i = 0; i < TAU; i += P) {
    for (r = -N; r < 155; r += N) {    //초기 r 155 
      let F = f / 99;
      let Z = i + n - F;
      let K = r + R % 60;
      let x = sin(Z) * K * petal_scale;
      let y = cos(Z) * K * petal_scale;
      let H = i - n - F;
      K = K + N;
      let X = sin(H) * K * petal_scale;
      let Y = cos(H) * K * petal_scale;


      alpha = map(r, -N, 155, 30, 80);
      alpha = 80 - alpha;
      stroke(hue, seed_color, 100, alpha);
      // line(x, y, X, Y);
      // circle(x / 2, y / 2, 4);
      //bezier(x, y, x * petal_curve, y * petal_curve, X * petal_curve, Y * petal_curve, X, Y);

      curve(x, y, x, y, X, Y, X, Y);

      let ctrl1x = lerp(x, X, 0.3) * petal_curve;
      let ctrl1y = lerp(y, Y, 0.3) * petal_curve;
      let ctrl2x = lerp(x, X, 0.7) * petal_curve;
      let ctrl2y = lerp(y, Y, 0.7) * petal_curve;
      bezier(x, y, ctrl1x, ctrl1y, ctrl2x, ctrl2y, X, Y);
      n = -n;
    }
    R += .02;
  }
  f += P;
  if (R == 60) R = 0;  //오버플로우 방지 초기화 

}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(function (registration) {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch(function (error) {
      console.log('Service Worker registration failed:', error);
    });
}
