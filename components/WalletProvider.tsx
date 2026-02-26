import React, { FC, ReactNode } from 'react';
import { ConnectionProvider } from '@solana/wallet-adapter-react';

interface Props {
  children: ReactNode;
}

export const SolanaWalletProvider: FC<Props> = ({ children }) => {
  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      {children}
    </ConnectionProvider>
  );
};