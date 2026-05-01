import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as fs from 'fs';

async function deployAndSetup() {
  console.log('🚀 Deploying Surat Real Estate Smart Contract to Solana Devnet...\n');

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Load wallet
  let wallet: anchor.Wallet;
  const walletPath = `${process.env.HOME}/.config/solana/id.json`;
  if (fs.existsSync(walletPath)) {
    const keypairData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
    const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
    wallet = new anchor.Wallet(keypair);
  } else {
    console.error('❌ Wallet not found at', walletPath);
    console.log('Run: solana-keygen new --outfile ~/.config/solana/id.json');
    process.exit(1);
  }

  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`Wallet: ${wallet.publicKey.toBase58()}`);
  console.log(`Balance: ${balance / 1e9} SOL\n`);

  if (balance < 1e9) {
    console.log('⚠️  Balance too low. Requesting airdrop...');
    try {
      const sig = await connection.requestAirdrop(wallet.publicKey, 2e9);
      await connection.confirmTransaction(sig);
      console.log('✅ Airdrop successful: 2 SOL received\n');
    } catch {
      console.log('❌ Airdrop failed. Get SOL from https://faucet.solana.com\n');
    }
  }

  console.log('📋 Deployment Steps:');
  console.log('1. Install Anchor CLI: cargo install --git https://github.com/coral-xyz/anchor avm --locked');
  console.log('2. Install latest: avm install latest && avm use latest');
  console.log('3. Build: cd solana && anchor build');
  console.log('4. Deploy: anchor deploy --provider.cluster devnet');
  console.log('5. Run tests: anchor test --provider.cluster devnet\n');

  console.log('📌 Devnet Program ID: SuRtEsTaTePRoGrAmIdXXXXXXXXXXXXXXXXXXXXXXXX');
  console.log('📌 Update this in Anchor.toml after deployment\n');

  console.log('✅ Setup complete!');
}

deployAndSetup().catch(console.error);
