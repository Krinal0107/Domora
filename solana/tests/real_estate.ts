import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { RealEstate } from '../target/types/real_estate';
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { assert } from 'chai';
import crypto from 'crypto';

describe('real_estate', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RealEstate as Program<RealEstate>;
  const owner = provider.wallet;
  const buyer = Keypair.generate();
  const seller = provider.wallet;

  const propertyId = 'PROP-VESU-001';
  const documentHash = crypto.createHash('sha256').update('property-deed-content').digest();
  const documentHashArray = Array.from(documentHash);
  const priceInLamports = 50 * LAMPORTS_PER_SOL;
  const metadataUri = 'https://surat-estate.com/properties/PROP-VESU-001/metadata.json';

  let propertyPDA: PublicKey;
  let escrowPDA: PublicKey;
  let agreementPDA: PublicKey;

  before(async () => {
    // Airdrop to buyer for tests
    const sig = await provider.connection.requestAirdrop(buyer.publicKey, 100 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig);

    // Compute PDAs
    [propertyPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('property'), owner.publicKey.toBuffer(), Buffer.from(propertyId)],
      program.programId
    );

    [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), buyer.publicKey.toBuffer(), Buffer.from(propertyId)],
      program.programId
    );

    [agreementPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('agreement'),
        buyer.publicKey.toBuffer(),
        seller.publicKey.toBuffer(),
        Buffer.from(propertyId)
      ],
      program.programId
    );
  });

  it('Registers a property on-chain', async () => {
    const tx = await program.methods
      .registerProperty(
        propertyId,
        documentHashArray as any,
        new anchor.BN(priceInLamports),
        metadataUri
      )
      .accounts({
        propertyRecord: propertyPDA,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('Register tx:', tx);

    const record = await program.account.propertyRecord.fetch(propertyPDA);
    assert.equal(record.propertyId, propertyId);
    assert.equal(record.owner.toBase58(), owner.publicKey.toBase58());
    assert.equal(record.pricelamports.toNumber(), priceInLamports);
    assert.equal(record.isVerified, false);
    assert.equal(record.isActive, true);
    console.log('Property registered:', record.propertyId);
  });

  it('Verifies a property', async () => {
    const tx = await program.methods
      .verifyProperty(documentHashArray as any)
      .accounts({
        propertyRecord: propertyPDA,
        verifier: owner.publicKey,
      })
      .rpc();

    console.log('Verify tx:', tx);

    const record = await program.account.propertyRecord.fetch(propertyPDA);
    assert.equal(record.isVerified, true);
    assert.isNotNull(record.verifiedAt);
    console.log('Property verified at:', record.verifiedAt?.toNumber());
  });

  it('Updates property price', async () => {
    const newPrice = 60 * LAMPORTS_PER_SOL;
    await program.methods
      .updatePropertyPrice(new anchor.BN(newPrice))
      .accounts({
        propertyRecord: propertyPDA,
        owner: owner.publicKey,
      })
      .rpc();

    const record = await program.account.propertyRecord.fetch(propertyPDA);
    assert.equal(record.pricelamports.toNumber(), newPrice);
    console.log('Price updated to:', newPrice / LAMPORTS_PER_SOL, 'SOL');
  });

  it('Creates an escrow for property purchase', async () => {
    const agreementHash = crypto.createHash('sha256').update('sale-agreement').digest();
    const escrowAmount = 5 * LAMPORTS_PER_SOL;

    const tx = await program.methods
      .createEscrow(
        propertyId,
        new anchor.BN(escrowAmount),
        Array.from(agreementHash) as any
      )
      .accounts({
        escrow: escrowPDA,
        buyer: buyer.publicKey,
        seller: seller.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    console.log('Escrow tx:', tx);

    const escrow = await program.account.escrow.fetch(escrowPDA);
    assert.equal(escrow.buyer.toBase58(), buyer.publicKey.toBase58());
    assert.equal(escrow.seller.toBase58(), seller.publicKey.toBase58());
    assert.equal(escrow.amountLamports.toNumber(), escrowAmount);
    console.log('Escrow created for:', escrowAmount / LAMPORTS_PER_SOL, 'SOL');
  });

  it('Releases escrow to seller', async () => {
    const sellerBalanceBefore = await provider.connection.getBalance(seller.publicKey);

    await program.methods
      .releaseEscrow()
      .accounts({
        escrow: escrowPDA,
        buyer: buyer.publicKey,
        seller: seller.publicKey,
      })
      .signers([buyer])
      .rpc();

    const sellerBalanceAfter = await provider.connection.getBalance(seller.publicKey);
    assert.isAbove(sellerBalanceAfter, sellerBalanceBefore);
    console.log('Escrow released, seller received funds');
  });

  it('Creates a sale agreement', async () => {
    const agreementHash = crypto.createHash('sha256').update('final-sale-agreement').digest();

    await program.methods
      .createAgreement(
        propertyId,
        Array.from(agreementHash) as any,
        { sale: {} },
        new anchor.BN(priceInLamports)
      )
      .accounts({
        agreement: agreementPDA,
        buyer: buyer.publicKey,
        seller: seller.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    const agreement = await program.account.agreement.fetch(agreementPDA);
    assert.equal(agreement.buyer.toBase58(), buyer.publicKey.toBase58());
    assert.equal(agreement.seller.toBase58(), seller.publicKey.toBase58());
    console.log('Agreement created');
  });

  it('Both parties sign the agreement', async () => {
    // Buyer signs
    await program.methods
      .signAgreementBuyer()
      .accounts({
        agreement: agreementPDA,
        signer: buyer.publicKey,
      })
      .signers([buyer])
      .rpc();

    // Seller signs
    await program.methods
      .signAgreementSeller()
      .accounts({
        agreement: agreementPDA,
        signer: seller.publicKey,
      })
      .rpc();

    const agreement = await program.account.agreement.fetch(agreementPDA);
    assert.equal(agreement.buyerSigned, true);
    assert.equal(agreement.sellerSigned, true);
    console.log('Agreement state after both signing:', agreement.state);
  });

  it('Completes the agreement', async () => {
    await program.methods
      .completeAgreement()
      .accounts({
        agreement: agreementPDA,
        authority: owner.publicKey,
      })
      .rpc();

    const agreement = await program.account.agreement.fetch(agreementPDA);
    assert.isNotNull(agreement.completedAt);
    console.log('Agreement completed at:', agreement.completedAt?.toNumber());
  });

  it('Deactivates the property after sale', async () => {
    await program.methods
      .deactivateProperty()
      .accounts({
        propertyRecord: propertyPDA,
        owner: owner.publicKey,
      })
      .rpc();

    const record = await program.account.propertyRecord.fetch(propertyPDA);
    assert.equal(record.isActive, false);
    console.log('Property deactivated');
  });
});
