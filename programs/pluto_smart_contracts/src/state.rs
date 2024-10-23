use anchor_lang::prelude::*;

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
