use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum PolarisError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    ContractPaused = 4,
    InvalidAmount = 5,
    MilestoneNotFound = 6,
    MilestoneNotSubmitted = 7,
    MilestoneAlreadyApproved = 8,
    EscrowNotFound = 9,
    EscrowAlreadyCompleted = 10,
    EscrowInDispute = 11,
    EscrowNotInDispute = 12,
    MilestoneSumMismatch = 13,
    DeadlineNotPassed = 14,
    DeadlinePassed = 15,
    InvalidDisputeDistribution = 16,
    ZeroMilestones = 17,
    ArbiterRequired = 18,
    MathOverflow = 19,
    InvalidToken = 20,
}
