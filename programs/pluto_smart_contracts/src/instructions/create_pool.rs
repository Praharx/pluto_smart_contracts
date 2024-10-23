use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount}
};

// Move pool struct to separate module if not already
#[account]
#[derive(InitSpace)]
pub struct PoolState {
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
}

impl PoolState {
    pub fn initialize(&mut self, mint_a: Pubkey, mint_b: Pubkey) -> Result<()> {
        self.mint_a = mint_a;
        self.mint_b = mint_b;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreatePool<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = PoolState::INIT_SPACE + 8,
        seeds = [
            b"pool",
            mint_a.key().as_ref(),
            mint_b.key().as_ref(),
        ],
        bump
    )]
    pub pool: Box<Account<'info, PoolState>>,

    /// CHECK: Read only authority
    #[account(
        seeds = [
            b"pool_authority",
            mint_a.key().as_ref(),
            mint_b.key().as_ref(),
        ],
        bump
    )]
    pub pool_authority: AccountInfo<'info>,

    #[account(
        init,
        payer = payer,
        seeds = [
            b"mint_authority",
            mint_a.key().as_ref(),
            mint_b.key().as_ref(),
        ],
        bump,
        mint::decimals = 6,
        mint::authority = pool_authority,
    )]
    pub mint_liquidity: Box<Account<'info, Mint>>, 

    pub mint_a: Box<Account<'info, Mint>>,
    pub mint_b: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint_a,
        associated_token::authority = pool_authority
    )]
    pub pool_account_a: Box<Account<'info, TokenAccount>>, 

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint_b,
        associated_token::authority = pool_authority
    )]
    pub pool_account_b: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn create_pool(ctx: Context<CreatePool>) -> Result<()> {
    msg!("Starting pool initialization..."); 

    // Initialize pool using the helper method
    ctx.accounts.pool.initialize(
        ctx.accounts.mint_a.key(),
        ctx.accounts.mint_b.key(),
    )?;

    msg!("Pool initialized successfully"); 
    Ok(())
}

// Add custom errors
#[error_code]
pub enum PoolError {
    #[msg("Token mints cannot be the same")]
    SameTokenMints,
    #[msg("Invalid token program")]
    InvalidTokenProgram,
}
// use anchor_lang::prelude::*;
// use anchor_spl::{
//     associated_token::AssociatedToken,
//     token::{Mint, Token, TokenAccount}
// };
// use std::mem::size_of;

// // Move pool struct to separate module if not already
// #[account]
// #[derive(Default)]
// pub struct PoolState {
//     pub mint_a: Pubkey,
//     pub mint_b: Pubkey,
// }

// impl PoolState {
//     pub const INIT_SPACE: usize = size_of::<Pubkey>() * 2; // Calculate space exactly
    
//     pub fn initialize(&mut self, mint_a: Pubkey, mint_b: Pubkey) -> Result<()> {
//         self.mint_a = mint_a;
//         self.mint_b = mint_b;
//         Ok(())
//     }
// }

// #[derive(Accounts)]
// #[instruction(bump: u8)]
// pub struct CreatePool<'info> {
//     #[account(mut)]
//     pub payer: Signer<'info>,

//     #[account(
//         init,
//         payer = payer,
//         space = PoolState::INIT_SPACE + 8,
//         seeds = [
//             b"pool",
//             mint_a.key().as_ref(),
//             mint_b.key().as_ref(),
//         ],
//         bump
//     )]
//     pub pool: Box<Account<'info, PoolState>>, // Box the account to move it to heap

//     /// CHECK: Read only authority
//     #[account(
//         seeds = [
//             b"pool_authority",
//             mint_a.key().as_ref(),
//             mint_b.key().as_ref(),
//         ],
//         bump
//     )]
//     pub pool_authority: AccountInfo<'info>,

//     #[account(
//         init,
//         payer = payer,
//         seeds = [
//             b"mint_authority",
//             mint_a.key().as_ref(),
//             mint_b.key().as_ref(),
//         ],
//         bump,
//         mint::decimals = 6,
//         mint::authority = pool_authority,
//     )]
//     pub mint_liquidity: Box<Account<'info, Mint>>, // Box large accounts

//     pub mint_a: Account<'info, Mint>,
//     pub mint_b: Account<'info, Mint>,

//     #[account(
//         init,
//         payer = payer,
//         associated_token::mint = mint_a,
//         associated_token::authority = pool_authority
//     )]
//     pub pool_account_a: Box<Account<'info, TokenAccount>>, // Box token accounts

//     #[account(
//         init,
//         payer = payer,
//         associated_token::mint = mint_b,
//         associated_token::authority = pool_authority
//     )]
//     pub pool_account_b: Box<Account<'info, TokenAccount>>,

//     pub token_program: Program<'info, Token>,
//     pub associated_token_program: Program<'info, AssociatedToken>,
//     pub system_program: Program<'info, System>,
// }

// pub fn create_pool(ctx: Context<CreatePool>) -> Result<()> {
//     msg!("Starting pool initialization..."); // Add logging

//     // Initialize pool using the helper method
//     ctx.accounts.pool.initialize(
//         ctx.accounts.mint_a.key(),
//         ctx.accounts.mint_b.key(),
//     )?;

//     msg!("Pool initialized successfully"); // Add logging
//     Ok(())
// }

// // Add custom errors
// #[error_code]
// pub enum PoolError {
//     #[msg("Token mints cannot be the same")]
//     SameTokenMints,
//     #[msg("Invalid token program")]
//     InvalidTokenProgram,
// }

