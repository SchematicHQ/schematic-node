import type { RedisClient } from "../../../src/cache/redis";

/**
 * In-memory implementation of the subset of the `RedisClient` interface used
 * by `RedisLeaseStore` + `RedisReservationStore`. The `eval` method
 * interprets the specific Lua scripts those stores send — it's not a generic
 * Lua engine, just enough to exercise the atomic semantics in tests.
 *
 * Atomicity: the JS event loop is single-threaded and our Lua paths are all
 * synchronous against the in-memory maps, so calling them from concurrent
 * promises emulates real Redis Lua atomicity faithfully enough for these
 * tests.
 */
export function makeFakeRedis(): RedisClient {
    const strings = new Map<string, string>();
    const hashes = new Map<string, Map<string, string>>();
    const sets = new Map<string, Set<string>>();
    const zsets = new Map<string, Map<string, number>>(); // member -> score
    const expirations = new Map<string, number>(); // key -> epoch ms

    const checkExpiry = (key: string): void => {
        const exp = expirations.get(key);
        if (exp !== undefined && exp <= Date.now()) {
            strings.delete(key);
            hashes.delete(key);
            sets.delete(key);
            zsets.delete(key);
            expirations.delete(key);
        }
    };

    const hgetAll = (key: string): Record<string, string> => {
        checkExpiry(key);
        const h = hashes.get(key);
        if (!h) return {};
        return Object.fromEntries(h.entries());
    };

    const hset = (key: string, field: string, value: string): void => {
        if (!hashes.has(key)) hashes.set(key, new Map());
        hashes.get(key)!.set(field, value);
    };

    const hget = (key: string, field: string): string | null => {
        checkExpiry(key);
        return hashes.get(key)?.get(field) ?? null;
    };

    const del = (key: string): void => {
        strings.delete(key);
        hashes.delete(key);
        sets.delete(key);
        zsets.delete(key);
        expirations.delete(key);
    };

    const zadd = (key: string, score: number, member: string): void => {
        if (!zsets.has(key)) zsets.set(key, new Map());
        zsets.get(key)!.set(member, score);
    };

    const zrem = (key: string, member: string): void => {
        zsets.get(key)?.delete(member);
    };

    const interpretScript = (script: string, keys: string[], args: string[]): unknown => {
        const trimmed = script.trim();
        // Every script below is single-key (KEYS[1] only) — mirroring the real
        // stores, which avoid multi-key Lua so they stay Cluster-safe.
        // Match by a stable substring per script.
        if (
            trimmed.includes("local existing_id = redis.call('HGET', KEYS[1], 'leaseId')") &&
            trimmed.includes("if existing_id and existing_expiry > now then")
        ) {
            // REPLACE_SCRIPT — keeps any live lease (regardless of id).
            // The real script reads `now` from the Redis server clock
            // (redis.call('TIME')); we emulate that with the local clock since
            // the fake is in-process.
            const [leaseHashKey] = keys;
            const [newId, newGranted, newExpiryStr, grace, companyId, creditTypeId] = args;
            const newExpiry = Number(newExpiryStr);
            const now = Date.now();
            const existingId = hget(leaseHashKey, "leaseId");
            const existingExpiry = Number(hget(leaseHashKey, "expiresAt") ?? "0");
            if (existingId && existingExpiry > now) {
                return 0;
            }
            del(leaseHashKey);
            hset(leaseHashKey, "leaseId", newId);
            hset(leaseHashKey, "companyId", companyId);
            hset(leaseHashKey, "creditTypeId", creditTypeId);
            hset(leaseHashKey, "grantedAmount", newGranted);
            hset(leaseHashKey, "localRemainingCredits", newGranted);
            hset(leaseHashKey, "expiresAt", newExpiryStr);
            expirations.set(leaseHashKey, newExpiry + Number(grace));
            return 1;
        }
        if (
            trimmed.includes("local raw = redis.call('HGET', KEYS[1], 'localRemainingCredits')") &&
            trimmed.includes("if remaining < requested then return false end")
        ) {
            // TRY_RESERVE_SCRIPT — `now` is the Redis server clock in the real
            // script (redis.call('TIME')); emulated with the local clock here.
            // Success returns the post-debit balance as a string (matching the
            // real script's tostring()); failure returns nil (null here).
            const [leaseHashKey] = keys;
            const remainingRaw = hget(leaseHashKey, "localRemainingCredits");
            if (remainingRaw === null) return null;
            const expiry = Number(hget(leaseHashKey, "expiresAt") ?? "0");
            const now = Date.now();
            if (expiry <= now) return null;
            const remaining = Number(remainingRaw);
            const requested = Number(args[0]);
            if (remaining < requested) return null;
            const newRemaining = remaining - requested;
            hset(leaseHashKey, "localRemainingCredits", String(newRemaining));
            return String(newRemaining);
        }
        if (
            trimmed.includes("local new_balance = remaining + refund") &&
            trimmed.includes("if new_balance > granted then new_balance = granted end")
        ) {
            // REFUND_SCRIPT — ARGV[2] (when non-empty) pins the refund to a
            // specific leaseId; a mismatch drops the refund.
            const [leaseHashKey] = keys;
            const rawRemaining = hget(leaseHashKey, "localRemainingCredits");
            if (rawRemaining === null) return 0;
            const requiredLease = args[1];
            if (requiredLease && requiredLease !== "" && hget(leaseHashKey, "leaseId") !== requiredLease) {
                return 0;
            }
            const remaining = Number(rawRemaining);
            const granted = Number(hget(leaseHashKey, "grantedAmount") ?? "0");
            const refund = Number(args[0]);
            const newBalance = Math.min(remaining + refund, granted);
            hset(leaseHashKey, "localRemainingCredits", String(newBalance));
            return 1;
        }
        if (
            trimmed.includes("local raw_granted = redis.call('HGET', KEYS[1], 'grantedAmount')") &&
            trimmed.includes("local add = target - granted")
        ) {
            // EXTEND_SCRIPT — reconciles to the server-authoritative TOTAL
            // (ARGV[1]); the credit delta is computed against the CURRENT
            // stored total so concurrent extends converge instead of
            // double-counting. Expiry only moves forward. ARGV[4] (when
            // non-empty) pins the extend to a leaseId; a mismatch drops it.
            const [leaseHashKey] = keys;
            const rawGranted = hget(leaseHashKey, "grantedAmount");
            if (rawGranted === null) return 0;
            const requiredLease = args[3];
            if (requiredLease && requiredLease !== "" && hget(leaseHashKey, "leaseId") !== requiredLease) {
                return 0;
            }
            const granted = Number(rawGranted);
            const target = Number(args[0]);
            const add = target - granted;
            if (add > 0) {
                const remaining = Number(hget(leaseHashKey, "localRemainingCredits") ?? "0");
                hset(leaseHashKey, "grantedAmount", String(target));
                hset(leaseHashKey, "localRemainingCredits", String(remaining + add));
            }
            const newExpiry = Number(args[1]);
            const grace = Number(args[2]);
            const currentExpiry = Number(hget(leaseHashKey, "expiresAt") ?? "0");
            if (newExpiry > currentExpiry) {
                hset(leaseHashKey, "expiresAt", args[1]);
                expirations.set(leaseHashKey, newExpiry + grace);
            }
            return 1;
        }
        if (
            trimmed.includes("local raw = redis.call('HGETALL', KEYS[1])") &&
            trimmed.includes("redis.call('DEL', KEYS[1])") &&
            trimmed.includes("return raw")
        ) {
            // CLAIM_SCRIPT (reservation) — atomic read + delete, returns the
            // flat [field, value, ...] array (or nil when already gone).
            const [resHashKey] = keys;
            const raw = hgetAll(resHashKey);
            if (Object.keys(raw).length === 0) return null;
            del(resHashKey);
            const flat: string[] = [];
            for (const [k, v] of Object.entries(raw)) {
                flat.push(k, v);
            }
            return flat;
        }
        throw new Error(`fake-redis: unrecognized Lua script:\n${script}`);
    };

    return {
        // Basic string ops (unused by lease stores but required by interface)
        async get(key) {
            checkExpiry(key);
            return strings.get(key) ?? null;
        },
        async set(key, value) {
            strings.set(key, String(value));
        },
        async setEx(key, seconds, value) {
            strings.set(key, String(value));
            expirations.set(key, Date.now() + seconds * 1000);
        },
        async del(keyOrKeys) {
            const arr = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
            for (const k of arr) del(k);
        },
        async *scanIterator(_options) {
            for (const k of [...strings.keys(), ...hashes.keys(), ...sets.keys(), ...zsets.keys()]) {
                yield k;
            }
        },
        // Hash ops
        async hSet(key, field, value) {
            if (typeof field === "object" && field !== null) {
                for (const [f, v] of Object.entries(field)) {
                    hset(key, f, String(v));
                }
                return;
            }
            hset(key, field, String(value));
        },
        async hGet(key, field) {
            return hget(key, field) ?? undefined;
        },
        async hGetAll(key) {
            return hgetAll(key);
        },
        async hDel(key, field) {
            const fields = Array.isArray(field) ? field : [field];
            const h = hashes.get(key);
            if (!h) return;
            for (const f of fields) h.delete(f);
        },
        // Sorted-set ops
        async zAdd(key, members) {
            const arr = Array.isArray(members) ? members : [members];
            for (const m of arr) zadd(key, m.score, m.value);
        },
        async zRangeByScore(key, min, max, options) {
            checkExpiry(key);
            const z = zsets.get(key);
            if (!z) return [];
            const minN = min === "-inf" ? Number.NEGATIVE_INFINITY : Number(min);
            const maxN = max === "+inf" ? Number.POSITIVE_INFINITY : Number(max);
            const members = Array.from(z.entries())
                .filter(([, score]) => score >= minN && score <= maxN)
                .sort(([, a], [, b]) => a - b)
                .map(([m]) => m);
            if (options?.LIMIT) {
                return members.slice(options.LIMIT.offset, options.LIMIT.offset + options.LIMIT.count);
            }
            return members;
        },
        async zRem(key, member) {
            const members = Array.isArray(member) ? member : [member];
            for (const m of members) zrem(key, m);
        },
        async eval(script, options) {
            return interpretScript(script, options.keys, options.arguments);
        },
        async pExpireAt(key, timestamp) {
            expirations.set(key, timestamp);
        },
        async zCard(key) {
            checkExpiry(key);
            return zsets.get(key)?.size ?? 0;
        },
    };
}
