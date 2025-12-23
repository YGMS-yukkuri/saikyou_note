export function pickRandomNotInSet(length: number, seen: Set<number>) {
  const available: number[] = []
  for (let i = 0; i < length; i++) if (!seen.has(i)) available.push(i)
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}