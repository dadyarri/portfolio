document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('p > img').forEach(img => {
        // Create a new <div>
        const div = document.createElement('div');

        // Create an <hr> element
        const hr = document.createElement('hr');

        // Create a text node for the image's alt text
        const altText = document.createElement('p');
        altText.textContent = img.alt;

        // Append the <img>, <hr>, and alt text to the new <div>
        div.appendChild(img.cloneNode(true)); // Clone the <img> to preserve it
        div.appendChild(hr);
        div.appendChild(altText);

        div.classList.add('image');

        // Replace the <p> with the new <div>
        const parentP = img.parentNode;
        parentP.parentNode.replaceChild(div, parentP);
    });
});
