const successIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const errorIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

function changeIcon(button, isSuccess) {
  button.innerHTML = isSuccess ? successIcon : errorIcon;
  setTimeout(() => {
    button.innerHTML = copyIcon;
  }, 2000);
}

function getCodeFromTable(codeBlock) {
  return [...codeBlock.querySelectorAll('tr')]
    .map((row) => row.querySelector('td:last-child')?.innerText ?? '')
    .join('');
}

function getNonTableCode(codeBlock) {
  return codeBlock.textContent.trim();
}

// Get modal (may be injected after script loads)
function getModal() {
  return document.getElementById('image-modal');
}

function getModalImg() {
  const modal = getModal();
  return modal ? modal.querySelector('img') : null;
}

// Close modal when clicking outside the image
document.addEventListener('click', (e) => {
  const modal = getModal();
  if (modal && e.target === modal) {
    modal.style.display = 'none';
  }
});

// Close modal when pressing Escape
document.addEventListener('keydown', (e) => {
  const modal = getModal();
  if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
    modal.style.display = 'none';
  }
});

// Event delegation: clipboard button clicks
document.addEventListener('click', async (e) => {
  if (e.target.closest('.clipboard-button')) {
    const button = e.target.closest('.clipboard-button');
    const container = button.closest('.code-container');
    if (!container) return;

    const codeBlock = container.querySelector('code');
    if (!codeBlock) return;

    const isTable = codeBlock.querySelector('table');
    const codeToCopy = isTable ? getCodeFromTable(codeBlock) : getNonTableCode(codeBlock);

    try {
      await navigator.clipboard.writeText(codeToCopy);
      changeIcon(button, true);
    } catch (error) {
      console.error('Failed to copy text: ', error);
      changeIcon(button, false);
    }
  }
});

// Event delegation: image clicks
document.addEventListener('click', (e) => {
  const img = e.target.closest('div.image img');
  if (!img) return;

  const modal = getModal();
  const modalImg = getModalImg();
  if (!modal || !modalImg) return;

  const rect = img.getBoundingClientRect();
  modalImg.src = img.src;
  modalImg.alt = img.alt;
  modalImg.style.minWidth = rect.width + 'px';
  modalImg.style.minHeight = rect.height + 'px';
  modal.style.display = 'flex';
});
