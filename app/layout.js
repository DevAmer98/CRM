import { Inter } from 'next/font/google'
import './ui/globals.css'
import { Toaster } from 'react-hot-toast';


const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Smart Vision',
  description: 'For Smart Solutions',
}

export default function RootLayout({ children }) {
  return (
      <html lang="en">
        <body suppressHydrationWarning={true} className={inter.className}>
          {children}
          <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              style: {
                background: 'green',
              },
            },
            error: {
              style: {
                background: 'red',
              },
            },
          }}
        />
        </body>
      </html>
  );
}

