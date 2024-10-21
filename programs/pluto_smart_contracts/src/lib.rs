use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod constants;
pub mod errors;

use instructions::*;

declare_id!("GryS4Vrr1kEkAtmqtFcxJsQvSWnZg9fKhXbJeEVagy3J");

#[program]
pub mod pluto_smart_contracts {
    use super::*;

    pub fn initialize_pool(ctx: Context<CreatePool>) -> Result<()> {
        create_pool(ctx)
    }

    pub fn deposit_liquidity(
        ctx: Context<DepositLiquidity>,
        amount_a: u64,
        amount_b: u64,
    ) -> Result<()> {
        deposit_liquidity(ctx, amount_a, amount_b)
    }

    pub fn withdraw_liquidity(
        ctx: Context<WithdrawLiquidity>,
        amount: u64
    ) -> Result<()> {
        withdraw_liquidity(ctx, amount)
    }
}
