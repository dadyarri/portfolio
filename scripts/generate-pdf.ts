const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:4321/cv', { waitUntil: 'networkidle' });

  const downloadButton = page.locator('a#download');
  await downloadButton.evaluate((node: SVGElement | HTMLElement) => (node.innerHTML = ''));

  const body = page.locator('body');
  await body.evaluate((node: SVGElement | HTMLElement) => { node.classList.remove('sm:my-14') });

  await page.emulateMedia({ media: 'screen' });
  await page.pdf({
    path: 'public/cv.pdf',
    printBackground: false,
    margin: {
      top: "30px",
      bottom: "40px",
      left: "10px",
      right: "10px"
    }
  });

  await browser.close();
})();
