import DB from './Database';

// Mock API
const MOCK_API_URL = "https://jsonplaceholder.typicode.com/todos";

class SyncEngine {

    async processQueue() {
        console.log("[Sync] Checking queue...");
        const pendingItems = await DB.getPendingSyncItems();

        if (pendingItems.length === 0) {
            console.log("[Sync] Queue empty.");
            return;
        }

        console.log(`[Sync] Found ${pendingItems.length} pending items.`);

        for (const item of pendingItems) {
            try {
                console.log(`[Sync] Processing item ${item.id} (${item.operation})...`);
                const payload = JSON.parse(item.payload);

                // Simulate Network Request
                // In real app: await fetch(API_URL, { method: 'POST', body: ... })
                await new Promise(r => setTimeout(r, 1000));

                console.log(`[Sync] Item ${item.id} synced to backend.`);

                // Update local Todo status to 'synced'
                if (payload && payload.id) {
                    await DB.updateTodoStatus(payload.id, 'synced');
                }

                // Remove from queue
                await DB.deleteSyncItem(item.id);

            } catch (error) {
                console.error(`[Sync] Failed to sync item ${item.id}`, error);
            }
        }
    }

    async pullChanges() {
        console.log("[Sync] Pulling changes from backend...");
        try {
            // Mock Pull: Fetch some data
            // In real app: fetch(API_URL).then(...)

            // For POC, we just log. 
            // A real implementation would:
            // 1. Fetch remote changes (since last sync timestamp).
            // 2. Diff with local DB.
            // 3. Apply updates to 'todos' table.

            console.log("[Sync] Pull complete (Mock).");

        } catch (error) {
            console.error("[Sync] Pull failed", error);
        }
    }

    async sync() {
        // 1. Push Local Changes
        await this.processQueue();

        // 2. Pull Remote Changes
        await this.pullChanges();
    }
}

const syncEngine = new SyncEngine();
export default syncEngine;
