---
part: "3"
---

## 3.1 Consistency and coordination {#3.1}

::: inshort
“Consistent” hides several promises, and each costs round trips. Default isolation allows write skew, quorums aren't linearizable, a leader needs a fencing token as well as a lease, and an action across services is a saga, not a transaction.
:::

::: refresher 1.6#databases
A **leader** takes every write and streams changes to **read replicas**; a replica that hasn't caught up serves stale reads (**replication lag**).
:::

::: refresher 1.6#failure
**Failover:** detect that the leader is gone, promote the most up-to-date replica, redirect clients, and stop the old leader writing.
:::

{{predict 3.1-p1}}

### Isolation levels and write skew ★★ {#isolation}

**Bottleneck:** transactions interfering inside one database. **Root fact:** 4.

ACID's isolation comes in levels, and most databases default to a weak one: read committed in PostgreSQL, repeatable read in MySQL.

| Level | Each transaction… | Still allows |
|---|---|---|
| **Read committed** | Sees only committed data | A row changing between two reads |
| **Snapshot isolation** | Reads one consistent snapshot | Write skew |
| **Serializable** | Behaves as if it ran alone | Nothing; conflicts abort, so retry |

In **write skew**, two transactions read the same snapshot, then each writes a different row, so no write conflicts. Two on-call doctors each see the other still on call, and both sign off. Prevent it with serializable isolation, or by locking the rows you read (`SELECT … FOR UPDATE`).

### Quorums ★★ {#quorums}

**Bottleneck:** leaderless copies must still return recent writes. **Root facts:** 3 and 4.

In a Dynamo-style store such as Cassandra, each key lives on N nodes. A write waits for W of them to acknowledge; a read asks R and keeps the newest version. If R + W > N, every read overlaps every write on at least one node: with N = 3, W = 2 and R = 2, one node can be down without blocking either.

The second “why?”: overlap isn't linearizability. A write that failed after reaching one node may or may not be seen; concurrent writes are ordered by timestamp, so clock skew can drop the later one; and a **sloppy quorum** breaks the overlap during a partition. Quorums buy availability, not a safe bank balance.

### Consensus, leases and fencing ★★★ {#consensus}

**Bottleneck:** nodes must agree on one leader despite failures. **Root fact:** 4.

**Consensus** algorithms such as Raft and Paxos get a group to agree on a value, such as who leads, while a majority is up: 3 nodes survive 1 failure, 5 survive 2. Each decision costs a round trip to a majority, so keep it for small, critical state (leadership, configuration, locks), used through a coordination service such as etcd or ZooKeeper.

Leadership is a **lease** that expires unless renewed, so a cut-off leader should stop. But a process can pause for seconds, for garbage collection or a stalled virtual machine, then wake after its lease has passed to someone else, and write anyway. **Fencing tokens** close the gap: each lease carries a higher number, and storage rejects any write with a lower one than it has seen.

{{fig fencing-tokens}}

::: signal
“Leader election through etcd, with leases and fencing tokens that storage checks.” **Expect next:** “Isn't a heartbeat timeout enough?” No: a paused leader can't know it was replaced, so storage has to check.
:::

### Two-phase commit, sagas and the outbox ★★★ {#sagas-outbox}

**Bottleneck:** one business action spanning services, each with its own database. **Root facts:** 3 and 4.

**Two-phase commit** has a coordinator ask every participant to prepare, then commit. It's atomic, but participants hold locks while they wait, a coordinator crash between phases blocks them, and every participant must be up. A **saga** chains local transactions instead (reserve stock, charge, book shipping); if a step fails, **compensating actions** undo the earlier steps in reverse. Sagas stay available, but in-between states are visible, and every step and compensation must be idempotent, because each may be retried.

Each step must also announce itself. Writing the database, then publishing to a queue, can fail in between and lose the event: a **dual write**. Instead, write the event to an **outbox** table in the same local transaction as the change; a relay, or change data capture, publishes it at least once.

::: signal
“Order placement is a saga with compensations; each service publishes through an outbox.” **Expect next:** “Why not two-phase commit?” It blocks while the coordinator is down and ties every service's availability together.
:::

