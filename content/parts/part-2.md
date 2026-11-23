---
part: "2"
---

## 2.1 What seniors do differently {#2.1}

::: inshort
The same design can sound mid-level or senior. The difference is mostly initiative: a senior candidate decides, puts a number on the decision, names its cost, and raises failure before being asked, while keeping the interviewer able to follow and steer.
:::

::: refresher 1.2#reshape
**RESHAPE:** Requirements 4, Estimate 3, Surface & schema 3, High-level design 6, Analyse 12, Pressure-test 5, Evaluate 2. A working design by minute 16.
:::

{{predict 2.1-p1}}

### What a senior answer sounds like ★★★ {#senior-signals}

Level changes what each scored dimension demands. This guide aims at the middle column:

| Dimension | Mid-level | Senior | Staff |
|---|---|---|---|
| Scoping | Asks some questions, when prompted | Drives requirements and numbers unprompted | Questions the problem and its business goal |
| Design | Works, with hints | Works end to end by minute 16, without over-building | Compares whole designs by fit with the organisation |
| Depth | Describes components | Two levels deep on the hardest part, with numbers | Deep in several places; sees second-order effects |
| Trade-offs | Lists options | Decides, and states the cost | Weighs cost, teams and time to market |
| Failure | Covers it when asked | Raises failures, abuse and SLOs first | Plans migrations, ownership and rollout |

The senior candidate does unprompted what the mid-level one does when asked. Listen to the same moments:

| Step | Mid-level says | Senior says |
|---|---|---|
| Requirements | “What features do we need?” | “Reads dominate and a minute of staleness is fine; that's what shapes this.” |
| Estimate | “That's 1,200 requests a second.” | “1,200 a second fits one database, so no sharding yet.” |
| Analyse | “We could use a queue, or a log, or…” | “The hard part is fan-out. At these numbers I'll take the first option, and it costs us this.” |
| Pressure-test | Waits to be asked about failure | “If the cache cluster dies, the database sees 20 times its load, so…” |
| Evaluate | “I think it's good.” | “We traded freshness for read speed; the SLO is p99 under 200 ms.” |

Each senior line ends in a decision, and each decision names its cost.

### Driving the conversation ★★★ {#driving}

The interviewer can only score what they can follow. These habits make your reasoning visible:

- **Say what you're about to do,** so the interviewer can redirect you early rather than late.
- **Prioritise out loud:** “Sign-in is standard here; I'll come back to it if there's time.”
- **Check in about every 8 minutes:** “Does this depth work, or should I go deeper on storage?” Interviewers often hint at what they want to probe.
- **Decide rather than list:** two options, compared on the numbers, then a choice.
- **Reason from the root facts when unsure:** what must it store, how far does the data travel, and what happens when it fails?
- **Treat pushback as information.** “What if traffic grows 100 times?” usually asks for the next level of depth, not a correction. Restate the new constraint, then adapt the part that breaks.
- **Admit what you don't know, then reason:** “I haven't used that store, but it would need to…” beats a confident guess, because interviewers probe bluffs until they break.

::: signal
“Two options. A log keeps events for replay; a queue is simpler. The analytics team needs replay, so the log, and it costs us partition management.” **Expect next:** a harder probe on the option you chose. That's the point: you've earned depth.
:::

{{check 2.1}}

## 2.2 Caching and data, in depth {#2.2}

::: inshort
A cache and a database are two copies: the depth is keeping them in step and surviving the moment a hot key expires. Choose stores and keys from the queries, and name what each copy costs with CAP and PACELC.
:::

::: refresher 1.6#caches
**Cache-aside:** read the cache; on a miss, read the database and store the answer with a TTL. Every cache trades staleness for speed.
:::

::: refresher 1.6#databases
A **leader** takes every write and streams changes to **read replicas**; a replica that hasn't caught up serves a stale read.
:::

{{predict 2.2-p1}}

### Cache patterns and invalidation ★★★ {#cache-patterns}

**Bottleneck:** a cache and a database are two copies, and something must keep them in step. **Root fact:** 4.

In [[cache-aside]], a write updates the database first, then deletes the cached entry, and the next read refills it. Deleting rather than writing the new value stops two racing writers from leaving the older value behind. Its cousins:

| Pattern | How it differs | Choose when |
|---|---|---|
| **Read-through** | The cache loads misses itself | You want one loading library |
| **Write-through** | Cache and database written together | Reads must see writes at once |
| **Write-behind** | Cache now, database later, in batches | Write speed beats losing the last few seconds |
| **Refresh-ahead** | Hot entries reloaded before they expire | A pause on expiry is unacceptable |

