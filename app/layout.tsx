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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
