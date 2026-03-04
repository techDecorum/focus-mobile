import { Program, AnchorProvider, BN, web3 } from '@coral-xyz/anchor';
import {
  Connection, PublicKey, LAMPORTS_PER_SOL, Transaction,
} from '@solana/web3.js';
import { Buffer } from '@craftzdog/react-native-buffer';
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import idl from './idl.json';

const PROGRAM_ID = new PublicKey('2bsjJXARsoLH49Svs1pRw98rr1dctYHJHov43dLvqUjg');
const DEVNET = new Connection('https://api.devnet.solana.com', 'confirmed');

export const getPoolPDA = (): PublicKey => {
  const [poolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('global_pool')], PROGRAM_ID
  );
  return poolPDA;
};

export const getVaultPDA = (userPublicKey: PublicKey): PublicKey => {
  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), userPublicKey.toBytes()], PROGRAM_ID
  );
  return vaultPDA;
};

const getReadonlyProgram = (publicKey: PublicKey) => {
  const dummyWallet = {
    publicKey,
    signTransaction: async (tx: Transaction) => tx,
    signAllTransactions: async (txs: Transaction[]) => txs,
  };
  const provider = new AnchorProvider(DEVNET, dummyWallet as any, { commitment: 'confirmed' });
  return new Program(idl as any, PROGRAM_ID, provider);
};

const signAndSendTransaction = async (
  publicKey: PublicKey,
  transaction: Transaction
): Promise<string> => {
  const { blockhash, lastValidBlockHeight } = await DEVNET.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = publicKey;

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

  const signature = await DEVNET.sendRawTransaction(signedTxs[0].serialize());
  await DEVNET.confirmTransaction({ signature, blockhash, lastValidBlockHeight });
  return signature;
};

export const initializeVault = async (
  connection: Connection,
  publicKey: PublicKey
): Promise<string> => {
  const program = getReadonlyProgram(publicKey);
  const vaultPDA = getVaultPDA(publicKey);
  const poolPDA = getPoolPDA();
  const ix = await program.methods
    .initializeVault()
    .accounts({
      vault: vaultPDA, pool: poolPDA,
      user: publicKey, systemProgram: web3.SystemProgram.programId,
    })
    .instruction();
  return signAndSendTransaction(publicKey, new Transaction().add(ix));
};

export const startSession = async (
  connection: Connection,
  publicKey: PublicKey,
  amountSOL: number,
  durationSeconds: number
): Promise<string> => {
  const program = getReadonlyProgram(publicKey);
  const vaultPDA = getVaultPDA(publicKey);
  const ix = await program.methods
    .startSession(new BN(Math.floor(amountSOL * LAMPORTS_PER_SOL)), new BN(durationSeconds))
    .accounts({
      vault: vaultPDA, user: publicKey,
      systemProgram: web3.SystemProgram.programId,
    })
    .instruction();
  return signAndSendTransaction(publicKey, new Transaction().add(ix));
};

export const completeSession = async (
  connection: Connection,
  publicKey: PublicKey
): Promise<string> => {
  const program = getReadonlyProgram(publicKey);
  const vaultPDA = getVaultPDA(publicKey);
  const poolPDA = getPoolPDA();
  const ix = await program.methods
    .completeSession()
    .accounts({ vault: vaultPDA, pool: poolPDA, user: publicKey })
    .instruction();
  return signAndSendTransaction(publicKey, new Transaction().add(ix));
};

export const abandonSession = async (
  connection: Connection,
  publicKey: PublicKey
): Promise<string> => {
  const program = getReadonlyProgram(publicKey);
  const vaultPDA = getVaultPDA(publicKey);
  const poolPDA = getPoolPDA();
  const ix = await program.methods
    .abandonSession()
    .accounts({ vault: vaultPDA, pool: poolPDA, user: publicKey })
    .instruction();
  return signAndSendTransaction(publicKey, new Transaction().add(ix));
};

// Raw deserialization - bypasses Anchor to avoid Buffer polyfill issues
export const fetchVaultState = async (
  connection: Connection,
  publicKey: PublicKey
) => {
  try {
    const vaultPDA = getVaultPDA(publicKey);
    const accountInfo = await DEVNET.getAccountInfo(vaultPDA);
    if (!accountInfo) return null;

    const data = accountInfo.data;
    // Layout: 8 discriminator | 32 owner | 1 isActive | 8 startTime
    //         8 durationSeconds | 8 stakedAmount | 8 totalSessions
    //         8 successfulSessions | 8 totalEarnedFromPool
    let offset = 8 + 32 + 1 + 8 + 8 + 8 + 8 + 8;
    const totalEarnedFromPool = data.readBigUInt64LE(offset);

    console.log('=== VAULT totalEarnedFromPool ===', Number(totalEarnedFromPool), 'lamports =', Number(totalEarnedFromPool) / 1e9, 'SOL');

    return {
      totalEarnedFromPool: { toNumber: () => Number(totalEarnedFromPool) },
    };
  } catch (err) {
    console.log('=== VAULT FETCH ERROR ===', err);
    return null;
  }
};

// Raw deserialization - bypasses Anchor to avoid Buffer polyfill issues
export const fetchPoolState = async (
  connection: Connection,
  publicKey: PublicKey
) => {
  try {
    const poolPDA = getPoolPDA();
    const accountInfo = await DEVNET.getAccountInfo(poolPDA);
    if (!accountInfo) return null;

    const data = accountInfo.data;
    // Layout: 8 discriminator | 8 totalBalance | 8 totalContributors | 1 bump
    const totalBalance = data.readBigUInt64LE(8);
    const totalContributors = data.readBigUInt64LE(16);

    console.log('=== POOL STATE ===', {
      totalBalanceSOL: Number(totalBalance) / 1e9,
      totalContributors: Number(totalContributors),
    });

    return {
      totalBalance: { toNumber: () => Number(totalBalance) },
      totalContributors: { toNumber: () => Number(totalContributors) },
    };
  } catch (err) {
    console.log('=== POOL FETCH ERROR ===', err);
    return null;
  }
};