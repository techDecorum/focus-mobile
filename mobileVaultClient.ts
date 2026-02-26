import { Program, AnchorProvider, BN, web3 } from '@coral-xyz/anchor';
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import idl from './idl.json';

const PROGRAM_ID = new PublicKey('2bsjJXARsoLH49Svs1pRw98rr1dctYHJHov43dLvqUjg');

export const getPoolPDA = (): PublicKey => {
  const [poolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('global_pool')],
    PROGRAM_ID
  );
  return poolPDA;
};

export const getVaultPDA = (userPublicKey: PublicKey): PublicKey => {
  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), userPublicKey.toBytes()],
    PROGRAM_ID
  );
  return vaultPDA;
};

// Helper: sign and send a transaction using Mobile Wallet Adapter
const signAndSendTransaction = async (
  connection: Connection,
  publicKey: PublicKey,
  transaction: Transaction
): Promise<string> => {
  // Get latest blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = publicKey;

  // Sign with Mobile Wallet Adapter
  const signedTxs = await transact(async (wallet: Web3MobileWallet) => {
    await wallet.authorize({
      cluster: 'devnet',
      identity: {
        name: 'Focus',
        uri: 'https://focus-app-orpin.vercel.app',
        icon: '/favicon.ico',
      },
    });
    return await wallet.signTransactions({ transactions: [transaction] });
  });

  // Send signed transaction
  const signature = await connection.sendRawTransaction(
    signedTxs[0].serialize()
  );
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });
  return signature;
};

// Helper: get a read-only program for fetching accounts
const getReadonlyProgram = (connection: Connection, publicKey: PublicKey) => {
  const dummyWallet = {
    publicKey,
    signTransaction: async (tx: Transaction) => tx,
    signAllTransactions: async (txs: Transaction[]) => txs,
  };
  const provider = new AnchorProvider(connection, dummyWallet as any, {
    commitment: 'confirmed',
  });
  return new Program(idl as any, PROGRAM_ID, provider);
};

export const initializeVault = async (
  connection: Connection,
  publicKey: PublicKey
): Promise<string> => {
  const program = getReadonlyProgram(connection, publicKey);
  const vaultPDA = getVaultPDA(publicKey);
  const poolPDA = getPoolPDA();

  const ix = await program.methods
    .initializeVault()
    .accounts({
      vault: vaultPDA,
      pool: poolPDA,
      user: publicKey,
      systemProgram: web3.SystemProgram.programId,
    })
    .instruction();

  const tx = new Transaction().add(ix);
  return signAndSendTransaction(connection, publicKey, tx);
};

export const startSession = async (
  connection: Connection,
  publicKey: PublicKey,
  amountSOL: number,
  durationSeconds: number
): Promise<string> => {
  const program = getReadonlyProgram(connection, publicKey);
  const vaultPDA = getVaultPDA(publicKey);
  const amountLamports = new BN(Math.floor(amountSOL * LAMPORTS_PER_SOL));
  const duration = new BN(durationSeconds);

  const ix = await program.methods
    .startSession(amountLamports, duration)
    .accounts({
      vault: vaultPDA,
      user: publicKey,
      systemProgram: web3.SystemProgram.programId,
    })
    .instruction();

  const tx = new Transaction().add(ix);
  return signAndSendTransaction(connection, publicKey, tx);
};

export const completeSession = async (
  connection: Connection,
  publicKey: PublicKey
): Promise<string> => {
  const program = getReadonlyProgram(connection, publicKey);
  const vaultPDA = getVaultPDA(publicKey);
  const poolPDA = getPoolPDA();

  const ix = await program.methods
    .completeSession()
    .accounts({
      vault: vaultPDA,
      pool: poolPDA,
      user: publicKey,
    })
    .instruction();

  const tx = new Transaction().add(ix);
  return signAndSendTransaction(connection, publicKey, tx);
};

export const abandonSession = async (
  connection: Connection,
  publicKey: PublicKey
): Promise<string> => {
  const program = getReadonlyProgram(connection, publicKey);
  const vaultPDA = getVaultPDA(publicKey);
  const poolPDA = getPoolPDA();

  const ix = await program.methods
    .abandonSession()
    .accounts({
      vault: vaultPDA,
      pool: poolPDA,
      user: publicKey,
    })
    .instruction();

  const tx = new Transaction().add(ix);
  return signAndSendTransaction(connection, publicKey, tx);
};

export const fetchVaultState = async (
  connection: Connection,
  publicKey: PublicKey
) => {
  try {
    const program = getReadonlyProgram(connection, publicKey);
    const vaultPDA = getVaultPDA(publicKey);
    return await program.account.vaultAccount.fetch(vaultPDA);
  } catch {
    return null;
  }
};

export const fetchPoolState = async (
  connection: Connection,
  publicKey: PublicKey
) => {
  try {
    const program = getReadonlyProgram(connection, publicKey);
    const poolPDA = getPoolPDA();
    return await program.account.poolAccount.fetch(poolPDA);
  } catch {
    return null;
  }
};
