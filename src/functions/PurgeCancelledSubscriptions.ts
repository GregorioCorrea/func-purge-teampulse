import { app, InvocationContext, Timer } from "@azure/functions";
import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";

//
// Configuración de tu Storage Account (igual que en tu bot)
//
const account = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
const key     = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
const cred    = new AzureNamedKeyCredential(account, key);

const subsClient  = new TableClient(`https://${account}.table.core.windows.net`, "MarketplaceSubscriptions", cred);
const usageClient = new TableClient(`https://${account}.table.core.windows.net`, "PlanUsage",              cred);

// Días de retención
const daysToKeep = 90;

export async function PurgeCancelledSubscriptions(myTimer: Timer, context: InvocationContext): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  context.log(`🧹 PurgeCancelledSubscriptions: eliminando CANCELLED antes de ${cutoff.toISOString()}`);

  // Sólo status = 'Cancelled'
  const filter = `status eq 'Cancelled'`;
  for await (const sub of subsClient.listEntities<any>({ queryOptions: { filter } })) {
    if (new Date(sub.lastModified) < cutoff) {
      context.log(`✂️ Borrando subscriptionId=${sub.rowKey}`);
      await subsClient.deleteEntity(sub.partitionKey, sub.rowKey!);
      await usageClient.deleteEntity(sub.rowKey!, sub.rowKey!);
      context.log(`✅ Purged ${sub.rowKey}`);
    }
  }

  context.log("🧹 Purga completada.");
}

// ─── Cron diario a las 02:00 AM ─────────────────────────────────────
app.timer("PurgeCancelledSubscriptions", {
  schedule: "0 0 2 * * *",
  handler: PurgeCancelledSubscriptions,
});
