export interface MasonryItem {
  aspectRatio: number
}

export function balanceColumns<T extends MasonryItem>(items: T[], columns: number): T[][] {
  const cols: T[][] = Array.from({ length: Math.max(1, columns) }, () => [])
  const heights = new Array(cols.length).fill(0)
  for (const item of items) {
    const ratio = item.aspectRatio > 0 ? item.aspectRatio : 1
    let shortest = 0
    for (let i = 1; i < heights.length; i++) {
      if (heights[i] < heights[shortest]) shortest = i
    }
    cols[shortest]!.push(item)
    heights[shortest] += 1 / ratio
  }
  return cols
}
