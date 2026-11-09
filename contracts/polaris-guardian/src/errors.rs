use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum GuardianError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    ContractPaused = 4,
    InvalidAmount = 5,
    BreachNotFound = 6,
    ArbiterAlreadyRegistered = 7,
    ArbiterNotFound = 8,
    InsufficientBountyFunds = 9,
    EscrowCallFailed = 10,
    InvalidActionKind = 11,
}
