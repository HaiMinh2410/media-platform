# 🧠 ANTIGRAVITY v1 — GEMINI LOADER
# Routing table only. Chi tiết → .antigravity/runtime/

---

## BOOT SEQUENCE

On session start:

1. Read `.antigravity/memory/memory_state.json`
2. Check `session_intent.mode` → apply if set
3. Check `session_intent.flow_mode` → notify if true: "⚡ Flow mode is ON from last session"
4. Classify intent from user's first message (see INTENT ROUTING below)
5. IF intent requires FULL CONTEXT → load `.antigravity/runtime/memory-guard.md` + memory_core + memory_issues + last 5 decisions.log entries
6. Confirm boot:
   - PASS:  "✅ Antigravity loaded — [project] | Task: [task] | Mode: [mode] | Progress: [n]%"
   - WARN:  "⚠️ Antigravity loaded with warnings — [details]"
   - BLOCK: "❌ Memory corrupt — action required."

> memory_core is NOT loaded at boot unless intent requires FULL CONTEXT.
> If any memory file is missing → notify user, do NOT crash.

---

## INTENT ROUTING

Classify intent from user's message → load runtime file → follow its instructions.
NEVER require exact syntax. ALWAYS infer from natural language.

| Intent | Triggers | Runtime file | Memory tier |
|---|---|---|---|
| STATUS | "status", "tiến độ", "what's next", "next", "đang làm gì" | `runtime/status-format.md` § STATUS | **MINIMAL** |
| STATUS-TODAY | "hôm nay làm gì", "today", "status today", "summary hôm nay", "đã xong gì" | `runtime/status-format.md` § TODAY | **MINIMAL** |
| IDEA | "ghi lại ý tưởng", "idea:", "note:", "nhớ là", "jot down" | `runtime/idea-log.md` | **NONE** |
| HOTFIX | "paste error", "fix nhanh", "sửa nhanh", "quick fix" | `workflows/hotfix.workflow.md` | **HOTFIX** |
| EXECUTE (fast) | "run T005 --fast", "nhanh thôi", "small task" | `workflows/task.workflow.md` | **STANDARD** |
| EXECUTE (full) | "run T005", "làm T005 đi", "tiếp tục task", "build X" | `workflows/task.workflow.md` | **FULL** |
| REVIEW | "review T005", "check this code", "review --security" | `agents/reviewer.agent.md` | **REVIEW** |
| PREVIEW | "preview T005", "T005 làm gì", "explain T005 trước khi chạy" | `runtime/preview.md` | **REVIEW** |
| PLAN | "plan X", "break down", "tạo task list", "tôi muốn build Z" | `workflows/plan.workflow.md` | **FULL** |
| AUGMENT | "augment T005", "thêm X vào", "add Y to current task","current task cần thêm error handling" | `workflows/augment.workflow.md` | **FULL** |
| EXPERIMENT | "thử xem", "experiment", "sandbox", "không cần commit" | `workflows/experiment.workflow.md` | **REVIEW** |
| DEBUG | "debug", "tại sao X", "something is broken", "complex trace" | `workflows/debug.workflow.md` | **REVIEW** → auto **FULL** nếu major |
| CONSULT | "hỏi architect", "nên dùng pattern nào", "ask planner" | direct agent call | **FULL** |
| PIVOT | "pivot sang X", "đổi approach", "dùng cách khác" | `workflows/pivot.workflow.md` | **FULL** |
| ADHOC | "viết regex", "convert sang TS", "giải thích nhanh" (lệnh đơn lẻ không fit intent khác) | direct LLM call | **MINIMAL** |
| UNCLEAR | "không classify được" | load `runtime/intent-rules.md` § UNCLEAR | — |

---

### HOTFIX vs DEBUG tiebreak

Nếu user paste error hoặc nói về lỗi nhưng không rõ HOTFIX hay DEBUG:
→ Load `runtime/intent-rules.md` § HOTFIX + § ROUTING PRIORITY
→ Delegate sang `runtime/classifier.md` nếu vẫn không chắc
→ KHÔNG tự route mà không có basis rõ ràng

