import { init } from "steamworks.js";

async function test() {
    try {
        const client = init(431960);
        const queryConfig = {
            requiredTags: undefined,
            excludedTags: undefined,
            matchAnyTag: true,
            searchText: undefined,
            includeMetadata: true,
            includeAdditionalPreviews: true,
            includeLongDescription: false,
            cachedResponseMaxAge: 0,
        };

        console.log("--- Testing Default Items (Trend) ---");
        const res = await client.workshop.getAllItems(1, 13, 13, 431960, 431960, queryConfig);
        console.log("Result:", res.totalResults, "Items:", res.items.length);

        console.log("\n--- Testing Collections ---");
        const resCol = await client.workshop.getAllItems(1, 13, 3, 431960, 431960, queryConfig);
        console.log("Result (Collections):", resCol.totalResults, "Items:", resCol.items.length);
        if (resCol.items && resCol.items.length > 0) {
            console.log("First Collection Title:", resCol.items[0]?.title);
        }

        console.log("\n--- Testing Approved Items (Using Tag) ---");
        const approvedConfig = { ...queryConfig, requiredTags: ["Approved"] };
        const resApp = await client.workshop.getAllItems(1, 0, 13, 431960, 431960, approvedConfig);
        console.log("Result (Approved):", resApp.totalResults, "Items:", resApp.items.length);
        if (resApp.items && resApp.items.length > 0) {
            console.log("First Approved Title:", resApp.items[0]?.title);
        }

        process.exit(0);
    } catch (e: any) {
        console.error("Test failed:", e);
        process.exit(1);
    }
}
test();
