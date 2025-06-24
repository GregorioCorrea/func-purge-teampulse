import { app, InvocationContext, Timer } from "@azure/functions";

export async function PurgeCancelledSubscriptions(myTimer: Timer, context: InvocationContext): Promise<void> {
    context.log('Timer function processed request.');
}

app.timer('PurgeCancelledSubscriptions', {
    schedule: '0 */5 * * * *',
    handler: PurgeCancelledSubscriptions
});