### Metastable failures and cells ★★ {#metastable-cells}

**Bottleneck:** failures that outlast their cause, or reach everyone. **Root facts:** 3 and 5.

A **metastable failure** persists after its trigger has gone, held up by the system's own feedback (Bronson et al., 2021). A brief slowdown causes timeouts; clients retry, doubling the load; the extra load causes more timeouts. Removing the trigger doesn't end it. Cut the feedback instead: shed load, cap retries with a budget, then readmit traffic gradually while caches warm.

**Cells** limit the **blast radius**: identical, independent copies of the whole stack, each serving a slice of customers behind a thin router. A bad deploy or a poison request then takes down one cell, not everyone. The cost is duplicated infrastructure, and features that need data from many cells.

### Decision table {#decision}

| Need | Use | What it costs |
|---|---|---|
| No write skew inside one database | Serializable isolation, or locking the rows read | Aborts and retries under contention |
| Leaderless reads that see recent writes | R + W > N | Slower reads and writes; still not linearizable |
| Exactly one leader | Consensus, leases and fencing tokens | A round trip to a majority per decision |
| One action across services | A saga with compensations | Visible in-between states; idempotent steps |
| Escape a retry storm | Load shedding, retry budgets, slow readmission | Requests refused for a while |
| Keep one failure from reaching everyone | Cells | Duplicated infrastructure |

{{check 3.1}}

## 3.2 Changing and extending live systems {#3.2}

::: inshort
A live system can't stop for upgrades, and old and new code always run side by side. So every change, to schema, data or code, must work with both versions, and every second copy of the data must come from one source of truth's change log, never from two writes.
:::

::: refresher 2.3#partitioning-schemes
**Partitioning** sends each key to a shard by range, by hash or through a directory; consistent hashing moves only a small slice of keys when a node joins.
:::

::: refresher 3.1#sagas-outbox
**The outbox:** write each event in the same local transaction as the change, and let a relay publish it.
:::

{{predict 3.2-p1}}

### Resharding and cross-shard queries ★★ {#resharding}

**Bottleneck:** shards fill up or heat up while serving traffic. **Root facts:** 1 and 4.

Plan for it from day one: create many more logical partitions than machines, say 1,000 on 10, and move whole partitions rather than rehashing keys. To move one live, copy a snapshot, catch up from the change log, verify, switch the routing, and delete the old copy, throttled to spare live traffic.

A query without the shard key asks every shard and waits for the slowest (**scatter-gather**), so its tail latency grows with the shard count. A **secondary index** helps. A local one lives on each shard: cheap writes, but reads still scatter. A global one is partitioned by the indexed value: one-shard reads, but each write also updates another shard, usually asynchronously.

### Expand–contract ★★ {#expand-contract}

**Bottleneck:** a change that breaks whichever version is still running. **Root fact:** 3.

**Expand–contract** splits a breaking change into steps that each work with both old and new code. To rename `fullname` to `display_name`:

{{fig expand-contract}}

You can stop or roll back after any step before the drop, and the same method works for API fields and message formats. The backfill in step 2 runs in small batches, throttled by replication lag and p99 latency, resumable from a checkpoint and safe to rerun: a backfill at full speed is a load spike you caused yourself.

### Dual writes and change data capture ★★ {#dual-writes-cdc}

**Bottleneck:** keeping a second store, such as a search index, in step. **Root facts:** 3 and 4.

With **dual writes**, the app writes to the database and then to the index. Either write can fail after the other succeeds, a timeout can hide a write that did succeed, and two requests can land in different orders in each store, so the copies drift for good. Make the database the single source of truth instead. **Change data capture** reads the database's own change log and applies each change, in commit order, to the other store. For business events rather than row changes, use the outbox.

::: signal
“The search index is fed by change data capture from the orders table, a few seconds behind.” **Expect next:** “Why not write both from the app?” Two writes to two systems aren't atomic, and one source of truth can't disagree with itself.
:::