Every cached value is a bet that the source hasn't changed. Settle it three ways: **expire** (the TTL caps staleness; shorter means more misses), **invalidate** (delete the key on every write path, batch jobs included), or **version** the key, as in `price:v42`, so a change makes old entries unreachable. Choose staleness per kind of data: a minute is fine for a like count, not for a price or an unsubscribe.

::: signal
“A stale price costs money, so I'll version the key and invalidate on write, with a TTL as the backstop.” **Expect next:** “What if the invalidation is lost?” The TTL bounds how long it stays wrong.
:::

### Stampedes and hot keys ★★★ {#stampedes}

**Bottleneck:** misses that arrive together. **Root fact:** 5.

When a popular key expires, every request that misses hits the database at once: a **cache stampede**, worst after a restart empties the cache. Three fixes, often combined:

- **Request coalescing:** the first miss loads the value, and the rest wait for it.
- **Jittered TTLs:** a few random seconds on each TTL, so keys don't expire together.
- **Stale-while-revalidate:** serve the old value while one request refreshes it.

A [[hot key]] is one so popular that a single cache node can't serve it, such as a celebrity's profile: copy it into each app server's memory for a few seconds. A full cache evicts: **LRU** (least recently used) by default, or **LFU** (least frequently used) to protect favourites from a one-off scan.

::: signal
“After a deploy the cache is cold, so I'd coalesce misses on the hottest keys.” **Expect next:** “One key gets 50,000 reads a second?” A few seconds of local caching on each server.
:::

### Modelling data by access pattern ★★★ {#data-modelling}

**Bottleneck:** a query that must visit many machines. **Root facts:** 1 and 2.

Choose the store by the shape of the queries:

| Family | Model (e.g.) | Choose when |
|---|---|---|
| **Relational** | Tables, joins, transactions (PostgreSQL) | The default: related data, ad-hoc queries, money |
| **Key-value** | A value per key (Redis, DynamoDB) | Lookups by ID: sessions, carts |
| **Document** | JSON-like documents (MongoDB) | Varied attributes, read whole: a catalogue |
| **Wide-column** | Sorted rows in partitions (Cassandra) | Heavy writes read by key and range: readings by device and time |
| **Graph** | Nodes and edges (Neo4j) | Questions many hops deep: friends of friends |

In a NoSQL store, design from the queries, not the entities, so each query is one cheap read. The **partition key** chooses the machine, so rows read together must share it; the **sort key** orders rows within a partition, so a range is one scan. For “the latest 50 messages in a conversation”, partition by conversation ID and sort by time; partitioning by time alone would pile every new message onto one partition. Other queries get their own copy of the data (**denormalising**), kept in step on every write.

::: signal
“Partition key conversation ID, sort key time: the latest 50 messages are one range read.” **Expect next:** “And searching messages?” A search index, fed from the change stream.
:::

### Replication and its lag ★★★ {#replication}

**Bottleneck:** one database machine is one failure away from an outage. **Root facts:** 3 and 4.

The key question in **replication** is when the leader says “done”:

{{fig leader-follower}}

- **Synchronous:** once a follower has the write. Failover loses nothing, but every write waits a round trip, and a slow follower stalls them all.
- **Asynchronous:** at once. Writes stay fast, but followers lag, and writes they hadn't received are lost if the leader dies.
- **Semi-synchronous:** one synchronous follower, the rest asynchronous: the usual compromise.

**Replication lag** shows up two ways: a user's own write vanishes on refresh, or two reads hit two followers and time runs backwards. **Read-your-writes** sends a user's reads to the leader for a short window after they write; **monotonic reads** pin each user to one follower.

::: signal
“One synchronous follower in another zone, so failover loses nothing; asynchronous followers serve reads.” **Expect next:** “What does that cost?” A round trip on every write, and a stall whenever that follower slows.
:::

### CAP and PACELC ★★★ {#cap-pacelc}

**Bottleneck:** copies that can't talk must either stop or disagree. **Root facts:** 3 and 4.

The **CAP theorem** is about a **network partition**, when some nodes can't reach the others. A replicated system must then either stay consistent, meaning every read sees the latest write (not ACID's “consistent”), by refusing requests on the side without a majority, or stay available, answering on both sides and reconciling later. Partitions are rare, so **PACELC** adds the everyday case: else, choose latency or consistency, because agreement costs round trips even on a healthy network.

{{fig pacelc}}

Choose per kind of data. Amazon's Dynamo chose availability, because a rejected shopping-cart write is lost revenue; a bank balance chooses consistency.

::: deeper 3.1#quorums
Quorums, and why they still aren't linearizable.
:::

{{check 2.2}}

## 2.3 Async work and partitioning, in depth {#2.3}

