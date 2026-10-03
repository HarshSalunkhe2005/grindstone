/** Lays a topic dependency graph out in layers, parents above children. Pure, so it can be tested. */
export interface TreeNodeInput {
  id: number;
  position: number;
}
export interface TreeEdge {
  from_topic: number;
  to_topic: number;
}
export interface TreeNode {
  id: number;
  layer: number;
  x: number;
  y: number;
}
export interface TreeLayout {
  nodes: TreeNode[];
  edges: { from: TreeNode; to: TreeNode }[];
  width: number;
  height: number;
}

export const NODE_W = 196;
export const NODE_H = 72;
const GAP_X = 28;
const GAP_Y = 52;
const PAD = 16;

export function layoutTree(topics: TreeNodeInput[], edges: TreeEdge[]): TreeLayout {
  const parents = new Map<number, number[]>();
  for (const t of topics) parents.set(t.id, []);
  for (const e of edges) parents.get(e.to_topic)?.push(e.from_topic);

  const depth = new Map<number, number>();
  const resolve = (id: number, seen = new Set<number>()): number => {
    const known = depth.get(id);
    if (known !== undefined) return known;
    if (seen.has(id)) return 0; // a cycle in bad data must not hang the page
    seen.add(id);
    const ps = parents.get(id) ?? [];
    const d = ps.length ? 1 + Math.max(...ps.map((p) => resolve(p, seen))) : 0;
    depth.set(id, d);
    return d;
  };
  topics.forEach((t) => resolve(t.id));

  const layers = new Map<number, TreeNodeInput[]>();
  for (const t of topics) {
    const d = depth.get(t.id) ?? 0;
    layers.set(d, [...(layers.get(d) ?? []), t]);
  }
  const layerCount = layers.size ? Math.max(...layers.keys()) + 1 : 0;
  const widest = Math.max(1, ...[...layers.values()].map((l) => l.length));
  const width = widest * NODE_W + (widest - 1) * GAP_X + PAD * 2;

  const nodes: TreeNode[] = [];
  for (let l = 0; l < layerCount; l++) {
    const row = (layers.get(l) ?? []).sort((a, b) => a.position - b.position);
    const rowWidth = row.length * NODE_W + (row.length - 1) * GAP_X;
    const startX = (width - rowWidth) / 2;
    row.forEach((t, i) => nodes.push({ id: t.id, layer: l, x: startX + i * (NODE_W + GAP_X), y: PAD + l * (NODE_H + GAP_Y) }));
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const links = edges
    .map((e) => ({ from: byId.get(e.from_topic)!, to: byId.get(e.to_topic)! }))
    .filter((e) => e.from && e.to);

  return { nodes, edges: links, width, height: PAD * 2 + layerCount * NODE_H + Math.max(0, layerCount - 1) * GAP_Y };
}
