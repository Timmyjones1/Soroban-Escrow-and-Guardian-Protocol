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
    JobNotFound = 9,
    JobAlreadyCompleted = 10,
    MilestoneInDispute = 11,
    MilestoneNotInDispute = 12,
    MilestoneSumMismatch = 13,
    DeadlineNotPassed = 14,
    DeadlinePassed = 15,
    InvalidDisputeDistribution = 16,
    ZeroMilestones = 17,
    ArbiterRequired = 18,
    MathOverflow = 19,
    InvalidToken = 20,
    InvalidSplitsSum = 21,
    ReviewWindowNotElapsed = 22,
    MilestoneNotDelivered = 23,
    MilestoneNotFunded = 24,
    NoArbiterConfigured = 25,
    KeeperFeeExceedsLimit = 26,
    EmptySplits = 27,
    MilestoneNotActive = 28,
}
