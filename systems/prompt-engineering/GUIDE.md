# Prompt Engineering Guide for Claude Opus 4.6

A practical guide to writing effective prompts, system instructions, and tool descriptions. Based on real-world testing and iteration.

---

## Core Principles

### 1. Drop the Urgency — Write Calmly

ALL-CAPS markers like CRITICAL, MUST, NEVER, ALWAYS cause the model to overtrigger on rules. It treats every instruction as maximum priority, which paradoxically makes it worse at following any of them. The model responds better to calm, clear language because it can properly weight instructions relative to each other.

**Before:**
```
You MUST ALWAYS respond in JSON. NEVER include markdown. CRITICAL: Do NOT add extra fields.
```

**After:**
```
Respond in JSON format. Don't include markdown formatting or extra fields beyond what's requested.
```

The second version is shorter, clearer, and produces more consistent results.

---

### 2. Explain Why, Not Just What

When you explain the reasoning behind a rule, the model generalizes correctly to edge cases you didn't anticipate. A bare rule gets followed literally; a rule with reasoning gets followed in spirit.

**Before:**
```
Keep responses under 200 words.
```

**After:**
```
Keep responses under 200 words. Users are reading on mobile and scanning quickly — concise answers get read, long ones get skipped.
```

With the reasoning, the model also adjusts tone and structure to support scannability, not just length.

---

### 3. Show Only Desired Behavior

When you show anti-patterns ("don't do this"), the model anchors on them and starts reproducing them. Show only what good output looks like. The model learns more from one positive example than from a list of don'ts.

**Before:**
```
Don't respond like this:
"I'm not sure, but maybe try restarting?"

Instead respond like this:
"Restart the service with: systemctl restart nginx"
```

**After:**
```
Example response:
"Restart the service with: systemctl restart nginx"
```

If you showed the model the bad example, it will sometimes produce hedging language. Just show the good version.

---

### 4. Remove "If In Doubt" Defaults

Phrases like "if in doubt, use this tool" or "when unsure, default to X" cause the model to use that tool far too often. The model interprets uncertainty broadly. Instead, describe specific conditions when a tool should be used.

**Before:**
```
Use the search tool if you're not sure about the answer.
```

**After:**
```
Use the search tool when the question involves facts that change over time (prices, dates, current events) or specific data you weren't trained on.
```

---

### 5. Match Prompt Format to Output Format

The formatting style of your prompt influences the formatting style of the output. If you write your system prompt with bullet points and headers, the model will tend to produce bullet points and headers. If you want conversational replies, write conversationally.

**Before (wants casual chat, writes formally):**
```
## Response Guidelines
- Maintain informal tone
- Use conversational language
- Avoid bullet points in responses
```

**After:**
```
Talk like a friend would. Keep it casual and conversational — no lists, no headers, just normal sentences.
```

---

## System Prompts

### Structure

A good system prompt has three parts:

1. **Identity** — Who the model is (one sentence)
2. **Context** — What it's working with, who it's talking to
3. **Behavior** — How it should respond, with reasoning

```
You are a senior code reviewer for a Python team.

The team uses Python 3.12, pytest for testing, and follows PEP 8. Reviews go to developers with 1-3 years of experience, so explanations should teach, not just flag.

When reviewing code, focus on correctness first, then readability. Suggest specific fixes rather than vague improvements — a developer should be able to apply your review without guessing what you meant.
```

### What to Avoid

- Stacking dozens of rules (the model loses track after ~10 distinct instructions)
- Contradictory instructions ("be concise" + "explain thoroughly")
- Identity statements that conflict with behavior ("you are friendly" + rules that force terse responses)

---

## Tool Descriptions

Tool descriptions are prompts too. The model decides when to use a tool based on its description.

### Good tool description pattern:
```json
{
  "name": "get_weather",
  "description": "Returns current weather conditions and 5-day forecast for a location. Use when the user asks about weather, temperature, or whether they need an umbrella."
}
```

### What makes this work:
- States what it returns (so the model knows what to expect)
- Lists specific trigger conditions (so the model knows when to call it)
- Doesn't say "use this if you're not sure about conditions" (would overtrigger)

### Parameter descriptions matter:
```json
{
  "name": "location",
  "description": "City name or coordinates. Examples: 'London', '51.5,-0.1'. Defaults to user's last known location if omitted."
}
```

Specific examples in parameter descriptions reduce malformed calls.

---

## Few-Shot Examples

Few-shot examples are the most powerful steering tool you have. One example is worth a hundred words of instruction.

### Rules:
- Show 2-3 examples of desired output (not more — diminishing returns)
- Only show correct examples
- Vary the examples enough that the model generalizes (don't use three examples that are too similar)
- Match the difficulty of examples to the expected input

```
Extract the action items from meeting notes.

Meeting notes: "We agreed to ship v2 by Friday. Sara will handle QA. Tom needs to update the API docs before Thursday."

Action items:
- Ship v2 by Friday (team)
- QA review (Sara)
- Update API docs by Thursday (Tom)

Meeting notes: "Quick sync. No blockers. We'll revisit the pricing page next sprint."

Action items:
- Revisit pricing page (next sprint)
```

---

## Chain-of-Thought

Asking the model to reason step-by-step helps with complex tasks. But how you ask matters.

**Effective:** Give it a structure to fill in.
```
Before answering, work through this:
1. What is the user actually asking?
2. What information do I need?
3. What's the most direct answer?
```

**Less effective:** Just saying "think step by step" — this produces verbose reasoning without improving accuracy on most tasks. Use structured reasoning for complex logic, math, or multi-step analysis.

---

## Persona Crafting

Personas work best when they're grounded in specific behaviors, not vague adjectives.

**Before:**
```
You are a friendly, helpful, knowledgeable assistant.
```

**After:**
```
You are a staff engineer at a startup. You give direct answers, share relevant experience when it helps, and push back when a technical approach has known problems. You don't sugarcoat, but you're not rude — think senior colleague, not customer support.
```

The second version produces noticeably different (and more useful) output because it describes concrete behavior patterns.

---

## Checklist

Before shipping a prompt:

- [ ] No ALL-CAPS urgency markers
- [ ] Every rule has a "because" or clear reasoning
- [ ] No anti-pattern examples shown to the model
- [ ] No "if in doubt / when unsure" fallback triggers
- [ ] Prompt formatting matches desired output style
- [ ] Tested with edge cases, not just happy path
- [ ] Under ~10 distinct behavioral rules
- [ ] Tool descriptions have specific trigger conditions

---

## Further Reading

- `examples/` — Before/after pairs for each principle
- `lint.js` — Automated prompt linter that checks these principles
- `rules.json` — Machine-readable rule definitions
