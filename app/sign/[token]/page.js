import MobileSigner from './MobileSigner';

export const metadata = { title: 'Tanda Tangan via HP — Rachita Sign' };

export default async function SignPage({ params }) {
  const { token } = await params;
  return <MobileSigner token={token} />;
}
