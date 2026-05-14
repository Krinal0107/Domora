use anchor_lang::prelude::*;

declare_id!("8i766exkHgJefjwC8zcfagKQJvny93rsgeNn47wuuwC1");

#[program]
pub mod real_estate {
    use super::*;

    // ──────────────────────────────────────────────
    // Property Registry Instructions
    // ──────────────────────────────────────────────

    pub fn register_property(
        ctx: Context<RegisterProperty>,
        property_id: String,
        document_hash: [u8; 32],
        price_lamports: u64,
        metadata_uri: String,
    ) -> Result<()> {
        require!(property_id.len() <= 64, ErrorCode::PropertyIdTooLong);
        require!(metadata_uri.len() <= 256, ErrorCode::UriTooLong);
        require!(price_lamports > 0, ErrorCode::InvalidPrice);

        let record = &mut ctx.accounts.property_record;
        record.owner = ctx.accounts.owner.key();
        record.property_id = property_id;
        record.document_hash = document_hash;
        record.price_lamports = price_lamports;
        record.metadata_uri = metadata_uri;
        record.is_verified = false;
        record.is_active = true;
        record.registered_at = Clock::get()?.unix_timestamp;
        record.bump = ctx.bumps.property_record;

        emit!(PropertyRegistered {
            owner: record.owner,
            property_id: record.property_id.clone(),
            price_lamports: record.price_lamports,
            timestamp: record.registered_at,
        });

        Ok(())
    }

    pub fn verify_property(
        ctx: Context<VerifyProperty>,
        document_hash: [u8; 32],
    ) -> Result<()> {
        let record = &mut ctx.accounts.property_record;
        require!(record.is_active, ErrorCode::PropertyNotActive);
        require!(
            record.document_hash == document_hash,
            ErrorCode::DocumentHashMismatch
        );

        record.is_verified = true;
        record.verified_at = Some(Clock::get()?.unix_timestamp);
        record.verifier = Some(ctx.accounts.verifier.key());

        emit!(PropertyVerified {
            property_id: record.property_id.clone(),
            verifier: ctx.accounts.verifier.key(),
            timestamp: record.verified_at.unwrap(),
        });

        Ok(())
    }

    pub fn update_property_price(
        ctx: Context<UpdateProperty>,
        new_price_lamports: u64,
    ) -> Result<()> {
        require!(new_price_lamports > 0, ErrorCode::InvalidPrice);
        let record = &mut ctx.accounts.property_record;
        require!(record.is_active, ErrorCode::PropertyNotActive);
        require!(
            record.owner == ctx.accounts.owner.key(),
            ErrorCode::Unauthorized
        );

        record.price_lamports = new_price_lamports;
        record.updated_at = Some(Clock::get()?.unix_timestamp);

        Ok(())
    }

    pub fn deactivate_property(ctx: Context<UpdateProperty>) -> Result<()> {
        let record = &mut ctx.accounts.property_record;
        require!(
            record.owner == ctx.accounts.owner.key(),
            ErrorCode::Unauthorized
        );
        record.is_active = false;
        Ok(())
    }

