export function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  if (origin === new URL(request.url).origin) return true;

  const host = request.headers.get('host');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (!host || forwardedHost !== host || !['http', 'https'].includes(forwardedProto)) return false;

  return origin === `${forwardedProto}://${host}`;
}
