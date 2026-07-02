export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createNormalSampler(seed: number): () => number {
  const rand = mulberry32(seed);
  return function () {
    const u1 = rand();
    const u2 = rand();
    return Math.sqrt(-2 * Math.log(u1 === 0 ? Number.MIN_VALUE : u1)) * Math.cos(2 * Math.PI * u2);
  };
}