::: inshort
Queued work arrives at least once, so consumers must be idempotent. Shards follow your queries, sit on a consistent-hash ring, and still need a plan for the one key busier than the rest.
:::

::: refresher 1.6#queues
A request returns at once while a **worker** does the slow job later, with retries; a job can run twice.
:::

::: refresher 1.6#shards
**Sharding** splits data by a key so each machine takes a share of the writes. It comes last: queries without the key ask every shard.
:::

{{predict 2.3-p1}}

### Queue, pub/sub or log ★★★ {#queue-pubsub-log}

**Bottleneck:** who gets each message, and whether it can be read again. **Root fact:** 5.

{{fig queue-vs-log}}

| Kind | Who gets each message | Afterwards | Choose when |
|---|---|---|---|
| **Work queue** (e.g., SQS) | One worker | Deleted once handled | Jobs, such as resizing an image |
| **Pub/sub** | Every subscriber, its own copy | Deleted per subscriber | Several services react to one event |
| **Log** (e.g., Kafka) | Every reader, at its own **offset** | Kept for days | Replays, and new readers of old events |

A log keeps order only within a partition, which is chosen by key.

::: signal
“Order events go on a log, so billing, email and analytics each read at their own pace.” **Expect next:** “How long do you keep them?” Long enough to rebuild a consumer: days to weeks.
:::

### Delivery guarantees and idempotency ★★★ {#delivery-idempotency}

**Bottleneck:** a crash between doing the work and saying so. **Root fact:** 3.

A consumer **acknowledges** a message once it's handled. Ack first and a crash loses the message (**at-most-once**, fine for metrics). Work first and a crash redelivers it (**at-least-once**, the normal choice). **Exactly-once** delivery can't be guaranteed end to end: a lost ack looks just like a lost message. So make handling **idempotent**, keyed by an **idempotency key** such as the order ID, and commit the key with the effect:

```python
def handle(message):
    with db.transaction():
        if db.insert_if_absent("processed", key=message.order_id):
            db.add_points(message.user_id, message.points)  # once per key
    queue.ack(message)   # a crash before this redelivers; the key stops a repeat
```

Checking “was this done?” first isn't enough: two workers can both check, then both act. The unique insert settles the race. For an outside call, such as a payment, pass the key to the provider too.

::: signal
“At-least-once delivery, idempotent consumers: effectively once.” **Expect next:** “Doesn't Kafka offer exactly-once?” For its own reads and writes, not for the email your consumer sends.
:::

### Back-pressure and dead letters ★★ {#backpressure}

**Bottleneck:** consumers slower than producers. **Root fact:** 5.

