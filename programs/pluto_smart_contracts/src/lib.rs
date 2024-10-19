use anchor_lang::prelude::*;

declare_id!("GryS4Vrr1kEkAtmqtFcxJsQvSWnZg9fKhXbJeEVagy3J");

#[program]
pub mod pluto_smart_contracts {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
