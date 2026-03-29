"""Emit src/renderer/src/tridoku/topology.ts from triangular mesh math."""
import math

def main() -> None:
    def vid(r: int, c: int) -> int:
        return sum(i + 1 for i in range(r)) + c

    verts: list[tuple[float, float]] = []
    for r in range(10):
        for c in range(r + 1):
            verts.append((c - r / 2.0, -r * math.sqrt(3) / 2))

    edges: set[tuple[int, int]] = set()
    for r in range(10):
        for c in range(r + 1):
            idx = vid(r, c)
            for dr, dc in [(-1, -1), (-1, 0), (1, 0), (1, 1), (0, -1), (0, 1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr <= 9 and 0 <= nc <= nr:
                    j = vid(nr, nc)
                    if j > idx:
                        edges.add(tuple(sorted((idx, j))))

    adj: list[set[int]] = [set() for _ in range(55)]
    for a, b in edges:
        adj[a].add(b)
        adj[b].add(a)

    triangles: list[tuple[int, int, int]] = []
    for i in range(55):
        for j in adj[i]:
            if j <= i:
                continue
            for k in adj[i] & adj[j]:
                if k > i and k > j:
                    triangles.append(tuple(sorted((i, j, k))))
    triangles = sorted(set(triangles))
    assert len(triangles) == 81

    cent: list[tuple[float, float]] = []
    for t in triangles:
        cx = sum(verts[v][0] for v in t) / 3
        cy = sum(verts[v][1] for v in t) / 3
        cent.append((cx, cy))

    touch: list[list[int]] = [[] for _ in range(81)]
    for i in range(81):
        for j in range(i + 1, 81):
            if set(triangles[i]) & set(triangles[j]):
                touch[i].append(j)
                touch[j].append(i)

    bottom_row = {vid(9, c) for c in range(10)}
    left_edge = {vid(r, 0) for r in range(10)}
    right_edge = {vid(r, r) for r in range(10)}

    def count_on(t: tuple[int, int, int], s: set[int]) -> int:
        return sum(1 for v in t if v in s)

    outer_bottom: list[int] = []
    outer_left: list[int] = []
    outer_right: list[int] = []
    for i, t in enumerate(triangles):
        if count_on(t, bottom_row) >= 2:
            outer_bottom.append(i)
        if count_on(t, left_edge) >= 2:
            outer_left.append(i)
        if count_on(t, right_edge) >= 2:
            outer_right.append(i)

    def lerp(
        p: tuple[float, float], q: tuple[float, float], t: float
    ) -> tuple[float, float]:
        return (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)

    def dist_point_seg(
        p: tuple[float, float], a: tuple[float, float], b: tuple[float, float]
    ) -> float:
        ax, ay = a
        bx, by = b
        px, py = p
        abx, aby = bx - ax, by - ay
        t = max(
            0,
            min(
                1,
                ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby + 1e-9),
            ),
        )
        qx, qy = ax + t * abx, ay + t * aby
        return math.hypot(px - qx, py - qy)

    a = verts[vid(0, 0)]
    b = verts[vid(9, 0)]
    c = verts[vid(9, 9)]
    va = lerp(a, b, 1 / 3)
    vb = lerp(b, c, 1 / 3)
    vc = lerp(c, a, 1 / 3)
    inner_edges = [(va, vb), (vb, vc), (vc, va)]
    inner_groups: list[list[int]] = []
    for u, v in inner_edges:
        lst = [(dist_point_seg(cent[i], u, v), i) for i in range(81)]
        lst.sort(key=lambda x: x[0])
        inner_groups.append([x[1] for x in lst[:9]])

    nonets = [list(range(k * 9, (k + 1) * 9)) for k in range(9)]
    groups = nonets + [outer_bottom, outer_left, outer_right] + inner_groups

    lines: list[str] = []
    lines.append(
        "/** Tridoku topology: 81 cells, vertex-touch adjacency, constraint groups (nonets + outer + inner). */"
    )
    lines.append("export const CELL_COUNT = 81 as const")
    lines.append(
        "export const VERTS: readonly { readonly x: number; readonly y: number }[] = ["
    )
    for vx, vy in verts:
        lines.append(f"  {{ x: {vx!r}, y: {vy!r} }},")
    lines.append("] as const")
    lines.append("export const TRIANGLES: readonly [number, number, number][] = [")
    for t in triangles:
        lines.append(f"  [{t[0]}, {t[1]}, {t[2]}],")
    lines.append("] as const")
    lines.append(
        "export const CENTROIDS: readonly { readonly x: number; readonly y: number }[] = ["
    )
    for cx, cy in cent:
        lines.append(f"  {{ x: {cx!r}, y: {cy!r} }},")
    lines.append("] as const")
    lines.append("export const TOUCH_NEIGHBORS: readonly ReadonlyArray<number>[] = [")
    for row in touch:
        lines.append(f"  [{', '.join(str(x) for x in row)}],")
    lines.append("] as const")
    lines.append("export const CONSTRAINT_GROUPS: readonly ReadonlyArray<number>[] = [")
    for g in groups:
        lines.append(f"  [{', '.join(str(x) for x in g)}],")
    lines.append("] as const")

    out_path = (
        r"c:\Users\Azure\Documents\Axiom\Typescript\Sudoku\src\renderer\src\tridoku\topology.ts"
    )
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("wrote", out_path)


if __name__ == "__main__":
    main()