A growing backlog is growing delay: by [[Little's law]], wait = backlog ÷ drain rate. Add consumers unless the bottleneck is downstream, shed low-priority work, and bound the queue so producers slow down (**back-pressure**). After a few failed retries, park a **poison message** in a **dead-letter queue**. Alert on the oldest message's age: age is what users feel.

### Choosing how to partition ★★★ {#partitioning-schemes}

**Bottleneck:** an even spread that keeps queries cheap. **Root fact:** 1.

| Scheme | A key's shard is… | Good at | Bad at |
|---|---|---|---|
| **Range** | The one owning its range | Range scans, such as by time | New keys all hitting one shard |
| **Hash** | Set by hashing the key | Even spread | Range scans ask every shard |
| **Directory** | Looked up in a table | Moving one big tenant | The table is a dependency |

Range on time sends every new write to the newest shard, so lead the key with a hashed field, such as the device ID, and keep time as the sort key.

### Consistent hashing ★★★ {#consistent-hashing}

**Bottleneck:** adding a node shouldn't move most of the data. **Root facts:** 1 and 3.

Placing keys with `hash(key) mod N` breaks when N changes: almost every key moves, which for a cache means a storm of misses. **Consistent hashing** puts nodes and keys on a ring; each key belongs to the next node clockwise, so a new node takes only its own slice. With **virtual nodes**, each server owns many small slices: load evens out, and a failed server's keys spread over many neighbours.

{{fig hash-ring}}

::: numbers
{{num mod_n_remap}}.
:::

### Hot partitions and unique IDs ★★★ {#hot-keys-ids}

**Bottleneck:** one key with far more traffic than the rest; IDs without one central counter. **Root facts:** 4 and 5.

More nodes don't cool a [[hot key]]: one key lives on one shard. Cache its reads; split it into `key#0` … `key#9` and merge on read; or design around it, such as fetching a celebrity's posts at read time instead of copying them to every follower.

An auto-increment ID is a bottleneck on one database and repeats across shards. **Snowflake-style IDs** pack a millisecond timestamp, a worker ID and a sequence into 64 bits: unique without coordination, and roughly time-ordered. Time-ordered **UUIDv7** also works, at 128 bits.

::: signal
“Snowflake IDs: 64-bit, time-sortable, no coordination per ID.” **Expect next:** “What if a clock jumps back?” The generator waits until it catches up, and alerts.
:::

### Decision table {#decision}

| Need | Use | What it costs |
|---|---|---|
| Background jobs | Work queue | Duplicates, so idempotent workers |
| Survive redelivery | Idempotency key, committed with the effect | A table of keys to keep and expire |
| Spread writes evenly | Hash partitioning on a key in every query | Range scans ask every shard |
| Add nodes without reshuffling | Consistent hashing, virtual nodes | A ring to manage; hot keys remain |

{{check 2.3}}

## 2.4 APIs, regions, reliability and operations {#2.4}

::: inshort
Clients you can't update need stable APIs and safe retries; distant users need regions and recovery targets in numbers; every call needs a timeout, a retry policy and a limit. SLOs say how reliable is enough, and the bill says what it costs.
:::

::: refresher 1.6#services-regions
**Regions** bring the service near distant users and survive a region's loss, but copies an ocean apart either wait for each other or disagree.
:::

::: refresher 1.6#failure
Every call to another machine needs a **timeout**; retries back off, add jitter, and give up after a few tries.
:::

{{predict 2.4-p1}}

### API style, pagination and retries ★★★ {#api-design}

**Bottleneck:** clients you can't update. **Root facts:** 2 and 3.

| Style | How | Choose when |
|---|---|---|
| **REST** | Resources at URLs, HTTP verbs, usually JSON | Public APIs: universal, cacheable, easy to debug |
| **RPC** (e.g., gRPC) | Remote function calls with a schema and a binary encoding | High-volume calls between your own services |
| **GraphQL** | The client asks for exactly the fields it needs | Many different clients; harder to cache |

**Pagination** uses a cursor, an opaque marker for the last item seen: offsets make the database read and discard every skipped row, and pages shift as new items arrive. **Versioning:** adding fields is safe, but removing or renaming one needs a new version. **Idempotency keys** go on every create, so a retried “create payment” returns the first result instead of charging twice. In front of it all, an L7 load balancer or API gateway ends TLS, routes by path and enforces rate limits.

### Pushing updates to clients ★★★ {#realtime}

**Bottleneck:** in HTTP, only the client can speak first. **Root fact:** 2.

| Method | How | Choose when |
|---|---|---|
| **Polling** | Ask every N seconds | Updates every few minutes; wastes requests |
| **SSE** (server-sent events) | One long HTTP response that streams events | One way: scores, feeds, LLM tokens |
| **WebSockets** | A lasting two-way connection | Chat, collaboration, games |

Held connections are state, so a connection tier holds them, sized by memory per connection, and pub/sub routes each message to the server holding the right user. After a deploy, clients must reconnect with jitter, or they all arrive in one wave.

### Regions and disaster recovery ★★★ {#multi-region}

**Bottleneck:** distance, region outages and data-residency laws. **Root facts:** 2 and 4.

{{fig two-regions}}

- **Active–passive:** one region takes the writes and replicates asynchronously to a standby. Simple, but a failover loses the replication lag.
- **Active–active:** every region takes writes. Fast everywhere, but two regions can change one record at once. Resolve it with last-writer-wins, which drops one change; by merging; or by giving each record a home region that alone accepts its writes.

The **RPO** (recovery point objective) is how much data you may lose, measured in time; the **RTO** (recovery time objective) is how long you may be down. Backups alone give hours of each, a warm standby minutes, active–active seconds, at the highest cost. Drill failovers: an unrehearsed one is a hope, not a plan.

::: signal
“RPO of one minute, RTO of 15: a warm standby under a minute behind, automated failover, drilled each quarter.” **Expect next:** “Why not zero and zero?” Synchronous writes across regions, and active–active: the costliest point.
:::

### Timeouts, retries and circuit breakers ★★★ {#timeouts-retries}

**Bottleneck:** a slow dependency holds your threads hostage. **Root facts:** 3 and 5.

Every call needs a **timeout**, set from the dependency's [[p99]]; otherwise a dependency that slows to 5 seconds ties up your threads until you fail too, a **cascading failure**. Retry only transient failures of idempotent calls. **Exponential backoff** doubles each wait, [[jitter]] randomises it so clients don't retry in waves, and a **retry budget**, say 10% of requests, stops retries multiplying the load during an outage. Retry at one layer only: three layers making four attempts each turn one request into 64.

A **circuit breaker** watches the calls to one dependency. Once failures pass a threshold, it fails calls at once for a while, saving your threads and giving the dependency room to recover.

### Overload and availability arithmetic ★★★ {#overload}

**Bottleneck:** demand beyond capacity, and chains of dependencies. **Root facts:** 3 and 5.

**Rate limiting** caps each caller. A **token bucket** refills at a steady rate up to a cap, so short bursts pass while the average holds. Enforce it at the gateway, per user or API key, and reply **429 Too Many Requests** with a **Retry-After** header. When demand still exceeds capacity, **shed load** by rejecting low-priority work fast, or **degrade gracefully** by serving cached results instead of errors.

Availability multiplies along a chain: four services in series at 99.95% each give about 99.8%. Removing a hard dependency, with an async call, a cache or a degraded answer, helps most.

### SLOs, cost and security ★★★ {#slos-cost}

**Bottleneck:** “reliable enough”, “affordable” and “safe” each need a number or a rule. **Root facts:** 1, 3 and 7.

An **SLI** measures what users feel, such as the share of checkouts that succeed within a second. An **SLO** is its target, such as 99.9% over 30 days, and an **SLA** is a looser contract with penalties. The **error budget** is the failure the SLO allows, {{num error_budget_month}} at 99.9%: spend it on releases, and when it's gone, freeze risky changes. Alert on symptoms, such as the budget burning fast, not on causes such as high CPU.

Cost follows the biggest line, often storage: tier it by age. Security basics: TLS on every connection; authorisation (what you may do) checked at every resource, not just authentication (who you are); least privilege for every service and key; and secrets in a secrets manager, never in code or logs.

{{check 2.4}}

## 2.5 LLM calls and retrieval, in depth {#2.5}

::: inshort
A call's wait is set by its output and its concurrency by memory. Tools and schemas turn text into actions and data. Retrieval is two pipelines, whose quality is decided by chunking, hybrid search and reranking, and for a small corpus, sending everything can beat retrieving.
:::

::: refresher 1.7#tokens
Calls cost **tokens** in and out, output priced higher; the model writes one token at a time, so long answers are slow, and apps stream them.
:::

::: refresher 1.7#rag
**RAG:** your code finds the best passages and puts them in the prompt; the model answers from them and cites them.
:::

{{predict 2.5-p1}}

### Prefill, decode and the KV cache ★★★ {#prefill-decode}

**Bottleneck:** output is produced one token at a time. **Root facts:** 1, 2 and 6.

A call runs in two phases. **Prefill** processes the whole prompt in parallel and sets the **time to first token** (TTFT). **Decode** then writes the reply one token at a time; each step reads the model's weights from memory, so it runs at a steady {{num output_speed}}.

{{fig prefill-decode}}

So total time ≈ TTFT + output tokens ÷ tokens per second, and output length dominates: {{num halve_output}}. Stream the answer, cap its length, and keep prompts lean for a fast first token.

To write each token, the model attends to every earlier one. The **KV cache** keeps those earlier tokens' intermediate results, so each step processes only the newest token. It lives in GPU memory while a request generates and grows with context length × concurrent requests, so memory, more than compute, caps how many requests a GPU serves at once.

::: signal
“Answers average 300 tokens: about half a second to the first token, then 4 seconds of decode, so we stream.” **Expect next:** “How do you make it faster?” Shorter answers first, then a smaller model; trimming the prompt mostly speeds the first token.
:::

### Tool calls and structured output ★★★ {#tool-calling}

**Bottleneck:** a model can only produce text. **Root fact:** 6.

A model can't act; it can only ask. In **tool calling**, you describe each tool with a name, a purpose and a JSON schema for its arguments. The model may reply with a request to call one; your code validates the arguments like user input, runs the tool, and returns the result for the model to continue. The model decides when to call a tool from its description alone, so write it for the model.

**Structured output** applies the same idea to the answer: the model must return JSON that matches a schema. With **constrained decoding**, the provider lets it produce only tokens that keep the output valid. Validate in code anyway, and retry or flag failures.

### Token economics ★★★ {#token-economics}

**Bottleneck:** cost scales with tokens. **Root fact:** 6.

A call costs input tokens × the input price, plus output tokens × the output price, and output usually costs several times more per token. Retrieval reverses the usual intuition: with passages in every prompt, input makes up {{num rag_input_share}}. Work one through:

{{item 2.5-d1}}

### The RAG pipeline ★★★ {#rag-pipeline}

**Bottleneck:** the right passages must reach the prompt, with few wrong ones. **Root facts:** 4 and 6.

{{fig rag-pipeline}}

**Indexing,** ahead of time and on every change: parse each document, keeping headings and tables; **chunk** it into passages of a few hundred tokens at natural boundaries; **embed** each chunk and store it with its source, version and the **permissions** of its document; and index the keywords too. The index is a copy of your documents, so it goes stale: re-index on change, and watch the age of the oldest change not yet indexed.

**Querying,** for each question: rewrite a follow-up into a standalone query; run vector and keyword search side by side (**hybrid search**), each filtered by the user's permissions; merge the two lists with **reciprocal rank fusion**; let a **reranker** model reorder the top 50 or so and keep the best five; and number them in the prompt, so the answer can cite them. Measure the search on its own with **recall@k**: does a passage that answers the question appear in the top five?

### Long context or retrieval ★★★ {#long-context}

**Bottleneck:** context windows can now hold whole manuals. **Root fact:** 6.

If the whole corpus is under {{num stuffing_threshold}}, you can skip retrieval and send everything, with prompt caching to cut the cost of repeating it: no pipeline, and nothing missed by a bad search. But every call pays for every token, models degrade as input grows ({{num context_rot}}), and every user sees everything. Retrieval wins at high volume, over large or changing corpora, and wherever permissions differ by user.

::: signal
“A 150k-token manual and 50 questions a day: about $20 a day to send it whole, so no retrieval.” **Expect next:** “At 50,000 a day?” Then retrieval: five passages cost a sliver of 150k tokens.
:::

{{check 2.5}}

## 2.6 Agents, serving, evals and safety, in depth {#2.6}

::: inshort
Most features are workflows; an agent earns its cost only when the steps depend on what it finds, and then it needs hard caps in code. Route easy requests to small models through one gateway, prove every change with evals big enough to mean something, and contain prompt injection by design.
:::

::: refresher 1.7#rungs
**The complexity ladder:** a single call; a workflow, where your code fixes the steps; an agent, which picks tools in a loop; several agents. Climb only when evals say so.
:::

::: refresher 1.7#injection
**Prompt injection** hides instructions in content the model reads. The **lethal trifecta** is private data, untrusted content and a way out, all in one place.
:::

{{predict 2.6-p1}}

### Workflows, agents and their caps ★★★ {#workflows-agents}

**Bottleneck:** multi-step work without handing over control. **Root fact:** 6.

Most multi-step features are workflows: ordinary code with model calls inside, each step testable on its own.

| Pattern | How | Choose when |
|---|---|---|
| **Chaining** | Each call's output feeds the next, with checks between | A task splits into fixed steps |
| **Routing** | A cheap classifier sends each input to a specialised prompt | Inputs differ in kind |
| **Parallelising** | Independent calls run at once, then combine or vote | Many independent checks |
| **Orchestrator–workers** | One call plans sub-tasks, workers do them, one merges | The sub-tasks aren't known in advance |
| **Evaluator–optimiser** | One call drafts, another critiques, the draft is revised | Clear criteria, and revision measurably helps |

An agent reads the task and its results so far, then either calls a tool or answers, and repeats. Notice that every limit lives in code, outside the model:

```python
def run_agent(task, tools, max_steps=20, max_cost=2.00):
    messages, cost = [system_prompt(tools), task.prompt], 0.0
    for step in range(max_steps):
        reply = llm(messages, tools=tools)
        cost += reply.cost
        if reply.final_answer:
            return reply.final_answer
        if cost > max_cost:
            break
        for call in reply.tool_calls:                  # validated before running
            result = run_tool(call, key=f"{task.id}:{step}:{call.id}")
            messages += [call, result]
    return hand_to_human(task, messages)               # a cap was hit
```

Each tool call is a remote call, so it gets a [[timeout]] and an [[idempotency key]], and each step is logged as a trace.

### How reliability compounds ★★★ {#compounding}

**Bottleneck:** every step is another chance to fail. **Root facts:** 3 and 6.

Success multiplies across steps, as availability does along a chain: ten steps at 95% each give {{num compounding}}. Raise it with fewer steps, steps that validate their own output, and checkpoints that let a failed run resume rather than restart. One success proves little: **pass^k**, all of k tries succeeding, is what users experience; at 90% per run, {{num pass_k}}.

### Routing, gateways and caching ★★★ {#serving}

**Bottleneck:** paying top-tier prices for every request, through every team's own code. **Root facts:** 1 and 6.

Small models are fast and cheap; large ones are slower and many times dearer. **Route** each request to a tier with rules or a small classifier, or **cascade**: the small model tries first, and the request escalates when its answer fails validation.

An **AI gateway** puts every model call through one front door: token quotas per team, routing and fallback across providers, logging and cost per feature, and hooks for guardrails. **Prompt caching** reuses the processed opening of a prompt when a request starts with exactly the same tokens, at {{num prompt_cache_read}}, so put stable content first and the question last.

### Evals you can trust ★★★ {#evals}

**Bottleneck:** “it looked good on five examples” isn't evidence. **Root fact:** 6.

A trustworthy eval has three parts. A **test set** of realistic inputs, including edge cases and ones that must be refused, grown from real failures and tagged by slice, such as language or task. **Graders:** code for anything exact; a model judge calibrated against human labels on your own task, where strong judges reach {{num judge_agreement}}; and people for the hardest cases. And a **release gate:** no change to a prompt, model or retrieval step may regress any slice.

Sample size decides what you can conclude. Around 80%, the 95% interval is {{num eval_interval}}, and detecting a drop from 80% to 75% takes {{num eval_detect_5pts}} cases.

### Guardrails and base rates ★★★ {#guardrails}

**Bottleneck:** when attacks are rare, most alarms are false. **Root fact:** 7.

A **guardrail** checks a model's input or output, for injection attempts, personal data, unsafe content or broken schemas. How useful its alarms are depends on how rare the thing it catches is, its **base rate**. A detector that wrongly flags 1% of normal requests, where 1 request in 10,000 is an attack, raises about 100 false alarms per real one: {{num guardrail_base_rate}}. So don't hard-block on one classifier: send flagged requests to safer handling, such as a model with no tools, and layer cheap defences.

### Prompt injection and the lethal trifecta ★★★ {#trifecta}

**Bottleneck:** models can't reliably tell your instructions from text they read. **Root fact:** 7.

{{fig lethal-trifecta}}

No prompt or filter prevents injection reliably, so break at least one leg:

- **Least privilege:** each agent gets only the tools and data its task needs.
- **Human approval** for consequential actions: sending, paying, deleting.
- **Allow-lists:** messages only to known recipients, links and images only to known domains.
- **Split the work:** a model with no tools reads the untrusted content and emits validated fields; a separate step with tools sees only those fields.

::: signal
“The email reader has no tools; the step that can send sees only validated fields, and new recipients need approval.” **Expect next:** “Can't a better system prompt stop it?” No: the model can't reliably tell instructions from data.
:::

{{check 2.6}}

## 2.7 Faded designs: news feed and support agent {#2.7}

::: inshort
Two designs, half worked for you. The requirements and numbers are given; at each **Your move**, you make the call that decides the design, then compare it with a strong answer. The reasoning after each move holds the numbers, so read it even with full marks.
:::

**How to work:** spend about 2 minutes on each move, on paper and out loud, then reveal and tick what you got.

### News feed ★★★ {#news-feed}

**The prompt:** “Design the home feed of a social network.” People follow accounts, post short text and photos, and read a feed of posts from the accounts they follow, newest first.

**Requirements, given:** 200 M daily users, each following about 200 accounts, and a few accounts with tens of millions of followers. A feed page loads with p99 under 200 ms, and a post reaches followers within a minute. Non-goals: ranking, ads and search.

| Quantity | Working | Result |
|---|---|---|
| Feed loads | 200 M users × 10 a day ÷ 10⁵ s | ≈ 20,000 a second |
| Posts | 200 M × 0.5 a day ÷ 10⁵ s | ≈ 1,000 a second |
| Feed deliveries | 1,000 posts a second × 200 followers | ≈ 200,000 a second |

{{item 2.7-f1}}

Count the work. Building feeds as posts are written (**fan-out on write**) costs one small insert per follower: 1,000 × 200 = 200,000 a second. Building them as feeds are read costs one lookup per followed account: 20,000 × 200 = 4 million a second. The multiplier is 200 either way, so the ratio is just loads to posts, 20 to 1. Build on write, and a feed load becomes one list fetch. The cost is paid at posting time: seconds of delay, which the one-minute target allows.

{{item 2.7-f2}}

One celebrity post fanned out on write means 50 million inserts: more than a minute of the whole fleet's capacity, and a hot spot on every feed shard. So accounts above a threshold, say a million followers, become **pull** accounts, and readers merge in their recent posts at load time, from a widely replicated cache. Inactive users get no fan-out either; their feeds are rebuilt when they return.

{{fig feed-scaled}}

Each feed is a list of the latest 500 or so post IDs per user in an in-memory store, about 800 GB in all. It's a cache, not the record: a lost feed is rebuilt from the posts. A page **hydrates** those IDs with one batch read from a post cache. Fan-out workers read post events from a log and are idempotent, so a replayed event can't add a post twice.

### Support agent ★★★ {#support-agent}

**The prompt:** “Design an AI assistant for an online shop's customer support. It answers questions about orders and policies, and can issue small refunds.”

**Requirements, given:** 20,000 conversations a day: 70% ask where an order is or what a policy says, 15% want a refund, and 15% are complaints or account problems. At least 85% resolved correctly, refunds always within policy, and a hand-off to a person whenever the assistant is unsure. Replies start within 2 seconds. About 80,000 model calls a day cost roughly $1,700, or 9 cents a conversation, against several dollars for a human agent: the cost case is easy, and quality and safety are the work.

{{item 2.7-f3}}

Start with a **routing workflow**. A small model classifies each message: order questions call the order tool, policy questions use retrieval, refund requests enter a fixed refund flow, and everything else goes to a person, with a summary attached. Add a single agent, with the same scoped tools and hard caps, only if evals show the messy cases need investigation. The tools are few: look up the signed-in customer's orders, search the help centre, issue a refund, hand off. Identity comes from the login session, never from the chat, and nothing can send email or touch another customer's data.

{{item 2.7-f4}}

The refund rules live in a **policy engine**, code that the refund tool calls before paying: the order belongs to this customer and is within 30 days, the amount isn't more than was paid, and automatic refunds stay under $50 and a daily limit. The prompt explains the policy; the code enforces it, because a model can be argued, flattered or injected out of a rule in its prompt. Every refund carries an idempotency key, and traces record the prompt and policy versions. Customer messages are untrusted, but the only way out is the chat back to the same customer, so the lethal trifecta stays broken.

Roll out in **shadow mode**, where human agents send, edit or discard the assistant's drafts, then to a canary of 5% of conversations, watching escalations, reopened tickets and refunds per conversation.

**Compare the two:** the feed is write amplification with skew; the agent is a write path that moves money, guarded by code, approvals and idempotency rather than by the prompt.

## 2.8 Mock A: notification service {#2.8}

::: inshort
The one part of the guide that rehearses the interview itself: an unseen prompt, a 35-minute clock and your own voice. The runner plays the interviewer, and your honest scoring plays the judge.
:::

Set aside 45 quiet minutes, and don't read past the prompt card yet. Interviewing only for LLM roles? Run an LLM prompt from {{appendix E}} instead.

1. **Start the timer.** Its cues mark each RESHAPE step, so you can see whether you're behind.
2. **Write your clarifying questions,** then reveal the card. It answers the questions an interviewer would accept.
3. **Talk out loud and draw on paper the whole time,** and record yourself on your phone.
4. **Open each probe card when it unlocks,** at minutes 12, 20 and 27, and answer it aloud. If you'd already covered it, tick the box: raising a problem before you're asked is a senior signal.
5. **Score every rubric line** when time is up: 2 if you did it unprompted and said why, 1 if partly or only after a probe, 0 if it's missing. Credit only what you said or drew, not what you meant.
6. **Listen back** to two minutes of Requirements and two of Analyse, for numbers, decisions and silences. Then read the model outline, and follow the review link beside each weak line.

Don't pause to look things up: note the gap and carry on, as you would in the room. **Ready at the senior bar** means at least 75% overall, no zero on a Requirements, Estimate, Analyse or Pressure-test line, an average of 1.5 or more on Analyse and Pressure-test, and at least one probe handled before its card opened. If you fall short, re-read the linked sections and run a fresh prompt from {{appendix E}} after a night's sleep; the second attempt usually shows the biggest gain.

{{mock mock-a}}

## 2.9 Check and recap {#2.9}

::: inshort
Four questions from across Parts 1 and 2, then a recap card of the trade-offs and senior signals to say out loud. Answer them without notes, and you're working at the depth interviewers probe.
:::

{{check 2.9}}

::: recap
#### Senior signals

Decide, put a number on the decision, and name its cost. Raise failures, hot spots and abuse before you're asked. Check in every 8 minutes; pushback asks for depth.

#### Caches and data

Cache-aside deletes on write, with the TTL as a backstop; coalesce misses so a hot key's expiry can't stampede. Keys come from the queries. Read-your-writes hides replication lag. CAP applies in a partition; PACELC applies every day.

#### Async work and partitions

At-least-once delivery plus idempotency keys gives effectively once. A queue for jobs, a log for replay. Alert on the oldest message's age. Hash for spread, ranges for scans, consistent hashing to grow, and split or cache a hot key.

#### Reliability and operations

Timeouts from p99; retries with backoff, jitter and a budget, at one layer; circuit breakers; rate limits that answer 429. RPO and RTO in minutes, drilled. SLOs with error budgets.

#### LLM systems

Output length sets the wait; memory sets concurrency. Hybrid search, reranked to five, with permissions inside the search. Workflows before agents, with caps in code. Small models for easy requests. Evals big enough to mean something. Break the lethal trifecta in the design.
:::

**What you can do now:** compare options with numbers and decide, for every core block; raise failures, hot spots and abuse first; and design an LLM feature with a quality bar, a cost budget and the trifecta broken. Part 3 answers the follow-up questions.
