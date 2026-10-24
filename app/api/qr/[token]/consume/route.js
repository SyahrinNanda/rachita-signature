import { consumeSignature } from '../../../../../lib/qr-store';
import { isSameOrigin } from '../../../../../lib/request-origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  if (!isSameOrigin(request)) return Response.json({ error: 'Asal permintaan tidak diizinkan.' }, { status: 403 });
  const { token } = await params;
  const result = consumeSignature(token, request.headers.get('x-session-owner'));
  return Response.json(result, { status: result.error ? result.status : 200, headers: { 'Cache-Control': 'no-store' } });
}
