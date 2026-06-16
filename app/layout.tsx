import type { Metadata } from 'next'
import { EB_Garamond, Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'

const garamond = EB_Garamond({ subsets: ['latin'], variable: '--font-garamond', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' })

export const metadata: Metadata = {
  title: 'The Deep Satirist',
  description: 'Wit without mercy. Satire without apology.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${garamond.variable} ${playfair.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
