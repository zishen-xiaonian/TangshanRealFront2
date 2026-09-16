import { getJson, postJson } from './http'

const DEFAULT_STATS_TIMEOUT = 60000

const OUTAGE_USER_COUNTIES_API =
  import.meta.env.VITE_OUTAGE_USER_COUNTIES_API || '/api/v1/outage-users/counties'
const OUTAGE_USER_COUNTY_USER_COUNT_API =
  import.meta.env.VITE_OUTAGE_USER_COUNTY_USER_COUNT_API || '/api/v1/outage-users/county-user-count'
const OUTAGE_USER_TIME_TREND_API =
  import.meta.env.VITE_OUTAGE_USER_TIME_TREND_API || '/api/v1/outage-users/time-trend'
const OUTAGE_USER_TIME_TREND_CHART_API =
  import.meta.env.VITE_OUTAGE_USER_TIME_TREND_CHART_API || '/api/v1/outage-users/time-trend/chart'
const OUTAGE_USER_TIME_TREND_USERS_API =
  import.meta.env.VITE_OUTAGE_USER_TIME_TREND_USERS_API || '/api/v1/outage-users/time-trend/users/real-count'
const OUTAGE_EVENT_OUTAGE_DETAIL_API =
  import.meta.env.VITE_OUTAGE_EVENT_OUTAGE_DETAIL_API || '/api/v1/outage-events/outage-detail'
const OUTAGE_USER_SPATIAL_DISTRIBUTION_API =
  import.meta.env.VITE_OUTAGE_USER_SPATIAL_DISTRIBUTION_API || '/api/v1/outage-users/spatial-distribution'
const OUTAGE_USER_SPATIAL_DISTRIBUTION_EQUIPMENT_SUMMARY_API =
  import.meta.env.VITE_OUTAGE_USER_SPATIAL_DISTRIBUTION_EQUIPMENT_SUMMARY_API ||
  '/api/v1/outage-users/spatial-distribution/equipment-summary'
const OUTAGE_USER_SPATIAL_DISTRIBUTION_EQUIPMENT_API =
  import.meta.env.VITE_OUTAGE_USER_SPATIAL_DISTRIBUTION_EQUIPMENT_API ||
  '/api/v1/outage-users/spatial-distribution/equipment'
const OUTAGE_USER_REGION_WARNING_LIGHTS_API =
  import.meta.env.VITE_OUTAGE_USER_REGION_WARNING_LIGHTS_API || '/api/v1/outage-users/region-warning-lights'
const OUTAGE_USER_REGION_WARNING_LIGHTS_DETAIL_API =
  import.meta.env.VITE_OUTAGE_USER_REGION_WARNING_LIGHTS_DETAIL_API ||
  '/api/v1/outage-users/region-warning-lights/detail'
const OUTAGE_USER_FAULT_LOCATION_API =
  import.meta.env.VITE_OUTAGE_USER_FAULT_LOCATION_API || '/api/v1/outage-users/fault-location'
const OUTAGE_USER_FAULT_LOCATION_EVENT_TYPES_API =
  import.meta.env.VITE_OUTAGE_USER_FAULT_LOCATION_EVENT_TYPES_API ||
  '/api/v1/outage-users/fault-location/event-types'
const OUTAGE_USER_FAULT_LOCATION_LINES_API =
  import.meta.env.VITE_OUTAGE_USER_FAULT_LOCATION_LINES_API ||
  '/api/v1/outage-users/fault-location/lines'
const OUTAGE_USER_FAULT_LOCATION_LINES_DETAIL_API =
  import.meta.env.VITE_OUTAGE_USER_FAULT_LOCATION_LINES_DETAIL_API ||
  '/api/v1/outage-users/fault-location/lines/detail'
const OUTAGE_USER_OUTAGE_SCOPE_ASSESSMENT_API =
  import.meta.env.VITE_OUTAGE_USER_OUTAGE_SCOPE_ASSESSMENT_API || '/api/v1/outage-users/outage-scope-assessment'
const OUTAGE_USER_OUTAGE_SCOPE_ASSESSMENT_DETAIL_API =
  import.meta.env.VITE_OUTAGE_USER_OUTAGE_SCOPE_ASSESSMENT_DETAIL_API ||
  '/api/v1/outage-users/outage-scope-assessment/detail'
const OUTAGE_USER_TAGS_CHART_API =
  import.meta.env.VITE_OUTAGE_USER_TAGS_CHART_API || '/api/v1/outage-users/user-tags/chart'
const OUTAGE_USER_TAGS_API =
  import.meta.env.VITE_OUTAGE_USER_TAGS_API || '/api/v1/outage-users/user-tags'
const OUTAGE_USER_ANALYSIS_API =
  import.meta.env.VITE_OUTAGE_USER_ANALYSIS_API || '/api/v1/outage-users/analysis-overview'
