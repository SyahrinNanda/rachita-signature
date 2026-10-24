import { cancelSession, sessionStatus, submitSignature } from '../../../../lib/qr-store';
import { isSameOrigin } from '../../../../lib/request-origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { token } = await params;
  const status = sessionStatus(token);
  return Response.json(status ?? { error: 'Sesi tidak ditemukan atau sudah kedaluwarsa.' }, {
    status: status ? 200 : 404,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request, { params }) {
  if (!isSameOrigin(request)) return Response.json({ error: 'Asal permintaan tidak diizinkan.' }, { status: 403 });
  if (Number(request.headers.get('content-length') || 0) > 500_000) return Response.json({ error: 'Gambar terlalu besar.' }, { status: 413 });
  let body;
  try {
    if (!request.body) throw new Error('empty');
    const reader = request.body.getReader();
    const chunks = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 500_000) { await reader.cancel(); return Response.json({ error: 'Gambar terlalu besar.' }, { status: 413 }); }
      chunks.push(Buffer.from(value));
    }
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return Response.json({ error: 'Data tidak valid.' }, { status: 400 }); }
  const { token } = await params;
  const result = submitSignature(token, body?.image);
  return Response.json(result, { status: result.error ? result.status : 200, headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(request, { params }) {
  if (!isSameOrigin(request)) return Response.json({ error: 'Asal permintaan tidak diizinkan.' }, { status: 403 });
  const { token } = await params;
  const result = cancelSession(token, request.headers.get('x-session-owner'));
  return Response.json(result, { status: result.error ? result.status : 200, headers: { 'Cache-Control': 'no-store' } });
}
