const { Connection, PublicKey } = require('@solana/web3.js');
const { Buffer } = require('buffer');

const PROGRAM_ID = new PublicKey('2bsjJXARsoLH49Svs1pRw98rr1dctYHJHov43dLvqUjg');
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

const [poolPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from('global_pool')],
  PROGRAM_ID
);

connection.getAccountInfo(poolPDA).then(info => {
  if (!info) return console.log('No account found');
  
  const data = info.data;
  console.log('Raw bytes:', data.toString('hex'));
  console.log('Data length:', data.length);
  
  // First 8 bytes are the Anchor discriminator, skip them
  // Remaining bytes are the account fields
  const payload = data.slice(8);
  console.log('Payload bytes:', payload.toString('hex'));
  console.log('Payload length:', payload.length, '(', payload.length / 8, 'x u64 fields )');
  
  // Try reading as u64 little-endian (lamports)
  if (payload.length >= 8) {
    const val1 = payload.readBigUInt64LE(0);
    console.log('Field 1 (u64 LE):', val1.toString(), 'lamports =', (Number(val1) / 1e9).toFixed(6), 'SOL');
  }
  if (payload.length >= 16) {
    const val2 = payload.readBigUInt64LE(8);
    console.log('Field 2 (u64 LE):', val2.toString(), 'lamports =', (Number(val2) / 1e9).toFixed(6), 'SOL');
  }
});