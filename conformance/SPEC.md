# Credit lease & reservation semantics — conformance spec

This document specifies the client-side credit lease/reservation semantics implemented by the
Schematic Node SDK (the reference implementation), in enough detail to reimplement them in another
language without reading the Node source. The machine-readable test vectors in
`conformance/vectors/*.json` pin the observable behavior; this spec explains the model, the
configuration knobs, and the invariants that cannot be expressed as deterministic vectors.

Where this document and the vectors disagree, the vectors win — they are generated from the
reference implementation's behavior.

- [Vector format](#vector-format)
- [Model overview](#model-overview)
- [State](#state)
- [Store operations](#store-operations)
- [Lease manager](#lease-manager)
- [Check flow](#check-flow)
- [Track / settle flow](#track--settle-flow)
- [Configuration knobs](#configuration-knobs)
- [Bounded-leak contract](#bounded-leak-contract)
- [Invariants not expressible as vectors](#invariants-not-expressible-as-vectors)

## Vector format

Each file in `conformance/vectors/` is a JSON document:

```json
{
    "category": "reservation_lifecycle",
    "vectors": [
        {
            "name": "unique_snake_case_name",
            "description": "What this vector pins and why.",
            "backends": ["in_memory", "redis"],
            "given": {
                "config": { "lease_duration_ms": 300000, "reservation_ttl_ms": 60000, "lease_size": 1000, "low_water_mark": 0.25 },
                "leases": [ { "lease_id": "lse_1", "company_id": "co_1", "credit_type_id": "ct_1", "granted_amount": 1000, "expires_at_ms": 60000 } ]
            },
            "operations": [
                { "op": "try_reserve", "company_id": "co_1", "credit_type_id": "ct_1", "credits": 100, "expect": { "balance": 900 } }
            ]
        }
    ]
}
```

Rules:

- All keys are `snake_case`. Vectors are plain JSON — no language-specific types.
- **Virtual clock.** The run starts at a fixed virtual instant `t0`. Every `*_at_ms` field is an
  offset in milliseconds from `t0` (an absolute position on the virtual timeline, not relative to
  the current operation). The `advance_clock` operation moves the clock forward; nothing else does.
  Runners must execute vectors against a controllable clock (no wall time).
- `backends` restricts which store backends the vector runs against; when omitted, the vector must
  pass against every backend the SDK ships (in-memory and Redis for Node).
- `given.leases` are installed via the store's `replace` operation at `t0` (each install must
  return "written").
- Assertions are attached per-operation via `expect`. Final-state assertions are expressed as
  trailing read operations (`get_lease`, `reserved_credits`, `reservation_count`).
- `expect.balance` / `expect.consumed` use JSON `null` for the "no / refused" result.
- Reservation ids created by `check` operations are random; the vector names them via
  `save_reservation_as` and later operations reference them with `handle`.

### Operations

Store-level (exercise the lease store and reservation store directly):

| op | fields | expect |
| --- | --- | --- |
| `advance_clock` | `ms` | — |
| `replace_lease` | `lease_id`, `company_id`, `credit_type_id`, `granted_amount`, `expires_at_ms` | `written` (bool) |
| `drop_lease` | `company_id`, `credit_type_id` | — |
| `try_reserve` | `company_id`, `credit_type_id`, `credits` | `balance` (post-debit number, or `null`) |
| `refund_lease` | `company_id`, `credit_type_id`, `credits`, `pin_lease_id`? | — |
| `extend_lease` | `company_id`, `credit_type_id`, `granted_total`, `expires_at_ms`?, `pin_lease_id`? | — |
| `get_lease` | `company_id`, `credit_type_id` | `exists`, `lease_id`?, `granted_amount`?, `local_remaining_credits`? |
| `add_reservation` | `id`, `lease_id`, `company_id`, `credit_type_id`, `event_subtype`, `quantity_reserved`, `credits_reserved`, `consumption_rate`, `expires_at_ms` | — |
| `consume_reservation` | `id` or `handle`, `credits`, `crash_before_refund`? (bool, one-shot) | `consumed` (number or `null`), `throws`? |
| `get_reservation` | `id` or `handle` | `exists` |
| `reserved_credits` | `company_id`, `credit_type_id` | `total` |
| `reservation_count` | — | `count` |
| `sweep_expired` | — | `swept` |

Manager-level (exercise the lease manager with a scripted wire client):

| op | fields | expect |
| --- | --- | --- |
| `acquire_if_needed` | `company_id`, `credit_type_id`, `server`? ( `{ "lease": {...} }` or `{ "error": "..." }` ), `install_during_wire`? (lease installed into the store while the wire call is in flight, emulating a sibling pod winning the race) | `lease_id` (or `null`), `wire_acquires` (cumulative count), `last_acquire_requested_amount`?, `released_lease_ids` (cumulative) |
| `maybe_extend` | `company_id`, `credit_type_id`, `required_credits`?, `server`? ( `{ "lease": { "granted_total", "expires_at_ms" } }` or `{ "error": "..." }` ) | `wire_extends` (cumulative count), `last_extend_additional_amount`?, `last_extend_lease_id`? |
| `release_all_local_leases` | — (in-memory backend only) | `released_lease_ids`, `remaining_slots` |

Flow-level (exercise the full check/track orchestration with a scripted rules engine):

| op | fields | expect |
| --- | --- | --- |
| `check` | `flag_key`, `company` (`{ id, credit_balances }`), `usage`, `event_subtype`?, `on_acquire_failure`?, `engine` (array of scripted engine results, consumed in call order), `server`? (as above), `save_reservation_as`? | `allowed`, `reason`?, `err`?, `has_reservation`, `reservation`? (field subset), `fallback_called`?, `engine_calls`? (per-call `{ credit_balance, credit_cost?, event_usage? }`; `credit_balance` may be the string `"max_safe_integer"`) |
| `track` | `handle`, `actual_quantity` | `settled_locally`, `track` (`{ event, quantity, lease_id }`) |

A scripted engine result is `{ "value": bool, "reason"?: string, "entitlement"?: { "value_type",
"credit_id"?, "consumption_rate"?, "event_subtype"?, "feature_id"?, "feature_key"? } }`. The engine
is an oracle: the vectors pin the *orchestration around* the rules engine (what it is called with,
and what the SDK does with its answer), not the engine itself — the engine is shared WASM across
SDKs and has its own tests.

## Model overview

Credit-metered features are gated client-side without a wire call per check. The SDK:

1. **Leases** a tranche of credits from the server per `(company_id, credit_type_id)`. The server
   pre-debits the company balance by the granted amount; the SDK tracks a local view of how much
   of the tranche remains un-reserved (`local_remaining_credits`).
2. **Reserves** `usage x consumption_rate` credits from the lease at `check()` time, atomically
   (check-and-debit). A successful, engine-approved check returns a *reservation handle*.
3. **Settles** the reservation at `track()` time with the actual usage: the actually-consumed
   credits stay debited, the unspent slice is refunded to the lease, and a Track event bills the
   server (the server is the source of truth for real consumption).

Everything client-side is *local bookkeeping against the leased tranche*. The server reconciles:
an expired lease's unspent remainder is refunded to the company balance server-side, and Track
events (keyed by `lease_id`) drive the authoritative consumption.

Leases and reservations both expire:

- A **lease** past its expiry must be treated as *released* — its local balance is stale (the
  server already refunded the remainder) and must never serve another reserve or be extended.
- A **reservation** past its TTL is swept: removed from the table and its full hold refunded to
  the lease. Work that finishes after the sweep still bills the server (recovery emit) but does
  not re-debit the local lease.

## State

**Lease slot** — at most one lease per `(company_id, credit_type_id)` key:

| field | meaning |
| --- | --- |
| `lease_id` | Server-issued id. |
| `granted_amount` | Server-authoritative total granted to this lease (grows on extend). |
| `local_remaining_credits` | Local view: granted minus outstanding holds/consumption. Initialized to `granted_amount` on install. |
| `expires_at` | Expiry instant. Past it the lease is dead (see above). |

**Reservation** — keyed by a unique id:

| field | meaning |
| --- | --- |
| `id` | Unique (UUID in Node). |
| `lease_id` | The lease the hold was carved from. Pins refunds. |
| `company_id`, `credit_type_id` | Slot key. |
| `event_subtype` | Event the settle will bill as. |
| `quantity_reserved` | Caller-declared usage (event units). |
| `credits_reserved` | `quantity_reserved x consumption_rate`. |
| `consumption_rate` | Rate at reservation time. |
| `expires_at` | Reservation TTL deadline (sweep target). |
| `eval_ctx` | Company/user keys used at check time; threaded onto the Track event. |

## Store operations

These are the primitives both store backends (per-process in-memory; shared Redis) must implement
with identical observable semantics. Each mutation must be atomic per slot/reservation (see
[Invariants](#invariants-not-expressible-as-vectors)).

### `replace(lease)` — install-if-not-live

Install a fresh lease with `local_remaining_credits = granted_amount`, **only if** the slot is
empty or the existing lease is expired *and carries a different `lease_id`*. If a *live* lease
occupies the slot — even with a different `lease_id` (a sibling pod won the race) — leave it
untouched (its already-debited balance wins) and report "kept". If an *expired* lease with the
**same** `lease_id` occupies the slot (a stale acquire response for a lease the idempotent server
also handed to a racing sibling, which may since have extended it), do not rewrite it either:
rewriting would reset `local_remaining_credits` to the full grant and erase debits whose
reservations are still open. Reconcile it like `extend` instead — granted to the incoming total
(lower/equal totals are no-ops), expiry only forward, balance untouched — and report "kept".
Returns written/kept so the caller can run the redundant-lease release logic (see manager).

### `try_reserve(company, credit, credits)` — atomic check-and-debit

- Reject (return `null`, touch nothing) if: no lease in the slot; the lease is **expired**; the
  remaining balance is `< credits`; or `credits` is not a finite non-negative number (NaN must
  never reach the arithmetic — it slips through every comparison and would poison the balance
  into approving everything).
- Otherwise debit and return the **post-debit balance** (so the caller can derive the pre-debit
  figure as `returned + credits` without a racy follow-up read).
- Reserving down to exactly 0 is allowed.

### `refund(company, credit, credits, pin_lease_id?)`

Add credits back to `local_remaining_credits`, **clamped at `granted_amount`**. No-op if
`credits <= 0` or no lease is in the slot. When `pin_lease_id` is given, the refund applies
**only if** the slot still holds that lease: a hold carved out of expired lease A must never
inflate successor lease B — A's remainder (including this slice) was already refunded to the
company balance server-side when A expired, so crediting B would double-count.

### `extend(company, credit, granted_total, new_expires_at?, pin_lease_id?)` — reconcile to total

After a remote extend, reconcile the slot to the **server-authoritative total**:

- Compute `delta = granted_total - stored granted_amount` **atomically against the currently
  stored total** — never from a caller-held pre-wire-call read (two pods extending concurrently
  from the same stale read would each apply a delta and mint phantom credits). If `delta > 0`,
  set `granted_amount = granted_total` and add `delta` to `local_remaining_credits`. If
  `delta <= 0` (a total a sibling already applied, or a stale lower total) it is a **no-op** —
  applies converge in any order.
- Expiry only ever moves **forward**: `new_expires_at` is applied only if later than the stored
  expiry, so an out-of-order apply cannot shorten a lease a sibling just extended.
- When `pin_lease_id` is given and the slot holds a different lease, drop the whole extend
  (credits and expiry): the server granted the extension to the pinned lease; crediting a
  successor would mint credits the server refunds with the pinned lease at its expiry.
- No-op if the slot is empty.

### `drop(company, credit)`

Remove the slot entry (after a remote release). Plain delete.

### Reservation table: `add`, `get`, `consume`, `reserved_credits`, `sweep_expired`

- `add(reservation)` — register. Idempotent on id. `add` does NOT debit the lease; the debit
  already happened in `try_reserve` (see [ordering](#bounded-leak-contract)).
- `consume(id, credits_consumed)` — **exactly-once claim**: atomically remove the reservation
  from the table; if it was already gone (swept, or consumed by a racing caller) return `null`
  and touch nothing. On a successful claim, clamp `credits_consumed` to
  `[0, credits_reserved]`, refund `credits_reserved - clamped` to the lease (pinned to the
  reservation's `lease_id`), and return the clamped figure. The claim and the refund are two
  steps; the claim is the arbiter (see bounded-leak contract).
- `reserved_credits(company, credit)` — sum of `credits_reserved` across open reservations for
  the slot. A reservation counts iff it is still in the table, so
  `local_remaining_credits + reserved_credits` stays exact between operations.
- `sweep_expired(now)` — remove every reservation with `expires_at <= now` and refund its full
  hold to its lease (pinned to its `lease_id`; a stale-lease hold is dropped, not refunded).
  Returns the number swept. Runs on a background interval (`sweep_interval_ms`) in production;
  vectors call it explicitly.

## Lease manager

Owns the lease lifecycle against the server wire API (`acquire`, `extend`, `release`).

### Acquire (`acquire_if_needed`)

- If the slot holds a **live** lease, return it — no wire call.
- Otherwise call the server: `requested_amount = lease_size`, `expires_at = now +
  lease_duration_ms`. An expired local entry is left in place for `replace` to overwrite
  atomically (deleting it first would open a race window against sibling pods; every reader
  re-guards on expiry anyway).
- On response, `replace` the slot. If `replace` kept an existing lease (a sibling won, or the
  slot's expired row was reconciled in place):
  - If the installed lease has a **different id** than the one the server handed us, ours is a
    redundant hold nobody will draw on — release it (fire-and-forget; a failed release falls
    back to server-side lease expiry).
  - If the ids are the **same** (the server is idempotent for an active slot and handed the
    racing acquire the sibling's lease back), release **nothing** — releasing would pull the
    shared lease out from under every sibling.
  - If the slot reads empty (expired in the gap), also release nothing.
  - Either way, return whatever the slot now holds.
- Wire or store failure: return "no lease" (never throw) — the caller routes it through
  fail-open/fail-closed.
- Per-process single-flight per slot: concurrent callers share one in-flight wire call
  (best-effort; duplicates are absorbed by the idempotent server + `replace`).

### Extend (`maybe_extend`)

Triggered when EITHER:

- `local_remaining_credits / max(granted_amount, 1) <= low_water_mark` (steady-state refresh), or
- the caller passes `required_credits` and `local_remaining_credits < required_credits` (a check
  just failed a reserve of that size — extend opportunistically).

Rules:

- **Never extend an expired lease** — the server treats it as released; the right move is a fresh
  acquire on the next check.
- Wire body: `additional_amount = max(lease_size, required_credits - local_remaining_credits)`.
  Sizing to the shortfall matters: a single check needing more than `remaining + lease_size`
  would otherwise fail its post-extend retry forever regardless of server balance.
  `expires_at = now + lease_duration_ms`.
- On response, reconcile via the store's `extend` with the server's **total** and new expiry,
  **pinned** to the extended lease's id.
- Failures resolve to "no lease" without throwing (often fire-and-forget).
- Per-process single-flight per slot, kept separate from acquire's (an in-flight extend must not
  satisfy an acquire, or vice versa).

### Release on close (`release_all_local_leases`)

Only for a **per-process (in-memory) store**, whose leases are exclusively this process's:
release every live lease over the wire (returning the unspent remainder to the company balance
immediately) and drop it locally; **skip expired** leases (already swept server-side). A shared
(Redis) store must never do this — sibling pods still draw on those leases. Best-effort:
failures fall back to server-side expiry.

## Check flow

`check(eval_ctx, flag_key, { usage, event_subtype?, on_acquire_failure?, ... })` — the
lease-gated feature check. Fallback = the plain (non-lease) flag check, which has its own
degradation story; when the flow "falls back", no reservation is issued and no lease state is
touched beyond what already happened.

Guards, in order:

1. `usage` missing → plain check (lease path not requested).
2. `usage` not a finite non-negative number → resolve **statically** by `on_acquire_failure`
   (deny for fail-closed; blanket allow for fail-open, reason `invalid_usage`). The value must
   never reach the stores.
3. `usage == 0` → nothing to reserve; fall back to the plain check (no 0-credit reservation).
4. No datastream / cached flag / resolvable company (or named user) → fall back.

Then:

5. **Entitlement probe.** Run the rules engine once against the company's *real* balance — no
   substitution, no credit-cost preflight (a preflight against the lease-depleted server balance
   could fail the credit condition and hide the entitlement being probed for). Read the matched
   entitlement's shape:
   - Not credit-metered (`value_type != "credit"`: boolean/override grant, numeric allocation,
     unlimited, or not entitled) → **fall back**, no lease traffic at all.
   - Credit entitlement missing `credit_id`, a positive `consumption_rate`, or a resolvable
     `event_subtype` (caller's explicit subtype wins over the entitlement's) → fall back.
   - Probe error → fall back (it is a resolution step, not the gate).
6. `credit_cost = usage x consumption_rate`.
7. **Acquire** a lease for `(company, credit_id)`. Failure → [failure handling](#failure-handling)
   with reason `lease_acquire_failed`.
8. **Reserve** `credit_cost` via `try_reserve`. On refusal, opportunistically
   `maybe_extend(required_credits = credit_cost)` (awaited) and retry the reserve **once**.
   Still refused → failure handling, reason `insufficient_lease_balance`. Store error →
   failure handling, reason `lease_store_error`.
9. **Record the reservation** (TTL = `reservation_ttl_ms` from now) — *after* the debit, *before*
   the engine gate. If persisting fails, undo the debit (claim-and-refund; direct refund if
   nothing persisted; both pinned to the lease) and go to failure handling
   (`lease_store_error`). If even the undo fails, accept the bounded leak.
10. **Engine gate.** Re-run the engine against a company snapshot whose
    `credit_balances[credit_id]` is substituted with the **pre-reservation** local balance
    (post-debit balance returned by `try_reserve` + `credit_cost` — exact as of the debit, no
    read race), passing `credit_cost = { credit_id: credit_cost }` so the engine evaluates
    `pre_reservation - credit_cost >= 0` — the same arithmetic `try_reserve` just enforced, plus
    every non-credit rule (plan targeting, overrides).
    - Engine **allows** → keep the hold; return `{ allowed: true, reservation }`. Fire-and-forget
      a watermark-driven `maybe_extend`.
    - Engine **denies** → cancel the reservation (claim + full refund) and return
      `{ allowed: false }` with the engine's reason.
    - Engine **errors** → cancel the reservation and resolve **statically** by mode (the engine
      itself is down, so no fail-open re-evaluation is possible).

### Failure handling

Every can't-gate outcome (acquire failed, store unreachable, lease exhausted) funnels through the
configured `on_acquire_failure` mode (default **fail-closed**):

- **fail-closed** → `{ allowed: false }`, reason = the failure reason. No reservation.
- **fail-open** → *err on the side of assuming the credits are there*, **not** blanket allow:
  re-run the engine with the credit balance substituted to an effectively unlimited value
  (`MAX_SAFE_INTEGER` in Node) and the caller's usage preflight threaded through. Plan
  targeting, overrides, and every non-credit condition still apply — a company that is not
  entitled stays **denied** even with the lease backend down. No reservation is issued either
  way; `err` carries the failure reason. Only if that evaluation itself errors does the SDK
  fall back to a blanket allow.

## Track / settle flow

`track_with_reservation(reservation, actual_quantity)` settles a reservation:

1. `credits = actual_quantity x reservation.consumption_rate`.
2. `consume(reservation.id, credits)`:
   - **Settled locally** (claim succeeded): the clamped consumed slice stays debited; the unspent
     slice is refunded to the lease (pinned).
   - **Not settled** (`null`: already swept after TTL, already consumed, or store unreachable):
     local lease state is untouched — if the sweeper already refunded the full hold, nothing
     re-debits the consumed slice, so the local balance reads **high** until the lease rolls
     over. This is why `reservation_ttl_ms` should exceed the longest expected gap between
     `check()` and `track_with_reservation()`.
3. Either way, emit the Track event built from the **caller-held handle** (not the store):
   `event = event_subtype`, `quantity = actual_quantity` (the *unclamped* actual — the server is
   the source of truth for real consumption; only local bookkeeping clamps to the reserved
   amount), `lease_id = reservation.lease_id` (routes the server-side consumption through the
   lease's sub-ledger instead of double-debiting the pre-debited grant), plus the reservation's
   `eval_ctx` company/user and any caller traits.
4. The Track carries a deterministic idempotency key derived from the reservation id
   (`"lease-reservation:" + reservation.id` in Node); the server dedupes by it for 24h, so a
   recovery emit racing the normal emit, or an accidental double settle, collapses to one billed
   event across pods and restarts.
5. Guard: a non-finite or negative `actual_quantity` skips the settle entirely (no store call, no
   event) — the untouched reservation expires at its TTL and the sweeper refunds the full hold.

## Configuration knobs

| knob (vector key) | Node name | default | meaning |
| --- | --- | --- | --- |
| `lease_duration_ms` | `defaultLeaseDuration` | 300 000 (5 min) | Lease lifetime requested at acquire/extend (`expires_at = now + duration`). |
| `reservation_ttl_ms` | `defaultReservationTTL` | 60 000 (60 s) | Reservation lifetime; the sweep deadline. Size above the longest expected check→track gap. |
| `lease_size` | `defaultLeaseSize` | 10 000 | Credits requested per acquire, and the minimum extend tranche. |
| `low_water_mark` | `lowWaterMark` | 0.25 | Remaining/granted ratio at or below which a background extend is kicked off. |
| `sweep_interval_ms` | `sweepIntervalMs` | 1 000 | Expired-reservation sweep cadence. |
| — | `onAcquireFailure` | `fail-closed` | Per-check failure mode (see check flow). |

Per-credit-type overrides of the first four are supported (keyed by credit type id); resolution is
override → client config → default.

## Bounded-leak contract

The flow deliberately orders its two-step transitions so that a process crash between steps leaks
*locally held credits* (which the server reclaims at lease expiry) rather than enabling a
double-spend. The invariant direction is always: **the debit/claim is durable first; the
record/refund may be lost.**

| # | crash window | what leaks | bound | reclaimed by | must NOT happen |
| --- | --- | --- | --- | --- | --- |
| 1 | after `try_reserve` (debit), before `add` (record) | the debited hold — invisible to the reservation table, so the sweeper can never refund it | `credits_reserved` of that one check | lease expiry: the expired balance is never served again, and the server refunds the whole grant; the successor lease installs at full grant | a reservation record without a debit (a later consume would refund credits never held → double-spend). Vectors pin that the debit lands strictly before the record. |
| 2 | inside `consume`: after the claim, before the refund | the unspent slice of that reservation | `credits_reserved` of that one reservation | lease expiry (same mechanism) | a double refund: the claim is exactly-once, so a retried settle or a sweeper finds nothing to claim and refunds nothing |
| 3 | (Redis only) after the claim, before index cleanup | nothing (bookkeeping only): the per-slot reserved-credits index transiently over-counts | one index field | the sweeper reconciles the orphaned index entry — **without refunding** (without the claimed record, exactly-once cannot be arbitrated across racing sweepers) | a refund driven by an index entry alone |

Additional pinned properties:

- A leak never survives its lease: after lease expiry the stale balance is refused
  (`try_reserve → null`) and a successor lease restores the full grant.
- A retried check after a window-1 crash settles independently: its own slice refunds exactly
  once; the leaked slice never refunds.
- A late retried settle after a window-2 crash (even after a successor lease is installed)
  refunds nothing into the successor.

## Invariants not expressible as vectors

These hold in the reference implementation but need concurrency, wall clocks, or non-JSON values
to demonstrate; ports must uphold them and should test them natively.

1. **Per-slot atomicity.** `replace`, `try_reserve`, `refund`, `extend` are atomic per lease
   slot; `consume`'s claim is atomic per reservation. In-memory: per-key mutual exclusion. Redis:
   single-key Lua scripts (single-key keeps them Redis-Cluster-safe; the refund to the lease hash
   is deliberately a separate single-key step, never a multi-key script — see leak window 2/3).
2. **Server-clock expiry (shared backend).** With a shared store, lease expiry must be decided
   against the *store's* clock (Redis `TIME`), not the calling process's — pods with skewed
   clocks must agree on liveness. Backend rows carry a TTL grace window past `expires_at`
   (60 s lease / 30 s reservation in Node) so the sweeper can still read them; expired-but-not-
   evicted rows must still refuse reserves.
3. **NaN/precision guards.** Non-finite or negative amounts are rejected at every boundary
   (`usage`, `try_reserve`, `actual_quantity`) — JSON cannot encode NaN, so vectors only cover
   the negative case. Fractional credit amounts are legal throughout (rates like 0.1); Redis
   stores balances as strings to avoid integer truncation.
4. **Single-flight.** Per-process, per-slot single-flight for acquire and for extend, tracked
   separately. Best-effort only: duplicate wire calls are safe (idempotent server + keep-first
   `replace` + reconcile-to-total `extend`).
5. **Concurrent cross-pod extends converge.** Two pods extending from the same stale read must
   not double-count — guaranteed by reconcile-to-total computed inside the store (the sequential
   out-of-order-totals vector pins the arithmetic; the concurrent schedule needs a race).
6. **Idempotent billing.** The Track idempotency key is deterministic from the reservation id;
   the server dedupes for 24h. Double settles and recovery emits collapse to one billed event.
7. **Background sweep loop.** `start_sweep`/`stop` run `sweep_expired` on an interval; timers
   must not keep the process alive. Vectors call `sweep_expired` explicitly instead.
8. **Fire-and-forget never rejects.** `acquire_if_needed`, `maybe_extend`, and release paths
   resolve (to "no lease") on failure rather than rejecting — they are often unawaited.
9. **Offline/unconfigured degradation.** Lease config absent → `check` is a plain flag check;
   `track_with_reservation` on an unconfigured client still emits the billing event with the
   `lease_id` and idempotency key intact.
