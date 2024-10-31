use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use fixed::types::I64F64;

use crate::state::PoolState;

#[derive(Accounts)]
pub struct SwapToken<'info> {
    // the person performing a swap
    #[account(mut)]
    pub trader: Signer<'info>,
    #[account(
        seeds = [
            b"pool",
            mint_a.key().as_ref(),
            mint_b.key().as_ref()
        ],
        bump,
        has_one = mint_a,
        has_one = mint_b
    )]
    pub pool: Box<Account<'info, PoolState>>,

    /// CHECK: Read only authority
    #[account(
        seeds = [
            b"pool_authority",
            mint_a.key().as_ref(),
            mint_b.key().as_ref()
        ],
        bump        
    )]
    pub pool_authority: AccountInfo<'info>,

    pub mint_a: Box<Account<'info, Mint>>,
    pub mint_b: Box<Account<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = pool_authority
    )]
    pub pool_account_a: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = mint_b,
        associated_token::authority = pool_authority
    )]
    pub pool_account_b: Box<Account<'info, TokenAccount>>,

    #[
        account(
            init_if_needed,
            payer = trader,
            associated_token::mint = mint_a,
            associated_token::authority = trader
        )
    ]
    pub trader_account_a: Box<Account<'info, TokenAccount>>,
    #[
        account(
            init_if_needed,
            payer = trader,
            associated_token::mint = mint_b,
            associated_token::authority = trader
        )
    ]
    pub trader_account_b: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>
}