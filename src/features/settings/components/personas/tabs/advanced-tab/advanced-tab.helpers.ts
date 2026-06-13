import * as React from "react";

// Thuật toán LCS so khớp dòng thẳng hàng chuẩn Git Diff
export function diffLines(one: string, two: string) {
  const a = one ? one.split("\n") : [];
  const b = two ? two.split("\n") : [];
  const matrix = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(0));

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  let i = a.length;
  let j = b.length;
  const resultA: { text: string; type: "normal" | "removed" }[] = [];
  const resultB: { text: string; type: "normal" | "added" }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      resultA.unshift({ text: a[i - 1], type: "normal" });
      resultB.unshift({ text: b[j - 1], type: "normal" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      resultB.unshift({ text: b[j - 1], type: "added" });
      resultA.unshift({ text: "", type: "normal" });
      j--;
    } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
      resultA.unshift({ text: a[i - 1], type: "removed" });
      resultB.unshift({ text: "", type: "normal" });
      i--;
    }
  }

  return { diffA: resultA, diffB: resultB };
}

// Hàm highlight các biến {{...}} trong System Prompt để dễ theo dõi
export function highlightPromptVariables(text: string) {
  if (!text) return "";
  const parts = text.split(/(\{\{[a-zA-Z0-9_]+\}\})/g);
  return parts.map((part, idx) => {
    if (part.startsWith("{{") && part.endsWith("}}")) {
      return React.createElement(
        "span",
        { key: idx, className: "text-info font-bold font-mono" },
        part,
      );
    }
    return part;
  });
}
