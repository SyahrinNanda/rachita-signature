'use client';

import { useEffect } from 'react';
import { initApp } from '../lib/editor-app';

export default function Page() {
  useEffect(() => { initApp(); }, []);
  return (
    <>
    <svg className="icon-sprite" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></symbol>
      <symbol id="i-upload" viewBox="0 0 24 24"><path d="M12 16V4m-5 5 5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></symbol>
      <symbol id="i-file" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6"/></symbol>
      <symbol id="i-shield" viewBox="0 0 24 24"><path d="m12 22 1-.4c5-2 8-5.2 8-10V5l-9-3-9 3v6.6c0 4.8 3 8 8 10l1 .4Z"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/></symbol>
      <symbol id="i-pen" viewBox="0 0 24 24"><path d="m14 4 6 6M4 20l4.5-1 11-11a2.12 2.12 0 0 0-3-3l-11 11L4 20Z"/><path d="M4 20h16"/></symbol>
      <symbol id="i-text" viewBox="0 0 24 24"><path d="M4 7V4h16v3M12 4v16m-4 0h8"/></symbol>
      <symbol id="i-stamp" viewBox="0 0 24 24"><path d="M7 14h10l2 4H5l2-4ZM9 14V9a3 3 0 0 1 6 0v5M4 22h16"/></symbol>
      <symbol id="i-shape" viewBox="0 0 24 24"><rect x="3" y="3" width="12" height="12" rx="1"/><circle cx="17" cy="17" r="4"/></symbol>
      <symbol id="i-phone" viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></symbol>
      <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 3v12m-5-5 5 5 5-5M4 17v3h16v-3"/></symbol>
      <symbol id="i-print" viewBox="0 0 24 24"><path d="M6 9V3h12v6M6 18H4V9h16v9h-2M6 15h12v6H6zM17 12h.01"/></symbol>
      <symbol id="i-eye" viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></symbol>
      <symbol id="i-close" viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19"/></symbol>
      <symbol id="i-check" viewBox="0 0 24 24"><path d="m4 12 5 5L20 6"/></symbol>
      <symbol id="i-back" viewBox="0 0 24 24"><path d="M20 12H4m6 6-6-6 6-6"/></symbol>
      <symbol id="i-undo" viewBox="0 0 24 24"><path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-2"/></symbol>
      <symbol id="i-redo" viewBox="0 0 24 24"><path d="m15 14 5-5-5-5m5 5H10a6 6 0 0 0 0 12h2"/></symbol>
      <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 4v16M4 12h16"/></symbol>
      <symbol id="i-minus" viewBox="0 0 24 24"><path d="M4 12h16"/></symbol>
      <symbol id="i-cursor" viewBox="0 0 24 24"><path d="M5 3v16l4.5-4.5 3.5 6 2.5-1.5-3.4-5.8L19 12 5 3Z"/></symbol>
      <symbol id="i-spark" viewBox="0 0 24 24"><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2ZM19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17Z"/></symbol>
    </svg>

    <header className="site-header">
      <a className="brand" href="#beranda" aria-label="Rachita Sign, kembali ke beranda">
        <img className="brand-logo" src="/rachita-logo.png" alt="" />
        <span className="brand-name">Rachita<span className="brand-dot">.</span><small>SIGN</small></span>
      </a>
      <nav className="site-nav" aria-label="Navigasi utama">
        <a href="#cara-kerja">Cara kerja</a>
        <a href="#fitur">Fitur</a>
        <a href="#privasi">Privasi</a>
      </nav>
      <button className="header-cta" id="header-start">Mulai sekarang <svg><use href="#i-arrow"/></svg></button>
    </header>

    <main id="beranda">
      <section className="hero" id="landing-view">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line"></span> CARA MUDAH TANDA TANGAN DOKUMEN</div>
          <h1>Tanda tangan PDF,<br /><em>semudah itu.</em></h1>
          <p>Tambahkan tanda tangan, teks, atau stempel ke PDF Anda dalam beberapa langkah. Langsung dari browser, tanpa akun.</p>
          <div className="hero-actions">
            <button className="button button-primary" id="hero-upload">Pilih file PDF <svg><use href="#i-arrow"/></svg></button>
            <button className="button button-link" id="see-editor">Coba editor dengan contoh <span aria-hidden="true">↗</span></button>
          </div>
          <div className="hero-proof"><div className="proof-icons"><span><svg><use href="#i-shield"/></svg></span><span><svg><use href="#i-file"/></svg></span></div><span><strong>Praktis & privat</strong><br />Dokumen tetap di perangkat Anda*</span></div>
        </div>
        <div className="hero-visual" aria-label="Ilustrasi editor tanda tangan PDF">
          <div className="visual-orbit orbit-one"></div><div className="visual-orbit orbit-two"></div>
          <div className="visual-note note-top"><svg><use href="#i-spark"/></svg> Dokumen siap ditandatangani</div>
          <div className="hero-document">
            <div className="document-topline"><img className="doc-mini-logo" src="/rachita-logo.png" alt="" /><span>RACHITA GROUP</span><span className="doc-top-right">DOKUMEN RESMI</span></div>
            <div className="document-rule"></div>
            <div className="doc-caption">SURAT PERNYATAAN</div>
            <div className="doc-title">Persetujuan Dokumen</div>
            <div className="doc-meta">Nomor: 021/RCH/DOK/X/2026</div>
            <div className="skeleton lines-a"><i></i><i></i><i></i><i></i></div>
            <div className="doc-field"><span>Nama lengkap</span><b>Andi Pratama</b></div>
            <div className="doc-field"><span>Tanggal</span><b>24 Oktober 2026</b></div>
            <div className="skeleton lines-b"><i></i><i></i><i></i></div>
            <div className="doc-sign-row"><span>Pihak yang menyetujui,</span><span className="signature-art">Andi P.</span><span className="signature-line"></span><strong>Andi Pratama</strong></div>
          </div>
          <div className="visual-tool"><span className="visual-tool-icon"><svg><use href="#i-pen"/></svg></span><span><b>Tanda tangan</b><small>Tambahkan di mana saja</small></span><span className="tool-check"><svg><use href="#i-check"/></svg></span></div>
          <div className="visual-note note-bottom"><svg><use href="#i-shield"/></svg> Aman diproses di browser</div>
        </div>
      </section>

      <section className="upload-section" id="upload">
        <div className="section-heading"><div className="section-kicker">MULAI DARI SINI</div><h2>Dokumen Anda, siap dalam hitungan menit.</h2><p>Pilih satu file PDF untuk membuka ruang kerja Rachita Sign.</p></div>
        <div className="upload-card" id="drop-zone" tabIndex="0" role="button" aria-label="Pilih atau letakkan file PDF di sini">
          <div className="upload-icon"><svg><use href="#i-upload"/></svg></div>
          <h3>Letakkan file PDF di sini</h3>
          <p>atau pilih file dari perangkat Anda</p>
          <button className="button button-primary upload-button" id="select-file">Pilih file PDF <svg><use href="#i-arrow"/></svg></button>
          <small>Format PDF • Maksimal 20 MB</small>
        </div>
        <div className="upload-assurance"><span><svg><use href="#i-shield"/></svg> Tanpa akun</span><span><svg><use href="#i-file"/></svg> Satu dokumen per sesi</span><span><svg><use href="#i-check"/></svg> Diproses lokal di browser*</span></div>
      </section>

      <section className="steps-section" id="cara-kerja">
        <div className="section-heading"><div className="section-kicker">SIMPLE BY DESIGN</div><h2>Tiga langkah, selesai.</h2></div>
        <div className="steps-grid"><article className="step-card"><span className="step-number">01</span><span className="step-icon"><svg><use href="#i-upload"/></svg></span><h3>Unggah dokumen</h3><p>Pilih PDF yang ingin ditandatangani langsung dari perangkat Anda.</p></article><article className="step-card"><span className="step-number">02</span><span className="step-icon"><svg><use href="#i-pen"/></svg></span><h3>Tambahkan tanda tangan</h3><p>Gambar tanda tangan, unggah gambar, atau siapkan tanda tangan lewat HP.</p></article><article className="step-card"><span className="step-number">03</span><span className="step-icon"><svg><use href="#i-download"/></svg></span><h3>Unduh hasilnya</h3><p>Tinjau hasil akhir, lalu unduh atau cetak dokumen PDF.</p></article></div>
      </section>

      <section className="features-section" id="fitur"><div><div className="section-kicker">SEMUA YANG ANDA BUTUHKAN</div><h2>Lebih dari sekadar tanda tangan.</h2><p>Ruang kerja yang dirancang untuk menyelesaikan kebutuhan dokumen sehari-hari.</p></div><div className="feature-list"><span><svg><use href="#i-pen"/></svg> Gambar tanda tangan</span><span><svg><use href="#i-shape"/></svg> Bentuk & coretan</span><span><svg><use href="#i-stamp"/></svg> Stempel</span><span><svg><use href="#i-text"/></svg> Teks & anotasi</span></div></section>
      <section className="privacy-section" id="privasi"><span className="privacy-icon"><svg><use href="#i-shield"/></svg></span><div><div className="section-kicker">PRIVASI ITU PENTING</div><h2>Dokumen Anda tetap milik Anda.</h2><p>PDF diproses di browser Anda dan tidak disimpan oleh aplikasi. Hanya gambar tanda tangan via HP yang melewati relay sementara selama sesi QR aktif. Tanda tangan berupa gambar adalah tanda tangan visual, bukan tanda tangan digital tersertifikasi.</p></div></section>
    </main>


    <section className="editor-view" id="editor-view" hidden aria-label="Editor PDF">
      <div className="editor-topbar">
        <div className="editor-identity"><button className="icon-button back-button" id="back-home" aria-label="Kembali ke beranda"><svg><use href="#i-back"/></svg></button><img className="editor-brand-logo" src="/rachita-logo.png" alt="Rachita Sign" /><span className="editor-divider"></span><span className="editor-file-icon"><svg><use href="#i-file"/></svg></span><div><strong id="editor-filename">dokumen.pdf</strong><small><span className="status-dot"></span><span id="editor-file-status">Siap diedit</span></small></div></div>
        <div className="editor-top-actions"><button className="icon-button" id="undo-btn" aria-label="Batalkan" title="Batalkan"><svg><use href="#i-undo"/></svg></button><button className="icon-button" id="redo-btn" aria-label="Ulangi" title="Ulangi"><svg><use href="#i-redo"/></svg></button><span className="editor-divider"></span><button className="editor-new" id="new-document">Dokumen baru</button><button className="button button-primary editor-download" id="editor-download">Unduh PDF <svg><use href="#i-download"/></svg></button></div>
      </div>
      <div className="editor-toolbar" role="toolbar" aria-label="Alat editor"><div className="tool-group"><button className="tool-button active" data-tool="pilih"><svg><use href="#i-cursor"/></svg><span>Pilih</span></button><button className="tool-button" data-tool="tanda-tangan"><svg><use href="#i-pen"/></svg><span>Tanda tangan</span></button><button className="tool-button" data-tool="teks"><svg><use href="#i-text"/></svg><span>Teks</span></button><button className="tool-button" data-tool="stempel"><svg><use href="#i-stamp"/></svg><span>Stempel</span></button><button className="tool-button" data-tool="bentuk"><svg><use href="#i-shape"/></svg><span>Bentuk</span></button><button className="tool-button" data-tool="hp"><svg><use href="#i-phone"/></svg><span>Lewat HP</span></button></div><div className="toolbar-tip"><svg><use href="#i-shield"/></svg> PDF tetap di browser</div></div>
      <div className="editor-layout">
        <aside className="pages-sidebar"><div className="sidebar-title">HALAMAN <span id="page-count">0</span></div><div id="thumbnail-list" className="thumbnail-list"></div><div className="sidebar-help">Pilih halaman untuk menempatkan elemen.</div></aside>
        <div className="workspace"><div className="workspace-controls"><div className="page-navigation"><button id="prev-page" className="icon-button" aria-label="Halaman sebelumnya"><svg><use href="#i-back"/></svg></button><span>Halaman <strong id="current-page">1</strong> dari <span id="total-pages">1</span></span><button id="next-page" className="icon-button next-page-button" aria-label="Halaman berikutnya"><svg><use href="#i-arrow"/></svg></button></div><div className="zoom-controls"><button className="icon-button" id="zoom-out" aria-label="Perkecil"><svg><use href="#i-minus"/></svg></button><span id="zoom-label">100%</span><button className="icon-button" id="zoom-in" aria-label="Perbesar"><svg><use href="#i-plus"/></svg></button><button className="fit-page" id="fit-page">Pas halaman</button></div></div><div className="page-stage"><div className="page-shell" id="page-shell"><div className="editor-page" id="editor-page"><canvas id="pdf-canvas" aria-label="Halaman PDF"></canvas><div className="annotations" id="annotations" aria-label="Elemen pada halaman PDF"></div></div></div></div></div>
        <aside className="properties-sidebar"><div className="properties-title">PROPERTI <svg><use href="#i-shape"/></svg></div><div className="empty-properties" id="empty-properties"><span><svg><use href="#i-cursor"/></svg></span><strong>Pilih elemen</strong><p>Ketuk elemen pada halaman untuk mengubah posisi, ukuran, dan tampilannya.</p></div><div className="selected-properties" id="selected-properties" hidden><div className="property-group" id="text-property"><label htmlFor="element-text">Isi teks</label><textarea id="element-text" rows="3"></textarea></div><div className="property-grid"><label>X <input id="element-x" type="number" min="0" step="1" /></label><label>Y <input id="element-y" type="number" min="0" step="1" /></label><label>Lebar <input id="element-width" type="number" min="10" step="1" /></label><label>Tinggi <input id="element-height" type="number" min="10" step="1" /></label></div><label htmlFor="element-rotation">Rotasi (derajat)</label><input id="element-rotation" type="number" min="-180" max="180" step="1" /><label htmlFor="element-opacity">Opasitas</label><input id="element-opacity" type="range" min="10" max="100" defaultValue="100" /><div className="property-grid"><label>Warna <input id="element-color" type="color" defaultValue="#275b45" /></label><label>Ukuran teks <input id="element-font-size" type="number" min="8" max="96" /></label></div><div className="property-grid"><label>Garis <input id="element-stroke" type="number" min="1" max="20" /></label></div><div className="property-actions"><button id="duplicate-element">Duplikasi</button><button id="delete-element" className="delete-element">Hapus</button></div></div><div className="properties-note"><svg><use href="#i-shield"/></svg><span>Periksa pratinjau sebelum mengunduh atau mencetak PDF.</span></div></aside>
      </div>
      <div className="editor-footer"><div className="footer-hint"><span className="footer-hint-dot"></span><span id="editor-status">Siap mengedit</span></div><div className="footer-buttons"><button className="button button-outline" id="preview-btn"><svg><use href="#i-eye"/></svg> Pratinjau</button><button className="button button-outline" id="print-btn"><svg><use href="#i-print"/></svg> Cetak</button><button className="button button-primary" id="footer-download"><svg><use href="#i-download"/></svg> Unduh PDF</button></div></div>
    </section>

    <footer className="site-footer"><div className="footer-brand"><img className="footer-logo" src="/rachita-logo.png" alt="" /><strong>Rachita<span>.</span> Sign</strong></div><p>PDF diproses di browser; sesi QR hanya membawa gambar tanda tangan sementara.</p><span>Copyright 2026 Rachita Sign</span></footer>

    <input id="pdf-input" type="file" accept="application/pdf,.pdf" hidden />
    <dialog className="app-dialog" id="signature-dialog"><div className="dialog-head"><div><span className="section-kicker">TANDA TANGAN</span><h2>Buat tanda tangan Anda</h2></div><button className="icon-button dialog-close" data-close="signature-dialog" aria-label="Tutup"><svg><use href="#i-close"/></svg></button></div><p>Gambar dengan mouse, stylus, atau jari. Area tanda tangan transparan.</p><div className="signature-canvas-wrap"><canvas id="signature-canvas" width="900" height="330" aria-label="Area menggambar tanda tangan"></canvas><span>Tanda tangan di sini</span></div><div className="signature-settings"><label>Warna <input type="color" id="pen-color" defaultValue="#000000" /></label><label>Ketebalan <input type="range" id="pen-width" min="2" max="8" defaultValue="3" /></label></div><div className="dialog-actions"><button className="button button-outline" id="signature-undo">Ulangi</button><button className="button button-outline" id="clear-signature">Hapus</button><button className="button button-primary" id="add-signature">Tambahkan <svg><use href="#i-arrow"/></svg></button></div></dialog>
    <dialog className="app-dialog small-dialog" id="shape-dialog"><div className="dialog-head"><div><span className="section-kicker">ANOTASI</span><h2>Pilih bentuk</h2></div><button className="icon-button dialog-close" data-close="shape-dialog" aria-label="Tutup"><svg><use href="#i-close"/></svg></button></div><div className="shape-options"><button data-shape="rectangle"><span>Kotak</span></button><button data-shape="ellipse"><span>Lingkaran</span></button><button data-shape="line"><span>Garis</span></button><button data-shape="arrow"><span>Panah</span></button><button data-shape="freehand"><span>Coretan bebas</span></button></div></dialog>
    <dialog className="app-dialog" id="freehand-dialog"><div className="dialog-head"><div><span className="section-kicker">CORETAN BEBAS</span><h2>Gambar coretan</h2></div><button className="icon-button dialog-close" data-close="freehand-dialog" aria-label="Tutup"><svg><use href="#i-close"/></svg></button></div><div className="signature-canvas-wrap"><canvas id="freehand-canvas" width="700" height="260" aria-label="Area menggambar coretan"></canvas></div><div className="dialog-actions"><button className="button button-outline" id="clear-freehand">Hapus</button><button className="button button-primary" id="add-freehand">Tambahkan</button></div></dialog>
    <dialog className="app-dialog qr-dialog" id="qr-dialog"><div className="dialog-head"><div><span className="section-kicker">TANDA TANGAN VIA HP</span><h2>Pindai dengan ponsel</h2></div><button className="icon-button dialog-close" data-close="qr-dialog" aria-label="Tutup"><svg><use href="#i-close"/></svg></button></div><p>Gambar tanda tangan di HP. PDF tetap berada di browser komputer.</p><div className="qr-content"><img id="qr-image" alt="QR Code menuju halaman tanda tangan HP" /><div><strong id="qr-status">Menyiapkan sesi...</strong><p>Sesi berlaku <span id="qr-time">05:00</span> lagi.</p><a id="qr-link" target="_blank" rel="noopener noreferrer">Buka tautan tanda tangan</a><small>Jika situs dibuka melalui localhost, buka aplikasi memakai alamat jaringan yang bisa diakses HP.</small></div></div><div className="dialog-actions"><button className="button button-outline" id="cancel-qr">Batalkan sesi</button><button className="button button-primary" id="renew-qr">Buat QR baru</button></div></dialog>
    <dialog className="app-dialog preview-dialog" id="preview-dialog"><div className="dialog-head"><div><span className="section-kicker">HASIL AKHIR</span><h2>Pratinjau PDF</h2></div><button className="icon-button dialog-close" data-close="preview-dialog" aria-label="Tutup"><svg><use href="#i-close"/></svg></button></div><p>Periksa seluruh halaman dan posisi elemen sebelum menyimpan.</p><iframe id="preview-frame" title="Pratinjau PDF final"></iframe><div className="dialog-actions"><button className="button button-outline" id="preview-print">Cetak PDF</button><button className="button button-primary" id="preview-download">Unduh PDF</button></div></dialog>
    <dialog className="app-dialog small-dialog" id="info-dialog"><div className="dialog-head"><div><span className="section-kicker">INFORMASI</span><h2 id="info-title">Informasi</h2></div><button className="icon-button dialog-close" data-close="info-dialog" aria-label="Tutup"><svg><use href="#i-close"/></svg></button></div><p id="info-message"></p><div className="dialog-actions"><button className="button button-primary" data-close="info-dialog">Mengerti</button></div></dialog>
    <iframe id="print-frame" title="Dokumen siap cetak" hidden></iframe>
    <div id="toast" className="toast" role="status" aria-live="polite"></div>
    </>
  );
}
