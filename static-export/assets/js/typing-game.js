document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('typing-game-toggle');
  const homeButton = document.getElementById('typing-game-home');
  const overlay = document.getElementById('typing-game-overlay');
  const input = document.getElementById('typing-input');
  const textArea = document.getElementById('typing-game-text-area');
  const gameSharkCanvas = document.getElementById('typing-game-sharks');
  const prompt = document.getElementById('typing-prompt');
  const timeDisplay = document.getElementById('typing-time');
  const wpmDisplay = document.getElementById('typing-wpm');
  const accuracyDisplay = document.getElementById('typing-accuracy');
  const status = document.getElementById('typing-game-status');
  const restart = document.getElementById('typing-game-restart');
  const soundToggle = document.getElementById('typing-game-sound');
  const soundLabel = document.getElementById('typing-game-sound-label');
  const soundDefinitions = {
    Escape: [9069, 115, 94],
    F1: [2754, 104, 85],
    F2: [3155, 99, 81],
    F3: [3545, 103, 84],
    F4: [3913, 100, 83],
    F5: [4305, 96, 78],
    F6: [4666, 103, 84],
    F7: [5034, 110, 90],
    F8: [5433, 103, 84],
    F9: [7795, 109, 89],
    F10: [6146, 105, 86],
    F11: [7322, 97, 80],
    F12: [7699, 98, 80],
    Delete: [14199, 100, 81],
    Backquote: [9069, 115, 94],
    Digit1: [2280, 109, 90],
    Digit2: [9444, 102, 83],
    Digit3: [9833, 103, 84],
    Digit4: [10185, 107, 87],
    Digit5: [10551, 108, 88],
    Digit6: [10899, 107, 87],
    Digit7: [11282, 99, 81],
    Digit8: [11623, 103, 85],
    Digit9: [11976, 110, 90],
    Digit0: [12337, 108, 89],
    Minus: [12667, 107, 87],
    Equal: [13058, 105, 86],
    Backspace: [13765, 101, 83],
    Tab: [15916, 97, 79],
    KeyQ: [16284, 83, 67],
    KeyW: [16637, 97, 79],
    KeyE: [16964, 105, 85],
    KeyR: [17275, 102, 83],
    KeyT: [17613, 108, 88],
    KeyY: [17957, 95, 78],
    KeyU: [18301, 105, 85],
    KeyI: [18643, 110, 90],
    KeyO: [18994, 98, 80],
    KeyP: [19331, 108, 89],
    BracketLeft: [19671, 94, 77],
    BracketRight: [20020, 96, 79],
    Backslash: [20387, 97, 79],
    CapsLock: [22560, 100, 81],
    KeyA: [22869, 109, 89],
    KeyS: [23237, 98, 80],
    KeyD: [23586, 103, 84],
    KeyF: [23898, 98, 81],
    KeyG: [24237, 102, 83],
    KeyH: [24550, 106, 86],
    KeyJ: [24917, 103, 85],
    KeyK: [25274, 102, 83],
    KeyL: [25625, 101, 82],
    Semicolon: [25989, 100, 82],
    Quote: [26335, 99, 81],
    Enter: [26703, 100, 81],
    ShiftLeft: [28109, 99, 81],
    KeyZ: [28550, 92, 75],
    KeyX: [28855, 101, 83],
    KeyC: [29557, 112, 92],
    KeyV: [29557, 112, 92],
    KeyB: [29909, 98, 81],
    KeyN: [30252, 112, 91],
    KeyM: [30605, 101, 83],
    Comma: [30965, 117, 95],
    Period: [31315, 97, 79],
    Slash: [31659, 96, 78],
    ShiftRight: [28109, 99, 81],
    ControlLeft: [8036, 92, 76],
    AltLeft: [34551, 96, 79],
    MetaLeft: [34551, 96, 79],
    Space: [33857, 100, 82],
    MetaRight: [34181, 97, 80],
    AltRight: [35878, 90, 74],
    ControlRight: [8036, 92, 76],
  };
  const duration = 30;
  const phrases = [
    'Desenvolver é transformar ideias em soluções úteis, criando ferramentas que resolvem problemas e tornam o trabalho mais simples.',
    'A cada projeto, aprendemos algo novo: testar, corrigir e melhorar faz parte do caminho de quem gosta de criar.',
    'Automatizar tarefas repetitivas libera tempo para atividades importantes e ajuda equipes a trabalhar com mais qualidade.',
    'A tecnologia ganha sentido quando aproxima pessoas, simplifica processos e transforma desafios reais em boas soluções.',
    'Programar exige curiosidade, paciência e prática; cada pequeno avanço nos aproxima de uma solução melhor.',
    'Com atenção aos detalhes e vontade de aprender, uma ideia simples pode se tornar uma ferramenta útil para muitas pessoas.',
  ];

  if (!toggle || !overlay || !input || !textArea || !prompt || !timeDisplay || !wpmDisplay || !accuracyDisplay || !status || !restart || !soundToggle || !soundLabel) return;

  const keys = new Map(
    Array.from(overlay.querySelectorAll('.typing-game-keyboard [data-key]'))
      .map(key => [key.dataset.key, key])
  );
  let phraseIndex = 0;
  let currentPhrase = '';
  let timeLeft = duration;
  let timer = 0;
  let completedCorrect = 0;
  let completedTyped = 0;
  let audioContext = null;
  let audioBuffer = null;
  let audioLoad = null;
  let audioFailed = false;
  let soundEnabled = true;
  let closeTimer = 0;
  let isClosing = false;
  let gameSharkSchool = null;

  const updateSoundButton = () => {
    soundToggle.setAttribute('aria-pressed', String(soundEnabled));
    soundToggle.setAttribute('aria-label', soundEnabled ? 'Desativar sons do teclado' : 'Ativar sons do teclado');
    soundLabel.textContent = soundEnabled ? (audioFailed ? 'Som alternativo' : 'Som ligado') : 'Som desligado';
  };

  const loadKeyboardSound = async () => {
    if (!soundEnabled || audioBuffer || audioFailed) return audioBuffer;
    if (!window.AudioContext) {
      soundEnabled = false;
      soundToggle.disabled = true;
      updateSoundButton();
      soundLabel.textContent = 'Som indisponível';
      status.textContent = 'Este navegador não oferece suporte ao áudio do teclado.';
      return null;
    }

    try {
      if (!audioContext) audioContext = new window.AudioContext();

      if (!audioLoad) {
        audioLoad = fetch('assets/audio/keythm-sound.ogg')
          .then(response => {
            if (!response.ok) throw new Error(`Falha ao carregar o áudio (${response.status}).`);
            return response.arrayBuffer();
          })
          .then(buffer => audioContext.decodeAudioData(buffer));
      }

      audioBuffer = await audioLoad;
      return audioBuffer;
    } catch (error) {
      console.error('Não foi possível carregar o áudio do teclado.', error);
      audioLoad = null;
      audioBuffer = null;
      audioFailed = true;
      if (!audioContext) {
        soundEnabled = false;
        soundToggle.disabled = true;
        updateSoundButton();
        status.textContent = 'Este navegador não conseguiu iniciar o áudio do teclado.';
        return null;
      }
      updateSoundButton();
      status.textContent = 'A amostra original não carregou; sons alternativos foram ativados.';
      return null;
    }
  };

  const playKeySound = (phase, code) => {
    const definition = soundDefinitions[code];
    if (!soundEnabled || !audioContext || !definition) return;

    const play = () => {
      if (!soundEnabled || audioContext.state !== 'running') return;

      if (audioBuffer) {
        const [start, pressDuration, releaseDuration] = definition;
        const source = audioContext.createBufferSource();
        const gain = audioContext.createGain();
        source.buffer = audioBuffer;
        gain.gain.value = 1;
        source.connect(gain).connect(audioContext.destination);
        source.start(
          audioContext.currentTime,
          (start + (phase === 'up' ? pressDuration : 0)) / 1000,
          (phase === 'up' ? releaseDuration : pressDuration) / 1000
        );
        source.addEventListener('ended', () => {
          source.disconnect();
          gain.disconnect();
        }, { once: true });
        return;
      }

      const now = audioContext.currentTime;
      const noiseLength = Math.floor(audioContext.sampleRate * 0.035);
      const noiseBuffer = audioContext.createBuffer(1, noiseLength, audioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let index = 0; index < noiseLength; index++) {
        noiseData[index] = (Math.random() * 2 - 1) * (1 - index / noiseLength);
      }

      const noise = audioContext.createBufferSource();
      const filter = audioContext.createBiquadFilter();
      const noiseGain = audioContext.createGain();
      noise.buffer = noiseBuffer;
      filter.type = 'lowpass';
      filter.frequency.value = phase === 'down' ? 2400 : 1800;
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      noise.connect(filter).connect(noiseGain).connect(audioContext.destination);
      noise.start(now);
      noise.stop(now + 0.035);

      const thock = audioContext.createOscillator();
      const thockGain = audioContext.createGain();
      thock.type = 'triangle';
      thock.frequency.setValueAtTime(phase === 'down' ? 155 : 125, now);
      thock.frequency.exponentialRampToValueAtTime(65, now + 0.04);
      thockGain.gain.setValueAtTime(0.12, now);
      thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      thock.connect(thockGain).connect(audioContext.destination);
      thock.start(now);
      thock.stop(now + 0.04);
    };

    if (audioContext.state === 'suspended') {
      void audioContext.resume()
        .then(() => {
          if (audioContext.state !== 'running') throw new Error('O contexto de áudio permaneceu suspenso.');
          play();
        })
        .catch(error => {
          console.error('O navegador bloqueou a reprodução do áudio.', error);
          status.textContent = 'O navegador bloqueou o áudio. Tente ativar o som novamente.';
        });
      return;
    }

    play();
  };

  const countCorrectCharacters = (target, typed) => {
    let correct = 0;
    for (let index = 0; index < Math.min(target.length, typed.length); index++) {
      if (target[index] === typed[index]) correct++;
    }
    return correct;
  };

  const updateStats = () => {
    const typed = input.value;
    const correct = completedCorrect + countCorrectCharacters(currentPhrase, typed);
    const total = completedTyped + typed.length;
    const elapsed = duration - timeLeft;
    const wordsPerMinute = elapsed > 0 ? Math.round(correct / 5 / (elapsed / 60)) : 0;
    const accuracy = total > 0 ? Math.round(correct / total * 100) : 100;

    timeDisplay.textContent = String(timeLeft);
    wpmDisplay.textContent = String(wordsPerMinute);
    accuracyDisplay.textContent = String(accuracy);
  };

  const renderPrompt = () => {
    const typed = input.value;
    const fragment = document.createDocumentFragment();
    let characterIndex = 0;

    currentPhrase.split(' ').forEach((word, wordIndex, words) => {
      const wordElement = document.createElement('span');
      wordElement.className = 'typing-game-word';

      Array.from(word).forEach(character => {
        const characterElement = document.createElement('span');
        characterElement.textContent = character;
        if (characterIndex < typed.length) {
          characterElement.className = typed[characterIndex] === character ? 'is-correct' : 'is-incorrect';
        } else if (characterIndex === typed.length) {
          characterElement.className = 'is-current';
        }
        wordElement.appendChild(characterElement);
        characterIndex++;
      });

      fragment.appendChild(wordElement);
      if (wordIndex < words.length - 1) {
        const space = document.createElement('span');
        space.textContent = ' ';
        if (characterIndex < typed.length) {
          space.className = typed[characterIndex] === ' ' ? 'is-correct' : 'is-incorrect';
        } else if (characterIndex === typed.length) {
          space.className = 'is-current';
        }
        fragment.appendChild(space);
        characterIndex++;
      }
    });

    prompt.replaceChildren(fragment);
  };

  const nextPhrase = () => {
    currentPhrase = phrases[phraseIndex % phrases.length];
    phraseIndex++;
    input.value = '';
    renderPrompt();
  };

  const clearTimer = () => {
    if (timer) window.clearInterval(timer);
    timer = 0;
  };

  const finishGame = () => {
    clearTimer();
    input.disabled = true;
    timeLeft = 0;
    updateStats();
    status.textContent = `Tempo esgotado! Você fez ${wpmDisplay.textContent} PPM com ${accuracyDisplay.textContent}% de precisão.`;
    restart.hidden = false;
  };

  const startTimer = () => {
    if (timer || timeLeft === 0) return;
    timer = window.setInterval(() => {
      timeLeft--;
      updateStats();
      if (timeLeft <= 0) finishGame();
    }, 1000);
  };

  const resetGame = () => {
    clearTimer();
    timeLeft = duration;
    completedCorrect = 0;
    completedTyped = 0;
    input.disabled = false;
    restart.hidden = true;
    status.textContent = 'Clique na área de texto e comece a digitar.';
    phraseIndex = Math.floor(Math.random() * phrases.length);
    nextPhrase();
    updateStats();
  };

  const releasePressedKeys = () => {
    keys.forEach(key => key.classList.remove('is-pressed'));
  };

  const finishClosing = () => {
    if (!isClosing) return;
    window.clearTimeout(closeTimer);
    closeTimer = 0;
    isClosing = false;
    overlay.hidden = true;
    document.body.classList.remove('typing-game-open');
    releasePressedKeys();
    toggle.focus();
  };

  const openGame = () => {
    if (isClosing) {
      window.clearTimeout(closeTimer);
      isClosing = false;
      if (input.value.length > 0) startTimer();
    } else {
      resetGame();
    }

    const bounds = toggle.getBoundingClientRect();
    overlay.style.setProperty('--game-origin-x', `${bounds.left + bounds.width / 2}px`);
    overlay.style.setProperty('--game-origin-y', `${bounds.top + bounds.height / 2}px`);
    overlay.hidden = false;
    overlay.classList.remove('is-visible');
    document.body.classList.add('typing-game-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fechar jogo de digitação');
    toggle.title = 'Fechar jogo';
    void loadKeyboardSound();

    window.requestAnimationFrame(() => {
      overlay.classList.add('is-visible');
      if (!gameSharkSchool && gameSharkCanvas && window.PortfolioEffects) {
        gameSharkSchool = new window.PortfolioEffects.SharkSchool(gameSharkCanvas);
      }
      input.focus({ preventScroll: true });
    });
  };

  const closeGame = () => {
    if (overlay.hidden || isClosing) return;
    clearTimer();
    isClosing = true;
    overlay.classList.remove('is-visible');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir jogo de digitação');
    toggle.title = 'Jogo de digitação';
    closeTimer = window.setTimeout(finishClosing, 650);
  };

  input.addEventListener('input', () => {
    if (input.value.length > 0) {
      startTimer();
      status.textContent = 'Continue digitando até o tempo acabar.';
    }
    renderPrompt();

    if (input.value.length >= currentPhrase.length && timer) {
      completedCorrect += countCorrectCharacters(currentPhrase, input.value);
      completedTyped += input.value.length;
      nextPhrase();
    }

    updateStats();
  });

  textArea.addEventListener('click', () => input.focus());

  toggle.addEventListener('click', () => {
    if (overlay.hidden || isClosing) openGame();
    else closeGame();
  });

  homeButton?.addEventListener('click', closeGame);

  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    updateSoundButton();
    if (soundEnabled) void loadKeyboardSound();
    input.focus({ preventScroll: true });
  });

  restart.addEventListener('click', () => {
    resetGame();
    input.focus();
  });

  overlay.addEventListener('transitionend', event => {
    if (event.target === overlay && event.propertyName === 'clip-path') finishClosing();
  });

  document.addEventListener('keydown', event => {
    if (overlay.hidden || isClosing || event.repeat) return;

    const key = keys.get(event.code);
    if (key) key.classList.add('is-pressed');
    playKeySound('down', event.code);

    if (event.code === 'Escape') {
      closeGame();
      return;
    }

    if (event.code === 'Tab') {
      const creditLink = overlay.querySelector('.typing-game-credit a');
      const focusable = [homeButton, input, soundToggle, ...(restart.hidden ? [] : [restart]), creditLink, toggle].filter(Boolean);
      const currentIndex = focusable.indexOf(document.activeElement);
      const nextIndex = event.shiftKey
        ? (currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1)
        : (currentIndex === focusable.length - 1 ? 0 : currentIndex + 1);
      event.preventDefault();
      focusable[nextIndex].focus();
    }
  });

  document.addEventListener('keyup', event => {
    if (overlay.hidden) return;
    const key = keys.get(event.code);
    if (key) key.classList.remove('is-pressed');
    playKeySound('up', event.code);
  });

  window.addEventListener('blur', releasePressedKeys);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') releasePressedKeys();
  });

  updateSoundButton();
  nextPhrase();
  updateStats();
});
