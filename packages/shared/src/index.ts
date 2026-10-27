export {
  BadRequestError,
  UnauthorizedError,
  VIEWS,
  PANES,
  isCompareDecision,
  mergeCompareDecision,
  parseCompany,
  parseDecideInput,
  parseStoredDecision,
  requireUserId,
  toAnalysisRow,
} from "./analysis";
export type { CompareDecision, Pane, StoredDecision, View } from "./analysis";

export {
  LOGO_ARROW,
  LOGO_ARROW_COLOR,
  LOGO_RING_BOTTOM,
  LOGO_RING_COLOR,
  LOGO_RING_SLASH,
  LOGO_RING_TOP,
  LOGO_VIEW_BOX,
} from "./brand/logo";

export {
  COMPARE_FILTERS,
  asDecision,
  filterCount,
  initialCompareState,
  paneStrategies,
  visibleStrategies,
} from "./compare";
export type { CompareFilter, CompareState } from "./compare";

export {
  ANALYSIS_PAGE_SIZE,
  analysisListWhere,
  analysisSpot,
  analysisTag,
  toAnalysisDetail,
  toAnalysisSummary,
} from "./history";
export type { AnalysisCursor, AnalysisDetail, AnalysisSummary } from "./history";

export type {
  AnalyzeResponse,
  DecideRequest,
  DecideResponse,
  Decision,
  IndexQuote,
  MarketIndicesResponse,
  MarketQuote,
  MarketQuotesResponse,
  RelayTokenResponse,
  Snapshot,
} from "./contracts";

export {
  analyzeLegs,
  expiryMsLeft,
  payoff,
  rankDecision,
  realizedVol,
  scoreStrategies,
} from "./decision";
export type { Chain as DecisionChain, Leg as DecisionLeg } from "./decision";

export { STALE_AFTER_MS, applyView, buildChain, evaluate } from "./derivativesBoard";
export type {
  Calculator,
  Chain as OptionChain,
  Company,
  Evaluation,
  LiveRow,
  SortKey,
  View as BoardView,
} from "./derivativesBoard";

export {
  BOARD_CALCULATORS,
  DEFAULT_BOARD_VIEW,
  boardCountText,
  connectionLabel,
  countStale,
  evaluateBoard,
  isMarketOpen,
  mergeTick,
  parseRupees,
  staleNote,
} from "./derivativesFeed";
export type { BoardFeed, ConnState, RelayTick } from "./derivativesFeed";

export { NORMAL_OPEN, checkIsMarketOpen } from "./market";

export {
  compactSigned,
  extremeRegion,
  innerTicks,
  niceTicks,
  pnlAt,
  price,
  signedInr,
  toSeries,
  withZeroCrossings,
} from "./payoff-series";
export type { ExtremeRegion, PayoffPoint, SeriesRow } from "./payoff-series";

export { payoffPoints, strikeMarkers } from "./payoff-points";
export type { StrikeMarker } from "./payoff-points";

export {
  NSE_FO_SYMBOLS,
  POPULAR_COMPANIES,
  QUICK,
  filterSymbols,
  symbolName,
} from "./symbols";
export type { Suggestion } from "./symbols";

export {
  THEMES,
  fonts,
  paper,
  radius,
  saffron,
  semantic,
  spacing,
  typeScale,
} from "./theme";
export type { SemanticName } from "./theme";

export {
  STRATEGY_DEFINITIONS,
  inr,
  keyMetrics,
  normalizeStrategy,
} from "./types";
export type { Category, Leg, Limit, NormalizedStrategy, PayoffRow } from "./types";

export {
  calculateBearCallSpread,
  calculateBearPutSpread,
  calculateBullCallSpread,
  calculateBullPutSpread,
  calculateButterflySpread,
  calculateCallButterfly,
  calculateCallCondor,
  calculateIronCondor,
  calculateLongStraddle,
  calculateLongStrangle,
  calculatePutButterfly,
  calculatePutCondor,
  calculateShortStraddle,
  calculateShortStrangle,
} from "./strategies";
