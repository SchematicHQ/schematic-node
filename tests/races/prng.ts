/**
 * Seeded PRNG (mulberry32) for the race harness. Every random choice in a run
 * — op selection, amounts, TTLs, and the micro-yields that vary event-loop
 * interleaving — draws from an `Rng` derived from the run's seed, so a failing
 * schedule replays exactly under `RACE_SEED=<seed>`.
 */
export class Rng {
    private state: number;

    constructor(seed: number) {
        this.state = seed >>> 0;
        // mulberry32 degenerates on a zero state; nudge to a fixed constant so
        // seed 0 is still a valid, distinct stream.
        if (this.state === 0) this.state = 0x9e3779b9;
    }

    /** Uniform float in [0, 1). */
    next(): number {
        this.state = (this.state + 0x6d2b79f5) >>> 0;
        let t = this.state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /** Uniform integer in [0, maxExclusive). */
    int(maxExclusive: number): number {
        return Math.floor(this.next() * maxExclusive);
    }

    /** Uniform integer in [min, max] (inclusive). */
    intBetween(min: number, max: number): number {
        return min + this.int(max - min + 1);
    }

    pick<T>(items: readonly T[]): T {
        return items[this.int(items.length)];
    }

    chance(probability: number): boolean {
        return this.next() < probability;
    }
}

/** Deterministically derive a child seed (e.g. per worker) from a run seed. */
export function deriveSeed(seed: number, salt: number): number {
    let h = (Math.imul(seed, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
    return h;
}
