export type Player = "HEADS" | "TAILS";

export type CoinFace = "heads" | "tails";

export interface Position {
  readonly row: number;
  readonly col: number;
}

export interface Coin {
  readonly position: Position;
  face: CoinFace;
}

export interface Edge {
  readonly from: Position;
  readonly to: Position;
}

export type Action = "PLACE" | "JOIN" | "PASS";

export interface GameState {
  readonly coins: ReadonlyMap<string, Coin>;
  readonly edges: readonly Edge[];
  readonly currentPlayer: Player;
  readonly coinsRemaining: number;
  readonly passCount: number;
  readonly lastAction: Action | null;
}

export interface PlaceMove {
  readonly type: "PLACE";
  readonly position: Position;
  readonly face: CoinFace;
}

export interface JoinMove {
  readonly type: "JOIN";
  readonly a: Position;
  readonly b: Position;
}

export interface PassMove {
  readonly type: "PASS";
}

export type Move = PlaceMove | JoinMove | PassMove;
