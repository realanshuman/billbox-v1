import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'BillBox — Invoice faster. Get paid sooner.',
  description: 'The fastest invoicing tool for digital sellers. Create, send, and track invoices in seconds.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full bg-white text-gray-900 antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { fontSize: '13px', fontFamily: 'inherit' },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
