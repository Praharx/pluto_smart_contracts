use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self,Mint, MintTo, Token, TokenAccount, Transfer}
};
use crate::{
    constants::{AUTHORITY_SEED, MINIMUM_LIQUIDITY}, errors::PlutoError, state::PoolState
};
use fixed::types::I64F64;

pub fn deposit_liquidity(
    ctx: Context<DepositLiquidity>,
    amount_a: u64,
    amount_b: u64,
) -> Result<()> {
    // preventing depositing assets the depositor doesn't own.
    let amount_a = if amount_a > ctx.accounts.depositor_account_a.amount {
        ctx.accounts.depositor_account_a.amount
    } else {
        amount_a
    };
    let amount_b = if amount_b > ctx.accounts.depositor_account_a.amount {
        ctx.accounts.depositor_account_b.amount
    } else {
        amount_b
    };

    let pool_a = &ctx.accounts.pool_account_a;
    let pool_b = &ctx.accounts.pool_account_b;

    let pool_creation = pool_a.amount == 0 && pool_b.amount == 0;
    let (amount_a, amount_b) = if pool_creation {
        msg!("Values before USD {},{}", amount_a, amount_b);
        (amount_a, amount_b)
    } else {
        // ratio should be multiplying pool_a.amount to pool_b.amount, only then willl we be able to scale them relative to each other.
        let ratio = I64F64::from_num(pool_a.amount)
                    .checked_mul(I64F64::from_num(pool_b.amount)) 
                    .unwrap();
        // scaling up amount_b to match the amount_a by mutlipyling ratio.
        if pool_a.amount > pool_b.amount {
            (
                I64F64::from_num(ratio)
                .checked_div(I64F64::from_num(amount_b))
                .unwrap()
                .to_num::<u64>(),
                amount_b,
            )
        } else if pool_a.amount == pool_b.amount {
            let diff;
            if amount_a > amount_b {
                diff = amount_a - amount_b;
                (
                    amount_a - diff,
                    amount_b
                )
            }
            else {
                diff = amount_b - amount_a;
                (
                    amount_a,
                    amount_b - diff
                )
            }
        } else {
            // down scaling amount_a to match the amount_b relatively.
            ( 
                amount_a,
                I64F64::from_num(ratio)
                .checked_div(I64F64::from_num(amount_a))
                .unwrap()
                .to_num::<u64>(),
            )
        }
    };
     
        // Computing the amount of liquidity that is to be deposited
        // total liquidity is represented as the geometric mean of amount a & b
        let mut liquidity = I64F64::from_num(amount_a)
            .checked_mul(I64F64::from_num(amount_b))
            .unwrap()
            .sqrt()
            .to_num::<u64>();

        // Locking some intial amount of liqudity
        if pool_creation {
            
            if liquidity < MINIMUM_LIQUIDITY {
                return err!(PlutoError::DepositTooSmall)
            } 

            liquidity -= MINIMUM_LIQUIDITY;
        }

        // Transfer tokens to the pool
        token::transfer(
            CpiContext::new (
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.depositor_account_a.to_account_info(),
                    to: ctx.accounts.pool_account_a.to_account_info(),
                    authority: ctx.accounts.depositor.to_account_info(),
                }
            ),
            amount_a
        )?;
        token::transfer(
            CpiContext::new (
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.depositor_account_b.to_account_info(),
                    to: ctx.accounts.pool_account_b.to_account_info(),
                    authority: ctx.accounts.depositor.to_account_info(),
                }
            ),
            amount_b
        )?;

        // Mint liquidity token to the depositor against the liquidity deposited
        let authority_bump = ctx.bumps.pool_authority;
        let authority_seeds = &[
            AUTHORITY_SEED,
            &ctx.accounts.mint_a.key().to_bytes(),
            &ctx.accounts.mint_b.key().to_bytes(),
            &[authority_bump],
        ];
        let signer_seeds = &[authority_seeds.as_slice()];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    authority: ctx.accounts.pool_authority.to_account_info(),
                    mint: ctx.accounts.mint_liquidity.to_account_info(),
                    to: ctx.accounts.depositor_account_liquidity.to_account_info()
                },
                signer_seeds
            ),
            liquidity
        )?;

    Ok(())
}

#[derive(Accounts)]
pub struct DepositLiquidity<'info> {
        #[account(mut)]
        pub payer: Signer<'info>,
        #[account(
        seeds = [
            b"pool",
            mint_a.key().as_ref(),
            mint_b.key().as_ref(),
            ],
            bump,
            has_one = mint_a,
            has_one = mint_b
        )]
        pub pool: Box<Account<'info, PoolState>>,
        
        ///CHECK: Read only authority
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
        pub depositor: Signer<'info>,
        
        #[account(
            mut,
            seeds = [
                b"mint_authority",
                mint_a.key().as_ref(),
                mint_b.key().as_ref(),
            ],
            bump,
        )]
        pub mint_liquidity: Box<Account<'info, Mint>>,

        #[account(
            mut,
            associated_token::mint = mint_a,
            associated_token::authority = pool_authority,
        )]
        pub pool_account_a: Box<Account<'info, TokenAccount>>,

        #[account(
            mut,
            associated_token::mint = mint_b,
            associated_token::authority = pool_authority,
        )]
        pub pool_account_b: Box<Account<'info, TokenAccount>>,

        #[account(
            init_if_needed,
            payer = payer,
            associated_token::mint = mint_liquidity,
            associated_token::authority = depositor
        )]
        pub depositor_account_liquidity: Box<Account<'info, TokenAccount>>,

        #[account(
            mut,
            associated_token::mint = mint_a,
            associated_token::authority = depositor
        )]
        pub depositor_account_a: Box<Account<'info, TokenAccount>>,

        #[account(
            mut,
            associated_token::mint = mint_b,
            associated_token::authority = depositor
        )]
        pub depositor_account_b: Box<Account<'info, TokenAccount>>,

        pub token_program: Program<'info, Token>,
        pub associated_token_program: Program<'info, AssociatedToken>,
        pub system_program: Program<'info, System>
}
