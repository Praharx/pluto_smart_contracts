use anchor_lang::prelude::*;

#[error_code]
pub enum PlutoError {
    #[msg("Deposit amount too small.")]
    DepositTooSmall
}