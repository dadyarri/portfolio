"use strict";
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:4321/cv', { waitUntil: 'networkidle' });

  const downloadButton = page.locator('a#download');
  await downloadButton.evaluate((node) => (node.innerHTML = ''));

  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({width: 1920, height: 1080})
  await page.pdf({
    path: 'public/cv.pdf',
    printBackground: false,
    margin: {
      top: "30px",
      bottom: "40px",
    }
  });

  await browser.close();
})();
