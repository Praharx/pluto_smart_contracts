use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub pool_id: u64,
    pub mint_a: Pubkey,
    pub mint_b: Pubkey
}