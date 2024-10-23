use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount}
};

use crate::state::PoolState;

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