### Safe rollouts ★★ {#rollouts}

**Bottleneck:** tests can't reproduce production, and most outages follow a change. **Root fact:** 3.

At Google, changes to a live system caused {{num outages_from_changes}} of outages. So release in steps that can be undone:

- **Shadow traffic:** copy real requests to the new version and compare its answers, without serving them.
- **Feature flags:** ship code switched off, then turn it on per user or percentage, and off again instantly.
- **Canary:** release to a small share of traffic, compare its error and latency SLIs with the old version's, and widen gradually.
- **Automatic rollback** on regression, which works only if the data changes stayed backward compatible.

### Specialist toolbox ★ {#toolbox}

| Need | Use | The catch |
|---|---|---|
| Find documents by their words | An **inverted index** (e.g., Elasticsearch), fed by change data capture | A second copy, seconds behind |
| Find things near a point | **Geohash** or **quadtree** cells, plus the neighbouring cells | Points near a cell's edge |
| “Seen this before?” at huge scale | A **Bloom filter**: {{num bloom_bits}} | False positives, never false negatives |
| Distinct counts at huge scale | **HyperLogLog**: {{num hll_size}} | An estimate, not an exact count |
| Metrics and sensor readings | A **time-series store**, rolling old data up | A label such as a user ID explodes the series count |
| Live totals over a time window | **Stream processing** (e.g., Flink) over a log, keeping state through crashes | Late and out-of-order events |
| Heavy writes, or fast reads | **LSM trees** write fast and compact later; **B-trees** read fast and update in place | Write cost against read cost |

{{check 3.2}}

## 3.3 LLM serving and retrieval internals {#3.3}

::: inshort
Self-hosted serving is sized from memory: the weights plus the KV cache of every request in flight, and serving engines exist to waste less of both memory and GPU time. Retrieval at scale needs approximate indexes, and some questions need several searches.
:::

::: refresher 2.5#prefill-decode
**Decode** writes one token at a time, reading all the weights at each step, and every generating request holds a **KV cache** in GPU memory.
:::

::: refresher 2.5#rag-pipeline
**Hybrid search**: vector and keyword search side by side, filtered by permissions, fused and reranked to about five passages.
:::

{{predict 3.3-p1}}

### Self-hosting capacity ★★★ {#gpu-capacity}

**Bottleneck:** GPU memory must hold the weights and every request in flight. **Root facts:** 1 and 6.

Weights take {{num weight_bytes}}, and on top come the KV caches of every concurrent request. Accelerators offer {{num gpu_memory}}. For an 8B model serving 20 requests a second, each taking 6 seconds with 8k tokens of context:

| Step | Working | Result |
|---|---|---|
| Weights at 16-bit | 8 × 10⁹ × 2 bytes | ≈ 16 GB per GPU |
| KV cache per request | 17 GB at 128k tokens ÷ 16 | ≈ 1 GB |
| In flight, by Little's law | 20 a second × 6 s | 120 requests ≈ 120 GB |
| GPUs of 80 GB | 120 GB ÷ (80 − 16) GB each | 2, or 3 with headroom |

Decode speed has a floor too: every step reads all the weights, so at 3.35 TB/s a 16 GB model manages about 200 steps a second. Batching shares each read among many requests, which is why throughput per GPU rises with concurrency.

::: signal
“16 GB of weights, about 1 GB of KV cache per request, 120 in flight: two 80 GB GPUs, three with headroom.” **Expect next:** “How do you fit more?” Quantize to 8-bit, page the KV cache, and cap the context length.
:::

### Inside a serving engine ★★ {#serving-internals}

**Bottleneck:** idle GPU time and wasted memory. **Root facts:** 1 and 5.

Serving engines, such as vLLM, combine:

- **Continuous batching:** new requests join the running batch at every decode step.
- **Paged KV cache:** the cache is stored in small blocks, like virtual-memory pages, so little sits reserved but unused (wasted KV memory: {{num paged_kv}}).
- **Prefix caching:** requests that share an opening reuse its KV cache, the self-hosted version of prompt caching.
- **Quantization:** weights, and often the KV cache, in 8 or 4 bits instead of 16, halving or quartering their memory for a small quality loss that evals must confirm.
- **Speculative decoding:** a small draft model guesses several tokens ahead, and the big model checks them in one step: {{num speculative_speedup}}.

