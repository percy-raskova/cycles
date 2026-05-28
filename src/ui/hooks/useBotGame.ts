import type {
  Agent,
  BotFunction,
  DeferredHandle,
  DriverUpdate,
  FinalScore,
  GameSession,
  Move,
  Player,
} from "@core";
import {
  computeFinalScore,
  createCpuAgent,
  createDeferredAgent,
  createSession,
  createStrategicBot,
  driveGame,
  randomBot,
  undo as undoSession,
} from "@core";
import { createLogger } from "@ui/lib/logger";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BotStrategyUI, GameSetupOptions, OpponentType } from "../types/setup";

const log = createLogger("bot-game");

/** Auto-pass notice duration (ms) before the driver applies a forced PASS. */
const AUTO_PASS_MS = 1000;
/** Default bot "think" delay (ms); tests inject `botDelayMs: 0` for instant play. */
const BOT_THINK_MS = 2000;

export interface UseBotGameOptions extends GameSetupOptions {
  readonly botDelayMs?: number;
  /** Test-only override of the starting session (e.g. a pre-built blocked board). */
  readonly initialSession?: GameSession;
}

export interface UseBotGameReturn {
  readonly session: GameSession;
  /** Submit the current player's move (human input → its DeferredAgent). */
  readonly submitMove: (move: Move) => void;
  readonly reset: () => void;
  readonly undo: () => void;
  readonly canUndo: boolean;
  readonly finalScore: FinalScore | null;
  readonly botThinking: boolean;
  /** Forced-pass notice shown during the auto-pass delay, else null. */
  readonly notice: string | null;
}

function oppositePlayer(player: Player): Player {
  return player === "HEADS" ? "TAILS" : "HEADS";
}

function initialFor(options: UseBotGameOptions): GameSession {
  if (options.initialSession) {
    return options.initialSession;
  }
  const firstPlayer = options.humanFirst ? options.playerRole : oppositePlayer(options.playerRole);
  return createSession({ firstPlayer });
}

function getBotFunction(opponent: BotStrategyUI, deadlineMs: number): BotFunction {
  if (opponent === "strategic") {
    // Inject the clock at the UI boundary (Q8) so the engine stays time-free.
    return createStrategicBot({ now: () => performance.now(), deadlineMs });
  }
  return randomBot;
}

function delay(ms: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

interface BuiltAgents {
  readonly agents: Readonly<Record<Player, Agent>>;
  readonly deferred: Readonly<Partial<Record<Player, DeferredHandle>>>;
}

/** Build the agent pair once: the human slot(s) deferred, a bot opponent as a CpuAgent. */
function buildAgents(
  opponent: OpponentType,
  humanSlot: Player,
  botDelayMs: number | undefined,
): BuiltAgents {
  const oppSlot = oppositePlayer(humanSlot);
  const humanHandle = createDeferredAgent(humanSlot);
  const deferred: Partial<Record<Player, DeferredHandle>> = { [humanSlot]: humanHandle };

  let oppAgent: Agent;
  if (opponent === "human") {
    const oppHandle = createDeferredAgent(oppSlot);
    deferred[oppSlot] = oppHandle;
    oppAgent = oppHandle.agent;
  } else {
    const bot = getBotFunction(opponent, botDelayMs ?? BOT_THINK_MS);
    const think = (signal: AbortSignal | undefined) => delay(botDelayMs ?? BOT_THINK_MS, signal);
    oppAgent = createCpuAgent(oppSlot, bot, { think });
  }

  const agents = { [humanSlot]: humanHandle.agent, [oppSlot]: oppAgent } as Record<Player, Agent>;
  return { agents, deferred };
}

function applyUpdate(
  update: DriverUpdate,
  setSession: (s: GameSession) => void,
  setNotice: (n: string | null) => void,
): void {
  if (update.kind === "applied") {
    setNotice(null);
    setSession(update.session);
    return;
  }
  if (update.kind === "start" || update.kind === "end") {
    setSession(update.session);
  }
}

export function useBotGame(options: UseBotGameOptions): UseBotGameReturn {
  const [session, setSession] = useState<GameSession>(() => initialFor(options));
  const [notice, setNotice] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);

  const optionsRef = useRef(options);
  optionsRef.current = options;
  const sessionRef = useRef(session);
  sessionRef.current = session;
  // A reset/undo sets the next run's start session; null ⇒ start fresh from options.
  const targetRef = useRef<GameSession | null>(null);

  // Agents persist across runs; rebuilt only when the game configuration changes.
  const { agents, deferred } = useMemo(
    () => buildAgents(options.opponent, options.playerRole, options.botDelayMs),
    [options.opponent, options.playerRole, options.botDelayMs],
  );

  // Run the driver for the whole game; restart on reset/undo (runId) or config change (agents).
  // biome-ignore lint/correctness/useExhaustiveDependencies: runId is a manual restart trigger; `agents` is the real captured dep, options are read via optionsRef.
  useEffect(() => {
    const controller = new AbortController();
    const start = targetRef.current ?? initialFor(optionsRef.current);
    targetRef.current = null;
    setSession(start);
    setNotice(null);

    void driveGame({
      initialSession: start,
      agents,
      signal: controller.signal,
      onUpdate: (u) => applyUpdate(u, setSession, setNotice),
      hooks: {
        beforeForcedPass: (slot, signal) => {
          setNotice(`${slot} has no legal moves — passing`);
          return delay(AUTO_PASS_MS, signal);
        },
      },
    }).catch((error: unknown) => {
      if (!isAbortError(error)) {
        log.error("driver run failed", error);
      }
    });

    return () => controller.abort();
  }, [runId, agents]);

  const submitMove = useCallback(
    (move: Move) => {
      deferred[sessionRef.current.state.currentPlayer]?.submit(move);
    },
    [deferred],
  );

  const reset = useCallback(() => {
    // New Game returns to a fresh board (matches the legacy reset → createSession()),
    // not any test-injected initialSession.
    targetRef.current = createSession();
    setRunId((n) => n + 1);
  }, []);

  const undo = useCallback(() => {
    const current = sessionRef.current;
    if (current.history.length === 0) {
      return;
    }
    targetRef.current = undoSession(current);
    setRunId((n) => n + 1);
  }, []);

  const isBotOpponent = options.opponent !== "human";
  const botThinking =
    isBotOpponent &&
    !session.isTerminal &&
    session.state.currentPlayer === oppositePlayer(options.playerRole);

  return {
    session,
    submitMove,
    reset,
    undo,
    canUndo: session.history.length > 0,
    finalScore: session.isTerminal ? computeFinalScore(session) : null,
    botThinking,
    notice,
  };
}
