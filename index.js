const timeset = {
  normal: {
    init: 196,
    first: 182,
    second: 152,
    last: 121,
  },
  hard: {
    init: 166,
    first: 152,
    second: 126,
    last: 100,
  }
};
let difficult = 'hard';
const baseTime = 1800;
const synth = window.speechSynthesis;
let speechReady = false;
let interval = 0;
let startTime;
let labTime;
let timerCycle = timeset.init;
let selectedVoice;

function init() {
  const voiceList = synth.getVoices();
  for(const voice of voiceList) {
    if (voice.lang === 'ko-KR') {
      selectedVoice = voice;
      break;
    }
  }

  if (!selectedVoice) {
    return;
  }

  speechReady = true;
}

function timerStart() {
  timerReset();
  labTime = startTime = Date.now();
  countDown();
  interval = setInterval(countDown, 500);
}

function syncDetail(syncTime) {
  if (startTime) {
    labTime += syncTime;
    countDown();
  }
}

function changeDiff(event) {
  if (startTime) {
    speech('진행중에는 난이도를 변경할 수 없습니다.');
    event.preventDefault();
    event.stopPropagation();
    event.target.value = difficult;
    return false;
  } else {
    difficult = event.target.value;
    speech(`난이도가 ${difficult}로 변경되었습니다.`);
  }
}

function timerToggle() {
  const toggleButton = document.body.querySelector('.btnStart');
  if (startTime) {
    timerReset();
    toggleButton.innerText = '시작';
    toggleButton.className = 'btnStart'
  } else {
    timerStart();
    toggleButton.innerText = '중지';
    toggleButton.className = 'btnStart isRunning';
  }
}

function timerReset() {
  clearInterval(interval);
  setPhase('first');
  setProgressTime(baseTime);
  setLeftTime(0);
  startTime = undefined;
  labTime = undefined;
  timerCycle = timeset[difficult].init;
}

function setPhase(phase) {
  const selected = document.querySelector('.buttonGroup .selected');
  selected.className = selected.className.replace('selected', '').trim();
  const selectedTimeset = timeset[difficult];

  document.querySelector(`.buttonGroup .${phase}`).className = `${phase} selected`;
  const previousCycle = timerCycle;
  switch(phase) {
    case "first":
      timerCycle = selectedTimeset.first;
      break;
    case "second":
      timerCycle = selectedTimeset.second;
      break;
    case "last":
      timerCycle = selectedTimeset.last;
      break;
  }

  if (previousCycle < timerCycle) {
    const differentTime = timerCycle - previousCycle;
    const phaseTime = Math.floor((Date.now() - labTime) / 1000);
    if (phaseTime < differentTime) {
      labTime = Math.max(labTime - previousCycle * 1000, startTime);
    }
  }
}

function setProgressTime(time) {
  const converted = convertMinute(time);
  document.querySelector('.progressTime .minute').innerText = converted.minute;
  document.querySelector('.progressTime .second').innerText = converted.second;
}

function setLeftTime(time) {
  const converted = convertMinute(time);
  document.querySelector('.leftTime .minute').innerText = converted.minute;
  document.querySelector('.leftTime .second').innerText = converted.second;
}

function setNextTime(time) {
  const converted = convertMinute(time);
  document.querySelector('.nextTime .minute').innerText = converted.minute;
  document.querySelector('.nextTime .second').innerText = converted.second;
}

function countDown() {
  const progressTime = Math.floor((Date.now() - startTime) / 1000);
  const phaseTime = Math.floor((Date.now() - labTime) / 1000);
  const leftTime = timerCycle - phaseTime;
  setProgressTime(baseTime - progressTime);
  setLeftTime(leftTime);
  setNextTime(baseTime - progressTime - leftTime);

  if (baseTime < progressTime) {
    timerReset();
  }

  if (leftTime <= 0) {
    labTime = Date.now() + leftTime * 1000;
    if (timerCycle === timeset[difficult].init) {
      timerCycle = timeset[difficult].first;
    }
    return;
  }

  if ([90,60].includes(leftTime)) {
    const converted = convertMinute(leftTime);
    speech(`${converted.minute}분 ${converted.second ? converted.second + '초' : ''}`);
  } else if ([40, 30, 20, 10].includes(leftTime)) {
    speech(`${leftTime}초 남았습니다.`, 1.1);
  } else if (leftTime < 6) {
    speech(leftTime, 1.2);
  }
}

const dupSpeech = {};

function speech(text, pitch = 1) {
  const hash = CryptoJS.MD5(text);
  if (dupSpeech[hash]) {
    return;
  }
  dupSpeech[hash] = 1;
  setTimeout(() => { delete dupSpeech[hash]; }, 1000);
  const utter = new SpeechSynthesisUtterance(text);
  utter.voice = selectedVoice;
  utter.pitch = pitch;
  speechSynthesis.speak(utter);
}

function convertMinute(second) {
  return {
    minute: Math.floor(second / 60),
    second: second % 60,
  };
}

document.body.onload = function(){
  setTimeout(init, 500);
};
