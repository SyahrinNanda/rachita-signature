import 'server-only';
import { randomBytes, timingSafeEqual } from 'node:crypto';

const TTL_MS = 5 * 60 * 1000;
const MAX_SESSIONS = 1000;
const MAX_SIGNATURE_BYTES = 300 * 1024;
const store = globalThis.__rachitaQrStore ?? new Map();
globalThis.__rachitaQrStore = store;

function sweep() {
  const now = Date.now();
  for (const [token, session] of store) {
    if (session.expiresAt <= now) store.delete(token);
  }
}

if (!globalThis.__rachitaQrSweeper) {
  const timer = setInterval(sweep, 30_000);
  timer.unref?.();
  globalThis.__rachitaQrSweeper = timer;
}

function validToken(token) {
  return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
}

function ownerMatches(session, owner) {
  if (typeof owner !== 'string' || !/^[a-f0-9]{64}$/.test(owner)) return false;
  return timingSafeEqual(Buffer.from(session.owner, 'hex'), Buffer.from(owner, 'hex'));
}

function find(token) {
  if (!validToken(token)) return null;
  const session = store.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    store.delete(token);
    return null;
  }
  return session;
}

export function createSession() {
  sweep();
  if (store.size >= MAX_SESSIONS) return null;
  const token = randomBytes(32).toString('hex');
  const owner = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + TTL_MS;
  store.set(token, { owner, expiresAt, image: null });
  return { token, owner, expiresAt };
}

export function sessionStatus(token) {
  const session = find(token);
  return session ? { status: session.image ? 'ready' : 'waiting', expiresAt: session.expiresAt } : null;
}

export function submitSignature(token, image) {
  const session = find(token);
  if (!session) return { error: 'Sesi tidak ditemukan atau sudah kedaluwarsa.', status: 404 };
  if (session.image) return { error: 'Sesi sudah menerima tanda tangan.', status: 409 };
  if (typeof image !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(image)) {
    return { error: 'Kirim gambar tanda tangan dalam format PNG.', status: 400 };
  }
  const bytes = Buffer.from(image.slice('data:image/png;base64,'.length), 'base64');
  const validHeader = bytes.length >= 33 && bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' && bytes.readUInt32BE(8) === 13 && bytes.subarray(12, 16).toString() === 'IHDR';
  const width = validHeader ? bytes.readUInt32BE(16) : 0;
  const height = validHeader ? bytes.readUInt32BE(20) : 0;
  if (bytes.length > MAX_SIGNATURE_BYTES || !validHeader || width < 1 || height < 1 || width > 2048 || height > 2048 || width * height > 4_000_000) {
    return { error: 'Gambar PNG tidak valid atau lebih dari 300 KB.', status: 400 };
  }
  session.image = image;
  return { status: 'ready' };
}

export function consumeSignature(token, owner) {
  const session = find(token);
  if (!session) return { error: 'Sesi tidak ditemukan atau sudah kedaluwarsa.', status: 404 };
  if (!ownerMatches(session, owner)) return { error: 'Akses sesi ditolak.', status: 403 };
  if (!session.image) return { error: 'Tanda tangan belum diterima.', status: 409 };
  const image = session.image;
  store.delete(token);
  return { status: 'received', image };
}

export function cancelSession(token, owner) {
  const session = find(token);
  if (!session) return { error: 'Sesi tidak ditemukan atau sudah kedaluwarsa.', status: 404 };
  if (!ownerMatches(session, owner)) return { error: 'Akses sesi ditolak.', status: 403 };
  store.delete(token);
  return { status: 'cancelled' };
}
