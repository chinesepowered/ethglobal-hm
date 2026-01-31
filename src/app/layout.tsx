import type { Metadata } from 'next'
import './globals.css'
import { Web3Provider } from '@/providers/Web3Provider'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'ENS PayLinks - Pay anyone with their ENS name',
  description:
    'Cross-chain payments to any ENS name. Send from any token on any chain, they receive USDC. Powered by ENS, LI.FI, and Circle.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-[#0B0B0F] text-white min-h-screen flex flex-col antialiased">
        <Web3Provider>
          <Header />
          <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">{children}</main>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  )
}
