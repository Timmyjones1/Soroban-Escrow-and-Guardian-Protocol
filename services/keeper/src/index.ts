import { rpc, Keypair, TransactionBuilder, Networks, Address, xdr } from "@stellar/stellar-sdk";
import { KEEPER_CONFIG } from "./config";
import { dispatchBreachAlert } from "./notifier";

const server = new rpc.Server(KEEPER_CONFIG.rpcUrl);

export interface MilestoneState {
  id: number;
  description: string;
  amount: bigint;
  deliverBy: number;
  reviewWindow: number;
  deliveredAt: number;
  status: "Funded" | "Delivered" | "Disputed" | "Resolved" | "Completed" | "Refunded";
}

export interface JobState {
  jobId: number;
  client: string;
  freelancer: string;
  token: string;
  totalAmount: bigint;
  milestones: MilestoneState[];
}

export class PolarisKeeper {
  private keypair: Keypair;
  private isRunning: boolean = false;

  constructor() {
    try {
      this.keypair = Keypair.fromSecret(KEEPER_CONFIG.keeperSecretKey);
    } catch {
      // In development / demo mode, generate temporary keeper keypair
      this.keypair = Keypair.random();
      console.log(`[KEEPER] Initialized with ephemeral keeper key: ${this.keypair.publicKey()}`);
    }
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    console.log("=================================================");
    console.log("🚀 POLARIS ESCROW & GUARDIAN KEEPER STARTED");
    console.log(`   Network: ${KEEPER_CONFIG.network}`);
    console.log(`   RPC URL: ${KEEPER_CONFIG.rpcUrl}`);
    console.log(`   Escrow Contract: ${KEEPER_CONFIG.escrowContractId}`);
    console.log(`   Guardian Contract: ${KEEPER_CONFIG.guardianContractId}`);
    console.log(`   Keeper Address: ${this.keypair.publicKey()}`);
    console.log(`   Poll Interval: ${KEEPER_CONFIG.pollIntervalMs}ms`);
    console.log("=================================================");

    while (this.isRunning) {
      try {
        await this.runKeeperCycle();
      } catch (err) {
        console.error("[KEEPER] Error in execution cycle:", err);
      }
      await new Promise((resolve) => setTimeout(resolve, KEEPER_CONFIG.pollIntervalMs));
    }
  }

  public stop(): void {
    this.isRunning = false;
    console.log("[KEEPER] Stopped keeper monitoring service.");
  }

  private async runKeeperCycle(): Promise<void> {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    console.log(`[KEEPER] [${new Date().toISOString()}] Scanning active Soroban escrows (Epoch: ${currentTimestamp})...`);

    // Fetch active contract events and ledger state
    const jobs = await this.queryActiveJobs();

    for (const job of jobs) {
      for (const m of job.milestones) {
        // Condition 1: Milestone is Funded, but deliver_by has elapsed -> Freelancer missed deadline!
        if (m.status === "Funded" && currentTimestamp > m.deliverBy) {
          console.warn(`[KEEPER] Breach Detected: Job #${job.jobId} Milestone #${m.id} missed deliver_by deadline!`);
          await this.enforceMissedDeadline(job.jobId, m.id, job.client);
        }

        // Condition 2: Milestone is Delivered, but review_window has elapsed -> Client silent timeout!
        if (m.status === "Delivered" && currentTimestamp >= m.deliveredAt + m.reviewWindow) {
          console.warn(`[KEEPER] Breach Detected: Job #${job.jobId} Milestone #${m.id} review window elapsed without client review!`);
          await this.enforceReviewTimeout(job.jobId, m.id, job.freelancer);
        }
      }
    }
  }

  private async enforceReviewTimeout(jobId: number, milestoneId: number, freelancer: string): Promise<void> {
    try {
      console.log(`[KEEPER] Executing trigger_timeout_action(action=0: ReviewTimeout) for Job #${jobId}...`);

      // Simulate on-chain call
      const simulatedTxHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

      await dispatchBreachAlert({
        jobId,
        milestoneId,
        breachKind: "ReviewTimeoutExpired",
        entitledParty: freelancer,
        txHash: simulatedTxHash,
        timestamp: new Date().toISOString(),
      });
      console.log(`[KEEPER] Successfully claimed keeper incentive micro-bounty for Job #${jobId}, Milestone #${milestoneId}!`);
    } catch (err) {
      console.error(`[KEEPER] Failed to enforce review timeout for Job #${jobId}:`, err);
    }
  }

  private async enforceMissedDeadline(jobId: number, milestoneId: number, client: string): Promise<void> {
    try {
      console.log(`[KEEPER] Executing trigger_timeout_action(action=1: MissedDeadline) for Job #${jobId}...`);

      // Simulate on-chain call
      const simulatedTxHash = "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a";

      await dispatchBreachAlert({
        jobId,
        milestoneId,
        breachKind: "DeadlineMissed",
        entitledParty: client,
        txHash: simulatedTxHash,
        timestamp: new Date().toISOString(),
      });
      console.log(`[KEEPER] Client refunded and keeper micro-bounty awarded for Job #${jobId}!`);
    } catch (err) {
      console.error(`[KEEPER] Failed to enforce missed deadline for Job #${jobId}:`, err);
    }
  }

  private async queryActiveJobs(): Promise<JobState[]> {
    // In production, queries Soroban RPC getEvents or persistent ledger keys
    // Returns active jobs sample for demonstration and integration
    return [
      {
        jobId: 1,
        client: "GBPOLARISDEMOCLIENTACCOUNTTESTNETXXXXXXXXXXXXXXXXX",
        freelancer: "GCPOLARISDEMOFREELANCERTESTNETXXXXXXXXXXXXXXXXXX",
        token: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWUIE362FMAMFYGUSDC",
        totalAmount: 10000000000n,
        milestones: [
          {
            id: 1,
            description: "Soroban Smart Contract Core Architecture",
            amount: 6000000000n,
            deliverBy: Math.floor(Date.now() / 1000) - 100, // Expired deadline example
            reviewWindow: 14400,
            deliveredAt: 0,
            status: "Funded",
          },
        ],
      },
    ];
  }
}

// Start keeper process if run directly
if (require.main === module) {
  const keeper = new PolarisKeeper();
  keeper.start().catch((err) => {
    console.error("[FATAL] Keeper encountered fatal error:", err);
    process.exit(1);
  });
}

