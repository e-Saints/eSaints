'use client';

import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';

import { ReactNode } from 'react';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

const config = getDefaultConfig({
  appName: 'eSaints Mint',
  projectId: '179177d0615982a0fba3500a3f6e2bcc', // ← tvoj stvarni ID
  chains: [polygon],
  ssr: true,
});

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              {children}
              <Toaster />
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}

