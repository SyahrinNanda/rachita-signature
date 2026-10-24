import { PDFDocument, degrees } from 'pdf-lib';

function dataUrlBytes(url) {
  const base64 = url.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function renderItemDataUrl(item) {
  const scale = 3;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(item.w * scale));
  canvas.height = Math.max(1, Math.ceil(item.h * scale));
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.strokeStyle = item.color || '#275b45';
  ctx.fillStyle = item.color || '#275b45';
  ctx.lineWidth = Math.max(1, item.strokeWidth || 2);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (item.type === 'text') {
    ctx.font = `${item.fontSize || 18}px Arial, sans-serif`;
    ctx.textBaseline = 'top';
    const lines = String(item.text || '').split('\n');
    lines.forEach((line, index) => ctx.fillText(line, 2, 2 + index * (item.fontSize || 18) * 1.25, item.w - 4));
  } else if (item.type === 'stamp') {
    ctx.strokeStyle = item.color || '#bc5e58';
    ctx.fillStyle = item.color || '#bc5e58';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, item.w - 4, item.h - 4);
    ctx.font = `700 ${item.fontSize || 18}px Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(item.text || 'DISETUJUI', item.w / 2, item.h / 2, item.w - 12);
  } else if (item.type === 'shape') {
    const pad = Math.max(3, ctx.lineWidth);
    if (item.shape === 'rectangle') ctx.strokeRect(pad, pad, item.w - 2 * pad, item.h - 2 * pad);
    if (item.shape === 'ellipse') { ctx.beginPath(); ctx.ellipse(item.w / 2, item.h / 2, Math.max(1, item.w / 2 - pad), Math.max(1, item.h / 2 - pad), 0, 0, Math.PI * 2); ctx.stroke(); }
    if (item.shape === 'line' || item.shape === 'arrow') {
      const y = item.h / 2; ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(item.w - pad, y); ctx.stroke();
      if (item.shape === 'arrow') { ctx.beginPath(); ctx.moveTo(item.w - pad - 12, y - 9); ctx.lineTo(item.w - pad, y); ctx.lineTo(item.w - pad - 12, y + 9); ctx.stroke(); }
    }
    if (item.shape === 'freehand' && item.points?.length) {
      ctx.beginPath();
      let start = true;
      item.points.forEach((point) => {
        if (!point) { start = true; return; }
        const [x, y] = point;
        if (start) { ctx.moveTo(x * item.w, y * item.h); start = false; }
        else ctx.lineTo(x * item.w, y * item.h);
      });
      ctx.stroke();
    }
  }
  return canvas.toDataURL('image/png');
}

function imagePosition(item, viewport) {
  const angle = (item.rotation || 0) * Math.PI / 180;
  const cx = item.x + item.w / 2;
  const cy = item.y + item.h / 2;
  const rotated = (x, y) => {
    const dx = x - cx; const dy = y - cy;
    return [cx + dx * Math.cos(angle) - dy * Math.sin(angle), cy + dx * Math.sin(angle) + dy * Math.cos(angle)];
  };
  const [ax, ay] = viewport.convertToPdfPoint(...rotated(item.x, item.y + item.h));
  const [bx, by] = viewport.convertToPdfPoint(...rotated(item.x + item.w, item.y + item.h));
  const [cxPdf, cyPdf] = viewport.convertToPdfPoint(...rotated(item.x, item.y));
  return {
    x: ax, y: ay,
    width: Math.hypot(bx - ax, by - ay),
    height: Math.hypot(cxPdf - ax, cyPdf - ay),
    rotate: degrees(Math.atan2(by - ay, bx - ax) * 180 / Math.PI),
    opacity: Math.max(0, Math.min(1, item.opacity ?? 1)),
  };
}

export async function exportPdf(originalBytes, items, viewports) {
  const pdf = await PDFDocument.load(originalBytes.slice(), { updateMetadata: false });
  const pages = pdf.getPages();
  const imageCache = new Map();
  for (const item of items) {
    if (!pages[item.page - 1] || !viewports[item.page]) continue;
    let bytes;
    let key;
    let kind = 'png';
    if (item.type === 'image' || item.type === 'signature') {
      key = item.dataUrl;
      bytes = dataUrlBytes(item.dataUrl);
      if (item.dataUrl.startsWith('data:image/jpeg;')) kind = 'jpg';
    } else {
      bytes = dataUrlBytes(renderItemDataUrl(item));
    }
    let embedded = key && imageCache.get(key);
    if (!embedded) {
      embedded = kind === 'jpg' ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
      if (key) imageCache.set(key, embedded);
    }
    pages[item.page - 1].drawImage(embedded, imagePosition(item, viewports[item.page]));
  }
  return pdf.save();
}