Bigger batches raise tokens per second, and so cut cost, but make each request wait longer: root fact 5 again. **Goodput** counts only the requests that meet their latency target, so tune for goodput, and give interactive and batch traffic separate pools.

### Vector indexes ★★ {#vector-indexes}

**Bottleneck:** comparing a query with millions of vectors. **Root fact:** 1.

Exact search compares the query with every vector: fine up to about a million, too slow beyond. **Approximate nearest-neighbour** (ANN) search trades a little recall for speed. The most common index, **HNSW**, is a layered graph: a search starts on a sparse top layer with long links, then drops to denser layers to refine, like flying, then driving, then walking. Filters, such as tenant or permission, must apply during the search, not after it, or a filtered query can come back nearly empty. Storing vectors in 8 bits instead of 32 makes the index {{num vector_quantization}}, for a small loss of recall.

### Agentic retrieval ★★ {#agentic-retrieval}

**Bottleneck:** some questions need several searches. **Root fact:** 6.

“Compare our refund policy in 2024 and 2026” needs two searches. In **agentic retrieval**, the model decides what to search for, reads the results, and searches again until it has enough. It handles multi-part questions far better, at the cost of more calls, latency and predictability. Run the fixed pipeline by default, let the model loop only for the questions that need it, cap its searches, and log every query for evals.

### Reasoning tokens and non-determinism ★★ {#determinism}

**Bottleneck:** thinking costs output tokens, and the same prompt can give different answers. **Root fact:** 6.

**Reasoning models** write intermediate steps before their answer. They help with maths and planning, but they're generated at decode speed and billed as output: for example, {{num reasoning_tokens}}. Cap the reasoning budget, and route easy requests to models that answer directly. Even at temperature 0, outputs vary in practice: 1,000 identical requests gave {{num temperature_zero}}, because the server's batch size changes the order of the arithmetic. So validate outputs, evaluate over several runs, and never assume a replay reproduces an answer.

{{check 3.3}}

## 3.4 Agents, quality and operations at depth {#3.4}

::: inshort
Several agents pay off only when work splits cleanly, and context decides most of an agent's quality. Judges and small eval sets mislead predictably, models change underneath you, and every installed tool is untrusted input.
:::

::: refresher 2.6#workflows-agents
**Workflows** fix the steps in code; an **agent** picks tools in a loop, within caps enforced in code.
:::

::: refresher 2.6#evals
A trustworthy eval needs a realistic **test set**, calibrated **graders** and a **release gate** that no slice may fail.
:::

{{predict 3.4-p1}}

### Multi-agent systems ★★ {#multi-agent}

**Bottleneck:** one context can't hold a broad task. **Root fact:** 6.

Before reaching for several agents, check whether a fixed workflow fits:

{{fig workflow-patterns}}

In a **multi-agent** system, a lead agent splits the task and gives each sub-agent a focused brief and a clean context; the sub-agents work in parallel, and the lead merges their findings. It suits broad work that separates cleanly, such as researching many sources at once. The costs: many times the tokens ({{num agent_tokens}}), information lost at every hand-off, and runs that are hard to debug. Avoid it for tightly coupled work, such as editing one codebase, where every agent needs the others' decisions.

### Context engineering and memory ★★ {#context-memory}

**Bottleneck:** the context fills up with stale material. **Root facts:** 6 and 7.

**Context engineering** is choosing what goes into each call. In a long run the transcript grows at every step, so calls slow down, cost more and lose focus. Compact old tool results into summaries, keep the task's state in a structured note outside the context, fetch details just in time, and load only the tools the current step needs.

**Memory** belongs to your system, not the model: stored outside and put back into the prompt. Treat long-term memory as user data, scoped per user, visible, deletable and expiring, and check what gets stored: memory written from untrusted content can carry an attacker's instructions into later sessions.

