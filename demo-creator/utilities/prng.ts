/**
 * Seeded PRNG — xoshiro128** variant.
 * Produces deterministic float sequences given the same seed.
 */

function splitmix32(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x9e3779b9) | 0
    let t = seed ^ (seed >>> 16)
    t = Math.imul(t, 0x21f0aaad)
    t = t ^ (t >>> 15)
    t = Math.imul(t, 0x735a2d97)
    t = t ^ (t >>> 15)
    return t >>> 0
  }
}

export class PRNG {
  private s: Uint32Array

  constructor(seed: number) {
    const sm = splitmix32(seed)
    this.s = new Uint32Array([sm(), sm(), sm(), sm()])
  }

  /** Returns a float in [0, 1) */
  next(): number {
    const s = this.s
    const result = Math.imul(s[1] * 5, 7)
    const rotl = ((result << 7) | (result >>> 25)) >>> 0

    const t = s[1] << 9

    s[2] ^= s[0]
    s[3] ^= s[1]
    s[1] ^= s[2]
    s[0] ^= s[3]

    s[2] ^= t
    s[3] = ((s[3] << 11) | (s[3] >>> 21)) >>> 0

    return (rotl >>> 0) / 4294967296
  }

  /** Returns a float in [min, max) */
  float(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  /** Returns a uint32 suitable as a new seed */
  nextSeed(): number {
    return (this.next() * 4294967296) >>> 0
  }

  /** Fork a new PRNG using a seed or the next value from this PRNG */
  fork(seed?: number): PRNG {
    return new PRNG(seed ?? this.nextSeed())
  }
}
