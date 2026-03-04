const { Connection, PublicKey } = require('@solana/web3.js');
const { Buffer } = require('buffer');

const PROGRAM_ID = new PublicKey('2bsjJXARsoLH49Svs1pRw98rr1dctYHJHov43dLvqUjg');
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

const [poolPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from('global_pool')],
  PROGRAM_ID
);

console.log('Pool PDA:', poolPDA.toString());

connection.getAccountInfo(poolPDA).then(info => {
  console.log('Pool account exists:', !!info);
  console.log('Pool account data length:', info?.data?.length ?? 'N/A');
}).catch(err => console.log('Error:', err.message));