use soroban_sdk::{contracttype, Env};

pub const LEDGER_THRESHOLD_INSTANCE: u32 = 17_280; // ~ 1 day (5 sec ledgers)
pub const EXTEND_TO_INSTANCE: u32 = 518_400; // ~ 30 days

pub const LEDGER_THRESHOLD_PERSISTENT: u32 = 17_280;
pub const EXTEND_TO_PERSISTENT: u32 = 1_036_800; // ~ 60 days

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Paused,
    EscrowCounter,
    Escrow(u64),
    Dispute(u64),
}

pub fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(LEDGER_THRESHOLD_INSTANCE, EXTEND_TO_INSTANCE);
}

pub fn extend_persistent_ttl(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, LEDGER_THRESHOLD_PERSISTENT, EXTEND_TO_PERSISTENT);
}
