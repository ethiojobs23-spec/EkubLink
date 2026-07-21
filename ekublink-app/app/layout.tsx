import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'EkubLink — Digital Ethiopian Equb',
  description: 'Digitize your traditional Ethiopian Equb savings group. Manage contributions, verify CBE receipts, and run transparent lottery draws.',
  keywords: ['Ekub', 'Equb', 'Ethiopian savings', 'ROSCA', 'CBE', 'digital equb'],
  authors: [{ name: 'EkubLink' }],
  openGraph: {
    title: 'EkubLink — Digital Ethiopian Equb',
    description: 'The modern way to run your Ethiopian Equb savings group',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  )
}
