document.addEventListener('DOMContentLoaded', () => {
    const headings = Array.from(
        document.querySelectorAll('.content h1, .content h2, .content h3')
    );
    const tocLinks = Array.from(document.querySelectorAll('aside a'));

    if (headings.length === 0 || tocLinks.length === 0) {
        return;
    }

    let ticking = false;

    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateActiveHeading();
                ticking = false;
            });
            ticking = true;
        }
    }

    function updateActiveHeading() {
        const scrollPosition = window.scrollY || window.pageYOffset;

        // Find the heading closest to the top but not below it
        let current = headings[0];

        for (const heading of headings) {
            if (heading.offsetTop - 100 <= scrollPosition) {
                current = heading;
            } else {
                break;
            }
        }

        // Remove active class from all TOC links
        tocLinks.forEach((link) => link.classList.remove('active'));

        // Add active class to the TOC link that matches current heading
        const activeLink = tocLinks.find(
            (link) => link.getAttribute('href') === `#${current.id}`
        );
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    updateActiveHeading();
});
