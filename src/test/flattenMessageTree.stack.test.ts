/**
 * A long conversation is a linked chain, and the recursive walk overflowed the
 * call stack on transcript-sized input (upstream #765).
 */
import { describe, it, expect } from "vitest";
import { flattenMessageTree } from "@/components/MessageViewer/helpers/flattenMessageTree";
import type { UIMessage } from "@/types";

const message = (uuid: string, second: number, parentUuid?: string): UIMessage => ({
  uuid,
  parentUuid,
  sessionId: "stack",
  timestamp: new Date(Date.UTC(2026, 0, 1, 12, 0, 0) + second * 1000).toISOString(),
  type: "assistant",
  content: `message ${uuid}`,
  model: "test-model",
});

type Options = Parameters<typeof flattenMessageTree>[0];

const options = (messages: UIMessage[]): Options =>
  ({
    messages,
    agentTaskGroups: new Map(),
    agentTaskMemberUuids: new Set<string>(),
    agentProgressGroups: new Map(),
    agentProgressMemberUuids: new Set<string>(),
    taskOperationGroups: new Map(),
    taskOperationMemberUuids: new Set<string>(),
  }) as Options;

const chain = (length: number) =>
  Array.from({ length }, (_, index) =>
    message(`m${index}`, index, index > 0 ? `m${index - 1}` : undefined)
  );

describe("deep transcript traversal", () => {
  it("flattens a 100k-deep chain in order without overflowing", () => {
    const messages = chain(100_000);
    const rows = flattenMessageTree(options(messages));
    const items = rows.filter((row) => row.type === "message");

    expect(items).toHaveLength(100_000);
    expect(items.map((row) => row.message.uuid)).toEqual(messages.map((m) => m.uuid));
  });

  it("keeps hidden descendants visited instead of orphaning them", () => {
    const rows = flattenMessageTree({
      ...options(chain(3)),
      hiddenMessageIds: ["m0"],
    });

    expect(rows.some((row) => row.type === "message")).toBe(false);
    expect(rows[0]?.type).toBe("hidden-placeholder");
  });
});
