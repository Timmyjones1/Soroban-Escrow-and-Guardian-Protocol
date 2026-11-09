import { KEEPER_CONFIG } from "./config";

export interface BreachNotification {
  jobId: number;
  milestoneId: number;
  breachKind: "DeadlineMissed" | "ReviewTimeoutExpired";
  entitledParty: string;
  txHash: string;
  timestamp: string;
}

export async function dispatchBreachAlert(notification: BreachNotification): Promise<void> {
  console.log(`[ALERT] Contract Breach Enforced: Job #${notification.jobId}, Milestone #${notification.milestoneId}`);
  console.log(`[ALERT] Breach Kind: ${notification.breachKind}, Entitled: ${notification.entitledParty}`);
  console.log(`[ALERT] Transaction Hash: ${notification.txHash}`);

  // 1. Dispatch Webhook notification if configured
  if (KEEPER_CONFIG.webhookUrl) {
    try {
      const response = await fetch(KEEPER_CONFIG.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "milestone.breach_enforced",
          data: notification,
          source: "polaris-guardian-keeper",
        }),
      });
      console.log(`[NOTIFIER] Webhook responded with status ${response.status}`);
    } catch (err) {
      console.error("[NOTIFIER] Failed to dispatch webhook alert:", err);
    }
  }

  // 2. Dispatch Email via Resend if API key is provided
  if (KEEPER_CONFIG.resendApiKey) {
    try {
      const emailPayload = {
        from: "Polaris Guardian <onboarding@resend.dev>",
        to: [KEEPER_CONFIG.alertEmail],
        subject: `[Polaris Alert] Automated Breach Enforced on Job #${notification.jobId}`,
        html: `
          <h2>Polaris Protocol Breach Enforcement Notice</h2>
          <p><strong>Job ID:</strong> ${notification.jobId}</p>
          <p><strong>Milestone ID:</strong> ${notification.milestoneId}</p>
          <p><strong>Breach Type:</strong> ${notification.breachKind}</p>
          <p><strong>Entitled Beneficiary:</strong> <code>${notification.entitledParty}</code></p>
          <p><strong>Tx Hash:</strong> <a href="https://stellar.expert/explorer/testnet/tx/${notification.txHash}">${notification.txHash}</a></p>
          <p><em>Enforced automatically on Stellar Testnet by Polaris Guardian Keeper Service.</em></p>
        `,
      };

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${KEEPER_CONFIG.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      console.log(`[NOTIFIER] Resend Email API response code: ${res.status}`);
    } catch (err) {
      console.error("[NOTIFIER] Resend email dispatch failed:", err);
    }
  }
}

