import { exportPdf, renderItemDataUrl } from './pdf-export';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_PAGES = 100;

export function initApp() {
  const root = $('#beranda');
  if (!root || root.dataset.initialized === 'true') return;
  root.dataset.initialized = 'true';

  const state = {
    pdfBytes: null, pdf: null, loadingTask: null, renderTask: null, serial: 0,
    fileName: '', page: 1, zoom: 1, viewports: {}, items: [], past: [], future: [],
    selected: null, nextId: 1, revision: 0, finalRevision: -1, previewedRevision: -1, finalUrl: null, finalBlob: null,
    qr: null, qrTimer: null, qrRequestId: 0, signatureHistory: [], signatureDrawn: false, freehandPoints: [],
  };
  let toastTimer;

  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3800);
  }

  function status(message, error = false) {
    $('#editor-status').textContent = message;
    $('#editor-status').classList.toggle('editor-status-error', error);
    $('#editor-file-status').textContent = message;
  }

  function info(title, message) {
    $('#info-title').textContent = title;
    $('#info-message').textContent = message;
    $('#info-dialog').showModal();
  }

  function readablePdfError(error) {
    const name = error?.name || '';
    const message = error?.message || '';
    if (/Password|Encrypted/i.test(name + message)) return 'PDF dilindungi kata sandi atau terenkripsi. Buka kuncinya sebelum mengunggah.';
    if (/Invalid|Format|Missing|header|corrupt/i.test(name + message)) return 'PDF rusak atau formatnya tidak didukung. Coba file PDF lain.';
    return 'PDF tidak dapat dibuka. Periksa file dan coba lagi.';
  }

  function formatBytes(bytes) {
    return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  function invalidateFinal() {
    state.revision++;
    state.finalRevision = -1;
    state.previewedRevision = -1;
    state.finalBlob = null;
    if ($('#preview-dialog').open) $('#preview-dialog').close();
    $('#preview-frame').removeAttribute('src');
    if (state.finalUrl) { URL.revokeObjectURL(state.finalUrl); state.finalUrl = null; }
  }

  function saveHistory() {
    state.past.push(structuredClone(state.items));
    if (state.past.length > 40) state.past.shift();
    state.future = [];
  }

  function updateHistoryButtons() {
    $('#undo-btn').disabled = !state.past.length;
    $('#redo-btn').disabled = !state.future.length;
  }

  function currentViewport() { return state.viewports[state.page]; }

  function clampItem(item) {
    const view = state.viewports[item.page];
    if (!view) return;
    item.w = Math.max(12, Math.min(view.width, Number(item.w) || 12));
    item.h = Math.max(12, Math.min(view.height, Number(item.h) || 12));
    item.x = Math.max(0, Math.min(view.width - item.w, Number(item.x) || 0));
    item.y = Math.max(0, Math.min(view.height - item.h, Number(item.y) || 0));
    item.rotation = Math.max(-180, Math.min(180, Number(item.rotation) || 0));
    item.opacity = Math.max(.1, Math.min(1, Number(item.opacity) || 1));
  }

  function addItem(spec) {
    if (!state.pdf) return toast('Unggah PDF terlebih dahulu.');
    const view = currentViewport();
    const item = {
      id: state.nextId++, page: state.page, type: spec.type,
      w: spec.w ?? 150, h: spec.h ?? 55,
      x: spec.x ?? (view.width - (spec.w ?? 150)) / 2,
      y: spec.y ?? Math.min(view.height - (spec.h ?? 55), view.height * .65),
      rotation: 0, opacity: 1, color: '#275b45', fontSize: 18, strokeWidth: 2,
      ...spec,
    };
    clampItem(item);
    saveHistory();
    state.items.push(item);
    state.selected = item.id;
    invalidateFinal();
    renderAnnotations();
    updateHistoryButtons();
    toast('Elemen ditambahkan. Geser atau tarik sudutnya untuk mengatur posisi.');
    return item;
  }

  function selectedItem() { return state.items.find((item) => item.id === state.selected); }

  function renderAnnotations() {
    const layer = $('#annotations');
    layer.replaceChildren();
    state.items.filter((item) => item.page === state.page).forEach((item) => {
      const el = document.createElement('div');
      el.className = `annotation ${item.type}${item.id === state.selected ? ' selected' : ''}`;
      el.dataset.id = String(item.id);
      el.style.left = `${item.x * state.zoom}px`;
      el.style.top = `${item.y * state.zoom}px`;
      el.style.width = `${item.w * state.zoom}px`;
      el.style.height = `${item.h * state.zoom}px`;
      el.style.transform = `rotate(${item.rotation}deg)`;
      el.style.opacity = String(item.opacity);
      el.style.color = item.color;
      if (item.type === 'signature' || item.type === 'image') {
        const image = document.createElement('img');
        image.src = item.dataUrl; image.alt = item.type === 'signature' ? 'Tanda tangan' : 'Gambar';
        el.append(image);
      } else {
        const image = document.createElement('img');
        image.src = renderItemDataUrl(item);
        image.alt = item.type === 'text' ? 'Teks' : item.type === 'stamp' ? 'Stempel' : 'Bentuk';
        el.append(image);
      }
      if (item.id === state.selected) {
        const handle = document.createElement('span'); handle.className = 'resize-handle'; handle.setAttribute('aria-label', 'Ubah ukuran elemen'); el.append(handle);
      }
      el.addEventListener('pointerdown', dragItem);
      layer.append(el);
    });
    renderProperties();
  }

  function renderProperties() {
    const item = selectedItem();
    $('#empty-properties').hidden = !!item;
    $('#selected-properties').hidden = !item;
    $('.properties-sidebar').classList.toggle('has-selection', !!item);
    if (!item) return;
    $('#text-property').hidden = !['text', 'stamp'].includes(item.type);
    $('#element-text').value = item.text || '';
    $('#element-x').value = Math.round(item.x);
    $('#element-y').value = Math.round(item.y);
    $('#element-width').value = Math.round(item.w);
    $('#element-height').value = Math.round(item.h);
    $('#element-rotation').value = Math.round(item.rotation);
    $('#element-opacity').value = Math.round(item.opacity * 100);
    $('#element-color').value = item.color || '#275b45';
    $('#element-font-size').value = item.fontSize || 18;
    $('#element-font-size').disabled = !['text', 'stamp'].includes(item.type);
    $('#element-stroke').value = item.strokeWidth || 2;
    $('#element-stroke').disabled = item.type !== 'shape';
  }

  function dragItem(event) {
    const id = Number(event.currentTarget.dataset.id);
    const item = state.items.find((entry) => entry.id === id);
    if (!item) return;
    event.preventDefault(); event.stopPropagation();
    const resize = event.target.classList.contains('resize-handle');
    state.selected = id;
    renderAnnotations();
    const startX = event.clientX, startY = event.clientY;
    const original = { x: item.x, y: item.y, w: item.w, h: item.h };
    let moved = false;
    const move = (e) => {
      const dx = (e.clientX - startX) / state.zoom;
      const dy = (e.clientY - startY) / state.zoom;
      if (!moved && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) { saveHistory(); moved = true; }
      if (!moved) return;
      if (resize) {
        item.w = original.w + dx; item.h = original.h + dy;
      } else { item.x = original.x + dx; item.y = original.y + dy; }
      clampItem(item);
      const node = $(`.annotation[data-id="${id}"]`);
      if (node) {
        node.style.left = `${item.x * state.zoom}px`; node.style.top = `${item.y * state.zoom}px`;
        node.style.width = `${item.w * state.zoom}px`; node.style.height = `${item.h * state.zoom}px`;
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (moved) { invalidateFinal(); renderAnnotations(); updateHistoryButtons(); }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  }

  function undo() {
    if (!state.past.length) return;
    state.future.push(structuredClone(state.items));
    state.items = state.past.pop(); state.selected = null;
    invalidateFinal(); renderAnnotations(); updateHistoryButtons();
  }

  function redo() {
    if (!state.future.length) return;
    state.past.push(structuredClone(state.items));
    state.items = state.future.pop(); state.selected = null;
    invalidateFinal(); renderAnnotations(); updateHistoryButtons();
  }

  async function pdfjs() {
    const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    return pdfjsLib;
  }

  async function renderPage() {
    if (!state.pdf) return;
    const serial = state.serial;
    if (state.renderTask) { state.renderTask.cancel(); state.renderTask = null; }
    const page = await state.pdf.getPage(state.page);
    if (serial !== state.serial) return;
    const base = page.getViewport({ scale: 1 });
    state.viewports[state.page] = base;
    const cssView = page.getViewport({ scale: state.zoom });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const renderView = page.getViewport({ scale: state.zoom * dpr });
    const canvas = $('#pdf-canvas');
    canvas.width = Math.ceil(renderView.width); canvas.height = Math.ceil(renderView.height);
    canvas.style.width = `${cssView.width}px`; canvas.style.height = `${cssView.height}px`;
    $('#page-shell').style.width = `${cssView.width}px`; $('#page-shell').style.height = `${cssView.height}px`;
    $('#editor-page').style.width = `${cssView.width}px`; $('#editor-page').style.height = `${cssView.height}px`;
    $('#zoom-label').textContent = `${Math.round(state.zoom * 100)}%`;
    $('#current-page').textContent = String(state.page);
    $('#prev-page').disabled = state.page <= 1;
    $('#next-page').disabled = state.page >= state.pdf.numPages;
    $$('.thumbnail').forEach((button) => button.classList.toggle('selected', Number(button.dataset.page) === state.page));
    renderAnnotations();
    const task = page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport: renderView });
    state.renderTask = task;
    try { await task.promise; }
    catch (error) { if (error?.name !== 'RenderingCancelledException') status('Gagal merender halaman.', true); }
    finally { if (state.renderTask === task) state.renderTask = null; page.cleanup(); }
  }

  async function renderThumbnails(serial) {
    const list = $('#thumbnail-list'); list.replaceChildren();
    for (let number = 1; number <= state.pdf.numPages; number++) {
      const button = document.createElement('button');
      button.className = `thumbnail${number === state.page ? ' selected' : ''}`;
      button.dataset.page = String(number);
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span'); label.textContent = `Halaman ${number}`;
      button.append(canvas, label);
      button.addEventListener('click', () => switchPage(number));
      list.append(button);
    }
    for (let number = 1; number <= state.pdf.numPages; number++) {
      if (serial !== state.serial || !state.pdf) return;
      try {
        const page = await state.pdf.getPage(number);
        const base = page.getViewport({ scale: 1 });
        state.viewports[number] = base;
        const scale = Math.min(100 / base.width, 130 / base.height);
        const viewport = page.getViewport({ scale });
        const canvas = list.querySelector(`[data-page="${number}"] canvas`);
        if (!canvas) return;
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
        page.cleanup();
      } catch { /* A broken thumbnail does not prevent editing another page. */ }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  async function switchPage(number) {
    if (!state.pdf || number < 1 || number > state.pdf.numPages || number === state.page) return;
    state.page = number; state.selected = null;
    $('.page-stage').scrollTop = 0;
    if (window.innerWidth <= 760) await fitPage();
    else await renderPage();
  }

  async function fitPage() {
    if (!state.pdf) return;
    const view = currentViewport() || (await state.pdf.getPage(state.page)).getViewport({ scale: 1 });
    const stage = $('.page-stage');
    state.zoom = Math.max(.3, Math.min(2, (stage.clientWidth - 45) / view.width, (stage.clientHeight - 45) / view.height));
    await renderPage();
  }

  async function cleanupDocument() {
    state.serial++;
    if (state.renderTask) { state.renderTask.cancel(); state.renderTask = null; }
    if (state.loadingTask) { try { await state.loadingTask.destroy(); } catch {} state.loadingTask = null; }
    state.pdf = null; state.pdfBytes = null; state.fileName = '';
    state.items = []; state.past = []; state.future = []; state.selected = null;
    state.viewports = {}; state.page = 1; state.zoom = 1; state.nextId = 1;
    invalidateFinal();
    $('#thumbnail-list').replaceChildren(); $('#annotations').replaceChildren();
    $('#pdf-canvas').getContext('2d').clearRect(0, 0, $('#pdf-canvas').width, $('#pdf-canvas').height);
    $('#pdf-input').value = ''; $('#image-input').value = ''; $('#signature-image-input').value = '';
    updateHistoryButtons(); renderProperties();
  }

  async function handlePdf(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return toast('Pilih file dengan format PDF.');
    if (file.size > MAX_PDF_BYTES) return toast('Ukuran PDF maksimal 20 MB.');
    if (file.size < 8) return toast('File PDF tampaknya kosong atau rusak.');
    status('Membaca PDF…');
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') throw new Error('Invalid PDF header');
      const { PDFDocument } = await import('pdf-lib');
      await PDFDocument.load(bytes.slice(), { updateMetadata: false });
      const pdfjsLib = await pdfjs();
      await cancelQr();
      await cleanupDocument();
      state.pdfBytes = bytes;
      state.loadingTask = pdfjsLib.getDocument({ data: bytes.slice(), useSystemFonts: true });
      state.pdf = await state.loadingTask.promise;
      if (state.pdf.numPages > MAX_PAGES) throw new Error(`PDF memiliki lebih dari ${MAX_PAGES} halaman.`);
      state.fileName = file.name;
      $('#editor-filename').textContent = file.name;
      $('#page-count').textContent = String(state.pdf.numPages).padStart(2, '0');
      $('#total-pages').textContent = String(state.pdf.numPages);
      $('main').hidden = true; $('.site-header').hidden = true; $('.site-footer').hidden = true;
      $('#editor-view').hidden = false; document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
      if (window.innerWidth <= 760) await fitPage();
      else await renderPage();
      renderThumbnails(state.serial);
      status(`${state.pdf.numPages} halaman • ${formatBytes(file.size)} siap diedit`);
    } catch (error) {
      await cleanupDocument();
      const message = /lebih dari/.test(error.message) ? error.message : readablePdfError(error);
      status(message, true); toast(message);
    }
  }

  async function leaveEditor() {
    await cancelQr();
    await cleanupDocument();
    $('#editor-view').hidden = true; $('main').hidden = false; $('.site-header').hidden = false; $('.site-footer').hidden = false;
    document.body.style.overflow = '';
    window.scrollTo(0, 0);
  }

  async function makeExample() {
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([595, 842]);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      page.drawText('RACHITA GROUP', { x: 55, y: 782, size: 18, font: bold, color: rgb(.15, .36, .27) });
      page.drawLine({ start: { x: 55, y: 765 }, end: { x: 540, y: 765 }, thickness: 2, color: rgb(.51, .73, .35) });
      page.drawText('SURAT PERNYATAAN', { x: 55, y: 710, size: 11, font: bold, color: rgb(.39, .62, .29) });
      page.drawText('Persetujuan Dokumen', { x: 55, y: 677, size: 23, font: bold, color: rgb(.16, .34, .24) });
      page.drawText('Nomor: 021/RCH/DOK/X/2026', { x: 55, y: 653, size: 10, font, color: rgb(.5, .56, .52) });
      const lines = ['Yang bertanda tangan di bawah ini menyatakan telah membaca dan memahami', 'isi dokumen ini. Seluruh informasi telah diperiksa dengan seksama.', '', 'Nama lengkap       : Andi Pratama', 'Tanggal                   : 24 Oktober 2026', 'Keperluan              : Persetujuan administrasi', '', 'Dengan ini saya menyatakan bahwa data dan persetujuan yang diberikan', 'adalah benar dan dapat digunakan sesuai keperluan yang tercantum.', '', 'Demikian surat pernyataan ini dibuat untuk dipergunakan sebagaimana mestinya.'];
      lines.forEach((line, index) => page.drawText(line, { x: 55, y: 590 - index * 25, size: 11, font, color: rgb(.27, .36, .3) }));
      page.drawText('Makassar, 24 Oktober 2026', { x: 355, y: 230, size: 11, font });
      page.drawText('Yang menyatakan,', { x: 355, y: 209, size: 11, font });
      page.drawLine({ start: { x: 355, y: 125 }, end: { x: 495, y: 125 }, thickness: 1, color: rgb(.6, .7, .63) });
      page.drawText('Andi Pratama', { x: 355, y: 106, size: 11, font: bold });
      const bytes = await pdf.save();
      await handlePdf(new File([bytes], 'contoh-dokumen.pdf', { type: 'application/pdf' }));
    } catch { toast('Dokumen contoh gagal dibuat.'); }
  }

  async function finalDocument() {
    if (!state.pdfBytes) throw new Error('Tidak ada PDF yang terbuka.');
    if (state.finalRevision === state.revision && state.finalUrl) return state.finalUrl;
    status('Membuat PDF final…');
    try {
      const bytes = await exportPdf(state.pdfBytes, state.items, state.viewports);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      if (state.finalUrl) URL.revokeObjectURL(state.finalUrl);
      state.finalBlob = blob; state.finalUrl = URL.createObjectURL(blob); state.finalRevision = state.revision;
      status('PDF final siap');
      return state.finalUrl;
    } catch (error) {
      status('Gagal membuat PDF final.', true);
      throw new Error(error?.message || 'Gagal membuat PDF final. Coba lagi.');
    }
  }

  async function preview() {
    try {
      const url = await finalDocument();
      $('#preview-frame').src = `${url}#toolbar=1`;
      $('#preview-dialog').showModal();
      state.previewedRevision = state.revision;
    } catch (error) { info('Pratinjau gagal', error.message); }
  }

  async function download() {
    if (state.previewedRevision !== state.revision) { toast('Periksa pratinjau PDF sebelum mengunduh.'); await preview(); return; }
    try {
      const url = await finalDocument();
      const link = document.createElement('a');
      const base = state.fileName.replace(/\.pdf$/i, '').replace(/[<>:"/\\|?*]/g, '-');
      link.href = url; link.download = `${base || 'dokumen'}-ditandatangani.pdf`;
      document.body.append(link); link.click(); link.remove();
      toast('PDF final berhasil dibuat dan diunduh.');
    } catch (error) { info('Unduh gagal', error.message); }
  }

  async function printPdf() {
    if (state.previewedRevision !== state.revision) { toast('Periksa pratinjau PDF sebelum mencetak.'); await preview(); return; }
    try {
      const url = await finalDocument();
      const frame = $('#print-frame');
      frame.onload = () => {
        try { frame.contentWindow.focus(); frame.contentWindow.print(); }
        catch { window.open(url, '_blank', 'noopener'); toast('Buka tab PDF untuk mencetak.'); }
      };
      frame.src = url;
    } catch (error) { info('Cetak gagal', error.message); }
  }

  function setActiveTool(tool) { $$('.tool-button').forEach((button) => button.classList.toggle('active', button.dataset.tool === tool)); }

  async function readImage(file, type) {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) return toast('Gunakan gambar PNG atau JPEG.');
    if (file.size > 5 * 1024 * 1024) return toast('Ukuran gambar maksimal 5 MB.');
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
      });
      const image = new Image(); image.src = dataUrl; await image.decode();
      const ratio = image.naturalHeight / image.naturalWidth;
      const w = type === 'signature' ? 170 : 190;
      addItem({ type, dataUrl, w, h: Math.max(22, Math.min(190, w * ratio)) });
      $('#signature-dialog').close();
    } catch { toast('Gambar tidak dapat dibaca.'); }
  }

  const signatureCanvas = $('#signature-canvas');
  const signatureCtx = signatureCanvas.getContext('2d');
  let signatureDrawing = false;
  function canvasPoint(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
  }
  signatureCanvas.addEventListener('pointerdown', (event) => {
    signatureCanvas.setPointerCapture(event.pointerId); signatureDrawing = true;
    state.signatureHistory.push(signatureCtx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height));
    const p = canvasPoint(signatureCanvas, event);
    signatureCtx.beginPath(); signatureCtx.moveTo(p.x, p.y); signatureCtx.lineTo(p.x + .1, p.y + .1);
    signatureCtx.strokeStyle = $('#pen-color').value; signatureCtx.lineWidth = Number($('#pen-width').value) * 2;
    signatureCtx.lineCap = 'round'; signatureCtx.lineJoin = 'round'; signatureCtx.stroke();
    state.signatureDrawn = true;
  });
  signatureCanvas.addEventListener('pointermove', (event) => {
    if (!signatureDrawing) return;
    const p = canvasPoint(signatureCanvas, event); signatureCtx.lineTo(p.x, p.y); signatureCtx.stroke();
  });
  signatureCanvas.addEventListener('pointerup', () => signatureDrawing = false);
  signatureCanvas.addEventListener('pointercancel', () => signatureDrawing = false);
  $('#clear-signature').addEventListener('click', () => { signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height); state.signatureHistory = []; state.signatureDrawn = false; });
  $('#signature-undo').addEventListener('click', () => {
    const prior = state.signatureHistory.pop(); if (!prior) return;
    signatureCtx.putImageData(prior, 0, 0); state.signatureDrawn = state.signatureHistory.length > 0;
  });
  $('#add-signature').addEventListener('click', () => {
    if (!state.signatureDrawn) return toast('Gambar tanda tangan terlebih dahulu.');
    const pixels = signatureCtx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height).data;
    let minX = signatureCanvas.width, minY = signatureCanvas.height, maxX = 0, maxY = 0;
    for (let y = 0; y < signatureCanvas.height; y++) for (let x = 0; x < signatureCanvas.width; x++) {
      if (pixels[(y * signatureCanvas.width + x) * 4 + 3] > 8) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
    }
    if (maxX < minX) return toast('Gambar tanda tangan terlebih dahulu.');
    const margin = 10;
    const crop = document.createElement('canvas');
    crop.width = maxX - minX + 1 + margin * 2; crop.height = maxY - minY + 1 + margin * 2;
    crop.getContext('2d').drawImage(signatureCanvas, minX - margin, minY - margin, crop.width, crop.height, 0, 0, crop.width, crop.height);
    const w = 175; const h = Math.max(28, Math.min(120, w * crop.height / crop.width));
    addItem({ type: 'signature', dataUrl: crop.toDataURL('image/png'), w, h });
    signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    state.signatureHistory = []; state.signatureDrawn = false;
    $('#signature-dialog').close();
  });

  const freehandCanvas = $('#freehand-canvas'); const freehandCtx = freehandCanvas.getContext('2d'); let freehandDrawing = false;
  freehandCanvas.addEventListener('pointerdown', (event) => {
    freehandDrawing = true; freehandCanvas.setPointerCapture(event.pointerId);
    const p = canvasPoint(freehandCanvas, event);
    if (state.freehandPoints.length) state.freehandPoints.push(null);
    state.freehandPoints.push([p.x, p.y]);
    freehandCtx.beginPath(); freehandCtx.moveTo(p.x, p.y);
    freehandCtx.strokeStyle = '#275b45'; freehandCtx.lineWidth = 5; freehandCtx.lineCap = 'round';
  });
  freehandCanvas.addEventListener('pointermove', (event) => {
    if (!freehandDrawing) return;
    const p = canvasPoint(freehandCanvas, event);
    state.freehandPoints.push([p.x, p.y]); freehandCtx.lineTo(p.x, p.y); freehandCtx.stroke();
  });
  freehandCanvas.addEventListener('pointerup', () => freehandDrawing = false);
  freehandCanvas.addEventListener('pointercancel', () => freehandDrawing = false);
  $('#clear-freehand').addEventListener('click', () => { freehandCtx.clearRect(0, 0, freehandCanvas.width, freehandCanvas.height); state.freehandPoints = []; });
  $('#add-freehand').addEventListener('click', () => {
    const points = state.freehandPoints.filter(Boolean);
    if (points.length < 2) return toast('Buat coretan terlebih dahulu.');
    const xs = points.map(([x]) => x), ys = points.map(([, y]) => y);
    const minX = Math.min(...xs), minY = Math.min(...ys), width = Math.max(10, Math.max(...xs) - minX), height = Math.max(10, Math.max(...ys) - minY);
    const normalized = state.freehandPoints.map((point) => point ? [(point[0] - minX) / width, (point[1] - minY) / height] : null);
    addItem({ type: 'shape', shape: 'freehand', points: normalized, w: Math.max(50, width * .5), h: Math.max(25, height * .5) });
    freehandCtx.clearRect(0, 0, freehandCanvas.width, freehandCanvas.height);
    state.freehandPoints = [];
    $('#freehand-dialog').close();
  });

  async function cancelQr() {
    state.qrRequestId++;
    if (state.qrTimer) { clearInterval(state.qrTimer); state.qrTimer = null; }
    const session = state.qr; state.qr = null;
    if (session) {
      try { await fetch(`/api/qr/${session.token}`, { method: 'DELETE', headers: { 'x-session-owner': session.owner } }); } catch {}
    }
    if ($('#qr-dialog').open) $('#qr-dialog').close();
  }

  async function openQr() {
    if (!state.pdf) return toast('Unggah PDF terlebih dahulu.');
    await cancelQr();
    const requestId = state.qrRequestId;
    $('#qr-status').textContent = 'Menyiapkan sesi…'; $('#qr-time').textContent = '05:00';
    $('#qr-dialog').showModal();
    try {
      const response = await fetch('/api/qr', { method: 'POST' });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      if (requestId !== state.qrRequestId) {
        await fetch(`/api/qr/${data.token}`, { method: 'DELETE', headers: { 'x-session-owner': data.owner } });
        return;
      }
      const targetPage = state.page;
      state.qr = { ...data, page: targetPage };
      const url = new URL(`/sign/${data.token}`, location.origin).toString();
      const QRCode = (await import('qrcode')).default;
      if (requestId !== state.qrRequestId) return;
      $('#qr-image').src = await QRCode.toDataURL(url, { width: 220, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#275b45', light: '#ffffffff' } });
      $('#qr-link').href = url;
      $('#qr-link').textContent = url;
      $('#qr-status').textContent = 'Menunggu tanda tangan dari HP';
      let ticks = 0;
      state.qrTimer = setInterval(async () => {
        if (!state.qr || state.qr.token !== data.token) return;
        const ms = Math.max(0, data.expiresAt - Date.now());
        $('#qr-time').textContent = `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
        if (!ms) { $('#qr-status').textContent = 'Sesi kedaluwarsa. Buat QR baru.'; clearInterval(state.qrTimer); state.qrTimer = null; state.qr = null; return; }
        if (++ticks % 2) return;
        try {
          const check = await fetch(`/api/qr/${data.token}`, { cache: 'no-store' });
          if (!state.qr || state.qr.token !== data.token) return;
          if (!check.ok) throw new Error('Sesi tidak lagi tersedia.');
          const result = await check.json();
          if (result.status !== 'ready') return;
          const received = await fetch(`/api/qr/${data.token}/consume`, { method: 'POST', headers: { 'x-session-owner': data.owner } });
          if (!state.qr || state.qr.token !== data.token) return;
          const payload = await received.json(); if (!received.ok) throw new Error(payload.error);
          clearInterval(state.qrTimer); state.qrTimer = null; state.qr = null;
          const image = new Image(); image.src = payload.image; await image.decode();
          if (state.page !== targetPage) await switchPage(targetPage);
          addItem({ type: 'signature', dataUrl: payload.image, w: 175, h: Math.max(28, Math.min(120, 175 * image.naturalHeight / image.naturalWidth)) });
          $('#qr-status').textContent = 'Tanda tangan diterima'; $('#qr-dialog').close(); toast('Tanda tangan dari HP berhasil diterima.');
        } catch (error) { $('#qr-status').textContent = error.message || 'Koneksi gagal. Buat QR baru.'; }
      }, 1000);
    } catch (error) { $('#qr-status').textContent = error.message || 'Sesi QR gagal dibuat.'; toast($('#qr-status').textContent); await cancelQr(); }
  }

  function updateProperty(field, value) {
    const item = selectedItem(); if (!item) return;
    saveHistory(); item[field] = value; clampItem(item);
    invalidateFinal(); renderAnnotations(); updateHistoryButtons();
  }

  // Upload and navigation
  $('#header-start').addEventListener('click', () => $('#upload').scrollIntoView({ behavior: 'smooth' }));
  $('#hero-upload').addEventListener('click', () => $('#pdf-input').click());
  $('#select-file').addEventListener('click', (event) => { event.stopPropagation(); $('#pdf-input').click(); });
  $('#see-editor').addEventListener('click', makeExample);
  $('#drop-zone').addEventListener('click', () => $('#pdf-input').click());
  $('#drop-zone').addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); $('#pdf-input').click(); } });
  ['dragenter', 'dragover'].forEach((name) => $('#drop-zone').addEventListener(name, (event) => { event.preventDefault(); $('#drop-zone').classList.add('dragging'); }));
  ['dragleave', 'drop'].forEach((name) => $('#drop-zone').addEventListener(name, (event) => { event.preventDefault(); $('#drop-zone').classList.remove('dragging'); }));
  $('#drop-zone').addEventListener('drop', (event) => handlePdf(event.dataTransfer.files[0]));
  $('#pdf-input').addEventListener('change', (event) => handlePdf(event.target.files[0]));
  $('#back-home').addEventListener('click', () => { if (!state.items.length || confirm('Kembali ke beranda? Perubahan yang belum diunduh akan hilang.')) leaveEditor(); });
  $('#new-document').addEventListener('click', () => { if (!state.items.length || confirm('Mulai dokumen baru? Perubahan yang belum diunduh akan hilang.')) leaveEditor(); });
  $('#prev-page').addEventListener('click', () => switchPage(state.page - 1));
  $('#next-page').addEventListener('click', () => switchPage(state.page + 1));
  $('#zoom-in').addEventListener('click', () => { state.zoom = Math.min(2, Math.round((state.zoom + .1) * 10) / 10); renderPage(); });
  $('#zoom-out').addEventListener('click', () => { state.zoom = Math.max(.3, Math.round((state.zoom - .1) * 10) / 10); renderPage(); });
  $('#fit-page').addEventListener('click', fitPage);
  $('#undo-btn').addEventListener('click', undo); $('#redo-btn').addEventListener('click', redo);
  $('#annotations').addEventListener('pointerdown', (event) => { if (event.target.id === 'annotations') { state.selected = null; renderAnnotations(); } });

  // Tools
  $$('.tool-button').forEach((button) => button.addEventListener('click', () => {
    const tool = button.dataset.tool; setActiveTool(tool);
    if (tool === 'tanda-tangan') $('#signature-dialog').showModal();
    if (tool === 'teks') addItem({ type: 'text', text: 'Teks baru', w: 180, h: 35, fontSize: 18 });
    if (tool === 'gambar') $('#image-input').click();
    if (tool === 'stempel') addItem({ type: 'stamp', text: 'DISETUJUI', w: 150, h: 48, fontSize: 18, color: '#bc5e58' });
    if (tool === 'bentuk') $('#shape-dialog').showModal();
    if (tool === 'hp') openQr();
  }));
  $('#image-input').addEventListener('change', (event) => { readImage(event.target.files[0], 'image'); event.target.value = ''; });
  $('#signature-image-input').addEventListener('change', (event) => { readImage(event.target.files[0], 'signature'); event.target.value = ''; });
  $('#signature-upload-trigger').addEventListener('click', () => $('#signature-image-input').click());
  $$('[data-shape]').forEach((button) => button.addEventListener('click', () => {
    $('#shape-dialog').close();
    if (button.dataset.shape === 'freehand') { $('#freehand-dialog').showModal(); return; }
    addItem({ type: 'shape', shape: button.dataset.shape, w: 160, h: button.dataset.shape === 'line' || button.dataset.shape === 'arrow' ? 35 : 95, color: '#275b45' });
  }));

  // Properties
  [['element-text', 'text'], ['element-x', 'x'], ['element-y', 'y'], ['element-width', 'w'], ['element-height', 'h'], ['element-rotation', 'rotation'], ['element-opacity', 'opacity'], ['element-color', 'color'], ['element-font-size', 'fontSize'], ['element-stroke', 'strokeWidth']].forEach(([id, field]) => {
    $(`#${id}`).addEventListener('change', (event) => updateProperty(field, field === 'opacity' ? Number(event.target.value) / 100 : ['text', 'color'].includes(field) ? event.target.value : Number(event.target.value)));
  });
  $('#delete-element').addEventListener('click', () => {
    if (state.selected == null) return;
    saveHistory(); state.items = state.items.filter((item) => item.id !== state.selected); state.selected = null;
    invalidateFinal(); renderAnnotations(); updateHistoryButtons();
  });
  $('#duplicate-element').addEventListener('click', () => {
    const item = selectedItem(); if (!item) return;
    const { id, ...copy } = structuredClone(item);
    addItem({ ...copy, x: item.x + 18, y: item.y + 18 });
  });

  // Final PDF and dialogs
  $('#preview-btn').addEventListener('click', preview);
  $('#print-btn').addEventListener('click', printPdf);
  $('#editor-download').addEventListener('click', download);
  $('#footer-download').addEventListener('click', download);
  $('#preview-download').addEventListener('click', download);
  $('#preview-print').addEventListener('click', printPdf);
  $('#cancel-qr').addEventListener('click', cancelQr);
  $('#renew-qr').addEventListener('click', openQr);
  $$('[data-close]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.close === 'qr-dialog') cancelQr();
    else $(`#${button.dataset.close}`).close();
  }));
  $$('#qr-dialog, #signature-dialog, #shape-dialog, #freehand-dialog, #preview-dialog').forEach((dialog) => dialog.addEventListener('cancel', (event) => {
    if (dialog.id === 'qr-dialog') { event.preventDefault(); cancelQr(); }
  }));
  document.addEventListener('keydown', (event) => {
    if ($('dialog[open]')) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.target.matches('input, textarea')) {
      event.preventDefault(); event.shiftKey ? redo() : undo();
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && state.selected != null && !event.target.matches('input, textarea')) {
      event.preventDefault(); $('#delete-element').click();
    }
  });
  window.addEventListener('beforeunload', () => {
    if (state.qr) fetch(`/api/qr/${state.qr.token}`, { method: 'DELETE', headers: { 'x-session-owner': state.qr.owner }, keepalive: true }).catch(() => {});
  });
  updateHistoryButtons();
  document.documentElement.dataset.editorReady = 'true';
}
