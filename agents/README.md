# Multi-Agent Workspace — Zenith

This directory contains the communication layer for 5 Claude Code agents working on this project.

## Team

| Agent | Role | Model Suggestion |
|-------|------|-----------------|
| Tech Lead | Architecture, reviews, task delegation | claude-opus-4-6 |
| Senior Engineer 1 | Feature implementation | claude-sonnet-4-6 |
| Senior Engineer 2 | Feature implementation | claude-sonnet-4-6 |
| QA Engineer | Testing, bug reports, validation | claude-sonnet-4-6 |
| Senior UI/UX Designer | UI audits, design specs, implementation review | claude-sonnet-4-6 |

---

## Directory Structure

```
agents/
  roles/
    tech-lead.md        # Tech Lead role instructions
    senior-eng.md       # Senior Engineer role instructions (shared)
    qa.md               # QA Engineer role instructions
    ux-designer.md      # Senior UI/UX Designer role instructions
  inbox/
    tech-lead.md        # Messages TO Tech Lead
    senior-eng-1.md     # Messages TO Senior Engineer 1
    senior-eng-2.md     # Messages TO Senior Engineer 2
    qa.md               # Messages TO QA
    ux-designer.md      # Messages TO Senior UI/UX Designer
  outbox/
    tech-lead.md        # Output FROM Tech Lead
    senior-eng-1.md     # Output FROM Senior Engineer 1
    senior-eng-2.md     # Output FROM Senior Engineer 2
    qa.md               # Output FROM QA
    ux-designer.md      # Output FROM Senior UI/UX Designer
  tasks.md              # Shared task board (single source of truth)
  README.md             # This file
```

---

## How to Start Each Agent Session

Open **5 separate terminals** in the project root. In each one, start `claude` and paste the opening prompt for that role:

### Terminal 1 — Tech Lead
```
Read agents/roles/tech-lead.md to understand your role. Then read agents/inbox/tech-lead.md for any messages and agents/tasks.md for the current task board. You are the Tech Lead.
```

### Terminal 2 — Senior Engineer 1
```
Read agents/roles/senior-eng.md to understand your role. Then read agents/inbox/senior-eng-1.md for messages and agents/tasks.md for your assigned tasks. You are Senior Engineer 1.
```

### Terminal 3 — Senior Engineer 2
```
Read agents/roles/senior-eng.md to understand your role. Then read agents/inbox/senior-eng-2.md for messages and agents/tasks.md for your assigned tasks. You are Senior Engineer 2.
```

### Terminal 4 — QA Engineer
```
Read agents/roles/qa.md to understand your role. Then read agents/inbox/qa.md for messages and agents/tasks.md for tasks awaiting QA. You are the QA Engineer.
```

### Terminal 5 — Senior UI/UX Designer
```
Read agents/roles/ux-designer.md to understand your role. Then read agents/inbox/ux-designer.md for messages and agents/tasks.md for your assigned tasks. You are the Senior UI/UX Designer.
```

---

## Workflow

```
You (manager)
  │
  ▼
agents/tasks.md  ◄──────────────────────────────────────────────┐
  │                                                              │
  ▼                                                              │
Tech Lead                                                        │
  │  reads tasks.md, assigns work, writes to agent inboxes      │
  ├──────────────────────────────────┐                          │
  ▼                                  ▼                          │
Senior Eng 1 / Senior Eng 2       Senior UI/UX Designer         │
  │  implements task                 │  produces design specs    │
  │  writes summary to outbox        │  writes specs to outbox   │
  │◄─────────────────────────────────┘  notifies engineers       │
  ▼                                                              │
Tech Lead                                                        │
  │  reviews code + design spec alignment                        │
  │  approves or sends back                                      │
  ▼                                                              │
Senior UI/UX Designer                                            │
  │  reviews implemented UI vs spec                              │
  │  approves or flags deviations                                │
  ▼                                                              │
QA Engineer                                                      │
  │  runs tests, writes results                                  │
  └─ updates tasks.md (qa-passed / qa-failed) ──────────────────┘
```

### Step-by-step

1. **You** add a task to `agents/tasks.md`
2. **Tech Lead** reads the task board and assigns it — writes to `agents/inbox/senior-eng-1.md` or `senior-eng-2.md`
3. **Engineer** reads their inbox, implements the task, writes a summary to their outbox (`agents/outbox/senior-eng-1.md`), and updates task status to `review`
4. **Tech Lead** reads the engineer's outbox, reviews the code changes, approves or requests changes — writes to `agents/outbox/tech-lead.md`
5. **QA** reads the approved outbox, runs Playwright tests, writes results to `agents/outbox/qa.md`, and updates task status to `qa-passed` or `qa-failed`
6. If `qa-failed`, loop back to step 3 with the bug report
7. If `qa-passed`, **you** mark the task `done`

---

## Tips

- You relay messages between agents by copy-pasting outbox content into the next agent's session, or by telling the agent to `read agents/outbox/senior-eng-1.md`
- Each agent's session is independent — they have no automatic awareness of each other
- The filesystem is the message bus
- Keep outbox entries dated so you can track history
