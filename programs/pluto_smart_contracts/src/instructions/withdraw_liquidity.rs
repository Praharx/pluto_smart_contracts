use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, Burn, TokenAccount, Transfer}
};
use fixed::types::I64F64;

use crate::{
    state::PoolState,
    constants::MINIMUM_LIQUIDITY
};

pub fn withdraw_liquidity(ctx: Context<WithdrawLiquidity>, amount:u64) -> Result<()> {
    const AUTHORITY: &[u8] = b"pool_authority";
        let authority_bump = ctx.bumps.pool_authority;
        let authority_seeds = &[
            AUTHORITY,
            &ctx.accounts.mint_a.key().to_bytes(),
            &ctx.accounts.mint_b.key().to_bytes(),
            &[authority_bump],
        ];
        let signer_seeds = &[authority_seeds.as_slice()];

    // Tranfer token from the pool
    // The withdrawals are calculated relative to the amount user asked for to the mint_liquidity tokens supply that exist in pool this would represent user's share in the pool and hence should receive tokens accordingly.
    let amount_a = I64F64::from_num(amount)
        .checked_mul(I64F64::from_num(ctx.accounts.pool_account_a.amount))
        .unwrap()
        .checked_div(I64F64::from_num(
            ctx.accounts.mint_liquidity.supply + MINIMUM_LIQUIDITY
        ))
        .unwrap()
        .floor()
        .to_num::<u64>();
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_account_a.to_account_info(),
                to: ctx.accounts.depositor_account_a.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            signer_seeds
        ),
        amount_a,
    )?;

    let amount_b = I64F64::from_num(amount)
        .checked_mul(I64F64::from_num(ctx.accounts.pool_account_b.amount))
        .unwrap()
        .checked_div(I64F64::from_num(
            ctx.accounts.mint_liquidity.supply + MINIMUM_LIQUIDITY
        ))
        .unwrap()
        .floor()
        .to_num::<u64>();
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_account_b.to_account_info(),
                to: ctx.accounts.depositor_account_b.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            signer_seeds
        ),
        amount_b,
    )?;

    // Burn the mint_liquidty tokens
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.mint_liquidity.to_account_info(),
                from: ctx.accounts.depositor_account_liquidity.to_account_info(),
                authority: ctx.accounts.depositor.to_account_info(),
            }
        ),
        amount
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawLiquidity<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
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
    pub pool: Account<'info, PoolState>,

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

    pub depositor: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"mint_auhtority",
            mint_a.key().as_ref(),
            mint_b.key().as_ref()
        ],
        bump
    )]
    pub mint_liquidity: Account<'info, Mint>,

    #[account(mut)]
    pub mint_a: Account<'info, Mint>,
    #[account(mut)]
    pub mint_b: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = pool_authority
    )]
    pub pool_account_a: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint_b,
        associated_token::authority = pool_authority
    )]
    pub pool_account_b: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint_liquidity,
        associated_token::authority = depositor
    )]
    pub depositor_account_liquidity: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint_a,
        associated_token::authority = depositor
    )]
    pub depositor_account_a: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint_b,
        associated_token::authority = depositor
    )]
    pub depositor_account_b: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>
}