    // ──────────────────────────────────────────────
    // Escrow Instructions
    // ──────────────────────────────────────────────

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        property_id: String,
        amount_lamports: u64,
        agreement_hash: [u8; 32],
    ) -> Result<()> {
        require!(amount_lamports > 0, ErrorCode::InvalidPrice);

        let escrow = &mut ctx.accounts.escrow;
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.seller = ctx.accounts.seller.key();
        escrow.property_id = property_id;
        escrow.amount_lamports = amount_lamports;
        escrow.agreement_hash = agreement_hash;
        escrow.state = EscrowState::Active;
        escrow.created_at = Clock::get()?.unix_timestamp;
        escrow.expires_at = escrow.created_at + (7 * 24 * 60 * 60); // 7 days
        escrow.bump = ctx.bumps.escrow;

        // Transfer lamports from buyer to escrow PDA
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &ctx.accounts.escrow.key(),
            amount_lamports,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        emit!(EscrowCreated {
            buyer: escrow.buyer,
            seller: escrow.seller,
            property_id: escrow.property_id.clone(),
            amount: amount_lamports,
            timestamp: escrow.created_at,
        });

        Ok(())
    }

    pub fn release_escrow(ctx: Context<ReleaseEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.state == EscrowState::Active, ErrorCode::EscrowNotActive);
        require!(
            escrow.buyer == ctx.accounts.buyer.key(),
            ErrorCode::Unauthorized
        );

        escrow.state = EscrowState::Released;
        escrow.released_at = Some(Clock::get()?.unix_timestamp);

        // Transfer from escrow to seller
        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= escrow.amount_lamports;
        **ctx.accounts.seller.try_borrow_mut_lamports()? += escrow.amount_lamports;

        emit!(EscrowReleased {
            property_id: escrow.property_id.clone(),
            amount: escrow.amount_lamports,
            timestamp: escrow.released_at.unwrap(),
        });

        Ok(())
    }

    pub fn refund_escrow(ctx: Context<RefundEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.state == EscrowState::Active, ErrorCode::EscrowNotActive);

        let now = Clock::get()?.unix_timestamp;
        require!(
            ctx.accounts.seller.key() == escrow.seller
                || (now > escrow.expires_at && ctx.accounts.seller.key() == escrow.buyer),
            ErrorCode::Unauthorized
        );

        escrow.state = EscrowState::Refunded;

        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= escrow.amount_lamports;
        **ctx.accounts.buyer.try_borrow_mut_lamports()? += escrow.amount_lamports;

        Ok(())
    }

    // ──────────────────────────────────────────────
    // Agreement Instructions
    // ──────────────────────────────────────────────

    pub fn create_agreement(
        ctx: Context<CreateAgreement>,
        property_id: String,
        agreement_hash: [u8; 32],
        agreement_type: AgreementType,
        amount_lamports: u64,
    ) -> Result<()> {
        let agreement = &mut ctx.accounts.agreement;
        agreement.buyer = ctx.accounts.buyer.key();
        agreement.seller = ctx.accounts.seller.key();
        agreement.property_id = property_id;
        agreement.agreement_hash = agreement_hash;
        agreement.agreement_type = agreement_type;
        agreement.amount_lamports = amount_lamports;
        agreement.state = AgreementState::Pending;
        agreement.created_at = Clock::get()?.unix_timestamp;
        agreement.bump = ctx.bumps.agreement;

        Ok(())
    }

    pub fn sign_agreement_seller(ctx: Context<SignAgreement>) -> Result<()> {
        let agreement = &mut ctx.accounts.agreement;
        require!(
            agreement.seller == ctx.accounts.signer.key(),
            ErrorCode::Unauthorized
        );
        require!(
            agreement.state == AgreementState::Pending,
            ErrorCode::InvalidAgreementState
        );

        agreement.seller_signed = true;
        if agreement.buyer_signed {
            agreement.state = AgreementState::Active;
            agreement.activated_at = Some(Clock::get()?.unix_timestamp);
        }

        Ok(())
    }

    pub fn sign_agreement_buyer(ctx: Context<SignAgreement>) -> Result<()> {
        let agreement = &mut ctx.accounts.agreement;
        require!(
            agreement.buyer == ctx.accounts.signer.key(),
            ErrorCode::Unauthorized
        );
        require!(
            agreement.state == AgreementState::Pending,
            ErrorCode::InvalidAgreementState
        );

        agreement.buyer_signed = true;
        if agreement.seller_signed {
            agreement.state = AgreementState::Active;
            agreement.activated_at = Some(Clock::get()?.unix_timestamp);
        }

        Ok(())
    }

    pub fn complete_agreement(ctx: Context<CompleteAgreement>) -> Result<()> {
        let agreement = &mut ctx.accounts.agreement;
        require!(
            agreement.state == AgreementState::Active,
            ErrorCode::InvalidAgreementState
        );

        agreement.state = AgreementState::Completed;
        agreement.completed_at = Some(Clock::get()?.unix_timestamp);

        emit!(AgreementCompleted {
            property_id: agreement.property_id.clone(),
            buyer: agreement.buyer,
            seller: agreement.seller,
            amount: agreement.amount_lamports,
            timestamp: agreement.completed_at.unwrap(),
        });

        Ok(())
    }
}

// ──────────────────────────────────────────────
// Account Structures
// ──────────────────────────────────────────────

#[account]
#[derive(Default)]
pub struct PropertyRecord {
    pub owner: Pubkey,
    pub property_id: String,
    pub document_hash: [u8; 32],
    pub price_lamports: u64,
    pub metadata_uri: String,
    pub is_verified: bool,
    pub is_active: bool,
    pub registered_at: i64,
    pub updated_at: Option<i64>,
    pub verified_at: Option<i64>,
    pub verifier: Option<Pubkey>,
    pub bump: u8,
}

impl PropertyRecord {
    pub const LEN: usize = 8
        + 32                // owner
        + 4 + 64            // property_id
        + 32                // document_hash
        + 8                 // price_lamports
        + 4 + 256           // metadata_uri
        + 1                 // is_verified
        + 1                 // is_active
        + 8                 // registered_at
        + 1 + 8             // updated_at (Option<i64>)
        + 1 + 8             // verified_at (Option<i64>)
        + 1 + 32            // verifier (Option<Pubkey>)
        + 1;                // bump
}

