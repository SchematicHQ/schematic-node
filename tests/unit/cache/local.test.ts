/* eslint @typescript-eslint/no-explicit-any: 0 */

import { LocalCache } from "../../../src/cache/local";

jest.useFakeTimers();

describe("LocalCache", () => {
    let cache: LocalCache<any>;

    beforeEach(() => {
        cache = new LocalCache({ maxItems: 10, ttl: 5000 });
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    it("should store and retrieve a value", async () => {
        await cache.set("key1", { data: "value1" });
        const value = await cache.get("key1");
        expect(value).toEqual({ data: "value1" });
    });

    it("should return undefined for expired items", async () => {
        await cache.set("key1", { data: "value1" }, 1000); // TTL: 1 second
        jest.advanceTimersByTime(1001); // Advance time by 1 second and 1 millisecond
        const value = await cache.get("key1");
        expect(value).toBeNull();
    });

    it("should evict least recently used item when maxItems is exceeded", async () => {
        const smallCache = new LocalCache({ maxItems: 3, ttl: 5000 }); // Small maxItems to force eviction

        await smallCache.set("key1", { data: "value1" });
        await smallCache.set("key2", { data: "value2" });
        await smallCache.set("key3", { data: "value3" });

        // Access key1 and key3 to make key2 the least recently used
        await smallCache.get("key1");
        await smallCache.get("key3");

        // Add another item to exceed maxItems
        await smallCache.set("key4", { data: "value4" });

        // Check values after eviction
        const value1 = await smallCache.get("key1");
        const value2 = await smallCache.get("key2");
        const value3 = await smallCache.get("key3");
        const value4 = await smallCache.get("key4");

        expect(value1).toEqual({ data: "value1" });
        expect(value2).toBeNull(); // key2 should be evicted
        expect(value3).toEqual({ data: "value3" });
        expect(value4).toEqual({ data: "value4" });
    });

    it("should update the access counter on get", async () => {
        await cache.set("key1", { data: "value1" });

        const initialItem = (cache as any).cache.get("key1");
        const initialAccessCounter = initialItem.accessCounter;

        await cache.get("key1");

        const item = (cache as any).cache.get("key1");
        expect(item.accessCounter).toBe(initialAccessCounter + 1); // Ensure the counter is incremented by 1
    });

    it("should remove the item when evicted", async () => {
        await cache.set("key1", { data: "value1" });

        const initialSize = (cache as any).cache.size;

        cache["evictItem"]("key1", (cache as any).cache.get("key1"));

        const currentSize = (cache as any).cache.size;
        expect(currentSize).toBe(initialSize - 1);
    });

    it("should not store items if maxItems is 0", async () => {
        const zeroItemCache = new LocalCache({ maxItems: 0 });
        await zeroItemCache.set("key1", { data: "value1" });
        const value = await zeroItemCache.get("key1");
        expect(value).toBeNull();
    });

    it("should maintain the correct number of items", async () => {
        const maxItems = 5;
        const testCache = new LocalCache({ maxItems, ttl: 5000 });

        for (let i = 0; i < 10; i++) {
            await testCache.set(`key${i}`, { data: `value${i}` });
        }

        expect((testCache as any).cache.size).toBe(maxItems);
    });

    it("should support custom TTL override per item", async () => {
        await cache.set("shortTTL", { data: "short" }, 500); // Custom short TTL
        await cache.set("defaultTTL", { data: "default" }); // Uses default 5000ms TTL

        const shortBefore = await cache.get("shortTTL");
        expect(shortBefore).toEqual({ data: "short" });

        jest.advanceTimersByTime(501);

        const shortAfter = await cache.get("shortTTL");
        expect(shortAfter).toBeNull();

        const defaultAfter = await cache.get("defaultTTL");
        expect(defaultAfter).toEqual({ data: "default" });
    });

    it("should delete an item", async () => {
        await cache.set("key1", { data: "value1" });

        const valueBefore = await cache.get("key1");
        expect(valueBefore).toEqual({ data: "value1" });

        await cache.delete("key1");

        const valueAfter = await cache.get("key1");
        expect(valueAfter).toBeNull();
    });

    it("should remove unlisted keys with deleteMissing", async () => {
        await cache.set("keep1", { data: "keep1" });
        await cache.set("keep2", { data: "keep2" });
        await cache.set("remove1", { data: "remove1" });
        await cache.set("remove2", { data: "remove2" });

        await cache.deleteMissing(["keep1", "keep2"]);

        const keep1 = await cache.get("keep1");
        const keep2 = await cache.get("keep2");
        const remove1 = await cache.get("remove1");
        const remove2 = await cache.get("remove2");

        expect(keep1).toEqual({ data: "keep1" });
        expect(keep2).toEqual({ data: "keep2" });
        expect(remove1).toBeNull();
        expect(remove2).toBeNull();
    });

    it("should handle concurrent read/write safely", async () => {
        const operations = [];
        for (let i = 0; i < 50; i++) {
            operations.push(cache.set(`concurrent${i}`, { data: `value${i}` }));
            operations.push(cache.get(`concurrent${i}`));
        }

        await expect(Promise.all(operations)).resolves.not.toThrow();

        // Verify that the last items written are consistent
        for (let i = 0; i < 10; i++) {
            const key = `concurrent${i}`;
            const value = await cache.get(key);
            if (value !== null) {
                expect(value).toEqual({ data: `value${i}` });
            }
        }
    });
});
