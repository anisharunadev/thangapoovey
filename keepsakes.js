(() => {
  'use strict';
  const dialog = document.getElementById('her-letter-dialog');
  const opener = document.getElementById('open-her-letter');
  const closeButton = document.getElementById('close-her-letter');
  const coverButton = document.getElementById('show-card-cover');
  const insideButton = document.getElementById('show-card-inside');
  const image = document.getElementById('card-reader-image');
  const caption = document.getElementById('card-reader-caption');
  const fullsize = document.getElementById('card-reader-fullsize');
  const pages = [
    { src: 'assets/her-card-cover-clean.webp', alt: 'The floral front cover of the birthday card Nisha gave Anish, with its bedsheet background removed', caption: 'Nee enakkaaga choose panna andha floral card. ♡' },
    { src: 'assets/her-birthday-letter-clean.webp', alt: 'Nisha’s handwritten birthday letter to Anish, with her words and little red hearts on isolated paper', caption: 'Un kaiyezhuthu. Un vaarthaigal. Enakkaaga nee eduthukkitta neram. ♡' }
  ];
  let currentPage = 0;
  function showPage(index) {
    currentPage = index;
    const page = pages[index];
    image.src = page.src;
    image.alt = page.alt;
    caption.textContent = page.caption;
    fullsize.href = page.src;
    coverButton.setAttribute('aria-pressed', String(index === 0));
    insideButton.setAttribute('aria-pressed', String(index === 1));
  }
  opener.addEventListener('click', () => {
    if (typeof dialog.showModal !== 'function') {
      window.open(pages[1].src, '_blank', 'noopener');
      return;
    }
    showPage(0);
    dialog.showModal();
    document.body.classList.add('letter-reader-open');
  });
  closeButton.addEventListener('click', () => dialog.close());
  coverButton.addEventListener('click', () => showPage(0));
  insideButton.addEventListener('click', () => showPage(1));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      showPage(currentPage === 0 ? 1 : 0);
      (currentPage === 0 ? coverButton : insideButton).focus();
    }
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('letter-reader-open');
    opener.focus({ preventScroll: true });
  });
})();
