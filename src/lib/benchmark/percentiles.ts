import type {
  CompanyMetrics,
  Distribution,
  DistributionMap,
  FilterState,
  MetricKey,
} from "./types";

const METRIC_KEYS: MetricKey[] = [
  "boardSize",
  "indPct",
  "womenPct",
  "localPct",
  "avgAge",
  "meetings",
];

const ZERO_DIST: Distribution = { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 };

const MIN_POOL_FOR_DIST = 4;

function pAt(sorted: number[], pct: number) {
  const i = (pct / 100) * (sorted.length - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

export function distributionFrom(values: number[]): Distribution {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length < 2) return ZERO_DIST;
  return {
    p10: round(pAt(sorted, 10)),
    p25: round(pAt(sorted, 25)),
    p50: round(pAt(sorted, 50)),
    p75: round(pAt(sorted, 75)),
    p90: round(pAt(sorted, 90)),
  };
}

function round(v: number) {
  return Math.round(v * 10) / 10;
}

export function distributionMapFrom(pool: CompanyMetrics[]): DistributionMap {
  const out = {} as DistributionMap;
  for (const key of METRIC_KEYS) {
    const values = pool
      .map((p) => p[key])
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    out[key] = distributionFrom(values);
  }
  return out;
}

export function applyFilters(
  peers: CompanyMetrics[],
  focus: CompanyMetrics,
  filters: FilterState
): CompanyMetrics[] {
  return peers.filter((p) => {
    if (filters.country && p.country !== focus.country) return false;
    if (filters.industry && p.industry !== focus.industry) return false;
    if (filters.capMin !== null && (p.marketCap == null || p.marketCap < filters.capMin)) return false;
    if (filters.capMax !== null && (p.marketCap == null || p.marketCap > filters.capMax)) return false;
    if (filters.empMin !== null && (p.employees == null || p.employees < filters.empMin)) return false;
    if (filters.empMax !== null && (p.employees == null || p.employees > filters.empMax)) return false;
    return true;
  });
}

export function computePool(
  focus: CompanyMetrics,
  allPeers: CompanyMetrics[],
  filters: FilterState
) {
  const filtered = applyFilters(allPeers, focus, filters);
  if (filtered.length < MIN_POOL_FOR_DIST) {
    return {
      filteredPeers: filtered,
      distributions: distributionMapFrom(allPeers),
      fallback: true,
    };
  }
  return {
    filteredPeers: filtered,
    distributions: distributionMapFrom(filtered),
    fallback: false,
  };
}

export interface Percentile {
  n: number;
  band: "below" | "at" | "above";
}

export function calcPercentile(val: number | null, dist: Distribution): Percentile | null {
  if (val == null || !Number.isFinite(val)) return null;
  if (dist.p90 === dist.p10 && dist.p90 === 0) return null;
  let n: number;
  if (val <= dist.p10) n = Math.max(1, Math.round((val / Math.max(dist.p10, 0.0001)) * 10));
  else if (val <= dist.p25) n = 10 + Math.round(((val - dist.p10) / Math.max(dist.p25 - dist.p10, 0.0001)) * 15);
  else if (val <= dist.p50) n = 25 + Math.round(((val - dist.p25) / Math.max(dist.p50 - dist.p25, 0.0001)) * 25);
  else if (val <= dist.p75) n = 50 + Math.round(((val - dist.p50) / Math.max(dist.p75 - dist.p50, 0.0001)) * 25);
  else if (val <= dist.p90) n = 75 + Math.round(((val - dist.p75) / Math.max(dist.p90 - dist.p75, 0.0001)) * 15);
  else n = 90;
  n = Math.min(99, Math.max(1, n));
  const band: Percentile["band"] = n < 35 ? "below" : n < 60 ? "at" : "above";
  return { n, band };
}
