// wordDiff.ts — diff mot-à-mot (LCS) pour le suivi des modifications (track changes).

export type DiffOp = { type: "eq" | "del" | "ins"; text: string };

function tokenize(s: string): string[] {
  // garde les espaces comme tokens pour reconstruire fidèlement
  return s.match(/\s+|[^\s]+/g) ?? [];
}

export function wordDiff(a: string, b: string): DiffOp[] {
  const x = tokenize(a);
  const y = tokenize(b);
  const n = x.length;
  const m = y.length;
  // table LCS
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = x[i] === y[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  const push = (type: DiffOp["type"], text: string) => {
    const last = ops[ops.length - 1];
    if (last && last.type === type) last.text += text;
    else ops.push({ type, text });
  };
  while (i < n && j < m) {
    if (x[i] === y[j]) {
      push("eq", x[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push("del", x[i]);
      i++;
    } else {
      push("ins", y[j]);
      j++;
    }
  }
  while (i < n) push("del", x[i++]);
  while (j < m) push("ins", y[j++]);
  return ops;
}
