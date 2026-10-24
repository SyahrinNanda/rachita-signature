import './globals.css';
import './editor.css';

export const metadata = {
  title: 'Rachita Sign — Tanda tangani PDF dengan mudah',
  description: 'Tampilan aplikasi untuk menandatangani dan memberi anotasi PDF dengan mudah.',
  icons: {
    icon: '/rachita-logo.png',
    apple: '/rachita-logo.png',
  },
};

export const viewport = {
  themeColor: '#275b45',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
