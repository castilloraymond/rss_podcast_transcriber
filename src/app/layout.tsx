import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PodcastProvider } from '@/lib/contexts/PodcastContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RSS Podcast Reader',
  description: 'A simple RSS podcast reader',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-900 text-gray-100 min-h-screen`}>
        <PodcastProvider>
          {children}
        </PodcastProvider>
      </body>
    </html>
  )
}
