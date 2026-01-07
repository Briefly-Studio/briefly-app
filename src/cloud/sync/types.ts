import type { CardRecord } from "../../models/card";
import type { DeckRecord } from "../../models/deck";

export type EntityType = "deck" | "card";

export type Change = {
  id: string;
  entity: EntityType;
  op: "upsert" | "delete";
  record: DeckRecord | CardRecord;
  ts: string;
};

export type PushRequest = { deviceId: string; changes: Change[] };
export type PushResponse = { accepted: string[]; rejected: string[] };

export type PullRequest = { deviceId: string; cursor?: string };
export type PullResponse = { cursor: string; changes: Change[] };
