# 🧠 ANTIGRAVITY v2 — GEMINI LOADER

---

## BOOT SEQUENCE

On session start:

1. Read `.antigravity/memory/memory_state.json`
2. Check `session_intent.flow_mode` → notify if true: "⚡ Flow mode is ON"
3. Classify intent from user's first message
4. Confirm boot: "✅ [project] | Task: [task] | [progress]%"

> memory_core NOT loaded at boot unless intent requires FULL CONTEXT.
> Missing memory file → notify user, do NOT crash.

---

## INTENT ROUTING

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
| EXPERIMENT | "thử xem", "experiment", "sandbox", "không cần commit" | `workflows/experiment.workflow.md` | **FULL** |
| DEBUG | "debug", "tại sao X", "something is broken", "complex trace" | `workflows/debug.workflow.md` | **REVIEW** → auto **FULL** nếu major |
| CONSULT | "hỏi architect", "nên dùng pattern nào", "ask planner" | direct agent call | **FULL** |
| PIVOT | "pivot sang X", "đổi approach", "dùng cách khác" | `workflows/pivot.workflow.md` | **FULL** |
| ADHOC | "viết regex", "convert sang TS", "giải thích nhanh" (lệnh đơn lẻ không fit intent khác) | direct LLM call | **MINIMAL** |
| UNCLEAR | "không classify được" | load `runtime/intent-rules.md` § UNCLEAR | — |

> Nếu không chắc HOTFIX hay DEBUG → load `runtime/intent-rules.md` §ROUTING PRIORITY

---

## MEMORY CONTEXT LEVELS
| Level    | Load what                                                                                                                   | Used for                                              |
|----------|-----------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| NONE     | nothing                                                                                                                     | IDEA                                                  |
| MINIMAL  | `memory_state.json` + decisions.log.jsonl (last 1 entry only)                                                               | STATUS, STATUS-TODAY, ADHOC                           |
| HOTFIX   | `constraints.md` + `coding_rules.md` + affected file from stack trace                                                       | HOTFIX                                                |
| STANDARD | `memory_state.json` + `constraints.md` + `coding_rules.md`                                                                  | EXECUTE FAST                                          |
| REVIEW   | `constraints.md` + `coding_rules.md` + architecture rules from memory_core + task context                                   | REVIEW, PREVIEW, EXPERIMENT, DEBUG                    |
| FULL     | `memory_core.json` + `memory_state.json` + last 3 decisions + `constraints.md` + `coding_rules.md` + `PROJECT_INTENT.md`    | EXECUTE FULL, PLAN, AUGMENT, CONSULT, PIVOT,EXPERIMENT|

RULE: Never ask user to paste memory manually.
RULE: STATUS does NOT load constraints.md.
RULE: HOTFIX does NOT load memory_state.json.
RULE: DEBUG auto-upgrades REVIEW → FULL if severity = major.

---

## SKILLS REGISTRY

> Location: `.agents/skills/` — loaded dynamically, never at boot.

| Skill | Triggers | Agents |
|---|---|---|
| frontend | ui, component, page, form, hook, react | builder, reviewer |
| supabase | db, auth, database, query, rls | architect, builder, reviewer |
| queue | worker, job, bullmq, redis, background | architect, builder, reviewer |
| ai | llm, groq, prompt, classify, generate | architect, builder, reviewer |
| webhook | webhook, meta, tiktok, callback | builder, reviewer |

RULE: Missing skill file → warning only, never block.
RULE: Inject skills only to Target Agents listed above.

---

## SESSION MODES & FLOW MODE

Modes: `ship` (default) | `explore` | `refactor`
Flow mode: `--flow-mode` / "cứ chạy đi" → auto-approve minor checkpoints
Details: `.antigravity/runtime/session-modes.md`

---

## SESSION PRINCIPLES

1. One task at a time — never parallelize
2. Human stays in the loop at critical decisions
3. Memory is truth — always load before executing
4. Intent over syntax — infer from natural language
5. Minimal friction — system adapts to user