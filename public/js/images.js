document.addEventListener('DOMContentLoaded', function () {
    // Create modal elements
    const modal = document.createElement('div');
    modal.classList.add('image-modal');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    modal.style.zIndex = '1000';
    modal.style.display = 'none';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.cursor = 'pointer';

    const modalImg = document.createElement('img');
    modalImg.style.maxWidth = '90%';
    modalImg.style.maxHeight = '90%';
    modalImg.style.objectFit = 'contain';

    modal.appendChild(modalImg);
    document.body.appendChild(modal);

    // Close modal when clicking outside the image
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Close modal when pressing Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    });

    document.querySelectorAll('p > img').forEach(img => {
        // Create a new <div>
        const div = document.createElement('div');

        // Create an <hr> element
        const hr = document.createElement('hr');

        // Create a text node for the image's alt text
        const altText = document.createElement('p');
        altText.textContent = img.alt;

        // Clone the image and add click event
        const clonedImg = img.cloneNode(true);
        clonedImg.style.cursor = 'pointer';
        clonedImg.addEventListener('click', function() {
            modalImg.src = this.src;
            modalImg.alt = this.alt;
            modal.style.display = 'flex';
        });

        // Append the <img>, <hr>, and alt text to the new <div>
        div.appendChild(clonedImg);
        
        // Only append hr and alt text if alt text exists
        if (img.alt && img.alt.trim() !== '') {
            div.appendChild(hr);
            div.appendChild(altText);
        }

        div.classList.add('image');

        // Replace the <p> with the new <div>
        const parentP = img.parentNode;
        parentP.parentNode.replaceChild(div, parentP);
    });
});
