import { chromium } from 'playwright-core';
import { readFile } from 'node:fs/promises';
import { PDFDocument, degrees } from 'pdf-lib';

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3100';
const tunnelHeaders = new URL(baseUrl).hostname.endsWith('.ngrok-free.dev')
  ? { 'ngrok-skip-browser-warning': '1' }
  : undefined;
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-gpu-compositing', '--disable-features=Vulkan', '--use-angle=swiftshader'],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, extraHTTPHeaders: tunnelHeaders });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(baseUrl);
  await page.waitForFunction(() => document.documentElement.dataset.editorReady === 'true', null, { timeout: 45000 });
  await page.locator('#pdf-input').setInputFiles({ name: 'rusak.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not a PDF') });
  await page.waitForFunction(() => document.querySelector('#toast').textContent.includes('PDF'));
  if (!await page.locator('#editor-view').isHidden()) throw new Error('Invalid PDF was accepted');
  await page.locator('#see-editor').click();
  await page.waitForFunction(() => !document.querySelector('#editor-view').hidden && document.querySelector('#pdf-canvas').width > 0, null, { timeout: 20000 });
  if ((await page.locator('#editor-filename').textContent()) !== 'contoh-dokumen.pdf') throw new Error('Example PDF did not open');
  await page.locator('[data-tool="teks"]').click();
  await page.locator('#element-text').fill('Disetujui untuk uji');
  await page.locator('#element-text').press('Tab');
  await page.locator('[data-tool="tanda-tangan"]').click();
  const desktopBox = await page.locator('#signature-canvas').boundingBox();
  await page.mouse.move(desktopBox.x + 60, desktopBox.y + 90);
  await page.mouse.down();
  await page.mouse.move(desktopBox.x + 230, desktopBox.y + 145, { steps: 10 });
  await page.mouse.up();
  await page.locator('#add-signature').click();
  if (await page.locator('.annotation.signature').count() !== 1) throw new Error('Desktop signature failed');
  await page.locator('#preview-btn').click();
  await page.waitForFunction(() => document.querySelector('#preview-frame').src.startsWith('blob:'), null, { timeout: 20000 });
  await page.locator('#preview-dialog [data-close]').click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#footer-download').click()]);
  const pdfBytes = await readFile(await download.path());
  const saved = await PDFDocument.load(pdfBytes);
  if (saved.getPageCount() !== 1) throw new Error('Exported PDF page count changed');
  await page.locator('#print-btn').click();
  await page.waitForFunction(() => document.querySelector('#print-frame').src.startsWith('blob:'), null, { timeout: 10000 });
  await page.locator('[data-tool="hp"]').click();
  await page.waitForFunction(() => document.querySelector('#qr-link').href.includes('/sign/'), null, { timeout: 10000 });
  const qrUrl = await page.locator('#qr-link').getAttribute('href');
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, extraHTTPHeaders: tunnelHeaders });
  mobile.on('pageerror', (error) => errors.push(`mobile: ${error.message}`));
  await mobile.goto(qrUrl);
  await mobile.waitForFunction(() => document.querySelector('.mobile-session-status')?.classList.contains('ready'), null, { timeout: 10000 });
  const box = await mobile.locator('.mobile-canvas-wrap canvas').boundingBox();
  await mobile.mouse.move(box.x + 40, box.y + 90);
  await mobile.mouse.down();
  await mobile.mouse.move(box.x + 150, box.y + 135, { steps: 8 });
  await mobile.mouse.move(box.x + 270, box.y + 90, { steps: 8 });
  await mobile.mouse.up();
  await mobile.locator('.mobile-sign-actions .button-primary').click();
  await mobile.waitForFunction(() => document.querySelector('.mobile-session-status')?.classList.contains('sent'), null, { timeout: 10000 });
  try {
    await page.waitForFunction(() => document.querySelectorAll('.annotation.signature').length === 2, null, { timeout: 15000 });
  } catch (error) {
    console.error('QR debug', await page.locator('#qr-status').textContent(), await page.locator('#toast').textContent(), await page.locator('.annotation').count());
    console.error('QR API', await (await fetch(`${baseUrl}/api/qr/${qrUrl.split('/').at(-1)}`)).text());
    throw error;
  }
  await page.locator('#duplicate-element').click();
  if (await page.locator('.annotation.signature').count() !== 3) throw new Error('Duplicate failed');
  await page.locator('#undo-btn').click();
  if (await page.locator('.annotation.signature').count() !== 2) throw new Error('Undo failed');
  await page.locator('#redo-btn').click();
  if (await page.locator('.annotation.signature').count() !== 3) throw new Error('Redo failed');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#new-document').click();
  await page.waitForFunction(() => document.querySelector('#editor-view').hidden);

  const multi = await PDFDocument.create();
  multi.addPage([595, 842]); multi.addPage([842, 595]);
  await page.locator('#pdf-input').setInputFiles({ name: 'dua-halaman.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await multi.save()) });
  await page.waitForFunction(() => !document.querySelector('#editor-view').hidden && document.querySelector('#total-pages').textContent === '2', null, { timeout: 20000 });
  await page.locator('#next-page').click();
  await page.waitForFunction(() => document.querySelector('#current-page').textContent === '2');
  await page.locator('[data-tool="bentuk"]').click();
  await page.locator('[data-shape="rectangle"]').click();
  await page.locator('#element-rotation').fill('25');
  await page.locator('#element-rotation').press('Tab');
  await page.locator('[data-tool="gambar"]').click();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+l3ioAAAAASUVORK5CYII=', 'base64');
  await page.locator('#image-input').setInputFiles({ name: 'gambar.png', mimeType: 'image/png', buffer: png });
  await page.waitForFunction(() => document.querySelectorAll('.annotation.image').length === 1);
  await page.locator('#prev-page').click();
  await page.waitForFunction(() => document.querySelector('#current-page').textContent === '1');
  if (await page.locator('.annotation').count() !== 0) throw new Error('Annotations leaked to wrong page');
  await page.locator('#preview-btn').click();
  await page.waitForFunction(() => document.querySelector('#preview-frame').src.startsWith('blob:'));
  await page.locator('#preview-dialog [data-close]').click();
  const [multiDownload] = await Promise.all([page.waitForEvent('download'), page.locator('#footer-download').click()]);
  const multiBytes = await readFile(await multiDownload.path());
  const multiResult = await PDFDocument.load(multiBytes);
  if (multiResult.getPageCount() !== 2 || multiBytes.length <= (await multi.save()).length) throw new Error('Multi-page export failed');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#new-document').click();
  await page.waitForFunction(() => document.querySelector('#editor-view').hidden);
  await page.locator('#pdf-input').setInputFiles({ name: 'hasil.pdf', mimeType: 'application/pdf', buffer: multiBytes });
  await page.waitForFunction(() => !document.querySelector('#editor-view').hidden && document.querySelector('#total-pages').textContent === '2', null, { timeout: 20000 });
  await page.locator('#next-page').click();
  await page.waitForFunction(() => document.querySelector('#current-page').textContent === '2');
  const countPixels = () => {
    const canvas = document.querySelector('#pdf-canvas');
    const ctx = canvas.getContext('2d');
    const image = ctx.getImageData(250, 250, 400, 300).data;
    let count = 0;
    for (let i = 0; i < image.length; i += 4) if (image[i + 3] > 0 && (image[i] < 230 || image[i + 1] < 230 || image[i + 2] < 230)) count++;
    return count > 100 ? count : 0;
  };
  await page.waitForFunction(countPixels, null, { timeout: 10000 }).catch(() => {});
  const drawnPixels = await page.evaluate(countPixels);
  if (drawnPixels < 100) throw new Error('Exported annotations did not render on page 2');
  await page.locator('#new-document').click();
  await page.waitForFunction(() => document.querySelector('#editor-view').hidden);
  const rotated = await PDFDocument.create();
  rotated.addPage([595, 842]).setRotation(degrees(90));
  await page.locator('#pdf-input').setInputFiles({ name: 'rotasi.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await rotated.save()) });
  await page.waitForFunction(() => !document.querySelector('#editor-view').hidden && document.querySelector('#pdf-canvas').width > 600, null, { timeout: 20000 });
  await page.locator('[data-tool="bentuk"]').click();
  await page.locator('[data-shape="rectangle"]').click();
  await page.locator('#element-x').fill('100'); await page.locator('#element-x').press('Tab');
  await page.locator('#element-y').fill('100'); await page.locator('#element-y').press('Tab');
  await page.locator('#preview-btn').click();
  await page.waitForFunction(() => document.querySelector('#preview-frame').src.startsWith('blob:'));
  await page.locator('#preview-dialog [data-close]').click();
  const [rotatedDownload] = await Promise.all([page.waitForEvent('download'), page.locator('#footer-download').click()]);
  const rotatedBytes = await readFile(await rotatedDownload.path());
  const rotatedResult = await PDFDocument.load(rotatedBytes);
  if (rotatedResult.getPage(0).getRotation().angle !== 90) throw new Error('Page rotation was lost');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#new-document').click();
  await page.waitForFunction(() => document.querySelector('#editor-view').hidden);
  await page.locator('#pdf-input').setInputFiles({ name: 'rotasi-hasil.pdf', mimeType: 'application/pdf', buffer: rotatedBytes });
  await page.waitForFunction(() => !document.querySelector('#editor-view').hidden && document.querySelector('#pdf-canvas').width > 600, null, { timeout: 20000 });
  const countRotatedPixels = () => {
    const canvas = document.querySelector('#pdf-canvas');
    const image = canvas.getContext('2d').getImageData(90, 90, 190, 130).data;
    let count = 0;
    for (let i = 0; i < image.length; i += 4) if (image[i + 3] > 0 && (image[i] < 230 || image[i + 1] < 230 || image[i + 2] < 230)) count++;
    return count > 50 ? count : 0;
  };
  await page.waitForFunction(countRotatedPixels, null, { timeout: 10000 }).catch(() => {});
  const rotatedPixels = await page.evaluate(countRotatedPixels);
  if (rotatedPixels < 50) throw new Error(`Rotated page annotation missing: ${rotatedPixels}`);
  const session = await (await fetch(`${baseUrl}/api/qr`, { method: 'POST' })).json();
  const invalid = await fetch(`${baseUrl}/api/qr/${session.token}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image: 'data:image/png;base64,AAAA' }) });
  const validImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+l3ioAAAAASUVORK5CYII=';
  const valid = await fetch(`${baseUrl}/api/qr/${session.token}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image: validImage }) });
  const denied = await fetch(`${baseUrl}/api/qr/${session.token}/consume`, { method: 'POST', headers: { 'x-session-owner': '0'.repeat(64) } });
  const consumed = await fetch(`${baseUrl}/api/qr/${session.token}/consume`, { method: 'POST', headers: { 'x-session-owner': session.owner } });
  const reused = await fetch(`${baseUrl}/api/qr/${session.token}`);
  if ([invalid.status, valid.status, denied.status, consumed.status, reused.status].join(',') !== '400,200,403,200,404') throw new Error('QR security flow failed');
  await mobile.goto(baseUrl);
  await mobile.waitForFunction(() => document.documentElement.dataset.editorReady === 'true', null, { timeout: 45000 });
  await mobile.locator('#see-editor').click();
  await mobile.waitForFunction(() => !document.querySelector('#editor-view').hidden && document.querySelector('#page-shell').getBoundingClientRect().width > 0, null, { timeout: 20000 });
  const mobilePageWidth = await mobile.locator('#page-shell').evaluate((element) => element.getBoundingClientRect().width);
  if (mobilePageWidth > 370) throw new Error(`Mobile editor overflows: ${mobilePageWidth}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
  console.log(JSON.stringify({ editor: 'ready', downloadedBytes: pdfBytes.length, pages: saved.getPageCount(), qr: 'received', multiPageExport: multiResult.getPageCount(), renderedPixels: drawnPixels, rotatedPixels, mobilePageWidth, browserErrors: 0 }));
  await mobile.close();
  await page.close();
} finally {
  await browser.close();
}
