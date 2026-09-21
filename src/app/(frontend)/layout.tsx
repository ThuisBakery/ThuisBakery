import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './styles.css'

export const metadata: Metadata = {
  title: 'ThuisBakery',
  description: "Jana's home bakery in Uithoorn.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
