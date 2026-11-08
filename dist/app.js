(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const progress = document.getElementById('progress');
  const chapters = [...document.querySelectorAll('.letter-chapter')];
  const chapterLinks = [...document.querySelectorAll('.chapter-nav a')];
  let scrollQueued = false;

  function updateReading() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${total > 0 ? Math.min(100, window.scrollY / total * 100) : 0}%`;
    let active = chapters[0];
    for (const chapter of chapters) {
      if (chapter.getBoundingClientRect().top <= window.innerHeight * 0.4) active = chapter;
    }
    chapterLinks.forEach(link => {
      const current = link.hash === `#${active.id}`;
      link.classList.toggle('active', current);
      if (current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateReading);
    }
  }, { passive: true });
  window.addEventListener('resize', updateReading);
  if (document.fonts) document.fonts.ready.then(updateReading);
  updateReading();

  function petals(count) {
    if (reducedMotion) return;
    const container = document.getElementById('petals');
    for (let i = 0; i < count; i += 1) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.setProperty('--duration', `${4 + Math.random() * 3}s`);
      petal.style.setProperty('--delay', `${Math.random() * 1.3}s`);
      petal.style.setProperty('--drift', `${Math.random() * 220 - 110}px`);
      petal.style.setProperty('--spin', `${Math.random() * 700 - 350}deg`);
      container.appendChild(petal);
      petal.addEventListener('animationend', () => petal.remove(), { once: true });
    }
  }

  document.querySelector('.open-letter').addEventListener('click', event => {
    const button = event.currentTarget;
    button.classList.add('is-opening');
    petals(22);
    const heading = document.getElementById('letter-title');
    heading.focus({ preventScroll: true });
    document.getElementById('letter').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    window.setTimeout(() => button.classList.remove('is-opening'), 600);
  });

  document.getElementById('wish-button').addEventListener('click', event => {
    const scene = document.getElementById('cake-scene');
    scene.classList.add('blown');
    scene.setAttribute('aria-label', 'A birthday cake with the candle blown out. Your wish is made.');
    document.getElementById('wish-result').classList.add('visible');
    event.currentTarget.textContent = 'Wish made, thangamey ♡';
    event.currentTarget.disabled = true;
    petals(55);
  });

  // One audio element keeps the birthday track and the keepsake song from overlapping.
  const soundButton = document.getElementById('sound-toggle');
  const music = document.getElementById('birthday-music');
  const songButton = document.getElementById('thangapoove-toggle');
  const songStatus = document.getElementById('thangapoove-status');
  const birthdayReturn = document.getElementById('birthday-track-return');
  const songSection = document.getElementById('your-letter');
  const voice = document.getElementById('voice-recording');
  const voiceKeepsake = document.getElementById('voice-keepsake');
  const tracks = {
    birthday: { src: 'assets/remo-birthday.mp3', label: 'Remo birthday music', volume: 0.38 },
    thangapoove: { src: 'assets/thangapoove.mp3', label: 'Thangapoove', volume: 0.42 }
  };
  let activeTrack = 'birthday';
  let desiredTrack = 'birthday';
  let inSongSection = false;
  let birthdayVisitOverride = false;
  let userPaused = false;
  let playPending = false;
  let mediaFailed = false;
  let playRequest = 0;
  let nextContinuousAttempt = 0;
  let fadeTimer;
  let fadeGeneration = 0;
  let transitionPending = false;
  let fadeInOnPlay = false;
  let voiceSuspended = false;
  let resumeAfterVoice = false;

  function setSoundLabel() {
    const playing = Boolean(music && !music.paused && !mediaFailed && !voiceSuspended);
    const label = tracks[activeTrack].label;
    soundButton.setAttribute('aria-pressed', String(playing));
    soundButton.setAttribute('aria-label', `${mediaFailed ? 'Retry' : playing ? 'Pause' : 'Play'} ${label}`);
    soundButton.setAttribute('title', mediaFailed ? 'Music could not load. Tap to try again.' : playing ? `Pause ${label}` : userPaused ? `Resume ${label}` : activeTrack === 'birthday' ? 'The Remo birthday music starts automatically when allowed, or when you touch, scroll or interact.' : 'Play Thangapoove');
    soundButton.querySelector('span').textContent = mediaFailed ? 'Tap to retry' : playing ? 'Sound on' : 'Sound off';
    const songSelected = activeTrack === 'thangapoove';
    if (songButton) {
      songButton.setAttribute('aria-pressed', String(songSelected && playing));
      songButton.setAttribute('aria-label', songSelected && mediaFailed ? 'Retry Thangapoove' : songSelected && (playing || playPending) ? 'Pause Thangapoove' : 'Play Thangapoove');
      songButton.setAttribute('aria-busy', String(songSelected && playPending));
      const action = songButton.querySelector('.song-action-label');
      if (action) action.textContent = !songSelected ? 'Indha paattu kekkalaama?' : mediaFailed ? 'Marubadiyum try pannalaama?' : playPending ? 'Paattu varudhu…' : playing ? 'Konjam pause pannalaam' : 'Marubadiyum kekkalaama?';
    }
    if (songStatus) songStatus.textContent = songSelected && mediaFailed ? 'Paattu load aagala. Oru vaati thirumba try pannalaam.' : songSelected && playing ? 'Thangapoove · unakkaaga paadudhu ♫' : 'Thangapoove · unakkaaga';
    if (birthdayReturn) birthdayReturn.hidden = !songSelected;
  }

  function cancelFade(restoreVolume = true) {
    fadeGeneration += 1;
    window.clearTimeout(fadeTimer);
    fadeTimer = undefined;
    transitionPending = false;
    fadeInOnPlay = false;
    if (restoreVolume && music) music.volume = tracks[activeTrack].volume;
  }

  function rampVolume(target, duration, finished) {
    const generation = ++fadeGeneration;
    const initial = music.volume;
    const started = Date.now();
    function step() {
      if (generation !== fadeGeneration) return;
      const fraction = Math.min(1, (Date.now() - started) / duration);
      music.volume = Math.max(0, Math.min(1, initial + (target - initial) * fraction));
      if (fraction === 1) {
        fadeTimer = undefined;
        if (finished) finished();
      } else fadeTimer = window.setTimeout(step, Math.min(40, duration - (Date.now() - started)));
    }
    step();
  }

  function startMusic(explicit = false) {
    if (!music || userPaused || voiceSuspended || (voice && !voice.paused && !voice.ended) || playPending || transitionPending || (!music.paused && !mediaFailed)) return;
    if (mediaFailed && !explicit) return;
    if (mediaFailed) {
      mediaFailed = false;
      music.load();
    }
    playPending = true;
    const request = ++playRequest;
    setSoundLabel();
    function finish(error) {
      // Pausing and source changes invalidate older play promises.
      if (request !== playRequest) return;
      playPending = false;
      if (error && error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
        mediaFailed = true;
        cancelFade();
      } else if (!error && fadeInOnPlay) {
        fadeInOnPlay = false;
        rampVolume(tracks[activeTrack].volume, 900);
      }
      setSoundLabel();
    }
    try {
      // Do not await before play(): direct calls preserve user activation.
      Promise.resolve(music.play()).then(() => finish(), finish);
    } catch (error) { finish(error); }
  }

  function loadTrack(key, fadeIn, shouldPlay) {
    cancelFade(false);
    playRequest += 1;
    playPending = false;
    mediaFailed = false;
    activeTrack = key;
    music.pause();
    music.src = tracks[key].src;
    music.volume = fadeIn && shouldPlay ? 0 : tracks[key].volume;
    fadeInOnPlay = fadeIn && shouldPlay;
    music.load();
    setSoundLabel();
    if (shouldPlay && !userPaused) startMusic(true);
  }

  function requestTrack(key) {
    const changed = desiredTrack !== key;
    desiredTrack = key;
    // Repeated scrolling inside a region must not restart a track or its fade.
    if (!changed && (transitionPending || activeTrack === key)) return;
    cancelFade(false);
    if (userPaused || voiceSuspended) {
      if (activeTrack !== key || playPending) loadTrack(key, false, false);
      else {
        music.volume = tracks[key].volume;
        setSoundLabel();
      }
      return;
    }
    if (activeTrack === key) {
      if (!music.paused && !mediaFailed) rampVolume(tracks[key].volume, 900);
      else startMusic();
      return;
    }
    if (music.paused || mediaFailed || playPending) {
      // When no previous sound is playing, attempt the new source immediately.
      loadTrack(key, true, true);
      return;
    }
    transitionPending = true;
    rampVolume(0, 600, () => {
      if (desiredTrack !== key || userPaused || voiceSuspended) return;
      transitionPending = false;
      loadTrack(key, true, true);
    });
  }

  function checkSongSection() {
    if (!songSection || !songButton) return;
    const bounds = songSection.getBoundingClientRect();
    const readingLine = window.innerHeight * 0.45;
    const inside = bounds.top <= readingLine && bounds.bottom > readingLine;
    if (inside !== inSongSection) {
      inSongSection = inside;
      birthdayVisitOverride = false;
    }
    requestTrack(inSongSection && !birthdayVisitOverride ? 'thangapoove' : 'birthday');
  }

  function pauseMusic() {
    userPaused = true;
    if (voiceSuspended) resumeAfterVoice = false;
    cancelFade();
    playPending = false;
    playRequest += 1;
    music.pause();
    // Pausing halfway through an outgoing fade still selects the proper region,
    // so a later resume plays the track for the section the reader is in.
    if (activeTrack !== desiredTrack) loadTrack(desiredTrack, false, false);
    else setSoundLabel();
  }

  function toggleCurrentTrack() {
    if (voiceSuspended || (voice && !voice.paused && !voice.ended)) {
      stopVoiceForBackground();
      userPaused = false;
      checkSongSection();
      if (activeTrack !== desiredTrack) loadTrack(desiredTrack, true, true);
      else startMusic(true);
      return;
    }
    if ((!music.paused || playPending || transitionPending) && !mediaFailed) pauseMusic();
    else {
      userPaused = false;
      if (activeTrack !== desiredTrack) loadTrack(desiredTrack, true, true);
      else startMusic(true);
    }
  }

  function stopVoiceForBackground() {
    // An explicit music control takes over without the voice pause event also
    // launching a second background play request.
    resumeAfterVoice = false;
    voiceSuspended = false;
    if (voice && !voice.paused) voice.pause();
  }

  function beginVoice() {
    if (voiceKeepsake && !voiceKeepsake.open) {
      voice.pause();
      return;
    }
    if (voiceSuspended) return;
    resumeAfterVoice = !userPaused;
    voiceSuspended = true;
    playPending = false;
    playRequest += 1;
    // Pause first: restoring the fade volume must never create a sound under
    // the voice note. No code in this controller starts the voice recording.
    music.pause();
    cancelFade();
    checkSongSection();
    if (activeTrack !== desiredTrack) loadTrack(desiredTrack, false, false);
    setSoundLabel();
  }

  function finishVoice() {
    if (!voiceSuspended) return;
    // A queued pause event from a previous native play/pause cycle must not
    // interrupt a recording the reader has already started again.
    if (voice && !voice.paused && !voice.ended && !voice.error) return;
    const shouldResume = resumeAfterVoice && !userPaused;
    resumeAfterVoice = false;
    voiceSuspended = false;
    checkSongSection();
    if (shouldResume) {
      if (activeTrack !== desiredTrack) loadTrack(desiredTrack, true, true);
      else {
        music.volume = 0;
        fadeInOnPlay = true;
        startMusic(true);
      }
    } else setSoundLabel();
  }

  if (music) {
    // JS owns source switches; native autoplay must not override an explicit pause.
    music.autoplay = false;
    music.loop = true;
    music.volume = tracks.birthday.volume;
    music.addEventListener('playing', () => {
      // Protect against an older pending background request starting after the
      // reader has begun the voice note or deliberately paused the music.
      if (voiceSuspended || userPaused || (voice && !voice.paused && !voice.ended)) music.pause();
      else mediaFailed = false;
      setSoundLabel();
    });
    music.addEventListener('pause', setSoundLabel);
    music.addEventListener('error', () => {
      // load() clears error, so ignore queued events from a previous source.
      if (!music.error) return;
      cancelFade();
      mediaFailed = true;
      playPending = false;
      playRequest += 1;
      if (activeTrack !== desiredTrack) loadTrack(desiredTrack, !userPaused && !voiceSuspended, !userPaused && !voiceSuspended);
      else setSoundLabel();
    });
    soundButton.addEventListener('click', toggleCurrentTrack);
    if (songButton) songButton.addEventListener('click', () => {
      birthdayVisitOverride = false;
      if (activeTrack === 'thangapoove' && desiredTrack === 'thangapoove') toggleCurrentTrack();
      else {
        stopVoiceForBackground();
        userPaused = false;
        requestTrack('thangapoove');
        startMusic(true);
      }
    });
    if (birthdayReturn) birthdayReturn.addEventListener('click', () => {
      birthdayVisitOverride = inSongSection;
      stopVoiceForBackground();
      userPaused = false;
      requestTrack('birthday');
      startMusic(true);
    });

    // Track the reading line on every boundary check, in either scroll direction.
    // Nested dialog scrolling leaves these document-section bounds unchanged.
    document.addEventListener('scroll', checkSongSection, { passive: true, capture: true });
    window.addEventListener('resize', checkSongSection);
    window.addEventListener('load', checkSongSection);
    window.addEventListener('pageshow', checkSongSection);
    if (document.fonts) document.fonts.ready.then(checkSongSection);

    function readerInteraction(event) {
      if (event.target && typeof event.target.closest === 'function' && event.target.closest('#sound-toggle, #thangapoove-toggle, #birthday-track-return, #voice-keepsake, #voice-recording')) return;
      if (event.type === 'keydown' && event.repeat) return;
      if (['scroll', 'wheel', 'touchmove', 'pointermove'].includes(event.type)) {
        const now = Date.now();
        if (now < nextContinuousAttempt) return;
        nextContinuousAttempt = now + 800;
      }
      startMusic();
    }
    ['touchstart', 'touchend', 'touchmove', 'pointerdown', 'pointerup', 'pointermove', 'click', 'wheel'].forEach(type => {
      document.addEventListener(type, readerInteraction, { passive: true });
    });
    document.addEventListener('scroll', readerInteraction, { passive: true, capture: true });
    document.addEventListener('keydown', readerInteraction);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkSongSection();
        startMusic();
      }
    });
    if (voice) {
      voice.autoplay = false;
      voice.addEventListener('play', beginVoice);
      voice.addEventListener('playing', beginVoice);
      voice.addEventListener('pause', finishVoice);
      voice.addEventListener('ended', finishVoice);
      voice.addEventListener('error', () => {
        voice.pause();
        finishVoice();
      });
      if (voiceKeepsake) voiceKeepsake.addEventListener('toggle', () => {
        if (!voiceKeepsake.open) {
          voice.pause();
          finishVoice();
        }
      });
    }
    setSoundLabel();
    // Initial/deep-linked or restored scroll positions choose the region first.
    checkSongSection();
    startMusic();
  } else {
    soundButton.hidden = true;
    if (songButton) songButton.hidden = true;
    if (birthdayReturn) birthdayReturn.hidden = true;
  }
})();
