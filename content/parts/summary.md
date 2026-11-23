---
page: summary
title: "The one-page summary"
budget_words: 800
note: "Each H2 is one recall block: hidden behind its heading in recall mode, all shown in print."
---

# The one-page summary

## RESHAPE in 35 minutes

| Step | Min | Ask yourself | LLM add-on |
|---|---:|---|---|
| **R**equirements | 4 | Who, what, how well? Name the 2–3 drivers and the non-goals | Quality bar; what must be refused |
| **E**stimate | 3 | Load, storage, bandwidth, then one decision | Tokens in and out, $/day, TTFT + output ÷ tok/s |
| **S**urface & schema | 3 | APIs, entities, keys that make the hard query cheap | Tools, output schema, what goes in the context |
| **H**igh-level | 6 | Simplest end-to-end design; walk one request | Lowest rung that meets the bar |
| **A**nalyse | 12 | The hardest part: two options, numbers, decide | Retrieval, routing, agent control, evals |
| **P**ressure-test | 5 | 10× load, failures, hot spots, abuse | Trifecta, guardrails, fallbacks, cost caps |
| **E**valuate | 2 | Trade-offs taken, SLOs, next steps | Offline evals, online signals, release gate |

Working design by minute 16. Check in every 8 minutes. Decide; don't list.

## Requirements checklist

- **Functional:** the top 3 use cases, and what's out of scope.
- **Scale:** users, daily actives, read:write ratio, peak factor, growth.
- **Quality:** p99 latency, availability, consistency per data type, durability.
- **Data:** size, retention, privacy, residency, cost ceiling.
- **LLM:** what good looks like, how it's measured, the cost of a wrong answer, what must be refused, and who signs off.

## Estimation sheet

- 1 day ≈ 10⁵ s · 1 M/day ≈ 12/s · peak ≈ 2–3× average
- 2¹⁰ ≈ 10³: KB → MB → GB → TB → PB · 1 TB/day ≈ 12 MB/s
- Memory 100 ns · SSD 100 µs · data-centre round trip 0.5 ms · between continents 100–150 ms
- 99.9% ≈ 9 h down a year · 99.99% ≈ 53 min · in series multiply; in parallel 1 − (1 − a)ⁿ
- Little: in flight = arrival rate × time in system · run servers at 60–70% busy
- Tokens: 1 ≈ 0.75 words ≈ 4 characters · output ≈ 60–110 tok/s (Nov 2026)
- Agents ≈ 4× chat tokens · multi-agent ≈ 15× · weights ≈ 2 bytes per parameter at 16-bit
- Evals: ±11 points at 50 cases, ±3.5 at 500 · ten steps at 95% ≈ 60% end to end

## Need → use → cost

| Need | Use | Cost |
|---|---|---|
| Spread load, survive a lost server | Load balancer + stateless servers | Sessions move out; the LB needs a pair |
| Fast repeated reads | Cache-aside + TTL | Stale reads; stampedes on hot keys |
| Content near global users | CDN | Invalidation lag |
| More read capacity | Read replicas | Lag breaks read-your-writes |
| More write capacity or data | Sharding (hash or range) | Cross-shard queries; hot partitions |
| Slow work off the request path | Queue + workers | Eventual results; needs idempotency |
| Fan out events, replay history | Partitioned log | Order only within a partition |
| Survive abuse and overload | Rate limits, load shedding | Real users throttled |
| Big files | Object storage + CDN | Metadata lives elsewhere |
| Real-time to clients | SSE or WebSockets | Stateful connections |
| Consistency across services | Saga + outbox | Compensations; eventual consistency |
| Knowledge the model lacks | RAG: hybrid search + rerank | Retrieval caps answer quality |
| Behaviour the model lacks | Prompting, then fine-tuning | Data, evals, retuning on upgrades |
| Cheaper, faster LLM calls | Routing, prompt caching, batch API | Misroutes; needs a stable prefix |
| Proof a change helps | Evals + release gate | Test-set upkeep; judge calibration |
| Safe agents | Least privilege, approvals, break the trifecta | Less autonomy |

## Scaling ladder (classic)

One box → separate database → load balancer + stateless servers → cache + CDN → read replicas → queues → shards → services → regions. Climb only when the numbers say so.

## Complexity ladder (LLM)

Single call, with retrieval if needed → workflow (chain, route, parallelise, orchestrate, evaluate–optimise) → single agent (tools in a loop, with step and cost caps) → multi-agent (≈ 15× tokens; only for broad tasks that split into parallel parts).

## Pressure-test list

- Single points of failure and failover; correlated failures (same zone, same deploy)
- Hot keys, celebrity accounts, thundering herds
- Timeouts, retries with backoff and jitter, retry budgets, idempotency keys
- Overload: back-pressure, load shedding, graceful degradation
- Consistency: replication lag, dual writes, ordering
- Data: backups, RPO and RTO, migrations by expand–contract
- Security: authentication vs authorisation, rate limits, encryption, tenant isolation
- LLM: the trifecta (private data + untrusted content + a way out), false alarms at volume, provider fallback, runaway cost, upgrades behind evals
- Observe: SLIs and SLOs, traces, alerts on symptoms

## Seven root facts

1. Machines are finite.
2. Distance costs time.
3. Parts fail, and networks split.
4. Agreement costs round trips.
5. Queues grow fast near full utilisation.
6. Models are probabilistic, priced per token, and produce one token at a time.
7. Inputs can be hostile, and models can't reliably tell instructions from data.

## Senior phrases

- “The requirement that drives this design is …”
- “At about X per second this fits on one node, so …”
- “Two options: … I'll pick … because …; it costs …”
- “What breaks first at 10× is …”
- “If this dependency is down, we degrade to …”
- “We'll know it works when … (SLO or eval).”

## Six pitfalls

Designing before scoping · no numbers · building agents, microservices or shards before you need them · listing options without deciding · ignoring failure and operations · talking without checking in.
