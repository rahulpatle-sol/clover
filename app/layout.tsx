import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Clover — Smart Job Application Tracker',
  description: 'Upload your resume, get skill-matched job recommendations, and apply in one click. The smartest way to track your job search.',
  keywords: 'job tracker, job application, resume parser, remote jobs, web3 jobs, job automation',
  authors: [{ name: 'Clover' }],
  openGraph: {
    title: 'Clover — Smart Job Application Tracker',
    description: 'Upload your resume, get skill-matched job recommendations, and apply in one click.',
    url: 'https://clover.rahulpatle.xyz',
    siteName: 'Clover',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clover — Smart Job Application Tracker',
    description: 'Upload your resume, get skill-matched job recommendations, and apply in one click.',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
    other: [
      { rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' },
      { rel: 'manifest', url: '/manifest.json' },
    ],
  },
  manifest: '/manifest.json',
  themeColor: '#1a7a4a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
