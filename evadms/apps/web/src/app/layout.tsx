import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EVAGas | LPG Gas Supplier Gauteng, Hartbeespoort, Rustenburg & Brits | Authorised Oryx Dealer',
  description: 'EVAGas - Authorised Oryx LPG supplier serving Gauteng, Hartbeespoort, Rustenburg & Brits. Bulk gas delivery, cylinder refills & wholesale LPG for homes and businesses. Call 010 599 2498.',
  keywords: 'LPG gas supplier Gauteng, gas delivery Hartbeespoort, bulk gas Rustenburg, gas refill Brits, Oryx gas dealer',
  openGraph: {
    type: 'website',
    url: 'https://evagas.co.za/',
    title: 'EVAGas | LPG Gas Supplier Gauteng, Hartbeespoort, Rustenburg & Brits',
    description: 'Authorised Oryx LPG supplier serving Gauteng, Hartbeespoort, Rustenburg & Brits. Bulk gas delivery, cylinder refills & wholesale LPG.',
    locale: 'en_ZA',
    siteName: 'EVAGas',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
