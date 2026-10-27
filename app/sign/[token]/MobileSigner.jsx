'use client';

import { useEffect, useRef, useState } from 'react';

export default function MobileSigner({ token }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const snapshotsRef = useRef([]);
  const drawnRef = useRef(false);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Memeriksa sesi tanda tangan…');
  const [expiresAt, setExpiresAt] = useState(null);
  const [remaining, setRemaining] = useState('05:00');
  const [color, setColor] = useState('#000000');
  const [width, setWidth] = useState(4);

  useEffect(() => {
    if (!/^[a-f0-9]{64}$/.test(token)) {
      setStatus('error'); setMessage('Tautan sesi tidak valid.'); return;
    }
    let alive = true;
    fetch(`/api/qr/${token}`, { cache: 'no-store' })
      .then(async (res) => { const data = await res.json(); if (!res.ok) throw new Error(data.error); return data; })
      .then((data) => {
        if (!alive) return;
        setExpiresAt(data.expiresAt);
        if (data.status === 'ready') { setStatus('error'); setMessage('Sesi ini sudah menerima tanda tangan.'); }
        else { setStatus('ready'); setMessage('Gambar tanda tangan Anda, lalu kirim ke komputer.'); }
      })
      .catch((error) => { if (alive) { setStatus('error'); setMessage(error.message || 'Tidak dapat memeriksa sesi.'); } });
    return () => { alive = false; };
  }, [token]);

  useEffect(() => {
    if (!expiresAt || status === 'sent') return;
    const tick = () => {
      const ms = Math.max(0, expiresAt - Date.now());
      setRemaining(`${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`);
      if (ms === 0) { setStatus('error'); setMessage('Sesi kedaluwarsa. Buat QR baru di komputer.'); }
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [expiresAt, status]);

  function point(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
  }

  function down(event) {
    if (status !== 'ready') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    snapshotsRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const p = point(event);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + .1, p.y + .1);
    ctx.strokeStyle = color; ctx.lineWidth = width * 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    drawnRef.current = true;
  }

  function move(event) {
    if (!drawingRef.current) return;
    const p = point(event);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(p.x, p.y); ctx.stroke();
  }

  function clear() {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    snapshotsRef.current = []; drawnRef.current = false;
  }

  function undo() {
    const snapshot = snapshotsRef.current.pop();
    if (!snapshot) return;
    canvasRef.current.getContext('2d').putImageData(snapshot, 0, 0);
    drawnRef.current = snapshotsRef.current.length > 0;
  }

  async function send() {
    if (!drawnRef.current || status !== 'ready') { setMessage('Gambar tanda tangan terlebih dahulu.'); return; }
    setStatus('sending'); setMessage('Mengirim tanda tangan…');
    try {
      const image = canvasRef.current.toDataURL('image/png');
      const response = await fetch(`/api/qr/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image }) });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 404 || response.status === 409) { setStatus('error'); setMessage(data.error || 'Sesi tidak tersedia.'); return; }
        throw new Error(data.error || 'Pengiriman gagal.');
      }
      setStatus('sent'); setMessage('Tanda tangan terkirim. Silakan kembali ke komputer.');
      clear();
    } catch (error) { setStatus('ready'); setMessage(error.message || 'Pengiriman gagal. Coba lagi.'); }
  }

  return (
    <main className="mobile-sign-page">
      <div className="mobile-sign-card">
        <div className="mobile-sign-brand"><img src="/rachita-logo-transparent.png" alt="" /><span>Rachita<strong> Sign</strong></span></div>
        <div className="section-kicker">TANDA TANGAN VIA HP</div>
        <h1>Tanda tangan di sini.</h1>
        <p>Hanya gambar tanda tangan yang dikirim ke komputer. Dokumen PDF tidak dibuka di HP.</p>
        <div className={`mobile-session-status ${status}`} role="status">{message}</div>
        {status !== 'sent' && status !== 'error' && <>
          <div className="mobile-canvas-wrap"><canvas ref={canvasRef} width="900" height="500" onPointerDown={down} onPointerMove={move} onPointerUp={() => drawingRef.current = false} onPointerCancel={() => drawingRef.current = false} aria-label="Area menggambar tanda tangan" /></div>
          <div className="mobile-sign-settings"><label>Warna <input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label><label>Ketebalan <input type="range" min="2" max="8" value={width} onChange={(e) => setWidth(Number(e.target.value))} /></label></div>
          <div className="mobile-sign-actions"><button type="button" className="button button-outline" onClick={undo}>Ulangi</button><button type="button" className="button button-outline" onClick={clear}>Hapus</button><button type="button" className="button button-primary" disabled={status !== 'ready'} onClick={send}>Kirim tanda tangan</button></div>
          <small>Sesi berlaku {remaining} lagi.</small>
        </>}
        {status === 'sent' && <p className="mobile-success">Halaman ini boleh ditutup.</p>}
      </div>
    </main>
  );
}
