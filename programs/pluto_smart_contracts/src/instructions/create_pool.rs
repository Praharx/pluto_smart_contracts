use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint ,Token, TokenAccount}
};
use crate::state::Pool;

#[derive(Accounts)]

pub struct CreatePool<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = Pool::INIT_SPACE,
        seeds = [
            b"pool",
            mint_a.key().as_ref(),
            mint_b.key().as_ref(),
        ],
        bump
    )]
    pub pool: Account<'info, Pool>,

    /// CHECK: Read only authority
    #[account(
        seeds = [
            b"pool_authortiy",
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
    // the liquidity tokens that will be provided to the LP when depositing assets to the pool
    pub mint_liquidity: Account<'info, Mint>,

    // gives the minting details of token a on solana network.
    pub mint_a: Account<'info, Mint>,
    pub mint_b: Account<'info, Mint>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint_a,
        associated_token::authority = pool_authority
    )]
    // the vault where actual token is stored
    pub pool_account_a: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint_b,
        associated_token::authority = pool_authority
    )]
    pub pool_account_b: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn create_pool(ctx: Context<CreatePool>) -> Result<()> {
    ctx.accounts.pool.set_inner(Pool {
        mint_a: ctx.accounts.mint_a.key(),
        mint_b: ctx.accounts.mint_b.key()
    });

    Ok(())
}

