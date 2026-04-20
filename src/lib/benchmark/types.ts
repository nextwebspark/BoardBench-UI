export interface CompanyMetrics {
  companyId: number;
  factId: number | null;
  name: string;
  country: string | null;
  industry: string | null;
  exchange: string | null;
  code: string | null;
  year: number | null;
  marketCap: number | null;
  revenue: number | null;
  employees: number | null;
  boardSize: number | null;
  indPct: number | null;
  womenPct: number | null;
  localPct: number | null;
  avgAge: number | null;
  meetings: number | null;
}

export type MetricKey =
  | "boardSize"
  | "indPct"
  | "womenPct"
  | "localPct"
  | "avgAge"
  | "meetings";

export interface Distribution {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export type DistributionMap = Record<MetricKey, Distribution>;

export interface FilterState {
  country: boolean;
  industry: boolean;
  capMin: number | null;
  capMax: number | null;
  empMin: number | null;
  empMax: number | null;
}

export interface PeerPanelCompany {
  id: number;
  name: string;
  code: string | null;
  country: string | null;
  exchange: string | null;
  sector: string | null;
  subSector: string | null;
}

export interface PeerPanelFilterState {
  sectors: Set<string>;
  subSectors: Set<string>;
  countries: Set<string>;
  exchanges: Set<string>;
  revenueBands: Set<string>;
  employeeBands: Set<string>;
}

export interface BenchmarkPool {
  focus: CompanyMetrics;
  allPeers: CompanyMetrics[];
  filteredPeers: CompanyMetrics[];
  distributions: DistributionMap;
  fallback: boolean;
}
