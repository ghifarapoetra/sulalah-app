import './globals.css'

export const metadata = {
  title: 'Sulalah — Pohon Silsilah Keluarga',
  description: 'Pohon silsilah keluarga dengan deteksi mahram otomatis. Jaga nasab, jaga silaturahim.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
