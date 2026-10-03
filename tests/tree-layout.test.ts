import { describe, expect, it } from "vitest";
import { NODE_H, NODE_W, layoutTree } from "@/lib/tree-layout";

const topics = [1, 2, 3, 4, 5].map((id) => ({ id, position: id }));

describe("layoutTree", () => {
  it("puts children one layer below their deepest parent", () => {
    const { nodes } = layoutTree(topics, [
      { from_topic: 1, to_topic: 2 },
      { from_topic: 1, to_topic: 3 },
      { from_topic: 2, to_topic: 4 },
      { from_topic: 3, to_topic: 4 },
      { from_topic: 4, to_topic: 5 },
    ]);
    const layer = Object.fromEntries(nodes.map((n) => [n.id, n.layer]));
    expect(layer).toEqual({ 1: 0, 2: 1, 3: 1, 4: 2, 5: 3 });
  });

  it("centres each layer and orders siblings by position", () => {
    const { nodes, width } = layoutTree(topics.slice(0, 3), [
      { from_topic: 1, to_topic: 2 },
      { from_topic: 1, to_topic: 3 },
    ]);
    const n = Object.fromEntries(nodes.map((x) => [x.id, x]));
    expect(n[2].x).toBeLessThan(n[3].x);
    expect(n[1].x + NODE_W / 2).toBeCloseTo(width / 2); // the lone root sits in the middle
  });

  it("returns one edge per link with resolved endpoints and a sensible height", () => {
    const layout = layoutTree(topics.slice(0, 2), [{ from_topic: 1, to_topic: 2 }]);
    expect(layout.edges).toHaveLength(1);
    expect(layout.edges[0].from.y).toBeLessThan(layout.edges[0].to.y);
    expect(layout.height).toBeGreaterThanOrEqual(2 * NODE_H);
  });

  it("survives disconnected nodes and cycles in bad data", () => {
    expect(layoutTree(topics, []).nodes).toHaveLength(5);
    const cyclic = layoutTree(topics.slice(0, 2), [
      { from_topic: 1, to_topic: 2 },
      { from_topic: 2, to_topic: 1 },
    ]);
    expect(cyclic.nodes).toHaveLength(2);
  });

  it("drops edges that point at unknown topics", () => {
    expect(layoutTree(topics.slice(0, 2), [{ from_topic: 1, to_topic: 99 }]).edges).toEqual([]);
  });
});
