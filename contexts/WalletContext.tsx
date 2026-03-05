import React, { createContext, useContext, useState, useCallback } from 'react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { useConnection } from '@solana/wallet-adapter-react';

interface WalletContextType {
  walletAddress: string | null;
  solBalance: number | null;
  publicKey: PublicKey | null;
  connect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  walletAddress: null,
  solBalance: null,
  publicKey: null,
  connect: async () => {},
  refreshBalance: async () => {},
});

export const useWallet = () => useContext(WalletContext);

export function WalletStateProvider({ children }: { children: React.ReactNode }) {
  const { connection } = useConnection();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);

  const fetchBalance = useCallback(async (address: string) => {
    try {
      let pubkey: PublicKey;
      try { pubkey = new PublicKey(Buffer.from(address, 'base64')); }
      catch { pubkey = new PublicKey(address); }
      const balance = await connection.getBalance(pubkey);
      setSolBalance(balance / LAMPORTS_PER_SOL);
      setPublicKey(pubkey);
    } catch {}
  }, [connection]);

  const connect = useCallback(async () => {
    try {
      const authResult = await transact(async (wallet: Web3MobileWallet) => {
        return await wallet.authorize({
          cluster: 'devnet',
          identity: {
            name: 'Focus',
            uri: 'https://focus-app-orpin.vercel.app',
            icon: '/favicon.ico',
          },
        });
      });
      const address = authResult.accounts[0].address;
      setWalletAddress(address);
      await fetchBalance(address);
    } catch (err: any) {
      console.log('=== WALLET ERROR ===', err.message, err.code);
      alert(`Wallet error: ${err.message}`);
    }
  }, [fetchBalance]);

  const refreshBalance = useCallback(async () => {
    if (walletAddress) await fetchBalance(walletAddress);
  }, [walletAddress, fetchBalance]);

  return (
    <WalletContext.Provider value={{
      walletAddress, solBalance, publicKey, connect, refreshBalance,
    }}>
      {children}
    </WalletContext.Provider>
  );
}