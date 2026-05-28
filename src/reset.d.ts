// @total-typescript/ts-reset — tightens loose TS stdlib types globally.
// Most impactful changes:
//   - JSON.parse(...) returns unknown (was any) — forces a narrowing step.
//   - .filter(Boolean) refines T | null | undefined | "" | 0 | false → T properly.
//   - Set.prototype.has / Array.prototype.includes accept wider input types.
// See https://github.com/total-typescript/ts-reset for the full list.
import "@total-typescript/ts-reset";
