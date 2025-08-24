import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'
import { FeedbackButton } from '@/components/feedback/feedback-button'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nexus - AI Tools & Resource Management',
  description: 'Organize, categorize, and search AI tools, resources, and client management assets in one comprehensive platform.',
  keywords: 'AI tools, resource management, project management, automation, client onboarding',
  authors: [{ name: 'Nexus Team' }],
  creator: 'Nexus',
  publisher: 'Nexus',
  robots: 'index, follow',
  openGraph: {
    title: 'Nexus - AI Tools & Resource Management',
    description: 'Organize, categorize, and search AI tools, resources, and client management assets in one comprehensive platform.',
    url: 'https://nexus-app.com',
    siteName: 'Nexus',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Nexus - AI Tools & Resource Management',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexus - AI Tools & Resource Management',
    description: 'Organize, categorize, and search AI tools, resources, and client management assets in one comprehensive platform.',
    images: ['/og-image.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0ea5e9' },
    { media: '(prefers-color-scheme: dark)', color: '#0369a1' },
  ],
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <FeedbackButton variant="floating" />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