#[account]
pub struct Escrow {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub property_id: String,
    pub amount_lamports: u64,
    pub agreement_hash: [u8; 32],
    pub state: EscrowState,
    pub created_at: i64,
    pub expires_at: i64,
    pub released_at: Option<i64>,
    pub bump: u8,
}

impl Escrow {
    pub const LEN: usize = 8
        + 32 + 32           // buyer, seller
        + 4 + 64            // property_id
        + 8                 // amount_lamports
        + 32                // agreement_hash
        + 1                 // state enum
        + 8 + 8             // created_at, expires_at
        + 1 + 8             // released_at
        + 1;                // bump
}

#[account]
pub struct Agreement {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub property_id: String,
    pub agreement_hash: [u8; 32],
    pub agreement_type: AgreementType,
    pub amount_lamports: u64,
    pub state: AgreementState,
    pub buyer_signed: bool,
    pub seller_signed: bool,
    pub created_at: i64,
    pub activated_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub bump: u8,
}

impl Agreement {
    pub const LEN: usize = 8
        + 32 + 32
        + 4 + 64
        + 32
        + 1                 // agreement_type
        + 8
        + 1                 // state
        + 1 + 1             // signed flags
        + 8
        + 1 + 8
        + 1 + 8
        + 1;
}

// ──────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Default)]
pub enum EscrowState {
    #[default]
    Active,
    Released,
    Refunded,
    Disputed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Default)]
pub enum AgreementState {
    #[default]
    Pending,
    Active,
    Completed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AgreementType {
    Sale,
    Rent,
    Lease,
}

// ──────────────────────────────────────────────
// Context Structs
// ──────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(property_id: String)]
pub struct RegisterProperty<'info> {
    #[account(
        init,
        payer = owner,
        space = PropertyRecord::LEN,
        seeds = [b"property", owner.key().as_ref(), property_id.as_bytes()],
        bump
    )]
    pub property_record: Account<'info, PropertyRecord>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyProperty<'info> {
    #[account(mut)]
    pub property_record: Account<'info, PropertyRecord>,

    pub verifier: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateProperty<'info> {
    #[account(mut, has_one = owner)]
    pub property_record: Account<'info, PropertyRecord>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(property_id: String)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = buyer,
        space = Escrow::LEN,
        seeds = [b"escrow", buyer.key().as_ref(), property_id.as_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: seller account for receiving funds
    pub seller: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,

    pub buyer: Signer<'info>,

    #[account(mut)]
    /// CHECK: seller receiving funds
    pub seller: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct RefundEscrow<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: seller authorizing refund
    pub seller: Signer<'info>,

    #[account(mut)]
    /// CHECK: buyer receiving refund
    pub buyer: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(property_id: String)]
pub struct CreateAgreement<'info> {
    #[account(
        init,
        payer = buyer,
        space = Agreement::LEN,
        seeds = [b"agreement", buyer.key().as_ref(), seller.key().as_ref(), property_id.as_bytes()],
        bump
    )]
    pub agreement: Account<'info, Agreement>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: seller pubkey
    pub seller: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SignAgreement<'info> {
    #[account(mut)]
    pub agreement: Account<'info, Agreement>,

    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CompleteAgreement<'info> {
    #[account(mut)]
    pub agreement: Account<'info, Agreement>,

    pub authority: Signer<'info>,
}

// ──────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────

#[event]
pub struct PropertyRegistered {
    pub owner: Pubkey,
    pub property_id: String,
    pub price_lamports: u64,
    pub timestamp: i64,
}

#[event]
pub struct PropertyVerified {
    pub property_id: String,
    pub verifier: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct EscrowCreated {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub property_id: String,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct EscrowReleased {
    pub property_id: String,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct AgreementCompleted {
    pub property_id: String,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

// ──────────────────────────────────────────────
// Errors
// ──────────────────────────────────────────────

#[error_code]
pub enum ErrorCode {
    #[msg("Property ID must be 64 characters or less")]
    PropertyIdTooLong,

    #[msg("Metadata URI must be 256 characters or less")]
    UriTooLong,

    #[msg("Price must be greater than zero")]
    InvalidPrice,

    #[msg("Property is not active")]
    PropertyNotActive,

    #[msg("Document hash does not match registered hash")]
    DocumentHashMismatch,

    #[msg("Unauthorized: you are not the owner")]
    Unauthorized,

    #[msg("Escrow is not in active state")]
    EscrowNotActive,

    #[msg("Invalid agreement state for this operation")]
    InvalidAgreementState,

    #[msg("Escrow has expired")]
    EscrowExpired,
}
