(function () {
  const canvas = document.getElementById('radioCanvas');
  const ctx = canvas.getContext('2d');
  const container = document.getElementById('radio-widget-container');
  const toggleButton = document.getElementById('toggleAnimation');
  let audioContext = null; // Initialize on first user gesture
  let soundsReady = false;

  // Create Mute/Unmute button
  const muteButton = document.getElementById('muteButton');
  muteButton.textContent = 'Mute';

  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;

  const backgroundImage = new Image();
  backgroundImage.src = 'solara_radio.png';

  const beepFiles = ['radio_beep1.mp3', 'radio_beep2.mp3', 'radio_beep3.mp3'];
  let beepBuffers = [];
  let isMuted = false;

  // Preload beep sounds as AudioBuffers
  async function preloadBeepBuffers() {
    const buffers = await Promise.all(beepFiles.map(loadAudioBuffer));
    beepBuffers = buffers;
    soundsReady = true;
  }

  async function loadAudioBuffer(file) {
    const response = await fetch(file);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  }

  let stars = [];
  let fallingStars = [];
  let radioWaves = [];
  let antennaX = canvas.width * 0.7;
  let antennaY = canvas.height * 0.6;

  let isAnimating = true;

  for (let i = 0; i < 200; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, speed: Math.random() * 0.5 + 0.2 });
  }

  function animate() {
    if (!isAnimating) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';

    stars.forEach(star => {
      star.x -= star.speed;
      star.y += star.speed;

      if (star.x < 0 || star.y > canvas.height) {
        star.x = canvas.width + Math.random() * 50;
        star.y = Math.random() * canvas.height;
      }

      ctx.fillRect(star.x, star.y, 2, 2);
    });

    fallingStars.forEach(star => {
      star.x += star.speedX;
      star.y += star.speedY;

      star.distanceTraveled += Math.sqrt(star.speedX ** 2 + star.speedY ** 2);

      const fadeThreshold = Math.sqrt(canvas.width ** 2 + canvas.height ** 2) * 0.3;

      if (star.distanceTraveled > fadeThreshold) {
        star.opacity -= 0.02;
      }

      ctx.beginPath();
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(star.x - 10, star.y - 10);
      ctx.strokeStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.stroke();
    });

    fallingStars = fallingStars.filter(star => star.opacity > 0 && star.x > -20 && star.y < canvas.height + 20);

    radioWaves.forEach(wave => {
      ctx.beginPath();
      ctx.arc(antennaX, antennaY, wave.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(255, 255, 255, ${wave.opacity})`;
      ctx.stroke();
      wave.radius += 1.5;
      wave.opacity -= 0.01;
    });

    radioWaves = radioWaves.filter(wave => wave.opacity > 0);

    requestAnimationFrame(animate);
  }

  // Falling stars interval
  setInterval(() => {
    if (isAnimating) {
      fallingStars.push({
        x: canvas.width + 20,
        y: Math.random() * canvas.height,
        speedX: -4,
        speedY: 2,
        distanceTraveled: 0,
        opacity: 1
      });
    }
  }, 1000);

  // Radio waves + random beep with fade-out
  setInterval(() => {
    if (isAnimating && !isMuted && soundsReady && beepBuffers.length > 0 && audioContext) {
      radioWaves.push({ radius: 0, opacity: 0.5 });

      const randomIndex = Math.floor(Math.random() * beepBuffers.length);
      const beepSource = audioContext.createBufferSource();
      beepSource.buffer = beepBuffers[randomIndex];

      const gainNode = audioContext.createGain();
      beepSource.connect(gainNode).connect(audioContext.destination);

      gainNode.gain.setValueAtTime(1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      beepSource.start();
    }
  }, 500);

  // Toggle animation button
  toggleButton.addEventListener('click', () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      preloadBeepBuffers();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    isAnimating = !isAnimating;
    toggleButton.textContent = isAnimating ? 'Pause' : 'Resume';
    if (isAnimating) requestAnimationFrame(animate);
  });

  // Mute/unmute button
  muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    muteButton.textContent = isMuted ? 'Unmute' : 'Mute';
  });

  backgroundImage.onload = () => {
    console.log('Image loaded successfully.');
    requestAnimationFrame(animate);
  };

  backgroundImage.onerror = () => {
    console.error('Failed to load image. Check file name and GitHub path.');
  };

  window.addEventListener('resize', () => {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    antennaX = canvas.width * 0.7;
    antennaY = canvas.height * 0.6;
  });
})();
