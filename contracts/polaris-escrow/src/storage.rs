use soroban_sdk::{contracttype, Env};

pub const MIN_TTL_LEDGERS: u32 = 17_280; // ~ 1 day (5 sec ledgers)
pub const MAX_TTL_LEDGERS: u32 = 1_036_800; // ~ 60 days

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Paused,
    KeeperFeeBps,
    JobCounter,
    Job(u64),
    Dispute(u64, u32), // (job_id, milestone_id)
}

pub fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(MIN_TTL_LEDGERS, MAX_TTL_LEDGERS);
}

pub fn extend_persistent_ttl(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, MIN_TTL_LEDGERS, MAX_TTL_LEDGERS);
}
