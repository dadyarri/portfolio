import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:4321/cv', { waitUntil: 'networkidle' });

  const downloadButton = page.locator('a[download]');
  await downloadButton.evaluate((node) => (node.innerHTML = ''));

  const body = page.locator('body');
  await body.evaluate((node) => node.classList.remove('bg-indigo-50'));
  await body.evaluate((node) => node.classList.remove('sm:shadow-md'));

  await page.pdf({
    path: 'public/cv.pdf',
    // margin: {
    //   top: '50px',
    //   bottom: '80px',
    // },
    printBackground: false,
  });

  await browser.close();
})();