### Eval statistics and judges ★★★ {#eval-statistics}

**Bottleneck:** a judge or a small test set can tell you what you hope to hear. **Root fact:** 6.

Sample size sets what an eval can detect. Around 80%, the 95% interval is {{num eval_interval}}, and detecting a drop to 75% takes {{num eval_detect_5pts}} cases. So compare versions **pairwise**, on the same cases, which shows smaller differences with fewer cases, and report results per slice, because an average can hide a regression in one.

Model judges have known biases: they tend to favour the answer shown first (**position bias**), longer answers, and answers in their own model's style. So swap the order and average, grade against narrow yes-or-no criteria rather than a score out of 10, and calibrate each judge against human labels on your own task.

### Tool poisoning and the supply chain ★★ {#supply-chain}

**Bottleneck:** third-party tools are untrusted input too. **Root fact:** 7.

Tool descriptions and results land in the model's context, so they can carry injected instructions: **tool poisoning**. A tool can also change after you approved it: a **rug pull**. So pin tool versions and review every change, give each tool least-privilege credentials, require approval for consequential actions, and run tools in a sandbox.

### Model lifecycle ★★★ {#model-lifecycle}

**Bottleneck:** models change and retire on the provider's schedule. **Root fact:** 6.

Pin exact model versions, so nothing changes silently. When a retirement notice arrives, start early: run the regression evals on the candidate model, compare slices such as language, customer tier and task, retune the prompts that regress, then canary a share of traffic through the gateway, with rollback. Alert when live signals drift: thumbs-down, hand-offs, refusals, a judge's score on sampled traffic, or cost per request.

### Tenants, incidents and governance ★★ {#llm-operations}

**Bottleneck:** LLM failures rarely look like crashes. **Root facts:** 1, 3 and 7.

- **Tenants:** token quotas per tenant at the gateway, priority for interactive work, and retrieval, caches and memory scoped per tenant.
- **Runaway cost:** cap the cost per task and per tenant, and alert on the rate of spend.
- **A bad prompt release:** quality falls while every dashboard stays green, so version prompts like code, gate them with evals, canary them, and roll back fast.
- **Governance:** redact personal data before it reaches a provider or a log, set retention periods, keep data in the regions the law requires, and record which model and prompt produced each answer.

### Toolbox: protocols and fine-tuning ★ {#toolbox}

| Name | What it is |
|---|---|
| **MCP** (Model Context Protocol) | An open standard for connecting models to tools and data: it standardises the plumbing, not trust |
| **A2A** (Agent2Agent) | A protocol for agents from different systems to hand tasks to each other |
| **Supervised fine-tuning** | Further training on example inputs and ideal outputs |
| **Preference tuning** (e.g., DPO) | Training on pairs of better and worse answers |
| **Distillation** | Training a small model on a large one's outputs, for one task |
| **LoRA** | Training a small add-on instead of all the weights: {{num lora_size}} |

{{check 3.4}}

## 3.5 Pattern cards: twelve designs {#3.5}

::: inshort
Most prompts are variations on a dozen designs. Know each one's crux, the decision that settles it and the senior detail, and your Analyse step starts in the right place.
:::

Six classic designs, then six LLM ones. Before each card, spend 30 seconds writing down what makes it hard, then reveal the crux. In the interview, still run RESHAPE: the card shows where your 12 minutes of analysis go.

### Chat and messaging ★★ {#chat}

{{crux 3.5-k1}}

- **Shape:** one-to-one and group messages within a second, in order within each conversation; offline users catch up later.
- **Design:** WebSockets to a connection tier; messages numbered per conversation, stored by conversation and time, and routed by pub/sub; offline users get a push.
- **Key decision:** order per conversation, never globally; delivery at least once, de-duplicated by message ID.
- **Senior depth:** a huge group behaves like a celebrity, so its members pull; end-to-end encryption rules out searching on the server.

### Ride-hailing and nearby search ★★ {#proximity}

{{crux 3.5-k2}}

