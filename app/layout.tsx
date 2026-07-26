import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Silsilah Keluarga',
  description: 'Aplikasi pohon silsilah keluarga interaktif — jelajahi hubungan antar generasi dengan mudah.',
  keywords: ['silsilah', 'pohon keluarga', 'family tree', 'genealogi', 'keturunan'],
  authors: [{ name: 'Family Tree App' }],
  openGraph: {
    title: 'Silsilah Keluarga',
    description: 'Jelajahi pohon silsilah keluarga secara interaktif.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#4CAF50',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