---

### CONSULT: agent inference

Nếu intent = CONSULT nhưng không rõ agent nào:
→ Load `runtime/intent-rules.md` § CONSULT
→ Infer từ loại câu hỏi, không tự đoán

---

### ADHOC: boundary

Nếu không chắc ADHOC hay intent khác:
→ Load `runtime/intent-rules.md` § ADHOC
→ ADHOC không update memory, không gọi agent có role cụ thể

---

### Modifiers

Modifiers điều chỉnh workflow behavior — expressed naturally, no exact syntax.
→ Full modifier table: load `runtime/intent-rules.md` § MODIFIERS khi cần
→ Common: --fast, --full, --skip-review, --patch, --flow-mode, --flow-mode-off, --experiment, --pivot
---

## MEMORY CONTEXT LEVELS

| Level    | Load what                                                                                                                   | Used for                                              |
|----------|-----------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| NONE     | nothing                                                                                                                     | IDEA                                                  |
| MINIMAL  | `memory_state.json` + decisions.log (last 1 entry only)                                                                     | STATUS, STATUS-TODAY, ADHOC                           |
| HOTFIX   | `constraints.md` + `coding_rules.md` + affected file from stack trace                                                       | HOTFIX                                                |
| STANDARD | `memory_state.json` + `constraints.md` + `coding_rules.md`                                                                  | EXECUTE FAST                                          |
| REVIEW   | `constraints.md` + `coding_rules.md` + architecture rules from memory_core + task context                                   | REVIEW, PREVIEW, EXPERIMENT, DEBUG                    |
| FULL     | `memory_core.json` + `memory_state.json` + last 3 decisions + `constraints.md` + `coding_rules.md` + `PROJECT_INTENT.md`    | EXECUTE FULL, PLAN, AUGMENT, CONSULT, PIVOT           |

RULE: Never ask user to paste memory manually.
RULE: Always load context from files before executing.
RULE: STATUS và STATUS-TODAY KHÔNG inject constraints.md — chỉ cần memory_state.
RULE: HOTFIX KHÔNG inject memory_state.json — không liên quan đến task context.
RULE: DEBUG tự upgrade từ REVIEW → FULL nếu severity = major.

---

## SKILLS REGISTRY (Dynamic Context)

> Skills contain domain-specific knowledge and patterns.
> They are dynamically loaded via `runtime/skill-loader.md` to prevent context bloat.
> Location: `.agents/skills/`

| Skill | Triggers / Keywords | Target Agents |
|---|---|---|
| frontend-design | ui, component, page, form, hook, frontend, react | builder, reviewer |
| groq-ai | llm, groq, prompt, classify, generate, ai | architect, builder, reviewer |
| managing-meta-webhooks | webhook, meta, tiktok, callback, event | builder, reviewer |
| supabase | db, auth, database, query, rls, supabase | architect, builder, reviewer |
| supabase-postgres-best-practices | postgres, indexing, performance, schema, optimization | architect, reviewer |

RULE: Missing skill files are gracefully ignored with a warning. NEVER block workflow execution if a skill file is not found.
RULE: Inject skills ONLY to their Target Agents. (e.g., UI skills are useless to the Architect, keep them for the Builder).

---

## SESSION MODES & MODIFIERS

→ Full details: `.antigravity/runtime/session-modes.md`

Modes: `ship` (default) | `explore` | `refactor`
Store in: `memory_state.session_intent.mode`

Common modifiers: --fast, --full, --skip-review, --patch, --flow-mode, --flow-mode-off
→ Full modifier table: `.antigravity/runtime/intent-rules.md` § MODIFIERS

---

## STATUS & TODAY OUTPUT FORMAT

→ Full format specs: `.antigravity/runtime/status-format.md`

---

## SESSION PRINCIPLES

1. One task at a time — never parallelize execution
2. Always review output — human stays in the loop
3. Memory is truth — never proceed without loading it
4. Intent over syntax — understand what the user means
5. Minimal friction — the system adapts to the user, not vice versa