- **Shape:** match a rider with a nearby driver in seconds, while a million drivers send 250,000 location updates a second.
- **Design:** an in-memory index of map cells, per city; search the rider's cell and its neighbours, and rank drivers by arrival time.
- **Key decision:** keep only each driver's latest location, in memory: it's replaced every few seconds anyway.
- **Senior depth:** two riders must never get one driver, so assign with an atomic compare-and-set that expires; split dense cells finer.

### Video upload and streaming ★★ {#video}

{{crux 3.5-k3}}

- **Shape:** uploads of several gigabytes, and playback that starts within two seconds, anywhere.
- **Design:** resumable uploads to object storage; a queued job transcodes short segments in parallel at several bitrates; a CDN serves them, and the player picks each segment's quality (**adaptive bitrate streaming**).
- **Key decision:** transcode per segment, in parallel, and publish once the first qualities are ready.
- **Senior depth:** views follow a power law: keep hits at the edge, and extra qualities only for popular videos.

### File storage and sync ★★ {#file-sync}

{{crux 3.5-k4}}

- **Shape:** large files kept in step across devices that go offline; most edits are small.
- **Design:** files split into chunks named by a hash of their content, with only missing chunks uploaded to object storage; a relational service holds versions and chunk lists.
- **Key decision:** chunks never change, so de-duplicating and caching them is safe; only the metadata needs strong consistency.
- **Senior depth:** content-defined chunking stops one insertion from shifting every later chunk; conflicting offline edits keep both copies.

### Web crawler ★★ {#crawler}

{{crux 3.5-k5}}

- **Shape:** billions of pages, recrawled on a schedule, politely and without repeats: a few hundred pages a second.
- **Design:** a **URL frontier** of priority queues feeds one queue per host, drained at a polite rate; a Bloom filter skips links already seen, and content hashes catch duplicate pages.
- **Key decision:** speed comes from crawling many hosts at once, never one host faster.
- **Senior depth:** crawler traps generate URLs forever, so cap the depth and URLs per host; recrawl each page as often as it changes.

### Ticketing and flash sales ★★ {#ticketing}

{{crux 3.5-k6}}

- **Shape:** 10,000 seats, a million people arriving at 10:00:00, and no seat sold twice.
- **Design:** a waiting room admits buyers at the rate booking can take; a hold is one atomic conditional update that expires after 10 minutes; payment carries an idempotency key.
- **Key decision:** seat inventory chooses consistency, while event pages come from the CDN, seconds stale.
- **Senior depth:** one event's seats are hot by design: atomic operations in memory, or split by section.

### Self-hosted LLM inference API ★★ {#inference-api}

{{crux 3.5-k7}}

- **Shape:** an open-weights model served to many teams, with a first-token target; GPU hours are the bill.
- **Design:** a gateway enforces quotas; a router picks a replica with free KV-cache memory; replicas run continuous batching and a paged KV cache, and scale on queue depth, not CPU.
- **Key decision:** size by concurrency × context length, not requests per second, and keep interactive and batch traffic apart.
- **Senior depth:** a new replica takes minutes to load its weights, so keep a warm minimum.

### Enterprise AI gateway ★★ {#ai-gateway}

{{crux 3.5-k8}}

- **Shape:** every team's model calls through one control point: hundreds of apps, several providers.
- **Design:** stateless replicas across zones; provider keys stay inside; token quotas per team; model aliases with fallback chains; logs sent asynchronously, redacted.
- **Key decision:** a thin hot path: authentication, quota and routing only.
- **Senior depth:** fail closed on authentication and quotas, but never fail a call because logging is down.

### Coding-agent platform ★★ {#coding-agent}

{{crux 3.5-k9}}

- **Shape:** agents that take an issue, change code, run the tests and open a pull request.
- **Design:** a fresh sandbox per task, with no production credentials and network access only to the package registry; a capped agent loop edits and tests; people review and merge.
- **Key decision:** tests and human review are the quality bar, never the agent's own verdict.
- **Senior depth:** issues and dependencies can carry injection, so the sandbox holds no secrets and can write only its own branch.

