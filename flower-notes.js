(() => {
  'use strict';
  const section = document.getElementById('little-flower');
  if (!section) return;
  const petals = [...section.querySelectorAll('[data-petal]')];
  const notes = [...section.querySelectorAll('.flower-note')];
  const intro = document.getElementById('flower-note-intro');
  const readCount = document.getElementById('petals-read');
  const completion = document.getElementById('flower-completion');
  const heart = document.getElementById('flower-heart-mark');
  const opened = new Set();
  notes.forEach(note => { note.hidden = true; });
  section.classList.add('flower-enhanced');

  function reveal(petal) {
    if (petal.getAttribute('aria-pressed') === 'true') return;
    const target = petal.getAttribute('aria-controls');
    intro.hidden = true;
    notes.forEach(note => { note.hidden = note.id !== target; });
    petals.forEach(button => { button.setAttribute('aria-pressed', String(button === petal)); });
    opened.add(petal.dataset.petal);
    petal.classList.add('petal-read');
    readCount.textContent = `${opened.size} / 5 kutty notes padichachu, ma.`;
    heart.textContent = opened.size === 5 ? '♡' : `${opened.size}/5`;
    completion.hidden = opened.size !== 5;
  }

  petals.forEach((petal, index) => {
    petal.addEventListener('click', () => reveal(petal));
    petal.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % petals.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + petals.length - 1) % petals.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = petals.length - 1;
      else return;
      event.preventDefault();
      petals[next].focus();
      reveal(petals[next]);
    });
  });
})();
