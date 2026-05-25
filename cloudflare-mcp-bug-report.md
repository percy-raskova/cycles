# Bug: workers-bindings MCP emits `{"not":{}}` in tool schemas, breaking strict LLM function-calling (Kimi, Gemini, OpenAI strict)

## Describe the bug

The hosted **workers-bindings** MCP server (`https://bindings.mcp.cloudflare.com/mcp`, `serverInfo.version: "0.4.7"`) returns tool input schemas in which every **optional** parameter is encoded as a `{"not":{}}` ("match nothing") branch inside an `anyOf`:

```json
"primary_location_hint": {
  "anyOf": [
    { "not": {} },
    { "type": "string", "enum": ["wnam","enam","weur","eeur","apac","oc"] }
  ]
}
```

Several LLM providers' function-calling validators **reject the JSON Schema `not` keyword outright** and fail the *entire* request (not just the one tool) the moment any such tool is in the tool list. Observed errors:

- **Kimi / Moonshot:** `Error from provider: JSON Schema not supported: could not understand the instance {'not': {}}`
- **Google Gemini:** rejects `anyOf`/`not` tool schemas (see colinhacks/zod#5807)
- **OpenAI strict mode / Fireworks:** same class of rejection

Because the failure aborts the whole request, **enabling this MCP server makes the agent unusable** with these models — every message fails, regardless of whether the user ever calls a binding tool.

## To Reproduce

1. Connect any MCP client backed by a strict-schema model (e.g. Kimi K2.x, Gemini) to `https://bindings.mcp.cloudflare.com/mcp`.
2. Send any message that includes the server's tools in the request.
3. The provider rejects the request with `JSON Schema not supported: could not understand the instance {'not': {}}`.

Affected tools include `d1_database_create` (`primary_location_hint`), `d1_database_query` (`params`), `hyperdrive_configs_list` (`page`, `per_page`, `order`, `direction`), and `hyperdrive_config_edit` (`name`, `database`, `host`, `port`, `scheme`, `user`, `caching_*`). A `tools/list` against the live server shows 18 distinct `{"not":{}}` instances.

## Expected behavior

Optional parameters should be expressed by omitting them from `required` (and/or a representable union), without a `{"not":{}}` branch, so the schemas are accepted by mainstream function-calling validators.

## Root cause

The tool params are defined with Zod `.optional()` / `.optional().nullable()`, e.g. in `packages/mcp-common/src/types/d1.types.ts`:

```ts
export const D1DatabasePrimaryLocationHintParam: z.ZodType<...> =
  z.enum(['wnam','enam','weur','eeur','apac','oc']).optional()
```

`mcp-common` pins `zod@3.24.2` and `@modelcontextprotocol/sdk@1.20.2`. The SDK converts schemas with `zod-to-json-schema` (`zodToJsonSchema(tool.inputSchema, { strictUnions: true })` in `src/server/mcp.ts`). `zod-to-json-schema`'s `parseOptionalDef` (`src/parsers/optional.ts`) renders an optional field as:

```ts
return { anyOf: [ { not: parseAnyDef(refs) }, innerSchema ] }
// parseAnyDef(refs) === {}  ->  { not: {} }
```

`strictUnions: true` does **not** remove this — it only filters catch-all union members, not the `not: {}` "not-undefined" arm. So `.optional()` → `{ anyOf: [{ not: {} }, T] }` for every optional field.

## Proposed fix

**Option A — schema sanitizer in `mcp-common` (low-risk, immediate).** Post-process each tool's generated JSON Schema before registration: recursively, for any `anyOf` containing a `{"not":{}}` member, drop that member; if only one branch remains, inline it. The field is already absent from `required`, so semantics are preserved. Sketch:

```ts
function stripNotEmpty(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stripNotEmpty)
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (Array.isArray(obj.anyOf)) {
      const kept = obj.anyOf.filter(
        (m) => !(m && typeof m === 'object'
          && 'not' in m
          && Object.keys((m as any).not ?? {}).length === 0
          && Object.keys(m).length === 1),
      )
      if (kept.length === 1) return { ...stripNotEmpty(kept[0]),
        ...(obj.description ? { description: obj.description } : {}) }
      obj.anyOf = kept.map(stripNotEmpty)
    }
    for (const k of Object.keys(obj)) if (k !== 'anyOf') obj[k] = stripNotEmpty(obj[k])
  }
  return node
}
```

**Option B — migrate to Zod v4 native `z.toJSONSchema()` (long-term).** Zod v4 omits optionals from `required` without emitting `{"not":{}}`. Requires bumping `zod` to `^4`, `agents` to `>=0.8.0`, and the MCP SDK to a version that calls `z.toJSONSchema()`.

**Option C — upstream in `@modelcontextprotocol/sdk`.** The same sanitizer applied after `zodToJsonSchema` in `src/server/mcp.ts` would fix this for all MCP servers built on the SDK; cross-referencing modelcontextprotocol/typescript-sdk#745.

Option A is the smallest change that unblocks affected users immediately.

## Environment

- Server: `workers-bindings` 0.4.7 (hosted, `https://bindings.mcp.cloudflare.com/mcp`)
- `mcp-common` 0.20.5 — `zod@3.24.2`, `agents@0.2.19`, `@modelcontextprotocol/sdk@1.20.2`
- Clients reproduced with: opencode (Kimi K2.x); also reported with Gemini

## References

- `zod-to-json-schema` optional parser: https://github.com/StefanTerdell/zod-to-json-schema/blob/master/src/parsers/optional.ts
- MCP SDK conversion call: https://github.com/modelcontextprotocol/typescript-sdk/issues/745
- Zod v4 / Gemini `anyOf` incompatibility: https://github.com/colinhacks/zod/issues/5807

---

Happy to open a PR implementing Option A (sanitizer + test) if a maintainer would like — just give the nod.