### Eval and release pipeline ★★ {#eval-pipeline}

{{crux 3.5-k10}}

- **Shape:** every prompt, model, retrieval or tool change, across many features, must prove it isn't worse.
- **Design:** versioned test sets with slices, run in parallel and batched where waiting is fine; code checks, calibrated judges and reviewers grade; a gate compares each slice with the baseline.
- **Key decision:** compare pairwise against the baseline, on the same cases, and gate each slice.
- **Senior depth:** pin and recalibrate the judge, and keep a held-out set that nobody tunes prompts against.

### Text-to-SQL analytics assistant ★★ {#text-to-sql}

{{crux 3.5-k11}}

- **Shape:** plain-language questions about a warehouse with hundreds of tables.
- **Design:** retrieval over a catalogue of tables and verified example queries picks the schema; code checks the model's SQL, allows only reads, and runs it on a replica as the asking user.
- **Key decision:** the database enforces permissions, never the prompt.
- **Senior depth:** grade result sets, not SQL text, since two queries can both be right; a semantic layer defines terms such as “active customer” once.

### Semantic search over 100 million documents ★★ {#semantic-search}

{{crux 3.5-k12}}

- **Shape:** 500 million chunks, permission filters on every query, and changes visible within minutes.
- **Design:** about 2 TB of vectors at 1,024 dimensions, so quantize to 8 bits and shard the approximate index beside a keyword index; change events feed the embedding pipeline.
- **Key decision:** quantize and shard the vectors, and keep hybrid ranking for exact terms.
- **Senior depth:** a new embedding model means re-embedding everything, so build the new index alongside and switch over gradually.

## 3.6 Mock B: meeting assistant {#3.6}

::: inshort
The LLM mock, run like Mock A: an unseen prompt, 35 minutes on the clock, out loud and on paper, then an honest score. This time the quality bar comes first, the estimate is in tokens, and the lethal trifecta must be broken by design.
:::

::: refresher 2.8
Start the timer, write your clarifying questions before revealing the card, talk and draw throughout, answer each probe when it unlocks, then score every line 0, 1 or 2, and listen back.
:::

Three things this prompt rewards: a measurable quality bar agreed before any design; tokens, cost and time estimated before you choose a model; and the lowest rung of the complexity ladder that meets the bar, with the trifecta broken in the architecture, not in the prompt.

Interviewing only for classic roles? Run a classic prompt from {{appendix E}} instead.

**Ready at the senior bar** means the same as for Mock A: at least 75% overall, no zero on a Requirements, Estimate, Analyse or Pressure-test line, an average of 1.5 or more on Analyse and Pressure-test, and at least one probe handled before its card opened.

{{mock mock-b}}

## 3.7 The finish {#3.7}

::: inshort
Six questions drawn from the whole guide, then the routine for the last day: protect what you've learned rather than adding to it, and walk in with the one-page summary fresh.
:::

### The final check ★★★ {#final-check}

Take it closed-book, on paper, in one sitting. Like an interview, the questions don't say which module they come from, so expect a lower score than usual: mixing topics is what trains you to recognise which tool a problem needs. Re-read the section linked to each miss today, and re-test it tomorrow.

{{check 3.7}}

### Interview day ★★★ {#interview-day}

- **The night before:** stop new material by early evening, re-test your error log once, and sleep a full night: sleep consolidates what you learned, and an all-nighter costs more than it buys.
- **Two hours before:** a short warm-up on an unseen prompt primes the procedure without tiring you. Try one now:

{{item 3.7-d1}}

- **One hour before:** the one-page summary in recall mode, ending on the pressure-test list and the senior phrases. Open nothing new.
- **Thirty minutes before:** test the camera, microphone and drawing tool, and keep paper and a pen as a backup.
- **In the room:** say the first RESHAPE step out loud, keep to the time boxes, and check in about every 8 minutes. If your mind goes blank, return to the requirements you wrote down.
- **Afterwards:** note the hardest questions while they're fresh: they're your study list for the next round, alongside the fresh prompts in {{appendix E}}.
