/**
 * Two selections in a row: the older load finishes last and must not paint
 * its messages over the session the user is looking at (upstream #767).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockLoadMessages } = vi.hoisted(() => ({
  mockLoadMessages: vi.fn(),
}));

vi.mock("@/adapters/registry/AdapterRegistry", () => ({
  adapterRegistry: {
    get: () => ({ loadMessages: mockLoadMessages }),
    tryGet: () => ({ loadMessages: mockLoadMessages }),
  },
}));

import { useAppStore } from "@/store/useAppStore";
import { useSourceStore } from "@/store/useSourceStore";

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const session = (id: string) =>
  ({
    session_id: id,
    file_path: `C:/proj/${id}.jsonl`,
    providerId: "claude",
    message_count: 0,
    last_modified: "2026-01-01T00:00:00Z",
    first_message_time: "2026-01-01T00:00:00Z",
  }) as never;

const ok = (count: number) => ({
  success: true,
  data: Array.from({ length: count }, () => ({})),
  pagination: { nextOffset: count, totalCount: count, hasMore: false },
});

describe("session load ownership", () => {
  beforeEach(() => {
    mockLoadMessages.mockReset();
    useSourceStore.setState({
      sources: [
        {
          id: "src-claude",
          providerId: "claude",
          path: "C:/proj",
          isAvailable: true,
        },
      ] as never,
    });
    useAppStore.setState({ projects: [], selectedProject: null });
  });

  it("drops a stale load that finishes after the next selection", async () => {
    const first = deferred<ReturnType<typeof ok>>();
    const second = deferred<ReturnType<typeof ok>>();

    mockLoadMessages
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const a = useAppStore.getState().selectSession(session("a"));
    const b = useAppStore.getState().selectSession(session("b"));

    // The newer selection answers first, the older one straggles in after.
    second.resolve(ok(0));
    await b;
    first.resolve(ok(3));
    await a;

    const state = useAppStore.getState();
    expect(state.selectedSession?.session_id).toBe("b");
    expect(state.messages).toHaveLength(0);
    expect(state.isLoadingMessages).toBe(false);
  });
});
