/** One item per line in a textarea ⇄ an array. */
export const toLines = (v: string) => v.split("\n").map((l) => l.trim()).filter(Boolean);
/** "Name: value" per line ⇄ pairs. */
export const toPairs = (v: string) =>
  toLines(v).map((l) => {
    const i = l.indexOf(":");
    return i > 0 ? { name: l.slice(0, i).trim(), value: l.slice(i + 1).trim() } : { name: l, value: "Yes" };
  });
export const fromPairs = (p: { name: string; value: string }[]) => p.map((x) => `${x.name}: ${x.value}`).join("\n");
/** "Group: item, item" per line ⇄ mods. */
export const toGroups = (v: string) =>
  toLines(v).map((l) => {
    const i = l.indexOf(":");
    const group = i > 0 ? l.slice(0, i).trim() : "Work done";
    return { group, items: (i > 0 ? l.slice(i + 1) : l).split(",").map((x) => x.trim()).filter(Boolean) };
  }).filter((g) => g.items.length > 0);
export const fromGroups = (g: { group: string; items: string[] }[]) => g.map((x) => `${x.group}: ${x.items.join(", ")}`).join("\n");
