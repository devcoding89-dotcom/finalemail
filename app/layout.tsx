import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { PageTransition } from '@/components/page-transition'
import { MobileInstallBanner } from '@/components/mobile-install-banner'
import { PwaProvider } from '@/components/pwa-provider'
import { FeatureAnnouncementModal } from '@/components/feature-announcement-modal'
import { FeatureTicker } from '@/components/feature-ticker'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'EmailSend — Scale Your Email Outreach',
  description:
    'Upload contacts, personalize with AI, and send bulk emails at scale.',
  manifest: '/manifest.json',
  themeColor: '#020617',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EmailSend',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaProvider>
          <FeatureTicker />
          <PageTransition />
          {children}
          <Toaster position="top-center" richColors />
          <MobileInstallBanner />
          <FeatureAnnouncementModal />
        </PwaProvider>
      </body>
    </html>
  )
}