const OUTAGE_ANALYSIS_REGIONS_API =
  import.meta.env.VITE_OUTAGE_ANALYSIS_REGIONS_API || '/api/v1/outage-analysis/regions'
const OUTAGE_ANALYSIS_IMPACT_COUNTS_API =
  import.meta.env.VITE_OUTAGE_ANALYSIS_IMPACT_COUNTS_API ||
  '/api/v1/outage-analysis/impact-scale-counts'
const OUTAGE_ANALYSIS_IMPACT_DAILY_TREND_API =
  import.meta.env.VITE_OUTAGE_ANALYSIS_IMPACT_DAILY_TREND_API ||
  '/api/v1/outage-analysis/impact-daily-trend'
const OUTAGE_ANALYSIS_WARNING_COUNTS_API =
  import.meta.env.VITE_OUTAGE_ANALYSIS_WARNING_COUNTS_API ||
  '/api/v1/outage-analysis/frequent-outage-warning-counts'
const ONE_MAP_METER_BOX_ID_API =
  import.meta.env.VITE_ONE_MAP_METER_BOX_ID_API || '/api/v1/one-map/meter-box-id'

const RIGHT_PANEL_OUTAGE_EVENTS_SUMMARY_API =
  import.meta.env.VITE_RIGHT_PANEL_OUTAGE_EVENTS_SUMMARY_API || '/api/right-panel/outage-events-summary'

export const queryOutageUserCounties = (params) =>
  postJson(OUTAGE_USER_COUNTIES_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserCountyUserCount = (params) =>
  postJson(OUTAGE_USER_COUNTY_USER_COUNT_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserTimeTrend = (params) =>
  postJson(OUTAGE_USER_TIME_TREND_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserTimeTrendChart = (params) =>
  postJson(OUTAGE_USER_TIME_TREND_CHART_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserTimeTrendUsers = (params) =>
  postJson(OUTAGE_USER_TIME_TREND_USERS_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageEventOutageDetail = (params) =>
  postJson(OUTAGE_EVENT_OUTAGE_DETAIL_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserSpatialDistribution = (params) =>
  postJson(OUTAGE_USER_SPATIAL_DISTRIBUTION_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserSpatialDistributionEquipmentSummary = (params) =>
  postJson(OUTAGE_USER_SPATIAL_DISTRIBUTION_EQUIPMENT_SUMMARY_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserSpatialDistributionEquipment = (params) =>
  postJson(OUTAGE_USER_SPATIAL_DISTRIBUTION_EQUIPMENT_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserRegionWarningLights = (params) =>
  postJson(OUTAGE_USER_REGION_WARNING_LIGHTS_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserRegionWarningLightsDetail = (params) =>
  postJson(OUTAGE_USER_REGION_WARNING_LIGHTS_DETAIL_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserFaultLocation = (params) =>
  postJson(OUTAGE_USER_FAULT_LOCATION_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserFaultLocationEventTypes = (params) =>
  postJson(OUTAGE_USER_FAULT_LOCATION_EVENT_TYPES_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserFaultLocationLines = (params) =>
  postJson(OUTAGE_USER_FAULT_LOCATION_LINES_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserFaultLocationLinesDetail = (params) =>
  postJson(OUTAGE_USER_FAULT_LOCATION_LINES_DETAIL_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserOutageScopeAssessment = (params) =>
  postJson(OUTAGE_USER_OUTAGE_SCOPE_ASSESSMENT_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserOutageScopeAssessmentDetail = (params) =>
  postJson(OUTAGE_USER_OUTAGE_SCOPE_ASSESSMENT_DETAIL_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserTagsChart = (params) =>
  postJson(OUTAGE_USER_TAGS_CHART_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserTags = (params) =>
  postJson(OUTAGE_USER_TAGS_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageUserAnalysisOverview = (params) =>
  postJson(OUTAGE_USER_ANALYSIS_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageAnalysisRegions = () =>
  getJson(OUTAGE_ANALYSIS_REGIONS_API, {}, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageAnalysisImpactCounts = (params) =>
  postJson(OUTAGE_ANALYSIS_IMPACT_COUNTS_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageAnalysisImpactDailyTrend = (params) =>
  postJson(OUTAGE_ANALYSIS_IMPACT_DAILY_TREND_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOutageAnalysisWarningCounts = (params) =>
  postJson(OUTAGE_ANALYSIS_WARNING_COUNTS_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryOneMapMeterBoxId = (params, amapToken) =>
  postJson(ONE_MAP_METER_BOX_ID_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
    headers: {
      'amap-token': String(amapToken || ''),
    },
  })

export const queryRightPanelOutageEventsSummary = (params) =>
  postJson(RIGHT_PANEL_OUTAGE_EVENTS_SUMMARY_API, params, {
    timeout: DEFAULT_STATS_TIMEOUT,
  })

export const queryRightPanelOverview = () => Promise.resolve({ data: {} })
