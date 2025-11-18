import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from 'next/font/google'
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GitHub Guardian - CI/CD Security Monitoring",
  description: "Enterprise-grade security monitoring for your GitHub CI/CD workflows",
  openGraph: {
    title: "GitHub Guardian Portal",
    description: "Track and manage security incidents in your CI/CD pipelines",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#0d1117",
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} ${geistMono.className}`}>
        {children}
      </body>
    </html>
  )
}
