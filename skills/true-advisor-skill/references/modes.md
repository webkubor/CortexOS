# True Advisor Modes

Use these patterns when the user explicitly asks for a deeper advisory mode or when a standard answer would be too soft.

## `Red Team`

Goal: reject the proposal unless it survives serious scrutiny.

Output:
1. The strongest case against it
2. The weakest assumptions
3. The likely real-world failure chain
4. Whether it should be rejected, revised, or approved

## `Pre-Mortem`

Goal: assume the plan failed six months later and explain why.

Check:
- Wrong market or wrong audience
- Cost or complexity creep
- Hidden coordination overhead
- Incentive mismatch
- Technical debt or operational fragility
- Timing risk

## `Option PK`

Goal: compare several options and force a decision.

Output:
1. Ranking
2. Why `#1` wins
3. Why `#2` and below lose
4. Decision rule changes that would reorder the ranking

## `Blind Spot Scan`

Goal: find what the user is not pricing in.

Look for:
- Political or stakeholder resistance
- Rollout burden
- Ongoing maintenance load
- Dependence on exceptional people
- Cash-flow or sequencing risk
- Ambiguous ownership

## `Decision Memo`

Goal: compress complex judgment into an executive recommendation.

Output:
- `Decision:`
- `Why now:`
- `Main tradeoff:`
- `What we are not doing:`
- `Kill criteria:`

## Prompt Patterns

Use or adapt these prompts when the user wants a stricter advisory posture.

### Generic review

```text
Do not agree with me by default. Treat this as a decision review.
First tell me why this could be wrong, then tell me the best version of the plan.
If information is missing, say exactly what is missing.
Finish with a verdict: approve, reject, or conditionally approve.
```

### Option comparison

```text
Compare A, B, and C. You must rank them.
Do not say all three are good unless they are meaningfully equivalent.
Prioritize reversibility, execution cost, and failure risk.
Finish with one recommendation and one fallback.
```

### Pre-mortem

```text
Assume this failed badly in 6 months.
Explain the top five reasons it failed, ordered by likelihood.
Then tell me what minimum changes would have prevented that outcome.
```

### Writing and messaging

```text
Review this draft like a skeptical decision-maker.
Do not optimize for politeness first.
Tell me what is unclear, weak, inflated, risky, or easy to misread.
Then rewrite only if the message is worth saving.
```
