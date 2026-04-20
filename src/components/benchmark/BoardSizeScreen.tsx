"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calcPercentile } from "@/lib/benchmark/percentiles";
import type { BenchmarkPool } from "@/lib/benchmark/types";
import { GaugeBar } from "./primitives/GaugeBar";
import { DimensionCard } from "./primitives/DimensionCard";
import { InsightList, type Insight } from "./primitives/InsightList";
import { GapToMedianBars } from "./primitives/GapToMedianBars";
import { PageHeader } from "./PageHeader";

export function BoardSizeScreen({ pool }: { pool: BenchmarkPool }) {
  const { focus, filteredPeers, distributions, fallback } = pool;
  const boardSizeDist = distributions.boardSize;
  const indDist = distributions.indPct;
  const meetingsDist = distributions.meetings;
  const localDist = distributions.localPct;

  const pBoardSize = calcPercentile(focus.boardSize, boardSizeDist);
  const pInd = calcPercentile(focus.indPct, indDist);

  const filteredPeerIds = new Set(filteredPeers.map((p) => p.companyId));
  const allRows = [focus, ...pool.allPeers];

  const insights: Insight[] = [
    {
      tone: pBoardSize?.band === "above" ? "positive" : pBoardSize?.band === "below" ? "negative" : "neutral",
      text: (
        <>
          <strong>Board size of {focus.boardSize ?? "—"}</strong> at P{pBoardSize?.n ?? "—"} —{" "}
          {pBoardSize?.band === "at"
            ? "within the normal range for your peer pool."
            : pBoardSize?.band === "above"
            ? "larger than most peers."
            : "smaller than most peers."}
        </>
      ),
    },
    {
      tone: pInd?.band === "below" ? "negative" : "positive",
      text: (
        <>
          <strong>Independence at {focus.indPct ?? "—"}%</strong> — peer median {indDist.p50}%.{" "}
          {focus.indPct != null && focus.indPct < indDist.p50
            ? "Below market. Review non-independent director count."
            : "At or above market."}
        </>
      ),
    },
    {
      tone: "neutral",
      text: (
        <>
          <strong>Meeting cadence ({focus.meetings ?? "—"}/yr)</strong> vs peer median of{" "}
          {meetingsDist.p50}.
        </>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Board size & structure"
        subtitle={
          <>
            Screen 1.1 · {focus.name} vs {filteredPeers.length} peers · {focus.year ?? "—"}
            {fallback && " · (fallback: full-universe benchmark)"}
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DimensionCard
          label="Board size"
          value={focus.boardSize}
          unit=""
          dist={boardSizeDist}
          note={`Range: ${boardSizeDist.p10}–${boardSizeDist.p90} directors`}
        />
        <DimensionCard
          label="Independence"
          value={focus.indPct}
          unit="%"
          dist={indDist}
          note={
            focus.boardSize != null && focus.indPct != null
              ? `${Math.round((focus.boardSize * focus.indPct) / 100)} of ${focus.boardSize} independent`
              : "Independent directors"
          }
        />
        <DimensionCard
          label="Meetings / year"
          value={focus.meetings}
          unit=""
          dist={meetingsDist}
          note={`Peer median ${meetingsDist.p50} meetings`}
        />
        <DimensionCard
          label="Local directors"
          value={focus.localPct}
          unit="%"
          dist={localDist}
          note="Nationals on board"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="h-[2.5px] w-4 rounded-sm bg-primary" />
                  Market position
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Teal dot = you · shaded = P25–P75 · ticks = P10, median, P90
                </p>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">
                N = {filteredPeers.length} peers
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <GaugeBar label="Total board size" value={focus.boardSize} distribution={boardSizeDist} />
            <GaugeBar label="Independence (%)" value={focus.indPct} distribution={indDist} unit="%" />
            <GaugeBar label="Meetings per year" value={focus.meetings} distribution={meetingsDist} />
            <GaugeBar label="Local directors (%)" value={focus.localPct} distribution={localDist} unit="%" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="h-[2.5px] w-4 rounded-sm bg-primary" />
              Key findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InsightList items={insights} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="h-[2.5px] w-4 rounded-sm bg-primary" />
                Board size — gap to market median
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                How many directors above or below the market median · dimmed = excluded by filter
              </p>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">
              N = {filteredPeers.length}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <GapToMedianBars
            rows={allRows}
            focusId={focus.companyId}
            filteredPeerIds={filteredPeerIds}
            valueKey="boardSize"
            median={boardSizeDist.p50}
          />
        </CardContent>
      </Card>
    </div>
  );
}
