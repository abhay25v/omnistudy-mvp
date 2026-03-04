import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OmniStudy - AI-Powered Learning',
  description: 'Simplify complex concepts with AI - Upload image, audio, or text to get simplified explanations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
