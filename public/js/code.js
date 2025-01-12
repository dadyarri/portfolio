const successIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const errorIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

// Function to change icons after copying
const changeIcon = (button, isSuccess) => {
    button.innerHTML = isSuccess ? successIcon : errorIcon;
    setTimeout(() => {
        button.innerHTML = copyIcon; // Reset to copy icon
    }, 2000);
};

// Function to get code text from tables, skipping line numbers
const getCodeFromTable = (codeBlock) => {
    return [...codeBlock.querySelectorAll('tr')]
        .map(row => row.querySelector('td:last-child')?.innerText ?? '')
        .join('');
};

// Function to get code text from non-table blocks
const getNonTableCode = (codeBlock) => {
    return codeBlock.textContent.trim();
};

document.addEventListener('DOMContentLoaded', function () {
    // Select all `pre` elements containing `code`
    document.querySelectorAll('pre code').forEach(codeBlock => {
        const pre = codeBlock.parentNode;

        // Wrap the `pre` block in a container for better layout
        const container = document.createElement('div');
        container.className = 'code-container';
        pre.parentNode.insertBefore(container, pre);
        container.appendChild(pre);

        // Create and append the copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'clipboard-button';
        copyBtn.innerHTML = copyIcon; // Assumes `copyIcon` contains the icon's HTML or SVG
        copyBtn.setAttribute('aria-label', 'Copy code to clipboard');

        // Create and append the label
        const lang = pre.getAttribute('data-language') || 'default';
        const label = document.createElement('span');
        label.className = 'code-label';
        label.textContent = lang.toUpperCase();

        // Create a footer for the button and label
        const footer = document.createElement('div');
        footer.className = 'code-footer';
        footer.appendChild(label);
        footer.appendChild(copyBtn);

        container.appendChild(footer);

        // Attach event listener to copy button
        copyBtn.addEventListener('click', async () => {
            const isTable = codeBlock.querySelector('table');
            const codeToCopy = isTable ? getCodeFromTable(codeBlock) : getNonTableCode(codeBlock);
            try {
                await navigator.clipboard.writeText(codeToCopy);
                changeIcon(copyBtn, true); // Show success icon
            } catch (error) {
                console.error('Failed to copy text: ', error);
                changeIcon(copyBtn, false); // Show error icon
            }
        });
    });
});