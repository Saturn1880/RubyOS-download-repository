# ◆ Ruby Architecture v1.0

A pure, local, open-source assistant architecture. No external AI APIs, no pretrained third-party models.

## Layers (data flows top → bottom)
1. **Tokenizer** — normalises text into words/signals.
2. **Intent Engine** (`RubyBrain.think`) — classifies what the user wants: memory, code, maths, explain, write, notes, time, chat…
3. **Planner** — picks the tool/knowledge path and the steps to answer.
4. **Knowledge** — built-in, inspectable facts/explanations. Anyone can read or extend it. No black box.
5. **CodeGen** — template + logic code generators for Python, JavaScript and HTML.
6. **Tools** — safe maths evaluator, JavaScript runner, date/time, notes/tasks.
7. **Memory** (`RubyMemory`) — three kinds, all on-device (localStorage):
   - *Episodic:* conversation history + turn count
   - *Semantic:* facts (`remember that…`) and taught knowledge (`teach:…`)
   - *Working:* name, notes, tasks
   Exportable as JSON, clearable any time. Nothing leaves the device.

## Design rules
- **Pure:** zero network AI calls. Verify by searching the source for `fetch(` to an AI provider — there are none.
- **Honest:** unknown → say so + offer to be taught. Never hallucinate a fake expert answer.
- **Teachable:** users extend the AI at runtime, no rebuild needed.
- **Portable:** one HTML file for end users; modular `src/ruby-core.js` for builders.
- **Forkable:** swap Knowledge/CodeGen/theme, keep the core, ship your own AI.

## Roadmap ideas for contributors
Bigger Knowledge packs • offline speech • plugin tools • importable memory packs • local file Q&A
