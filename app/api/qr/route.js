import { createSession } from '../../../lib/qr-store';
import { isSameOrigin } from '../../../lib/request-origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: 'Asal permintaan tidak diizinkan.' }, { status: 403 });
  }
  const session = createSession();
  if (!session) return Response.json({ error: 'Terlalu banyak sesi aktif. Coba lagi nanti.' }, { status: 429 });
  return Response.json(session, { headers: { 'Cache-Control': 'no-store' } });
}
