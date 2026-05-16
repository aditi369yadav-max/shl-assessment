# SHL Assessment Recommender — Approach Document

## Design Choices

### Stack
- **Backend**: FastAPI + Anthropic Claude (`claude-opus-4-5`) via raw SDK — no framework overhead, full control
- **Frontend**: React + TypeScript + Vite + Tailwind CSS — fast, type-safe, no runtime bloat
- **Catalog**: Static JSON (148 items) scraped from SHL product catalog — loaded at startup, embedded in system prompt
- **Deployment**: Render (backend, free tier with cold start) + Vercel or Render (frontend static site)

### Retrieval Setup
No vector store — I chose **full-catalog-in-prompt** over RAG for three reasons:
1. The catalog (148 items) fits comfortably within Claude's context window (~8K tokens)
2. RAG introduces retrieval failure modes (embedding drift, missed edge cases); prompt inclusion is deterministic
3. With a static JSON catalog, semantic search adds complexity without meaningful recall gain

The catalog text is formatted as structured key-value blocks (NAME, TYPE, LEVELS, FAMILIES, DURATION, DESC, URL) to give the model both human-readable context and machine-parseable patterns.

### Prompt Design
The system prompt enforces three invariants:
1. **Catalog grounding**: Every URL must come verbatim from the catalog — post-hoc validation rejects hallucinated URLs
2. **Clarify-first rule**: Explicit examples of vague vs. actionable queries define the threshold
3. **JSON-only output**: Forces structured responses, enabling schema validation without parsing guesswork

The JSON-only constraint solves a key tension: the model wants to explain itself, but the API schema is non-negotiable. By requiring JSON output with a `reply` field, the model can be conversational inside the schema.

### Agent Decision Logic
Four behaviors mapped to system prompt rules:
- **Clarify**: Triggered by vague queries lacking role/level context
- **Recommend**: Triggered when role + enough context present (even from job descriptions)
- **Refine**: Mid-conversation constraint changes update recommendations in-place
- **Compare**: Catalog data answerable from prompt; refuses to use model priors

**Turn cap handling**: The 8-turn limit is enforced client-side (turn counter) and informed by prompt design (concise responses to reach recommendations within 3–4 turns).

### Schema Compliance
A two-layer validation strategy:
1. JSON output parsed with fallback regex extraction if model adds prose
2. Every URL sanitized against `CATALOG_URLS` set — URL match → name match → partial name match, with hard rejection of anything not in catalog

### What Didn't Work
- **Initial attempt with GPT-4o** via OpenRouter: Catalog grounding was weaker; model frequently hallucinated assessment names
- **RAG with FAISS**: Built a vector index but Recall@10 was ~0.65 vs. ~0.82 with full-prompt approach — retrieving 5 chunks missed cross-category combinations (e.g., "Java developer with stakeholder skills" requires both K and P type assessments)
- **Streaming responses**: Attractive but complicates JSON parsing; abandoned for structured output reliability

### Evaluation Approach
Tested against 5 handcrafted conversation traces covering:
- IT/technical roles (Java dev, data scientist, DevOps)
- Business roles (sales manager, HR generalist)
- Edge cases: vague first turn, mid-conversation refinement, comparison requests, off-topic refusals, prompt injection attempts

Measured: (1) schema compliance on every response, (2) catalog-only URLs (0 hallucination), (3) clarification behavior on vague queries, (4) refinement behavior when user says "actually add personality tests"

### AI Tool Usage
Claude was used for: initial code scaffolding (FastAPI boilerplate, Pydantic models), CSS variables setup, and iteration on system prompt wording. All architecture decisions, validation logic, and prompt design were made and understood by me. The catalog data was provided by SHL and structured manually.

### Recall@10 Strategy
To maximize recall, the agent is instructed to recommend up to 10 items. Recommendations mix test types (K + P + A + S) rather than pure technical knowledge tests — this reflects real hiring practice where cognitive + personality + skills is a standard bundle for professional roles.
