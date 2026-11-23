---
page: appendix
id: "D"
slug: decoder
nav: "Name decoder"
intro: "Interviewers use product names as shorthand. This page maps each name to the building block it stands for, and links to the module that teaches that block. Names as of November 2026."
---

The guide teaches each building block by what it does, with an example product or two in brackets. This page works the other way round: find a name, read which block it is, then follow the link. Products change every year. The blocks underneath rarely do, so the block is the thing to learn.

::: signal
“I haven't run Pinecone myself. Is it the vector index here, filtered by tenant?” Asking what a product is doing in their system, then reasoning about the block, reads as senior. Bluffing about the product doesn't.
:::

## Classic: the front door and the edge {#edge}

| Names | What it is | Learn it in |
|---|---|---|
| **Cloudflare, Akamai, Fastly, Amazon CloudFront** | CDNs: copies of cacheable content at sites near users. Most also absorb attacks and can run code at the edge | {{ref 1.3#request-journey}}, {{ref 1.6#caches}} |
| **NGINX, HAProxy, Envoy, AWS Elastic Load Balancing** | Load balancers and reverse proxies: they spread requests over servers, end TLS and route by path. Envoy is also the proxy beside each service in a service mesh such as Istio | {{ref 1.6#servers}} |
| **Kong, Apigee, Amazon API Gateway** | API gateways: one front door that checks identity, applies rate limits and routes each request to a service | {{ref 1.3#parts-bin}}, {{ref 2.4#overload}} |
| **REST, gRPC, GraphQL** | API styles: resources over HTTP; typed remote calls over HTTP/2; queries in which the client picks the fields | {{ref 2.4#api-design}} |
| **WebSocket, server-sent events, long polling, webhooks** | Ways to push updates rather than wait to be asked | {{ref 2.4#realtime}} |

## Classic: storage {#storage}

| Names | What it is | Learn it in |
|---|---|---|
| **PostgreSQL, MySQL, SQL Server, Oracle, Amazon Aurora** | Relational databases: tables, SQL and transactions, usually one leader with read replicas | {{ref 1.6#databases}}, {{ref 2.2#replication}} |
| **Vitess, Citus** | Sharding layers that spread MySQL (Vitess) or PostgreSQL (Citus) over many machines | {{ref 1.6#shards}}, {{ref 3.2#resharding}} |
| **Google Spanner, CockroachDB, YugabyteDB, TiDB** | Distributed SQL: each shard is replicated by consensus (Paxos or Raft), and transactions can span shards | {{ref 3.1#consensus}}, {{ref 3.1#isolation}} |
| **Cassandra, ScyllaDB** | Wide-column stores in the Dynamo style: leaderless replicas on a hash ring, quorums chosen per request, LSM-tree storage | {{ref 2.3#consistent-hashing}}, {{ref 3.1#quorums}} |
| **Amazon DynamoDB** | A managed key-value and document store, partitioned by key. Despite the name, it isn't the leaderless Dynamo design: each partition has a leader, elected by Paxos | {{ref 2.2#data-modelling}} |
| **MongoDB, Couchbase, Firestore** | Document databases: JSON-like records, read whole by key or by an index | {{ref 2.2#data-modelling}} |
| **Bigtable, HBase** | Wide-column stores split by key range, each range served by one machine at a time | {{ref 2.3#partitioning-schemes}} |
| **Neo4j, Amazon Neptune** | Graph databases, for questions many hops deep | {{ref 2.2#data-modelling}} |
| **Redis, Valkey, Memcached** | In-memory key-value stores, used as caches. Redis and Valkey, an open-source fork of Redis, add counters, sorted sets and pub/sub | {{ref 1.6#caches}}, {{ref 2.2#cache-patterns}} |
| **Amazon S3, Google Cloud Storage, Azure Blob Storage** | Object storage: cheap, durable files by name, for media, backups and data lakes | {{ref 1.3#parts-bin}} |
| **Elasticsearch, OpenSearch, Solr** | Search engines built on an inverted index (Lucene), with keyword ranking (BM25) and now vector search too | {{ref 3.2#toolbox}}, {{ref 2.5#rag-pipeline}} |
| **Prometheus, InfluxDB, TimescaleDB** | Time-series stores, for metrics and sensor readings | {{ref 3.2#toolbox}} |
| **BigQuery, Snowflake, Redshift, ClickHouse, Druid, Pinot** | Analytics stores: data kept column by column, built to scan billions of rows for totals rather than to serve one record. Not taught in this guide | The warehouse in {{ref 3.5#text-to-sql}} |
| **Geohash, S2, H3, PostGIS** | Geospatial indexes: cells on the map, so “near me” becomes a lookup | {{ref 3.2#toolbox}}, {{ref 3.5#proximity}} |

## Classic: async work, coordination and operations {#async}

| Names | What it is | Learn it in |
|---|---|---|
| **Kafka, Amazon Kinesis, Redpanda, Pulsar** | Logs: partitioned, replicated and kept for days. Each reader keeps its own offset and can replay | {{ref 2.3#queue-pubsub-log}} |
| **RabbitMQ, Amazon SQS, ActiveMQ** | Queues: each message goes to one worker and is deleted once acknowledged | {{ref 1.6#queues}}, {{ref 2.3#queue-pubsub-log}} |
| **Amazon SNS, Google Cloud Pub/Sub, NATS** | Publish-subscribe: each message goes to every subscriber | {{ref 2.3#queue-pubsub-log}} |
| **Flink, Spark, Kafka Streams, Apache Beam** | Stream and batch processing: computations over logs and files, with state that survives crashes | {{ref 3.2#toolbox}}, {{ref 2.3#queue-pubsub-log}} |
| **Debezium** | Change data capture: reads a database's own log and publishes each change as an event | {{ref 3.2#dual-writes-cdc}} |
| **ZooKeeper, etcd, Consul** | Coordination services: small stores kept consistent by consensus, for leader election, locks, configuration and service discovery | {{ref 3.1#consensus}} |
| **Raft, Paxos, ZAB** | Consensus algorithms: a majority agrees on each change, so there is one leader at a time | {{ref 3.1#consensus}} |
| **Temporal, AWS Step Functions, Azure Durable Functions** | Durable workflow engines: multi-step processes with retries, timers and compensation, which survive crashes | {{ref 3.1#sagas-outbox}} |
| **Kubernetes, Docker, AWS Lambda** | Where code runs: containers, a scheduler that places and restarts them, and functions that scale to zero | {{ref 1.6#servers}} |
| **OpenTelemetry, Grafana, Jaeger, Datadog** | Observability: metrics, logs and traces, with dashboards and alerts on top | {{ref 1.3#parts-bin}}, {{ref 2.4#slos-cost}} |
| **Snowflake IDs, UUIDv7, ULID** | IDs that sort by creation time and need no central counter | {{ref 2.3#hot-keys-ids}} |

## LLM: models and where they run {#models}

| Names | What it is | Learn it in |
|---|---|---|
| **Claude (Anthropic), GPT (OpenAI), Gemini (Google)** | Frontier model families, used through their makers' APIs or through a cloud | {{ref 1.7#model}} |
| **Llama (Meta), Mistral, Qwen, DeepSeek, Gemma** | Open-weight models: you can download the weights and serve them yourself | {{ref 3.3#gpu-capacity}} |
| **Amazon Bedrock, Google Vertex AI, Microsoft Foundry** | Cloud platforms that host many providers' models behind one API, one contract and one bill | {{ref 2.6#serving}} |
| **vLLM, SGLang, TensorRT-LLM, NVIDIA Dynamo, llm-d** | Serving engines and frameworks for open models: continuous batching, a paged KV cache, prefix caching and routing between GPUs | {{ref 3.3#serving-internals}} |
| **PagedAttention, RadixAttention, FlashAttention** | Named serving techniques: the KV cache kept in pages (vLLM), shared prompt openings kept in a tree (SGLang), and a faster way to compute attention | {{ref 3.3#serving-internals}} |
| **NVIDIA H100, H200, B200; AMD MI300X; Google TPU; AWS Trainium and Inferentia** | Accelerators. For serving, memory size and memory bandwidth matter most | {{ref 3.3#gpu-capacity}} |
| **llama.cpp, Ollama, GGUF** | Running quantized models on a laptop or a single machine | {{ref 3.3#serving-internals}} |
| **Batch API, Message Batches** | Asynchronous model calls at about half price, returned within 24 hours | {{ref 2.5#token-economics}} |
| **Prompt caching, context caching** | Reusing the already-processed opening of a prompt: cheaper input and a faster first token | {{ref 2.5#token-economics}} |
| **Structured outputs, JSON mode, constrained decoding** | Forcing a model's output to match a schema | {{ref 2.5#tool-calling}} |
| **LoRA, QLoRA, DPO, RFT, distillation** | Ways to change a model's weights: a small add-on, pairs of better and worse answers, reinforcement scored by graders, a small model trained on a big one's outputs | {{ref 3.4#toolbox}}, {{ref 1.7#rungs}} |

## LLM: retrieval {#retrieval}

| Names | What it is | Learn it in |
|---|---|---|
| **Pinecone, Weaviate, Milvus, Qdrant, Chroma** | Vector databases: store embeddings, find nearest neighbours, filter by metadata | {{ref 3.3#vector-indexes}} |
| **pgvector, OpenSearch, Elasticsearch, Azure AI Search, Amazon S3 Vectors** | Vector search added to a store you may already run | {{ref 3.3#vector-indexes}} |
| **HNSW, IVF, DiskANN, ScaNN, FAISS, product quantization** | Approximate nearest-neighbour index types and libraries | {{ref 3.3#vector-indexes}} |
| **OpenAI embeddings, Voyage, Cohere Embed, BGE, E5** | Embedding models: text in, vector out | {{ref 2.5#rag-pipeline}} |
| **Cohere Rerank, cross-encoders, ColBERT** | Rerankers: score each candidate passage against the question | {{ref 2.5#rag-pipeline}} |
| **Bedrock Knowledge Bases, Vertex AI RAG Engine, OpenAI file search** | Managed retrieval: parsing, chunking, embedding and search sold as one service | {{ref 2.5#rag-pipeline}} |
| **Unstructured, Docling, Azure Document Intelligence, Google Document AI** | Parsers that turn PDFs, scans and slides into text and tables | {{ref 2.5#rag-pipeline}} |
| **GraphRAG, agentic retrieval, deep research** | Retrieval the model plans: several searches in turn, or a walk through a graph of entities | {{ref 3.3#agentic-retrieval}} |

## LLM: agents, tools and gateways {#agents}

| Names | What it is | Learn it in |
|---|---|---|
| **LangChain, LangGraph, LlamaIndex, DSPy** | Open-source frameworks for chains, retrieval pipelines and agent loops | {{ref 2.6#workflows-agents}} |
| **Claude Agent SDK, OpenAI Agents SDK, Google ADK, Strands Agents, Microsoft Agent Framework** | The providers' agent kits: the tool loop, sub-agents and sessions | {{ref 2.6#workflows-agents}}, {{ref 3.4#multi-agent}} |
| **CrewAI, AutoGen** | Multi-agent frameworks | {{ref 3.4#multi-agent}} |
| **Bedrock AgentCore, Vertex AI Agent Engine, Foundry Agent Service** | Managed runtimes that host agents with their memory, tools and identity | {{ref 3.4#context-memory}} |
| **Mem0, Zep, Letta** | Long-term memory stores for agents | {{ref 3.4#context-memory}} |
| **MCP, A2A, function calling** | How models call tools (function calling, MCP) and how agents hand work to other agents (A2A) | {{ref 2.5#tool-calling}}, {{ref 3.4#toolbox}} |
| **LiteLLM, Portkey, Kong AI Gateway, Envoy AI Gateway, Azure API Management, Apigee** | AI gateways: one proxy for every model call, with keys, token quotas, routing, fallback and logs | {{ref 3.5#ai-gateway}} |
| **Claude Code, OpenAI Codex, Cursor, GitHub Copilot** | Coding agents and assistants | {{ref 3.5#coding-agent}} |
| **Firecracker, gVisor** | Sandboxes that isolate the code an agent runs | {{ref 3.5#coding-agent}} |

## LLM: quality and safety {#quality}

| Names | What it is | Learn it in |
|---|---|---|
| **LangSmith, Langfuse, Braintrust, Arize Phoenix** | Tracing and eval platforms: record each call, then score outputs offline and in production | {{ref 2.6#evals}}, {{ref 3.4#llm-operations}} |
| **promptfoo, Inspect, RAGAS, DeepEval** | Eval harnesses and metric libraries | {{ref 2.6#evals}}, {{ref 3.5#eval-pipeline}} |
| **MMLU, GPQA, SWE-bench, LMArena** | Public benchmarks and leaderboards: fine for a shortlist, no substitute for your own eval set | {{ref 1.7#evals}}, {{ref 3.4#eval-statistics}} |
| **Llama Guard, Prompt Guard, NeMo Guardrails, Bedrock Guardrails, Azure AI Content Safety, Model Armor** | Guardrails: classifiers and rules on what goes into a model and what comes out | {{ref 2.6#guardrails}} |
| **Lethal trifecta, indirect prompt injection, spotlighting, CaMeL** | Prompt-injection vocabulary: the dangerous combination of capabilities, the attack carried by content, marking untrusted text, and a design that keeps untrusted data away from the plan | {{ref 2.6#trifecta}}, {{ref 1.7#injection}} |
| **OWASP Top 10 for LLM Applications, MITRE ATLAS** | Catalogues of attacks on AI systems, used in security reviews | {{ref 2.6#trifecta}} |

Names here are their owners' trademarks. Most LLM rows follow the AI System Design Primer's cloud mapping, last verified on 3 November 2026; see {{appendix F}}.
