/**
 * Deterministic in-process stand-in for the credits wire API, used by the
 * manager-level race scenario. Mirrors the server contract the SDK relies on:
 *
 * - `acquire` is transactional and idempotent for an active slot: while a
 *   live, unreleased lease exists for (company, creditType) every acquire is
 *   handed that lease back; a fresh lease is minted only when the slot is
 *   free. The check-and-mint is atomic (no awaits inside), like the real
 *   server's transaction.
 * - `extend` grows the lease's authoritative total and returns it; extending
 *   a released/expired lease errors.
 * - `release` marks the lease released and frees the slot.
 *
 * Seeded jitter at the entry and exit of every call simulates wire latency,
 * opening the windows (acquire response racing a sibling's install, extend
 * response landing after expiry) the lease manager has to survive.
 */
import type { CreditsClient } from "../../src/api/resources/credits/client/Client";

import type { VirtualClock } from "./harness";
import { jitter } from "./harness";
import type { Rng } from "./prng";

interface ServerLease {
    id: string;
    companyId: string;
    creditTypeId: string;
    granted: number;
    expiresAtMs: number;
}

export class ScriptedCreditsServer {
    readonly leasesById = new Map<string, ServerLease>();
    readonly released = new Set<string>();
    private readonly activeBySlot = new Map<string, string>();
    private seq = 0;

    constructor(
        private readonly clock: VirtualClock,
        private readonly rng: Rng,
    ) {}

    private activeLease(slotKey: string): ServerLease | undefined {
        const id = this.activeBySlot.get(slotKey);
        if (!id) return undefined;
        const lease = this.leasesById.get(id);
        if (!lease || this.released.has(id) || lease.expiresAtMs <= this.clock.now()) return undefined;
        return lease;
    }

    private toData(lease: ServerLease) {
        // Snapshot inside the atomic section so the response carries the state
        // as of the call, then travels through simulated latency.
        return {
            id: lease.id,
            companyId: lease.companyId,
            creditTypeId: lease.creditTypeId,
            grantedAmount: lease.granted,
            expiresAt: new Date(lease.expiresAtMs),
            createdAt: new Date(0),
            updatedAt: new Date(0),
        };
    }

    client(): CreditsClient {
        const acquireCreditLease = async (body: {
            companyId: string;
            creditTypeId: string;
            requestedAmount: number;
            expiresAt: Date;
        }) => {
            await jitter(this.rng);
            const slotKey = `${body.companyId}:${body.creditTypeId}`;
            let lease = this.activeLease(slotKey);
            if (!lease) {
                lease = {
                    id: `lse_srv_${++this.seq}`,
                    companyId: body.companyId,
                    creditTypeId: body.creditTypeId,
                    granted: body.requestedAmount,
                    expiresAtMs: body.expiresAt.getTime(),
                };
                this.leasesById.set(lease.id, lease);
                this.activeBySlot.set(slotKey, lease.id);
            }
            const data = this.toData(lease);
            await jitter(this.rng);
            return { data, params: {} };
        };

        const extendCreditLease = async (leaseId: string, body: { additionalAmount: number; expiresAt: Date }) => {
            await jitter(this.rng);
            const lease = this.leasesById.get(leaseId);
            if (!lease || this.released.has(leaseId) || lease.expiresAtMs <= this.clock.now()) {
                throw new Error(`cannot extend inactive lease ${leaseId}`);
            }
            lease.granted += body.additionalAmount;
            lease.expiresAtMs = Math.max(lease.expiresAtMs, body.expiresAt.getTime());
            const data = this.toData(lease);
            await jitter(this.rng);
            return { data, params: {} };
        };

        const releaseCreditLease = async (leaseId: string) => {
            await jitter(this.rng);
            this.released.add(leaseId);
            const lease = this.leasesById.get(leaseId);
            if (lease) {
                const slotKey = `${lease.companyId}:${lease.creditTypeId}`;
                if (this.activeBySlot.get(slotKey) === leaseId) this.activeBySlot.delete(slotKey);
            }
            await jitter(this.rng);
            return { data: {}, params: {} };
        };

        return { acquireCreditLease, extendCreditLease, releaseCreditLease } as unknown as CreditsClient;
    }
}
