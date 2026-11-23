---
page: appendix
id: "F"
slug: sources
nav: "Sources and licence"
intro: "What this guide is built on, what it changed, how you may reuse it, and the evidence behind its claims. This edition: November 2026."
---

## Built on two primers {#credits}

- **The System Design Primer** by Donne Martin and contributors: [github.com/donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer). Licensed CC BY 4.0. The classic building blocks, the latency numbers and the practice questions come from here.
- **The AI System Design Primer** by daneb and contributors: [github.com/daneb/ai-system-design-primer](https://github.com/daneb/ai-system-design-primer). Its text is licensed CC BY 4.0. The LLM building blocks, the dated figures for tokens, latency and cost, the worked LLM designs and the LLM practice questions come from here. Its code is MIT-licensed, and none of it is reused.

## What this guide changed {#changes}

Both primers were condensed, rewritten and extended:

- **Restructured** into a six-hour course in three Parts. Each Part runs the whole loop: frame the method, learn the classic and the LLM blocks, see a design solved, do one yourself, then check.
- **Rewritten** for readers new to system design: plain English, one idea per paragraph, each term defined where it first appears. Product names became examples in brackets, decoded in {{appendix D}}.
- **One method for both kinds of design,** RESHAPE, which adds the LLM primer's two changes to the classic steps: the quality bar comes first, and pressure-testing is a step of its own.
- **Added practice:** a pretest, prediction prompts, 81 scored questions with idea-unit answers and spaced reviews, an error log, worked, faded and guided designs, three timed mocks with probe cards and rubrics, recap cards and a one-page summary.
- **Every figure appears once,** with its source and an “as of” date where it changes ({{appendix C}}). Figures we derived ourselves show their working.
- **New diagrams,** drawn to fit a phone screen.
- **Left out:** the classic primer's solution code, the AI primer's lab code, its maturity tags and review dates, and depth beyond what interviews probe.

## Licence {#licence}

This guide is licensed under the [Creative Commons Attribution 4.0 International licence](https://creativecommons.org/licenses/by/4.0/) (CC BY 4.0). In short, you may share and adapt it for any purpose, including commercially, provided you give appropriate credit, link to the licence, and say whether you made changes. That summary isn't the licence itself; the licence's text governs.

Because this guide adapts both primers, credit them too. For example: “Adapted from the System design interview guide, itself built on The System Design Primer (Donne Martin) and The AI System Design Primer (daneb), all CC BY 4.0.”

Product names are trademarks of their owners and are used only to identify products. Your answers and progress are stored in this browser alone and are never sent anywhere.

## References {#references}

Figures marked “AI primer” in {{appendix C}} come from the AI System Design Primer's numbers page and labs, which cite their own primary sources.

### Systems {#ref-systems}

- Abadi, D. (2012). Consistency tradeoffs in modern distributed database system design. *IEEE Computer* 45(2). PACELC.
- Amdahl, G. M. (1967). Validity of the single processor approach to achieving large scale computing capabilities. *AFIPS Spring Joint Computer Conference*.
- Beyer, B., Jones, C., Petoff, J. & Murphy, N. R. (eds.) (2016). *Site Reliability Engineering.* O'Reilly. Error budgets, and outages caused by changes.
- Bloom, B. H. (1970). Space/time trade-offs in hash coding with allowable errors. *Communications of the ACM* 13(7).
- Brewer, E. (2000). Towards robust distributed systems. Keynote, *ACM PODC*. The CAP conjecture.
- Bronson, N., Aghayev, A., Charapko, A. & Zhu, T. (2021). Metastable failures in distributed systems. *HotOS*.
- Burrows, M. (2006). The Chubby lock service for loosely-coupled distributed systems. *OSDI*. Leases and sequencers, the idea behind fencing tokens.
- Conway, M. E. (1968). How do committees invent? *Datamation* 14(4).
- Dean, J. & Barroso, L. A. (2013). The tail at scale. *Communications of the ACM* 56(2).
- DeCandia, G. et al. (2007). Dynamo: Amazon's highly available key-value store. *SOSP*. Quorums, hinted handoff and version vectors.
- Deutsch, L. P. and colleagues at Sun Microsystems (1994–97). The fallacies of distributed computing.
- Elhemali, M. et al. (2022). Amazon DynamoDB: a scalable, predictably performant, and fully managed NoSQL database service. *USENIX ATC*. Why DynamoDB isn't Dynamo.
- Flajolet, P., Fusy, É., Gandouet, O. & Meunier, F. (2007). HyperLogLog: the analysis of a near-optimal cardinality estimation algorithm. *AofA*.
- Gall, J. (1975). *Systemantics.* Gall's law.
- Garcia-Molina, H. & Salem, K. (1987). Sagas. *ACM SIGMOD*.
- Gilbert, S. & Lynch, N. (2002). Brewer's conjecture and the feasibility of consistent, available, partition-tolerant web services. *ACM SIGACT News* 33(2).
- Karger, D. et al. (1997). Consistent hashing and random trees. *STOC*.
- Klein, G. (2007). Performing a project premortem. *Harvard Business Review*, September. The Pressure-test step.
- Knuth, D. E. (1974). Structured programming with go to statements. *ACM Computing Surveys* 6(4). Premature optimisation.
- Lamport, L. (1998). The part-time parliament. *ACM Transactions on Computer Systems* 16(2). Paxos.
- Little, J. D. C. (1961). A proof for the queuing formula L = λW. *Operations Research* 9(3).
- Ongaro, D. & Ousterhout, J. (2014). In search of an understandable consensus algorithm. *USENIX ATC*. Raft.
- Pelkonen, T. et al. (2015). Gorilla: a fast, scalable, in-memory time series database. *PVLDB* 8(12).
- Saltzer, J. H., Reed, D. P. & Clark, D. D. (1984). End-to-end arguments in system design. *ACM Transactions on Computer Systems* 2(4).

### LLM systems {#ref-llm}

- Anthropic (2024). Building effective agents. Workflows before agents.
- Anthropic (2024). Introducing contextual retrieval. Retrieval failures cut by context, keywords and reranking, and when to skip retrieval.
- Anthropic (2025). How we built our multi-agent research system. Token use of agents and multi-agent systems.
- Chen, C. et al. (2023). Accelerating large language model decoding with speculative sampling. *arXiv* (DeepMind).
- Cormack, G. V., Clarke, C. L. A. & Büttcher, S. (2009). Reciprocal rank fusion outperforms Condorcet and individual rank learning methods. *SIGIR*.
- Dao, T. et al. (2022). FlashAttention: fast and memory-efficient exact attention with IO-awareness. *NeurIPS*.
- Debenedetti, E. et al. (2025). Defeating prompt injections by design. *arXiv* (Google DeepMind). CaMeL.
- Greshake, K. et al. (2023). Not what you've signed up for: compromising real-world LLM-integrated applications with indirect prompt injection. *AISec*.
- He, H. and Thinking Machines Lab (2025). Defeating nondeterminism in LLM inference. Why temperature 0 still varies.
- Hines, K. et al. (2024). Defending against indirect prompt injection attacks with spotlighting. *arXiv* (Microsoft).
- Hinton, G., Vinyals, O. & Dean, J. (2015). Distilling the knowledge in a neural network. *arXiv*.
- Hong, K., Troynikov, A. & Huber, J. (2025). Context rot: how increasing input tokens impacts LLM performance. Chroma technical report.
- Hu, E. J. et al. (2022). LoRA: low-rank adaptation of large language models. *ICLR*.
- Kwon, W. et al. (2023). Efficient memory management for large language model serving with PagedAttention. *SOSP*.
- Leviathan, Y., Kalman, M. & Matias, Y. (2023). Fast inference from transformers via speculative decoding. *ICML*.
- Malkov, Y. A. & Yashunin, D. A. (2020). Efficient and robust approximate nearest neighbor search using hierarchical navigable small world graphs. *IEEE TPAMI* 42(4). HNSW.
- Model Context Protocol specification (2024 onwards). [modelcontextprotocol.io](https://modelcontextprotocol.io).
- OWASP (2025). OWASP Top 10 for LLM Applications.
- Petrov, A., La Malfa, E., Torr, P. & Bibi, A. (2023). Language model tokenizers introduce unfairness between languages. *NeurIPS*.
- Rafailov, R. et al. (2023). Direct preference optimization: your language model is secretly a reward model. *NeurIPS*.
- Robertson, S. & Zaragoza, H. (2009). The probabilistic relevance framework: BM25 and beyond. *Foundations and Trends in Information Retrieval* 3(4).
- Willison, S. (2025). The lethal trifecta for AI agents: private data, untrusted content, and external communication.
- Zheng, L. et al. (2023). Judging LLM-as-a-judge with MT-Bench and Chatbot Arena. *NeurIPS Datasets and Benchmarks*.
- Zheng, L. et al. (2024). SGLang: efficient execution of structured language model programs. *NeurIPS*. RadixAttention.
- Provider documentation and measurements, via the AI primer's numbers page: OpenAI (tokens per word, latency guidance), Artificial Analysis (output speeds), NVIDIA (H100 and H200 datasheets), Anthropic (tool-definition sizes), and provider price lists.

### How the guide teaches {#ref-learning}

- Ariga, A. & Lleras, A. (2011). Brief and rare mental “breaks” keep you focused. *Cognition* 118(3). Why breaks, though not Pomodoro's exact 25 minutes.
- Biggs, J. (1996). Enhancing teaching through constructive alignment. *Higher Education* 32(3).
- Bradbury, N. A. (2016). Attention span during lectures: 8 seconds, 10 minutes, or more? *Advances in Physiology Education* 40(4). Against the 10-minute myth.
- Bruner, J. S. (1960). *The Process of Education.* Harvard University Press. The spiral: each topic returns deeper in the next Part.
- Brunmair, M. & Richter, T. (2019). Similarity matters: a meta-analysis of interleaved learning and its moderators. *Psychological Bulletin* 145(11).
- Butler, A. C. & Roediger, H. L. (2008). Feedback enhances the positive effects and reduces the negative effects of multiple-choice testing. *Memory & Cognition* 36(3).
- Butterfield, B. & Metcalfe, J. (2001). Errors committed with high confidence are hypercorrected. *Journal of Experimental Psychology: Learning, Memory, and Cognition* 27(6).
- Cepeda, N. J. et al. (2006). Distributed practice in verbal recall tasks: a review and quantitative synthesis. *Psychological Bulletin* 132(3).
- Cepeda, N. J. et al. (2008). Spacing effects in learning: a temporal ridgeline of optimal retention. *Psychological Science* 19(11).
- Cowan, N. (2001). The magical number 4 in short-term memory. *Behavioral and Brain Sciences* 24(1).
- Dewar, M. et al. (2012). Brief wakeful resting boosts new memories over the long term. *Psychological Science* 23(9).
- Dunlosky, J., Hartwig, M. K., Rawson, K. A. & Lipko, A. R. (2011). Improving college students' evaluation of text learning using idea-unit standards. *Quarterly Journal of Experimental Psychology* 64(3).
- Dunlosky, J. et al. (2013). Improving students' learning with effective learning techniques. *Psychological Science in the Public Interest* 14(1).
- Gentner, D., Loewenstein, J. & Thompson, L. (2003). Learning and transfer: a general role for analogical encoding. *Journal of Educational Psychology* 95(2).
- Gick, M. L. & Holyoak, K. J. (1983). Schema induction and analogical transfer. *Cognitive Psychology* 15(1).
- Kalyuga, S., Ayres, P., Chandler, P. & Sweller, J. (2003). The expertise reversal effect. *Educational Psychologist* 38(1).
- Karpicke, J. D. & Roediger, H. L. (2008). The critical importance of retrieval for learning. *Science* 319.
- Kirschner, P. A., Sweller, J. & Clark, R. E. (2006). Why minimal guidance during instruction does not work. *Educational Psychologist* 41(2).
- Kornell, N. & Bjork, R. A. (2008). Learning concepts and categories: is spacing the “enemy of induction”? *Psychological Science* 19(6).
- Kornell, N., Hays, M. J. & Bjork, R. A. (2009). Unsuccessful retrieval attempts enhance subsequent learning. *Journal of Experimental Psychology: Learning, Memory, and Cognition* 35(4).
- Letrud, K. (2012). A rebuttal of NTL Institute's learning pyramid. *Education* 133(1).
- Mayer, R. E. (2020). *Multimedia Learning,* 3rd edition. Cambridge University Press.
- Morris, C. D., Bransford, J. D. & Franks, J. J. (1977). Levels of processing versus transfer appropriate processing. *Journal of Verbal Learning and Verbal Behavior* 16(5).
- Nelson, T. O. & Dunlosky, J. (1991). When people's judgments of learning (JOLs) are extremely accurate at predicting subsequent recall: the “delayed-JOL effect”. *Psychological Science* 2(4).
- Paivio, A. (1986). *Mental Representations: A Dual Coding Approach.* Oxford University Press.
- Pashler, H., McDaniel, M., Rohrer, D. & Bjork, R. (2008). Learning styles: concepts and evidence. *Psychological Science in the Public Interest* 9(3). Against matching “learning styles”.
- Pólya, G. (1945). *How to Solve It.* Princeton University Press.
- Rasch, B. & Born, J. (2013). About sleep's role in memory. *Physiological Reviews* 93(2).
- Rawson, K. A. & Dunlosky, J. (2007). Improving students' self-evaluation of learning for key concepts in textbook materials. *European Journal of Cognitive Psychology* 19(4–5).
- Renkl, A. & Atkinson, R. K. (2003). Structuring the transition from example study to problem solving in cognitive skill acquisition. *Educational Psychologist* 38(1).
- Richland, L. E., Kornell, N. & Kao, L. S. (2009). The pretesting effect: do unsuccessful retrieval attempts enhance learning? *Journal of Experimental Psychology: Applied* 15(3).
- Roediger, H. L. & Karpicke, J. D. (2006). Test-enhanced learning: taking memory tests improves long-term retention. *Psychological Science* 17(3).
- Rohrer, D. & Taylor, K. (2007). The shuffling of mathematics problems improves learning. *Instructional Science* 35(6).
- Schwartz, D. L. & Bransford, J. D. (1998). A time for telling. *Cognition and Instruction* 16(4).
- Smith, A. M., Floerke, V. A. & Thomas, A. K. (2016). Retrieval practice protects memory against acute stress. *Science* 354(6315).
- Sweller, J. (1988). Cognitive load during problem solving: effects on learning. *Cognitive Science* 12(2).
- Sweller, J. & Cooper, G. A. (1985). The use of worked examples as a substitute for problem solving in learning algebra. *Cognition and Instruction* 2(1).
- van Merriënboer, J. J. G. & Kirschner, P. A. (2018). *Ten Steps to Complex Learning,* 3rd edition. Routledge. The 4C/ID model: whole tasks, simple to complex.
- Wiggins, G. & McTighe, J. (1998). *Understanding by Design.* ASCD.
- Willingham, D. T. (2004). The privileged status of story. *American Educator*, Summer.

### How the site is designed {#ref-ux}

- Bringhurst, R. (1992). *The Elements of Typographic Style.* Hartley & Marks.
- Dyson, M. C. (2004). How physical text layout affects reading from screen. *Behaviour & Information Technology* 23(6).
- Fitts, P. M. (1954). The information capacity of the human motor system in controlling the amplitude of movement. *Journal of Experimental Psychology* 47(6).
- Hick, W. E. (1952). On the rate of gain of information. *Quarterly Journal of Experimental Psychology* 4(1).
- Hoober, S. (2013). How do users really hold mobile devices? *UXmatters*, February.
- Hull, C. L. (1932). The goal-gradient hypothesis and maze learning. *Psychological Review* 39(1).
- Hyman, R. (1953). Stimulus information as a determinant of reaction time. *Journal of Experimental Psychology* 45(3).
- Kahneman, D., Fredrickson, B. L., Schreiber, C. A. & Redelmeier, D. A. (1993). When more pain is preferred to less: adding a better end. *Psychological Science* 4(6).
- Kivetz, R., Urminsky, O. & Zheng, Y. (2006). The goal-gradient hypothesis resurrected. *Journal of Marketing Research* 43(1).
- Kurosu, M. & Kashimura, K. (1995). Apparent usability vs. inherent usability. *CHI Conference Companion*.
- Nielsen, J. (1994). 10 usability heuristics for user interface design. Nielsen Norman Group.
- Nielsen, J. (2006). Progressive disclosure; F-shaped pattern for reading web content. Nielsen Norman Group.
- Pernice, K. (2017). F-shaped pattern of reading on the web: misunderstood, but still relevant. Nielsen Norman Group.
- Porter, J. (2003). Testing the three-click rule. User Interface Engineering.
- W3C (2023). Web Content Accessibility Guidelines (WCAG) 2.2.
- Wroblewski, L. (2011). *Mobile First.* A Book Apart.
