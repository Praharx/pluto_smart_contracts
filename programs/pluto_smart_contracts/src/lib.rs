use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("GryS4Vrr1kEkAtmqtFcxJsQvSWnZg9fKhXbJeEVagy3J");

#[program]
pub mod pluto_smart_contracts {
    use super::*;

    pub fn initialize_pool(ctx: Context<CreatePool>) -> Result<()> {
        create_pool(ctx)?;
        Ok(())
    }
}
