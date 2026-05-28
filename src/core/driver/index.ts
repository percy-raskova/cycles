// Public surface of the game driver. Re-exports the Agent/driver types, the
// `driveGame` loop, and the three in-core agents. Re-exported in turn by
// `src/core/index.ts` so consumers import everything from `@core`.
export * from "./agents/index";
export { driveGame } from "./game-driver";
export * from "./types";
