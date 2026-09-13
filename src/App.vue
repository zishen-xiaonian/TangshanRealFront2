<script setup>
import './style.css'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  queryOutageUserCounties,
  queryOutageUserCountyUserCount,
  queryOutageUserFaultLocation,
  queryOutageUserFaultLocationEventTypes,
  queryOutageUserFaultLocationLines,
  queryOutageUserFaultLocationLinesDetail,
  queryOutageUserOutageScopeAssessment,
  queryOutageUserOutageScopeAssessmentDetail,
  queryOutageUserRegionWarningLights,
  queryOutageUserRegionWarningLightsDetail,
  queryOutageUserSpatialDistribution,
  queryOutageUserSpatialDistributionEquipment,
  queryOutageUserSpatialDistributionEquipmentSummary,
  queryOutageUserTags,
  queryOutageUserTagsChart,
  queryOutageUserTimeTrend,
  queryOutageUserTimeTrendChart,
  queryOneMapMeterBoxId,
  queryRightPanelOutageEventsSummary,
} from './api/outage'
import {
  querySensitiveAppealEmotionEvolution,
  querySensitiveAppealIntelligentReceipt,
  querySensitiveAppealIntelligentWarning,
  querySensitiveAppealKeyUserDetail,
  querySensitiveAppealKeyUserTypeCount,
  querySensitiveAppealKeyUsers,
  querySensitiveAppealSensitiveUserDetail,
  querySensitiveAppealSensitiveUserTypeCount,
  querySensitiveAppealSensitiveUsers,
  querySensitiveAppealSpecialUserDetail,
  querySensitiveAppealSpecialUserTypeCount,
  querySensitiveAppealSpecialUsers,
  querySensitiveAppealTypeTop5,
  querySensitiveAppealUserAppeals,
  querySensitiveAppealUserTypeCount,
} from './api/sensitiveAppeals'
import UserTagModuleCard from './components/UserTagModuleCard.vue'
import KeyUserTimeTrendCard from './components/KeyUserTimeTrendCard.vue'
import KeyUserCountBarCard from './components/KeyUserCountBarCard.vue'
import FaultLocationModuleCard from './components/FaultLocationModuleCard.vue'
import OutageRangeAssessmentCard from './components/OutageRangeAssessmentCard.vue'
import CountyWarningLightsCard from './components/CountyWarningLightsCard.vue'
import SearchBox from './components/SearchBox.vue'
import UserPersonalInfoPanel from './components/UserPersonalInfoPanel.vue'
import EmotionEvolutionAnalysisPanel from './components/EmotionEvolutionAnalysisPanel.vue'
import IntelligentWarningPanel from './components/IntelligentWarningPanel.vue'
import ReplyAssistantPanel from './components/ReplyAssistantPanel.vue'
import SensitiveDemandWorkOrderStatsCard from './components/SensitiveDemandWorkOrderStatsCard.vue'
import OutageUserAnalysisPanel from './components/OutageUserAnalysisPanel.vue'

const tangshanCenter = [118.180194, 39.630867]

const countyCenterMap = {
  路南区: [118.169, 39.619],
  路北区: [118.202, 39.652],
  古冶区: [118.462, 39.721],
  开平区: [118.264, 39.671],
  丰南区: [118.101, 39.558],
  丰润区: [118.13, 39.824],
  曹妃甸区: [118.451, 39.271],
  高新区: [118.243, 39.682],
  迁西县: [118.305, 40.142],
  滦南县: [118.682, 39.503],
  乐亭县: [118.905, 39.425],
  玉田县: [117.739, 39.9],
  遵化市: [117.965, 40.188],
  迁安市: [118.698, 40.013],
  滦州市: [118.699, 39.744],
}

const amapKey = import.meta.env.VITE_AMAP_KEY || '18757937d56dd908ebb8493c2cbfdc59'
const amapSecurityJsCode = import.meta.env.VITE_AMAP_SECURITY_CODE || '822cf0516f173ce886ab3d24e1c2d459'
const keyUserCountyMarkersMessageType = 'KEY_USER_COUNTY_MARKERS'
const keyUserCountyMarkersClearMessageType = 'KEY_USER_COUNTY_MARKERS_CLEAR'
const keyUserMapReadyMessageType = 'KEY_USER_MAP_READY'
const mapCountyFocusMessageType = 'MAP_COUNTY_FOCUS'
const mapOutageFeederLocateMessageType = 'MAP_OUTAGE_FEEDER_LOCATE'
const mapSpaceDeviceLocateMessageType = 'MAP_SPACE_DEVICE_LOCATE'
const mapOutageChainLocateMessageType = 'MAP_OUTAGE_CHAIN_LOCATE'
const amapTokenCapturedMessageType = 'AMAP_TOKEN_CAPTURED'
const mapOutageChainProvinceId = '1100F3DE20806FADE050007F01006CBE'
const outageChainFeederDevType = 'dkx'
const outageChainSubstationDevType = 'zf01'
const outageChainDistribution = 1
const oneMapMeterBoxPsrType = '3112'
const oneMapMeterBoxDistribution = '0'
const oneMapTokenProbePsrId = '0000'
const spaceDistributionPsrType = 'dytq'
const spaceDistributionProvinceId = '1100F3DE20806FADE050007F01006CBE'
const spaceDistributionDistribution = '0'
const spaceDistributionDeviceTypeMap = {
  '0408001': '0302',
  '0401004': '0110',
}
const tagAndKeyUserTargetCityName = '国网唐山供电公司'
const defaultTangshanCityId = '16401'
const countyListCityId = import.meta.env.VITE_TANGSHAN_CITY_ID || defaultTangshanCityId

const mapRef = ref(null)
const mapFrameRef = ref(null)
const oneMapAmapToken = ref('')
let mapInstance = null
let amapSdk = null
let eventMarkers = []
let keyUserCountyMarkers = []
let districtOverlays = []
let infoWindow = null

const isLeftCollapsed = ref(false)
const isRightCollapsed = ref(false)
const activePageTab = ref('outageUsers')
const intelligentAnalysisSearchInput = ref('')
const loading = ref(false)
const dataError = ref('')
const dataNotice = ref('')
const mapError = ref('')

const outageIndexRecords = ref([])
const outageEvents = ref([])
const outageUsers = ref([])
const tagStatsOverview = ref(null)
const tagStatsLoadingCount = ref(0)
const tagStatsLoading = computed(() => tagStatsLoadingCount.value > 0)
const countyStatsRows = ref([])
const countyList = ref([])
const faultSummaryData = ref(null)
const faultLocationLoadingCount = ref(0)
const faultLocationLoading = computed(() => faultLocationLoadingCount.value > 0)
const outageScopeSummaryData = ref(null)
const outageScopeSummaryLoadingCount = ref(0)
const outageScopeSummaryLoading = computed(() => outageScopeSummaryLoadingCount.value > 0)
const countyWarningLightsData = ref([])
const countyWarningPopupVisible = ref(false)
const countyWarningPopupCounty = ref('')
const countyWarningPopupEvents = ref([])
const countyWarningPopupLoading = ref(false)
const countyWarningPopupError = ref('')
const countyWarningPopupSelectedItem = ref(null)
const countyWarningPopupCurrentPage = ref(1)
const countyWarningPopupTotal = ref(0)
const countyTrendData = ref({
  labels: [],
  sensitiveSeries: [],
  importantSeries: [],
})
const countyTrendLoadingCount = ref(0)
const countyTrendLoading = computed(() => countyTrendLoadingCount.value > 0)
const countyOutageFreqLoadingCount = ref(0)
const countyOutageFreqLoading = computed(() => countyOutageFreqLoadingCount.value > 0)
const countyOutageFreqData = ref({
  keyUsers: {
    total: 0,
    distribution: [],
  },
  sensitiveUsers: {
    total: 0,
    distribution: [],
  },
})
const spatialDistributionRows = ref([])
const spatialDistributionLoadingCount = ref(0)
const spatialDistributionLoading = computed(() => spatialDistributionLoadingCount.value > 0)
const countyEquipmentStatsSummary = ref(null)
const countyEquipmentStatsLoadingCount = ref(0)
const countyEquipmentStatsLoading = computed(() => countyEquipmentStatsLoadingCount.value > 0)
const countyEquipmentListRows = ref([])
const countyEquipmentPageRows = ref([])
const countyEquipmentPageTotal = ref(0)
const spaceDistributionDetailVisible = ref(false)
const spaceDistributionDetailLoadingCount = ref(0)
const spaceDistributionDetailLoading = computed(() => spaceDistributionDetailLoadingCount.value > 0)

const selectedRegion = ref('全部')
const selectedEventId = ref('')
const activeMapEvent = ref(null)
const showOutageRangeAssessmentPage = ref(false)
const outageRangeChainsData = ref([])
const outageRangeChainsTotal = ref(0)
const outageRangeChainsCurrentPage = ref(1)
const outageRangeChainsLoading = ref(false)
const showOutageDetailPage = ref(false)
const outageDetailModalVisible = ref(false)
const selectedOutageDetail = ref(null)
const outageEventsSummaryData = ref(null)
const outageEventsSummaryLoadingCount = ref(0)
const outageEventsSummaryLoading = computed(() => outageEventsSummaryLoadingCount.value > 0)
const faultLocationEventTypesData = ref([])
const faultLocationEventTypesLoadingCount = ref(0)
const faultLocationEventTypesLoading = computed(() => faultLocationEventTypesLoadingCount.value > 0)
const faultLocationLineTypeOptions = ref([])
const outageDetailRows = ref([])
const outageDetailTotal = ref(0)
const outageDetailLoading = ref(false)
const outageDetailCurrentPage = ref(1)
const outageDetailSearchInput = ref('')
const outageDetailSearchKeyword = ref('')
const outageDetailSelectedNature = ref('')
const outageDetailGridBodyRef = ref(null)
const outageDetailPaginationRef = ref(null)
const outageDetailPageJumpRef = ref(null)
const outageDetailJumpPageInput = ref('')
const outageDetailRowsPerPage = ref(10)
const outageDetailDimension = ref('feeder')
const OUTAGE_DETAIL_MIN_PAGE_SIZE = 10
const OUTAGE_DETAIL_MAX_PAGE_SIZE = 10
const OUTAGE_DETAIL_FALLBACK_HEAD_HEIGHT = 34
const OUTAGE_DETAIL_FALLBACK_ROW_HEIGHT = 38
const OUTAGE_DETAIL_PAGE_SIZE_BUFFER = 0
const OUTAGE_DETAIL_MAX_PAGE_BUTTONS = 9
let outageDetailLayoutObserver = null
let outageDetailListRequestId = 0
let outageEventsSummaryRequestId = 0
let outageRangeChainsRequestId = 0
let outageEventDetailRequestId = 0
let faultLocationEventTypesRequestId = 0
let faultLocationLineTypesRequestId = 0
let countyWarningPopupRequestId = 0
let suppressOutageDetailAutoReload = false
const showUserDetailPage = ref(false)
const userDetailModalVisible = ref(false)
const selectedUserDetail = ref(null)
const userDetailCurrentPage = ref(1)
const userDetailSearchInput = ref('')
const userDetailSearchKeyword = ref('')
const userDetailSelectedType = ref('')
const userDetailGridBodyRef = ref(null)
const userDetailPaginationRef = ref(null)
const userDetailPageJumpRef = ref(null)
const userDetailJumpPageInput = ref('')
const userDetailRowsPerPage = ref(1)
const userDetailMaxPageButtons = ref(9)
const USER_DETAIL_MIN_PAGE_SIZE = 1
const USER_DETAIL_MAX_PAGE_SIZE = 30
const USER_DETAIL_FALLBACK_HEAD_HEIGHT = 34
const USER_DETAIL_FALLBACK_ROW_HEIGHT = 38
const USER_DETAIL_MAX_PAGE_BUTTONS = 9
const USER_DETAIL_MIN_PAGE_BUTTONS = 3
const USER_DETAIL_PAGE_BUTTON_MIN_WIDTH = 38
const USER_DETAIL_PAGE_BUTTON_GAP = 6
let userDetailLayoutObserver = null
const showKeyUserDetailPage = ref(false)
const keyUserDetailModalVisible = ref(false)
const selectedKeyUserDetail = ref(null)
const selectedKeyUserCounty = ref('')
const keyUserDetailCurrentPage = ref(1)
const keyUserDetailSearchInput = ref('')
const keyUserDetailSearchKeyword = ref('')
const keyUserDetailSelectedFilterCategory = ref('level')
const keyUserDetailSelectedFilterValue = ref('key')
const keyUserDetailJumpPageInput = ref('')
const keyUserDetailStatsData = ref({
  summary: null,
  keyUserByTrade: [],
  sensitiveUserByTrade: [],
  outageNatureDistribution: [],
})
const keyUserDetailStatsLoadingCount = ref(0)
const keyUserDetailStatsLoading = computed(() => keyUserDetailStatsLoadingCount.value > 0)
const keyUserDetailLoading = ref(false)
const keyUserDetailRows = ref([])
const keyUserDetailTotal = ref(0)
let keyUserDetailListRequestId = 0
let keyUserDetailStatsRequestId = 0
let keyUserDetailModalRequestId = 0
const KEY_USER_DETAIL_ROWS_PER_PAGE = 10
const KEY_USER_DETAIL_MAX_PAGE_BUTTONS = 9
const KEY_USER_FREQUENCY_FILTER_PAGE_SIZE = 500
const KEY_USER_FILTER_VALUES = new Set(['key', 'important', 'key-frequent', 'key-non-frequent'])
const KEY_USER_FREQUENCY_FILTER_VALUES = new Set(['key-frequent', 'key-non-frequent'])
const KEY_USER_DETAIL_MOCK_DATE = '20260701'
const KEY_USER_DETAIL_MOCK_TRADE_DISTRIBUTION = [
  { tradeName: '医疗卫生', userCount: 14 },
  { tradeName: '供水供气', userCount: 12 },
  { tradeName: '交通运输', userCount: 10 },
  { tradeName: '公共服务', userCount: 8 },
  { tradeName: '工业生产', userCount: 6 },
]
const KEY_USER_DETAIL_MOCK_COUNTIES = [
  '路南区',
  '路北区',
  '古冶区',
  '开平区',
  '丰南区',
  '丰润区',
  '曹妃甸区',
  '迁西县',
  '滦南县',
  '乐亭县',
  '玉田县',
  '遵化市',
  '迁安市',
  '滦州市',
]
const KEY_USER_DETAIL_MOCK_ROWS = KEY_USER_DETAIL_MOCK_TRADE_DISTRIBUTION
  .flatMap((item) => Array.from({ length: item.userCount }, () => item.tradeName))
  .map((tradeName, index) => {
    const sequence = String(index + 1).padStart(3, '0')
    const countyName = KEY_USER_DETAIL_MOCK_COUNTIES[index % KEY_USER_DETAIL_MOCK_COUNTIES.length]
    return {
      consNo: `20260701${sequence}`,
      consName: `${countyName}${tradeName}重点用户${sequence}`,
      countyName,
      tradeName,
      custTypeName: '重点用户',
      isKey: '1',
      isSen: '0',
      consAddr: `${countyName}重点保障区域${index + 1}号`,
    }
  })
const countyUserListSnapshotDate = String(import.meta.env.VITE_COUNTY_USER_LIST_SNAPSHOT_DATE || '').trim()
const countyUserListSnapshotStartDate = String(import.meta.env.VITE_COUNTY_USER_LIST_SNAPSHOT_START_DATE || '').trim()
const countyUserListSnapshotEndDate = String(import.meta.env.VITE_COUNTY_USER_LIST_SNAPSHOT_END_DATE || '').trim()
const countyUserListOutageCount = String(import.meta.env.VITE_COUNTY_USER_LIST_OUTAGE_COUNT || '').trim()
const setOutageDetailGridBodyRef = (el) => {
  outageDetailGridBodyRef.value = el
}
const setOutageDetailPaginationRef = (el) => {
  outageDetailPaginationRef.value = el
}
const setOutageDetailPageJumpRef = (el) => {
  outageDetailPageJumpRef.value = el
}
const setUserDetailGridBodyRef = (el) => {
  userDetailGridBodyRef.value = el
}
const setUserDetailPaginationRef = (el) => {
  userDetailPaginationRef.value = el
}
const setUserDetailPageJumpRef = (el) => {
  userDetailPageJumpRef.value = el
}
const toDateTimeLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const toDateLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const nowForFilter = new Date()
nowForFilter.setDate(nowForFilter.getDate() - 2)
const queryEndTime = ref(toDateLocal(nowForFilter))
const queryStartTime = ref(`${queryEndTime.value}T00:00`)

watch(queryEndTime, (value) => {
  const selectedDate = String(value || '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    queryStartTime.value = `${selectedDate}T00:00`
    void applyTimeFilter()
  }
})

const toBackendDateTime = (value) => {
  if (!value) {
    return ''
  }

  const normalized = String(value).trim().replace('T', ' ')
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return `${normalized} 23:59:59`
  }
  return normalized.length === 16 ? `${normalized}:00` : normalized
}

const safeNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    if (value.startsWith('{') && value.endsWith('}')) {
      return value
        .slice(1, -1)
        .split(',')
        .map((item) => Number(item.trim()) || 0)
        .reduce((sum, item) => sum + item, 0)
    }

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

const toBooleanFlag = (value) => {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value === 1
  }
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'y'
}

const countyUserListLevels = new Set(['all', 'key', 'sensitive', 'key_sensitive'])
const countyUserListOutageCounts = new Set(['1', '2', '3+'])

const normalizeCountyName = (countyName = '') => String(countyName || '').replace('供电公司', '').trim()
const toCountyDisplayName = (countyName = '') => String(countyName || '').trim()

const mapCountyList = (response) => {
  const data = response?.data
  const rawList = Array.isArray(data)
    ? data
    : Array.isArray(data?.list)
      ? data.list
      : Array.isArray(data?.rows)
        ? data.rows
        : []
  const dedup = new Map()
  rawList.forEach((item) => {
    const countyId = String(item?.countyId || '').trim()
    const countyName = toCountyDisplayName(item?.countyName || '')
    if (!countyName) {
      return
    }
    const key = countyId || normalizeCountyName(countyName)
    if (!key || dedup.has(key)) {
      return
    }
    dedup.set(key, { countyId, countyName })
  })
  return Array.from(dedup.values())
}

const loadCountyList = async () => {
  try {
    const payload = countyListCityId ? { cityId: countyListCityId } : {}
    const response = await queryOutageUserCounties(payload)
    countyList.value = mapCountyList(response)
    return countyList.value
  } catch (error) {
    console.error(error)
    countyList.value = []
    return []
  }
}

const getCountyIdByRegionName = (regionName) => {
  if (regionName === '全部') {
    return ''
  }

  const normalizedName = normalizeCountyName(regionName)
  const matched = countyList.value.find((item) => normalizeCountyName(item.countyName) === normalizedName)
  return matched?.countyId || ''
}

const appendCountyOrCityScope = (payload) => {
  const scopedPayload = payload || {}
  const countyId = getCountyIdByRegionName(selectedRegion.value)
  if (countyId) {
    scopedPayload.countyId = countyId
  } else if (countyListCityId) {
    scopedPayload.cityId = countyListCityId
  }
  return scopedPayload
}

const getEventId = (event) =>
  event?.id ||
  event?.eventId ||
  event?.event_id ||
  event?.outageId ||
  event?.outage_id ||
  extractOutageNumberParam(event) ||
  ''

const OUTAGE_NUMBER_FIELD_KEYS = ['outageNumber', 'outage_number', 'outageNo', 'outage_no', 'eventNo', 'event_no']

const toOutageNumberParam = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const text = String(value ?? '').trim()
  return text === '' ? '' : text
}

const extractOutageNumberParam = (record) => {
  const eventRecord = normalizeUserRecord(record)
  return toOutageNumberParam(readFieldValue(eventRecord, OUTAGE_NUMBER_FIELD_KEYS))
}

const hashText = (text) => {
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const getCountyCenter = (countyName) => {
  const normalized = normalizeCountyName(countyName)
  const fixed = countyCenterMap[normalized]
  if (fixed) {
    return fixed
  }

  const hash = hashText(normalized || '唐山')
  const lngOffset = ((hash % 100) - 50) / 400
  const latOffset = (((Math.floor(hash / 100) % 100) - 50) / 400)
  return [tangshanCenter[0] + lngOffset, tangshanCenter[1] + latOffset]
}

const postMessageToMapFrame = (message) => {
  const targetWindow = mapFrameRef.value?.contentWindow
  if (!targetWindow) {
    return
  }
  targetWindow.postMessage(message, window.location.origin)
}

const buildKeyUserCountyMarkerPayload = () =>
  keyUserCountyStats.value.map((countyStat) => ({
    countyName: countyStat.countyName,
    keyUserCount: safeNumber(countyStat.keyUserCount),
    ratioText: countyStat.ratioText,
    lngLat: getCountyCenter(countyStat.countyName),
    active: countyStat.countyName === selectedKeyUserCounty.value,
  }))

const syncKeyUserCountyMarkersToMapFrame = () => {
  if (!showKeyUserDetailPage.value) {
    postMessageToMapFrame({ type: keyUserCountyMarkersClearMessageType })
    return
  }

  postMessageToMapFrame({
    type: keyUserCountyMarkersMessageType,
    payload: buildKeyUserCountyMarkerPayload(),
  })
}

const syncCountyFocusToMapFrame = () => {
  if (selectedRegion.value === '全部') {
    postMessageToMapFrame({
      type: mapCountyFocusMessageType,
      payload: null,
    })
    return
  }

  postMessageToMapFrame({
    type: mapCountyFocusMessageType,
    payload: {
      countyName: selectedRegion.value,
      lngLat: getCountyCenter(selectedRegion.value),
    },
  })
}

const handleMapFrameLoad = () => {
  syncKeyUserCountyMarkersToMapFrame()
  syncCountyFocusToMapFrame()
}

const handleMapFrameMessage = (event) => {
  if (event.origin !== window.location.origin) {
    return
  }

  if (event?.data?.type === keyUserMapReadyMessageType) {
    syncKeyUserCountyMarkersToMapFrame()
    syncCountyFocusToMapFrame()
    return
  }

  if (event?.data?.type === amapTokenCapturedMessageType) {
    oneMapAmapToken.value = String(event?.data?.payload?.amapToken || '').trim()
  }
}

const waitForOneMapAmapToken = async (timeoutMs = 1800) => {
  const startedAt = Date.now()
  while (!oneMapAmapToken.value && Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return oneMapAmapToken.value
}

const requestOneMapAmapTokenByProbeFly = async () => {
  if (oneMapAmapToken.value) {
    return oneMapAmapToken.value
  }

  postMessageToMapFrame({
    type: mapSpaceDeviceLocateMessageType,
    payload: {
      devId: oneMapTokenProbePsrId,
      psrId: oneMapTokenProbePsrId,
      devType: oneMapMeterBoxPsrType,
      psrType: oneMapMeterBoxPsrType,
      provinceId: mapOutageChainProvinceId,
      distribution: oneMapMeterBoxDistribution,
      deviceName: oneMapTokenProbePsrId,
      name: oneMapTokenProbePsrId,
      enableFocusMark: false,
    },
  })

  return await waitForOneMapAmapToken()
}

const buildOneMapUserDetailPayload = (item, popupMode = '') => {
  if (!item || typeof item !== 'object') {
    return null
  }

  const resolvedPopupMode = popupMode || item.popupMode || 'userTag'

  return {
    popupMode: resolvedPopupMode === 'timeTrend' ? 'timeTrend' : 'userTag',
    consNo: String(item.consNo || '').trim() || '-',
    consName: String(item.consName || '').trim() || '-',
    outageCount: String(item.outageCount ?? '').trim() || '-',
    countyName: String(item.countyName || '').trim() || '-',
    tradeName: String(item.tradeName || '').trim() || '-',
    consAddr: String(item.consAddr || '').trim() || '-',
    userType: String(item.outageNature || item.userType || '').trim() || '-',
  }
}

const syncOneMapMeterBoxId = async (consNo, userDetail = null, popupMode = '') => {
  const normalizedConsNo = String(consNo || '').trim()
  if (!normalizedConsNo) {
    return
  }

  const amapToken = oneMapAmapToken.value || await requestOneMapAmapTokenByProbeFly()
  if (!amapToken) {
    return
  }

  try {
    const response = await queryOneMapMeterBoxId({ consNo: normalizedConsNo }, amapToken)
    const measPsrId = String(
      readFieldValue(response, ['measPsrId', 'meas_psr_id', 'psrId', 'psr_id']) ||
        readFieldValue(response?.data, ['measPsrId', 'meas_psr_id', 'psrId', 'psr_id']) ||
        readFieldValue(response?.result, ['measPsrId', 'meas_psr_id', 'psrId', 'psr_id']) ||
        '',
    ).trim()
    if (!measPsrId) {
      return
    }

    postMessageToMapFrame({
      type: mapSpaceDeviceLocateMessageType,
      payload: {
        devId: measPsrId,
        psrId: measPsrId,
        devType: oneMapMeterBoxPsrType,
        psrType: oneMapMeterBoxPsrType,
        provinceId: mapOutageChainProvinceId,
        distribution: oneMapMeterBoxDistribution,
        deviceName: measPsrId,
        name: measPsrId,
        enableFocusMark: true,
        userDetail: buildOneMapUserDetailPayload(userDetail, popupMode),
      },
    })
  } catch (error) {
    console.error(error)
  }
}

const locateOutageFeederOnMapFrame = (item) => {
  const feederId = String(
    readFieldValue(item, ['rdtFeederId', 'rdt_feeder_id', 'feederId', 'feeder_id']) || '',
  ).trim()
  if (!feederId) {
    return
  }

  const feederName = String(
    readFieldValue(item, ['rdtFeederName', 'rdt_feeder_name', 'feederName', 'feeder_name']) || '',
  ).trim()
  const feederDevType = String(
    readFieldValue(item, ['rdtFeederDevType', 'rdt_feeder_dev_type', 'rdtFeederType', 'rdt_feeder_type', 'devType', 'dev_type']) || '',
  ).trim()

  postMessageToMapFrame({
    type: mapOutageFeederLocateMessageType,
    payload: {
      rdtFeederId: feederId,
      rdtFeederName: feederName,
      devType: feederDevType || '',
    },
  })
}

const locateOutageRangeChainOnMapFrame = (item) => {
  if (!item) {
    return
  }

  const feederId = String(
    readFieldValue(item, ['rdtFeederId', 'rdt_feeder_id', 'feederId', 'feeder_id']) || '',
  ).trim()
  const substationId = String(
    readFieldValue(item, ['rdtSubsId', 'rdt_subs_id', 'substationId', 'substation_id', 'subsId', 'subs_id']) || '',
  ).trim()
  const feederName = String(
    readFieldValue(item, ['rdtFeederName', 'rdt_feeder_name', 'feederName', 'feeder_name']) || feederId || '',
  ).trim()
  const substationName = String(
    readFieldValue(item, ['rdtSubsName', 'rdt_subs_name', 'substationName', 'substation_name', 'subsName', 'subs_name']) ||
      substationId ||
      '',
  ).trim()
  const outageNumber = String(
    readFieldValue(item, ['outageNumber', 'outage_number', 'outageNo', 'outage_no', 'eventNo', 'event_no']) || '',
  ).trim()
  const normalUserCount = Math.max(safeNumber(readFieldValue(item, ['normalUserCount', 'normal_user_count'])), 0)
  const importantUserCount = Array.isArray(item.importantUsers)
    ? item.importantUsers.length
    : Math.max(safeNumber(readFieldValue(item, ['importantUserCount', 'important_user_count'])), 0)
  const sensitiveUserCount = Array.isArray(item.sensitiveUsers)
    ? item.sensitiveUsers.length
    : Math.max(safeNumber(readFieldValue(item, ['sensitiveUserCount', 'sensitive_user_count'])), 0)
  const devices = []

  if (feederId) {
    devices.push({
      role: 'feeder',
      devId: feederId,
      devType: outageChainFeederDevType,
      provinceId: mapOutageChainProvinceId,
      distribution: outageChainDistribution,
      name: feederName || feederId,
    })
  }
  if (substationId) {
    devices.push({
      role: 'substation',
      devId: substationId,
      devType: outageChainSubstationDevType,
      provinceId: mapOutageChainProvinceId,
      distribution: outageChainDistribution,
      name: substationName || substationId,
    })
  }

  postMessageToMapFrame({
    type: mapOutageChainLocateMessageType,
    payload: {
      outageNumber,
      rdtFeederId: feederId,
      rdtFeederName: feederName,
      rdtSubsId: substationId,
      rdtSubsName: substationName,
      devices,
      importantUserCount,
      sensitiveUserCount,
      normalUserCount,
      rangeRadiusMeters: Math.min(3600, Math.max(1200, (normalUserCount + importantUserCount + sensitiveUserCount) * 12)),
    },
  })
}

const resolveFirstDeviceId = (value) => {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const resolved = resolveFirstDeviceId(entry)
      if (resolved) {
        return resolved
      }
    }
    return ''
  }

  if (value && typeof value === 'object') {
    const nested = readFieldValue(value, ['devId', 'equipmentId', 'equipment_id', 'id', 'value'])
    return resolveFirstDeviceId(nested)
  }

  const text = String(value || '').trim()
  if (!text) {
    return ''
  }

  const chunk = text.split(/[，,;；、\s]+/).map((item) => item.trim()).find((item) => item !== '')
  return chunk || text
}

const resolveOutageLineEquipmentId = (item) => {
  const record = normalizeUserRecord(item)
  if (!record || Object.keys(record).length === 0) {
    return ''
  }

  const equipmentIdRaw = readFieldValue(record, [
    'equipmentId',
    'equipment_id',
    'faultEquipId',
    'fault_equip_id',
    'equipmentIds',
    'equipment_ids',
  ])
  const equipmentId = resolveFirstDeviceId(equipmentIdRaw)
  if (equipmentId) {
    return equipmentId
  }

  const feederIdRaw = readFieldValue(record, ['rdtFeederId', 'rdt_feeder_id', 'feederId', 'feeder_id'])
  return resolveFirstDeviceId(feederIdRaw)
}

const resolveOutageSubstationEquipmentId = (item) => {
  const record = normalizeUserRecord(item)
  if (!record || Object.keys(record).length === 0) {
    return ''
  }

  const equipmentIdRaw = readFieldValue(record, [
    'equipmentId',
    'equipment_id',
    'faultEquipId',
    'fault_equip_id',
    'equipmentIds',
    'equipment_ids',
  ])
  const equipmentId = resolveFirstDeviceId(equipmentIdRaw)
  if (equipmentId) {
    return equipmentId
  }

  const substationIdRaw = readFieldValue(record, [
    'rdtSubsId',
    'rdt_subs_id',
    'substationId',
    'substation_id',
    'subsId',
    'subs_id',
  ])
  return resolveFirstDeviceId(substationIdRaw)
}

const locateFaultOutageLineOnMapFrame = (item, detailData = null) => {
  const devId = resolveOutageLineEquipmentId(detailData) || resolveOutageLineEquipmentId(item)
  if (!devId) {
    locateOutageFeederOnMapFrame(detailData || item)
    return
  }

  const name = String(
    readFieldValue(detailData || {}, [
      'equipmentName',
      'equipment_name',
      'faultEquipName',
      'fault_equip_name',
      'rdtFeederName',
      'rdt_feeder_name',
      'feederName',
      'feeder_name',
    ]) ||
      readFieldValue(item, [
        'equipmentName',
        'equipment_name',
        'faultEquipName',
        'fault_equip_name',
        'rdtFeederName',
        'rdt_feeder_name',
        'feederName',
        'feeder_name',
      ]) ||
      devId,
  ).trim() || devId

  const beginTime = String(
    readFieldValue(detailData || {}, ['beginTime', 'begin_time', 'outageBeginTime', 'outage_begin_time']) ||
      readFieldValue(item, ['beginTime', 'begin_time', 'outageBeginTime', 'outage_begin_time']) ||
      '-',
  ).trim() || '-'
  const endTimeRaw = String(
    readFieldValue(detailData || {}, ['endTime', 'end_time', 'outageEndTime', 'outage_end_time', 'restoreTime', 'restore_time']) ||
      readFieldValue(item, ['endTime', 'end_time', 'outageEndTime', 'outage_end_time', 'restoreTime', 'restore_time']) ||
      '',
  ).trim()
  const hasEndTime = endTimeRaw !== '' && endTimeRaw !== '-' && endTimeRaw.toLowerCase() !== 'null'
  const hasRestoredFlag = (() => {
    const detailValue = readFieldValue(detailData || {}, ['isRestored', 'restored'])
    if (detailValue !== '' && detailValue !== null && detailValue !== undefined) {
      return detailValue
    }
    const itemValue = readFieldValue(item, ['isRestored', 'restored'])
    if (itemValue !== '' && itemValue !== null && itemValue !== undefined) {
      return itemValue
    }
    return null
  })()
  const countyName = String(
    readFieldValue(detailData || {}, ['countyName', 'county_name', 'rdtCountyName', 'rdt_county_name']) ||
      readFieldValue(item, ['countyName', 'county_name', 'rdtCountyName', 'rdt_county_name']) ||
      '-',
  ).trim() || '-'
  const affectedUsers = Math.max(
    safeNumber(
      readFieldValue(detailData || {}, ['affectedUsers', 'affected_users', 'affectedConsCnt', 'affected_cons_cnt']) ||
        readFieldValue(item, ['affectedUsers', 'affected_users', 'affectedConsCnt', 'affected_cons_cnt']),
    ),
    0,
  )

  postMessageToMapFrame({
    type: mapSpaceDeviceLocateMessageType,
    payload: {
      devId,
      devType: outageChainFeederDevType,
      provinceId: mapOutageChainProvinceId,
      distribution: outageChainDistribution,
      deviceName: name,
      name,
      feederName: name,
      outageLineName: name,
      beginTime,
      endTime: hasEndTime ? endTimeRaw : '-',
      isRestored: hasRestoredFlag,
      countyName,
      affectedUsers,
      enableFocusMark: true,
    },
  })
}

const locateFaultOutageSubstationOnMapFrame = (item, detailData = null) => {
  const devId = resolveOutageSubstationEquipmentId(detailData) || resolveOutageSubstationEquipmentId(item)
  if (!devId) {
    return
  }

  const name = String(
    readFieldValue(detailData || {}, [
      'substationName',
      'substation_name',
      'rdtSubsName',
      'rdt_subs_name',
      'equipmentName',
      'equipment_name',
      'name',
    ]) ||
      readFieldValue(item, [
        'substationName',
        'substation_name',
        'rdtSubsName',
        'rdt_subs_name',
        'equipmentName',
        'equipment_name',
        'name',
      ]) ||
      devId,
  ).trim() || devId

  const beginTime = String(
    readFieldValue(detailData || {}, ['beginTime', 'begin_time', 'outageBeginTime', 'outage_begin_time']) ||
      readFieldValue(item, ['beginTime', 'begin_time', 'outageBeginTime', 'outage_begin_time']) ||
      '-',
  ).trim() || '-'
  const endTimeRaw = String(
    readFieldValue(detailData || {}, ['endTime', 'end_time', 'outageEndTime', 'outage_end_time', 'restoreTime', 'restore_time']) ||
      readFieldValue(item, ['endTime', 'end_time', 'outageEndTime', 'outage_end_time', 'restoreTime', 'restore_time']) ||
      '',
  ).trim()
  const hasEndTime = endTimeRaw !== '' && endTimeRaw !== '-' && endTimeRaw.toLowerCase() !== 'null'
  const hasRestoredFlag = (() => {
    const detailValue = readFieldValue(detailData || {}, ['isRestored', 'restored'])
    if (detailValue !== '' && detailValue !== null && detailValue !== undefined) {
      return detailValue
    }
    const itemValue = readFieldValue(item, ['isRestored', 'restored'])
    if (itemValue !== '' && itemValue !== null && itemValue !== undefined) {
      return itemValue
    }
    return null
  })()
  const countyName = String(
    readFieldValue(detailData || {}, ['countyName', 'county_name', 'rdtCountyName', 'rdt_county_name']) ||
      readFieldValue(item, ['countyName', 'county_name', 'rdtCountyName', 'rdt_county_name']) ||
      '-',
  ).trim() || '-'
  const affectedUsers = Math.max(
    safeNumber(
      readFieldValue(detailData || {}, ['affectedUsers', 'affected_users', 'affectedConsCnt', 'affected_cons_cnt']) ||
        readFieldValue(item, ['affectedUsers', 'affected_users', 'affectedConsCnt', 'affected_cons_cnt']),
    ),
    0,
  )

  postMessageToMapFrame({
    type: mapSpaceDeviceLocateMessageType,
    payload: {
      devId,
      devType: outageChainSubstationDevType,
      provinceId: mapOutageChainProvinceId,
      distribution: outageChainDistribution,
      deviceName: name,
      name,
      outageSubstationName: name,
      beginTime,
      endTime: hasEndTime ? endTimeRaw : '-',
      isRestored: hasRestoredFlag,
      countyName,
      affectedUsers,
      enableFocusMark: false,
    },
  })
}

const resolveSpaceDistributionDevType = (equipmentType) => {
  const normalizedType = String(equipmentType || '').trim()
  if (!normalizedType) {
    return ''
  }
  return spaceDistributionDeviceTypeMap[normalizedType] || normalizedType
}

const locateSpaceDistributionDeviceOnMapFrame = (item) => {
  const psrId = String(
    readFieldValue(item, ['deviceNo', 'device_no', 'equipmentNo', 'equipment_no', 'equipmentId', 'equipment_id']) || '',
  ).trim()
  if (!psrId) {
    return
  }

  const name = String(
    readFieldValue(item, ['deviceName', 'equipmentName', 'equipment_name', 'name']) || psrId,
  ).trim() || psrId
  const importantUserCount = Math.max(safeNumber(readFieldValue(item, ['importantUserCount', 'keyUsers'])), 0)
  const sensitiveUserCount = Math.max(safeNumber(readFieldValue(item, ['sensitiveUserCount', 'sensitiveUsers'])), 0)
  const totalUserCountSource = readFieldValue(item, ['allUsersCnt', 'totalUserCount'])
  const totalUserCount = totalUserCountSource == null || String(totalUserCountSource).trim() === ''
    ? importantUserCount + sensitiveUserCount
    : Math.max(safeNumber(totalUserCountSource), 0)

  postMessageToMapFrame({
    type: mapSpaceDeviceLocateMessageType,
    payload: {
      devId: psrId,
      psrId,
      deviceNo: psrId,
      devType: spaceDistributionPsrType,
      psrType: spaceDistributionPsrType,
      provinceId: spaceDistributionProvinceId,
      distribution: spaceDistributionDistribution,
      deviceName: name,
      importantUserCount,
      sensitiveUserCount,
      totalUserCount,
      popupMode: 'spaceDistributionDevice',
      enableFocusMark: true,
    },
  })
}

const OUTAGE_LIST_PAGE_SIZE = 300
const OUTAGE_LIST_MAX_PAGES = 60
const OUTAGE_USER_PAGE_SIZE = 500
const OUTAGE_USER_MAX_PAGES = 24
const OUTAGE_USER_BATCH_SIZE = 20
const OUTAGE_USER_MAX_RECORDS = 12000
const OUTAGE_SINGLE_EVENT_MAX = 400
const OUTAGE_SINGLE_EVENT_PAGE_LIMIT = 3
const OUTAGE_TIME_WINDOW_MONTHS = 1
const OUTAGE_TIME_WINDOW_MAX = 36
const OUTAGE_DETAIL_DEFAULT_PAGE = 1
const OUTAGE_DETAIL_DEFAULT_PER_PAGE = 10
const OUTAGE_DETAIL_REMOTE_MAX_PER_PAGE = 500
const OUTAGE_CHAINS_REMOTE_PAGE_SIZE = 4
const COUNTY_WARNING_POPUP_CHAIN_PAGE_SIZE = 3

const chunkArray = (list, size) => {
  if (!Array.isArray(list) || list.length === 0 || size <= 0) {
    return []
  }

  const chunks = []
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size))
  }
  return chunks
}

const buildUserRecordKey = (item) => {
  if (item?.id) {
    return String(item.id)
  }
  return [
    item?.outageNumber || '',
    item?.consNo || item?.userId || item?.meansNo || '',
    item?.beginTime || '',
  ].join('|')
}
const parseBackendDateTime = (value) => {
  if (!value) {
    return null
  }
  const text = String(value).trim()
  if (!text) {
    return null
  }

  const normalized = text
    .replaceAll('/', '-')
    .replace('T', ' ')
  const completed = normalized.length === 16 ? `${normalized}:00` : normalized
  const match = completed.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (match) {
    const [, year, month, day, hour, minute, second = '0'] = match
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    )
    return Number.isNaN(date.getTime()) ? null : date
  }

  const fallback = new Date(text.replace(' ', 'T'))
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

const formatBackendDateTime = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const formatBackendDate = (value) => {
  const text = String(value || '').trim()
  if (/^\d{8}$/.test(text)) {
    return text
  }

  const matched = text.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/)
  if (matched) {
    return `${matched[1]}${matched[2]}${matched[3]}`
  }

  const parsed = parseBackendDateTime(text)
  if (!parsed) {
    return ''
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

const buildTimeWindows = (beginTime, endTime) => {
  const start = parseBackendDateTime(beginTime)
  const end = parseBackendDateTime(endTime)
  if (!start || !end || start > end) {
    return []
  }

  const windows = []
  let cursor = new Date(start)

  while (cursor <= end && windows.length < OUTAGE_TIME_WINDOW_MAX) {
    const windowStart = new Date(cursor)
    const windowEnd = new Date(cursor)
    windowEnd.setMonth(windowEnd.getMonth() + OUTAGE_TIME_WINDOW_MONTHS)
    windowEnd.setSeconds(windowEnd.getSeconds() - 1)

    const finalEnd = windowEnd < end ? windowEnd : new Date(end)
    windows.push({
      start: windowStart,
      end: finalEnd,
      beginTime: formatBackendDateTime(windowStart),
      endTime: formatBackendDateTime(finalEnd),
    })

    cursor = new Date(finalEnd)
    cursor.setSeconds(cursor.getSeconds() + 1)
  }

  return windows
}

const queryOutageUsersByTimeWindows = async ({ beginTime, endTime, outageEvents = [] }) => {
  const recordMap = new Map()
  const windows = buildTimeWindows(beginTime, endTime)

  for (const window of windows) {
    const outageNumbers = outageEvents
      .filter((item) => {
        const eventBegin = parseBackendDateTime(item?.beginTime)
        if (!eventBegin) {
          return false
        }
        return eventBegin >= window.start && eventBegin <= window.end
      })
      .map((item) => extractOutageNumberParam(item))
      .filter((item) => item !== '')

    if (outageNumbers.length === 0) {
      continue
    }

    const records = await queryOutageUsersByPages({
      beginTime: window.beginTime,
      endTime: window.endTime,
      outageNumbers,
    })

    records.forEach((item) => {
      const key = buildUserRecordKey(item)
      if (!recordMap.has(key)) {
        recordMap.set(key, item)
      }
    })

    if (recordMap.size >= OUTAGE_USER_MAX_RECORDS) {
      break
    }
  }

  return Array.from(recordMap.values())
}

const queryOutageEventsByPages = async () => []

const queryOutageUsersByPages = async () => []

const buildTagStatsOverviewPayload = ({ beginTime, endTime }) => {
  return appendCountyOrCityScope({
    beginTime: formatBackendDate(beginTime),
    endTime: formatBackendDate(endTime),
  })
}

const hasCountyStatsField = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  return [
    'totalUsers',
    'keyUsers',
    'sensitiveUsers',
    'normalUsers',
    'total_users',
    'key_users',
    'sensitive_users',
    'normal_users',
  ].some((key) => value[key] !== undefined && value[key] !== null && String(value[key]).trim() !== '')
}

const toCountyStatsRow = (value, fallbackName = '未知区县') => {
  const countyName = toCountyDisplayName(value?.countyName || value?.county_name || value?.name || fallbackName) || fallbackName
  const importantCount = Math.max(safeNumber(value?.keyUsers ?? value?.key_users), 0)
  const sensitiveCount = Math.max(safeNumber(value?.sensitiveUsers ?? value?.sensitive_users), 0)

  return {
    name: countyName,
    importantCount,
    sensitiveCount,
  }
}

const mapCountyStatsRows = (response) => {
  const data = response?.data || response?.result || response
  if (!data || typeof data !== 'object') {
    return []
  }

  const tangshanCountyIdSet = new Set(
    countyList.value
      .map((item) => String(item?.countyId || '').trim())
      .filter((item) => item !== ''),
  )
  const tangshanCountyNameSet = new Set(
    countyList.value
      .map((item) => normalizeCountyName(item?.countyName || ''))
      .filter((item) => item !== ''),
  )

  const resolveStatsCountyId = (item) => String(item?.countyId || item?.county_id || item?.id || '').trim()
  const resolveStatsCountyName = (item) => normalizeCountyName(
    toCountyDisplayName(item?.countyName || item?.county_name || item?.name || ''),
  )

  const isTangshanCountyStatsItem = (item) => {
    if (tangshanCountyIdSet.size === 0 && tangshanCountyNameSet.size === 0) {
      return true
    }

    const countyId = resolveStatsCountyId(item)
    if (countyId && tangshanCountyIdSet.has(countyId)) {
      return true
    }

    const countyName = resolveStatsCountyName(item)
    if (countyName && tangshanCountyNameSet.has(countyName)) {
      return true
    }

    return false
  }

  const rawList = Array.isArray(data)
    ? data
    : Array.isArray(data.list)
      ? data.list
      : Array.isArray(data.rows)
        ? data.rows
      : []

  if (rawList.length > 0) {
    const mappedRows = rawList
      .filter((item) => hasCountyStatsField(item) && isTangshanCountyStatsItem(item))
      .map((item) => toCountyStatsRow(item))
      .sort((a, b) => {
        const aTotal = a.importantCount + a.sensitiveCount
        const bTotal = b.importantCount + b.sensitiveCount
        if (aTotal !== bTotal) {
          return bTotal - aTotal
        }
        if (a.importantCount !== b.importantCount) {
          return b.importantCount - a.importantCount
        }
        return a.name.localeCompare(b.name, 'zh-Hans-CN')
      })

    if (mappedRows.length > 0) {
      return mappedRows
    }
  }

  const summaryData =
    data?.summary && typeof data.summary === 'object' && !Array.isArray(data.summary)
      ? data.summary
      : data

  if (!hasCountyStatsField(summaryData)) {
    return []
  }

  const selectedName = selectedRegion.value === '全部' ? '当前区县' : selectedRegion.value
  return [toCountyStatsRow({ ...summaryData, countyName: selectedName }, selectedName)]
}

const mapTagStatsOverview = (response) => {
  const data = response?.data || response?.result || response
  if (!data || typeof data !== 'object') {
    return null
  }

  const statsData = Array.isArray(data)
    ? data.reduce(
      (summary, item) => ({
        totalUsers: summary.totalUsers + safeNumber(item?.totalUsers ?? item?.total_users),
        keyUsers: summary.keyUsers + safeNumber(item?.keyUsers ?? item?.key_users),
        sensitiveUsers: summary.sensitiveUsers + safeNumber(item?.sensitiveUsers ?? item?.sensitive_users),
        normalUsers: summary.normalUsers + safeNumber(item?.normalUsers ?? item?.normal_users),
      }),
      { totalUsers: 0, keyUsers: 0, sensitiveUsers: 0, normalUsers: 0 },
    )
    : data?.summary && typeof data.summary === 'object' && !Array.isArray(data.summary)
      ? data.summary
      : data

  const hasAnyField = [
    'totalUsers',
    'keyUsers',
    'sensitiveUsers',
    'normalUsers',
    'total_users',
    'key_users',
    'sensitive_users',
    'normal_users',
  ].some((key) => statsData[key] !== undefined && statsData[key] !== null && String(statsData[key]).trim() !== '')

  if (!hasAnyField) {
    return null
  }

  const totalUsers = Math.max(safeNumber(statsData.totalUsers ?? statsData.total_users), 0)
  const keyUsers = Math.max(safeNumber(statsData.keyUsers ?? statsData.key_users), 0)
  const sensitiveUsers = Math.max(safeNumber(statsData.sensitiveUsers ?? statsData.sensitive_users), 0)
  const normalRaw = statsData.normalUsers ?? statsData.normal_users
  const normalUsers = normalRaw !== undefined && normalRaw !== null
    ? Math.max(safeNumber(normalRaw), 0)
    : Math.max(totalUsers - keyUsers - sensitiveUsers, 0)

  return {
    totalUsers,
    keyUsers,
    sensitiveUsers,
    normalUsers,
  }
}

const loadTagStatsOverview = async ({ beginTime, endTime }) => {
  if (!beginTime || !endTime) {
    tagStatsOverview.value = null
    countyStatsRows.value = []
    return null
  }

  tagStatsLoadingCount.value += 1
  try {
    const response = await queryOutageUserCountyUserCount(buildTagStatsOverviewPayload({ beginTime, endTime }))
    const mapped = mapTagStatsOverview(response)
    tagStatsOverview.value = mapped
    countyStatsRows.value = mapCountyStatsRows(response)
    return mapped
  } catch (error) {
    console.error(error)
    tagStatsOverview.value = null
    countyStatsRows.value = []
    return null
  } finally {
    tagStatsLoadingCount.value = Math.max(tagStatsLoadingCount.value - 1, 0)
  }
}

const USER_TIME_TREND_POINT_COUNT = 6

const formatTrendDateLabel = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '----/--/--'
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

const formatTrendTimeLabel = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '--:--'
  }
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

const buildTrendDateSegments = (beginTime, endTime) => {
  const startDate = parseBackendDateTime(beginTime)
  const endDate = parseBackendDateTime(endTime)
  if (!startDate || !endDate || startDate.getTime() >= endDate.getTime()) {
    return Array.from({ length: USER_TIME_TREND_POINT_COUNT }, () => '----/--/--')
  }

  const totalSpan = endDate.getTime() - startDate.getTime()
  const step = totalSpan / (USER_TIME_TREND_POINT_COUNT - 1)

  return Array.from({ length: USER_TIME_TREND_POINT_COUNT }, (_, index) => {
    const pointTime = new Date(startDate.getTime() + step * index)
    return formatTrendDateLabel(pointTime)
  })
}

const buildTrendTimeSegments = (beginTime, endTime) => {
  const startDate = parseBackendDateTime(beginTime)
  const endDate = parseBackendDateTime(endTime)
  if (!startDate || !endDate || startDate.getTime() >= endDate.getTime()) {
    return Array.from({ length: USER_TIME_TREND_POINT_COUNT }, () => '--:--')
  }

  const totalSpan = endDate.getTime() - startDate.getTime()
  const step = totalSpan / (USER_TIME_TREND_POINT_COUNT - 1)

  return Array.from({ length: USER_TIME_TREND_POINT_COUNT }, (_, index) => {
    const pointTime = new Date(startDate.getTime() + step * index)
    return formatTrendTimeLabel(pointTime)
  })
}

const buildDefaultCountyTrendData = (beginTime, endTime) => ({
  labels: buildTrendDateSegments(beginTime, endTime),
  timeLabels: buildTrendTimeSegments(beginTime, endTime),
  sensitiveSeries: Array.from({ length: USER_TIME_TREND_POINT_COUNT }, () => 0),
  importantSeries: Array.from({ length: USER_TIME_TREND_POINT_COUNT }, () => 0),
})

const parseTrendTimePoint = (value) => {
  const text = String(value || '').trim()
  const dateMatch = text.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (dateMatch) {
    const [, year, month, day] = dateMatch
    const date = new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return parseBackendDateTime(text)
}

const buildCountyTrendPayload = ({ beginTime, endTime }) => {
  return appendCountyOrCityScope({
    beginTime: formatBackendDate(beginTime),
    endTime: formatBackendDate(endTime),
  })
}

const subtractDaysFromBackendDate = (dateText, dayCount) => {
  const match = String(dateText || '').trim().match(/^(\d{4})(\d{2})(\d{2})$/)
  if (!match) {
    return ''
  }

  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  date.setDate(date.getDate() - Math.max(Number(dayCount) || 0, 0))
  const resultYear = date.getFullYear()
  const resultMonth = String(date.getMonth() + 1).padStart(2, '0')
  const resultDay = String(date.getDate()).padStart(2, '0')
  return `${resultYear}${resultMonth}${resultDay}`
}

const buildTimeTrendPayload = ({ beginTime, endTime }) => {
  const formattedEndTime = formatBackendDate(endTime)
  const formattedBeginTime = subtractDaysFromBackendDate(formattedEndTime, 4) || formatBackendDate(beginTime)

  return appendCountyOrCityScope({
    beginTime: formattedBeginTime,
    endTime: formattedEndTime,
  })
}

const buildDefaultCountyOutageFreqData = () => ({
  keyUsers: {
    total: 0,
    distribution: [
      { label: '停电1次', count: 0, percentage: 0 },
      { label: '停电2次', count: 0, percentage: 0 },
      { label: '停电3次及以上', count: 0, percentage: 0 },
    ],
  },
  sensitiveUsers: {
    total: 0,
    distribution: [
      { label: '停电1次', count: 0, percentage: 0 },
      { label: '停电2次', count: 0, percentage: 0 },
      { label: '停电3次及以上', count: 0, percentage: 0 },
    ],
  },
})

const mapCountyOutageFreqGroup = (group, fallbackLabels = []) => {
  const safeTotal = Math.max(safeNumber(group?.total), 0)
  const list = Array.isArray(group?.distribution) ? group.distribution : []
  const fallback = fallbackLabels.length > 0
    ? fallbackLabels
    : ['停电1次', '停电2次', '停电3次及以上']
  const normalized = fallback.map((label, index) => {
    const item = list[index] || {}
    const count = Math.max(safeNumber(item?.count), 0)
    const percentage = item?.percentage === undefined || item?.percentage === null
      ? (safeTotal > 0 ? Number(((count / safeTotal) * 100).toFixed(1)) : 0)
      : Math.max(safeNumber(item?.percentage), 0)
    return {
      label: String(item?.label || label || '').trim() || label,
      count,
      percentage: Number(percentage.toFixed(1)),
    }
  })

  return {
    total: safeTotal,
    distribution: normalized,
  }
}

const mapCountyOutageFreqData = (response) => {
  let data = response?.data || {}
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      data = {}
    }
  }
  if (Array.isArray(data)) {
    data = data[0] || {}
  }

  const defaults = buildDefaultCountyOutageFreqData()
  const hasTimeTrendChartFields = [
    'outageKeyOne',
    'outageKeyTwo',
    'outageKeyMore',
    'keyTotal',
    'outageSenOne',
    'outageSenTwo',
    'outageSenMore',
    'senTotal',
  ].some((key) => data?.[key] !== undefined && data?.[key] !== null && String(data?.[key]).trim() !== '')

  if (hasTimeTrendChartFields) {
    const keyTotal = Math.max(safeNumber(data?.keyTotal), 0)
    const senTotal = Math.max(safeNumber(data?.senTotal), 0)
    return {
      keyUsers: mapCountyOutageFreqGroup(
        {
          total: keyTotal,
          distribution: [
            { label: '停电1次', count: data?.outageKeyOne },
            { label: '停电2次', count: data?.outageKeyTwo },
            { label: '停电3次及以上', count: data?.outageKeyMore },
          ],
        },
        defaults.keyUsers.distribution.map((item) => item.label),
      ),
      sensitiveUsers: mapCountyOutageFreqGroup(
        {
          total: senTotal,
          distribution: [
            { label: '停电1次', count: data?.outageSenOne },
            { label: '停电2次', count: data?.outageSenTwo },
            { label: '停电3次及以上', count: data?.outageSenMore },
          ],
        },
        defaults.sensitiveUsers.distribution.map((item) => item.label),
      ),
    }
  }

  return {
    keyUsers: mapCountyOutageFreqGroup(data?.keyUsers, defaults.keyUsers.distribution.map((item) => item.label)),
    sensitiveUsers: mapCountyOutageFreqGroup(
      data?.sensitiveUsers,
      defaults.sensitiveUsers.distribution.map((item) => item.label),
    ),
  }
}

const mapCountyTrendData = (response, beginTime, endTime) => {
  const data = response?.data
  const points =
    Array.isArray(data?.points)
      ? data.points
      : Array.isArray(data?.list)
        ? data.list
        : Array.isArray(data?.rows)
          ? data.rows
          : (Array.isArray(data) ? data : [])
  if (points.length === 0) {
    return buildDefaultCountyTrendData(beginTime, endTime)
  }

  return {
    labels: points.map((item) => {
      const timePoint = readFieldValue(item, ['timePoint', 'time', 'date', 'x'])
      return formatTrendDateLabel(parseTrendTimePoint(timePoint))
    }),
    timeLabels: points.map((item) => {
      const timePoint = readFieldValue(item, ['timePoint', 'time', 'date', 'x'])
      return formatTrendTimeLabel(parseTrendTimePoint(timePoint))
    }),
    sensitiveSeries: points.map((item) => {
      const count = readFieldValue(item, ['sensitiveUsers', 'sensitive_users', 'sensitiveUserCount', 'sensitiveCount'])
      return Math.max(safeNumber(count), 0)
    }),
    importantSeries: points.map((item) => {
      const count = readFieldValue(item, ['keyUsers', 'key_users', 'importantUsers', 'keyUserCount', 'importantCount'])
      return Math.max(safeNumber(count), 0)
    }),
  }
}

const loadCountyTrendData = async ({ beginTime, endTime }) => {
  if (!beginTime || !endTime) {
    countyTrendData.value = buildDefaultCountyTrendData(beginTime, endTime)
    return countyTrendData.value
  }

  countyTrendLoadingCount.value += 1
  try {
    const response = await queryOutageUserTimeTrend(buildTimeTrendPayload({ beginTime, endTime }))
    countyTrendData.value = mapCountyTrendData(response, beginTime, endTime)
  } catch (error) {
    console.error(error)
    countyTrendData.value = buildDefaultCountyTrendData(beginTime, endTime)
  } finally {
    countyTrendLoadingCount.value = Math.max(countyTrendLoadingCount.value - 1, 0)
  }

  return countyTrendData.value
}

const buildSpatialDistributionPayload = ({ beginTime, endTime }) => {
  return appendCountyOrCityScope({
    beginTime: formatBackendDate(beginTime),
    endTime: formatBackendDate(endTime),
  })
}

const mapSpatialDistributionRows = (response) => {
  const data = response?.data
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.list)
      ? data.list
      : Array.isArray(data?.rows)
        ? data.rows
        : []

  return rows
    .map((item) => {
      const name = toCountyDisplayName(readFieldValue(item, ['name', 'countyName', 'county_name']))
      const importantCount = Math.max(safeNumber(readFieldValue(item, ['keyUsers', 'key_users'])), 0)
      const sensitiveCount = Math.max(safeNumber(readFieldValue(item, ['sensitiveUsers', 'sensitive_users'])), 0)
      return {
        name,
        importantCount,
        sensitiveCount,
      }
    })
    .filter((item) => item.name)
}

const loadSpatialDistributionRows = async ({ beginTime, endTime }) => {
  if (!beginTime || !endTime) {
    spatialDistributionRows.value = []
    return []
  }

  spatialDistributionLoadingCount.value += 1
  try {
    const response = await queryOutageUserSpatialDistribution(buildSpatialDistributionPayload({ beginTime, endTime }))
    spatialDistributionRows.value = mapSpatialDistributionRows(response)
  } catch (error) {
    console.error(error)
    spatialDistributionRows.value = []
  } finally {
    spatialDistributionLoadingCount.value = Math.max(spatialDistributionLoadingCount.value - 1, 0)
  }

  return spatialDistributionRows.value
}

const buildRegionWarningLightsPayload = ({ beginTime, endTime }) => ({
  beginTime: formatBackendDate(beginTime),
  endTime: formatBackendDate(endTime),
})

const loadRegionWarningLights = async ({ beginTime, endTime }) => {
  try {
    const response = await queryOutageUserRegionWarningLights(buildRegionWarningLightsPayload({ beginTime, endTime }))
    const data = response?.data
    const rawList = Array.isArray(data)
      ? data
      : Array.isArray(data?.list)
        ? data.list
        : Array.isArray(data?.rows)
          ? data.rows
          : []
    countyWarningLightsData.value = mapOverviewCountyWarningLights(rawList)
  } catch (error) {
    console.error(error)
    countyWarningLightsData.value = []
  }
  return countyWarningLightsData.value
}

const loadCountyOutageFreqData = async ({ beginTime, endTime }) => {
  if (!beginTime || !endTime) {
    countyOutageFreqData.value = buildDefaultCountyOutageFreqData()
    return countyOutageFreqData.value
  }

  countyOutageFreqLoadingCount.value += 1
  try {
    const response = await queryOutageUserTimeTrendChart(buildCountyTrendPayload({ beginTime, endTime }))
    countyOutageFreqData.value = mapCountyOutageFreqData(response)
  } catch (error) {
    console.error(error)
    countyOutageFreqData.value = buildDefaultCountyOutageFreqData()
  } finally {
    countyOutageFreqLoadingCount.value = Math.max(countyOutageFreqLoadingCount.value - 1, 0)
  }

  return countyOutageFreqData.value
}

const mapCountyEquipmentStatsSummary = (response) => {
  const rawData =
    response?.data?.data ??
    response?.data?.result ??
    response?.result?.data ??
    response?.result ??
    response?.data ??
    response
  const data = Array.isArray(rawData)
    ? rawData[0] || {}
    : rawData && typeof rawData === 'object'
      ? rawData
      : {}
  return {
    affectedDeviceCount: Math.max(safeNumber(readFieldValue(data, ['equipmentCount'])), 0),
    importantUserTotal: Math.max(safeNumber(readFieldValue(data, ['keyUsersCnt'])), 0),
    sensitiveUserTotal: Math.max(safeNumber(readFieldValue(data, ['sensitiveUsersCnt'])), 0),
  }
}

const loadCountyEquipmentStatsSummary = async ({ beginTime, endTime }) => {
  if (!beginTime || !endTime) {
    countyEquipmentStatsSummary.value = null
    return null
  }

  spaceDistributionDetailLoadingCount.value += 1
  countyEquipmentStatsLoadingCount.value += 1

  try {
    const response = await queryOutageUserSpatialDistributionEquipmentSummary(
      buildSpatialDistributionPayload({ beginTime, endTime }),
    )
    countyEquipmentStatsSummary.value = mapCountyEquipmentStatsSummary(response)
    return countyEquipmentStatsSummary.value
  } catch {
    countyEquipmentStatsSummary.value = null
    return null
  } finally {
    spaceDistributionDetailLoadingCount.value = Math.max(spaceDistributionDetailLoadingCount.value - 1, 0)
    countyEquipmentStatsLoadingCount.value = Math.max(countyEquipmentStatsLoadingCount.value - 1, 0)
  }
}

const mapCountyEquipmentListRows = (response) => {
  const result = mapCountyEquipmentPageResult(response)

  return result.list
    .sort((a, b) => {
      if (a.totalUserCount !== b.totalUserCount) {
        return b.totalUserCount - a.totalUserCount
      }
      if (a.importantUserCount !== b.importantUserCount) {
        return b.importantUserCount - a.importantUserCount
      }
      if (a.outageEventCount !== b.outageEventCount) {
        return b.outageEventCount - a.outageEventCount
      }
      if (a.sensitiveUserCount !== b.sensitiveUserCount) {
        return b.sensitiveUserCount - a.sensitiveUserCount
      }
      return String(a.deviceName || '').localeCompare(String(b.deviceName || ''), 'zh-Hans-CN')
    })
}

const loadCountyEquipmentListRows = async ({ beginTime, endTime }) => {
  if (!beginTime || !endTime) {
    countyEquipmentListRows.value = []
    return countyEquipmentListRows.value
  }

  spaceDistributionDetailLoadingCount.value += 1
  try {
    const response = await queryOutageUserSpatialDistributionEquipment({
      ...buildSpatialDistributionPayload({ beginTime, endTime }),
      pageNum: SPACE_EQUIPMENT_PAGE_NUMBER,
      pageSize: SPACE_EQUIPMENT_TOP_PAGE_SIZE,
      returnTotalNum: 'true',
    })
    countyEquipmentListRows.value = mapCountyEquipmentListRows(response)
  } catch (error) {
    console.error(error)
    countyEquipmentListRows.value = []
  } finally {
    spaceDistributionDetailLoadingCount.value = Math.max(spaceDistributionDetailLoadingCount.value - 1, 0)
  }

  return countyEquipmentListRows.value
}

const SPACE_EQUIPMENT_PAGE_NUMBER = 1
const SPACE_EQUIPMENT_PAGE_SIZE = 10
const SPACE_EQUIPMENT_TOP_PAGE_SIZE = 1000

const mapCountyEquipmentPageResult = (response) => {
  let data =
    response?.data?.data ??
    response?.data?.result ??
    response?.result?.data ??
    response?.result ??
    response?.data ??
    response
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      data = {}
    }
  }
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.rows)
      ? data.rows
      : Array.isArray(data?.list)
        ? data.list
        : []

  return {
    total: Math.max(safeNumber(data?.totalNum ?? data?.total ?? list.length), 0),
    page: Math.max(safeNumber(data?.pageNum ?? data?.page), 1),
    perPage: Math.max(safeNumber(data?.pageSize ?? data?.perPage), SPACE_EQUIPMENT_PAGE_SIZE),
    list: list.map((item, index) => {
      const deviceNo = String(
        item?.equipmentId || item?.equipmentNo || item?.deviceNo || item?.device_id || '',
      ).trim() || '-'
      const equipmentId = String(item?.equipmentId || item?.equipment_id || deviceNo || '').trim() || '-'
      const equipmentType = String(item?.equipmentType || item?.equipment_type || item?.type || '').trim()
      const deviceName = String(item?.equipmentName || item?.deviceName || item?.name || '').trim() || '-'
      const importantUserCount = Math.max(safeNumber(item?.keyUsersCnt ?? item?.keyUsers), 0)
      const sensitiveUserCount = Math.max(safeNumber(item?.senUsersCnt ?? item?.sensitiveUsersCnt ?? item?.sensitiveUsers), 0)
      const totalUserCount = Math.max(safeNumber(item?.allUsersCnt), importantUserCount + sensitiveUserCount)

      return {
        key: String(item?.equipmentId || item?.id || `${deviceNo}-${deviceName}-${index}`),
        equipmentId,
        equipmentType,
        deviceNo,
        deviceName,
        importantUserCount,
        sensitiveUserCount,
        totalUserCount,
        outageEventCount: 0,
        importantUserList: [],
        sensitiveUserList: [],
      }
    }).sort((a, b) => {
      if (a.totalUserCount !== b.totalUserCount) {
        return b.totalUserCount - a.totalUserCount
      }
      if (a.importantUserCount !== b.importantUserCount) {
        return b.importantUserCount - a.importantUserCount
      }
      if (a.sensitiveUserCount !== b.sensitiveUserCount) {
        return b.sensitiveUserCount - a.sensitiveUserCount
      }
      return String(a.deviceName || '').localeCompare(String(b.deviceName || ''), 'zh-Hans-CN')
    }),
  }
}

const loadCountyEquipmentPageRows = async ({ beginTime, endTime, page = SPACE_EQUIPMENT_PAGE_NUMBER }) => {
  if (!beginTime || !endTime) {
    countyEquipmentPageRows.value = []
    countyEquipmentPageTotal.value = 0
    return countyEquipmentPageRows.value
  }

  spaceDistributionDetailLoadingCount.value += 1
  try {
    const response = await queryOutageUserSpatialDistributionEquipment({
      ...buildSpatialDistributionPayload({ beginTime, endTime }),
      pageNum: page,
      pageSize: SPACE_EQUIPMENT_PAGE_SIZE,
      returnTotalNum: 'true',
    })
    const result = mapCountyEquipmentPageResult(response)
    countyEquipmentPageRows.value = result.list
    countyEquipmentPageTotal.value = result.total
  } catch (error) {
    console.error(error)
    countyEquipmentPageRows.value = []
    countyEquipmentPageTotal.value = 0
  } finally {
    spaceDistributionDetailLoadingCount.value = Math.max(spaceDistributionDetailLoadingCount.value - 1, 0)
  }

  return countyEquipmentPageRows.value
}

const buildFaultLocationPayload = ({ beginTime, endTime, dimension }) => {
  const payload = {
    beginTime: formatBackendDate(beginTime),
    endTime: formatBackendDate(endTime),
    city_id: defaultTangshanCityId,
  }
  if (dimension) {
    payload.dimension = dimension
  }
  return payload
}

const buildOutageScopePayload = ({ beginTime, endTime }) => {
  return {
    beginTime: formatBackendDate(beginTime),
    endTime: formatBackendDate(endTime),
  }
}

const normalizeOutageNatureCode = (value) => {
  const plain = String(value || '').trim()
  const lowered = plain.toLowerCase()
  if (['planned', '01', '1'].includes(lowered) || plain.includes('计划')) {
    return 'planned'
  }
  if (['fault', '02', '2'].includes(lowered) || plain.includes('故障')) {
    return 'fault'
  }
  if (['other', '03', '3'].includes(lowered) || plain.includes('其他')) {
    return 'other'
  }
  return ''
}

const buildFaultLocationLinesPayload = ({
  beginTime,
  endTime,
  page = OUTAGE_DETAIL_DEFAULT_PAGE,
  perPage = OUTAGE_DETAIL_DEFAULT_PER_PAGE,
  includeKeyword = true,
  includeSelectedType = true,
} = {}) => {
  const payload = {
    pageNum: Math.max(OUTAGE_DETAIL_DEFAULT_PAGE, Math.round(safeNumber(page) || OUTAGE_DETAIL_DEFAULT_PAGE)),
    pageSize: Math.max(
      OUTAGE_DETAIL_MIN_PAGE_SIZE,
      Math.min(OUTAGE_DETAIL_REMOTE_MAX_PER_PAGE, Math.round(safeNumber(perPage) || OUTAGE_DETAIL_DEFAULT_PER_PAGE)),
    ),
    returnTotalNum: 'true',
  }

  const formattedBeginTime = formatBackendDate(beginTime)
  const formattedEndTime = formatBackendDate(endTime)
  if (formattedBeginTime) {
    payload.beginTime = formattedBeginTime
  }
  if (formattedEndTime) {
    payload.endTime = formattedEndTime
  }

  const keyword = String(outageDetailSearchKeyword.value || '').trim()
  if (includeKeyword && keyword) {
    payload.line_id = keyword
  }

  const outageTypeName = String(outageDetailSelectedNature.value || '').trim()
  if (includeSelectedType && outageTypeName) {
    payload.outage_type_name = outageTypeName
  }

  return payload
}

const buildOutageEventsPayload = ({ beginTime, endTime, page = OUTAGE_DETAIL_DEFAULT_PAGE, perPage = OUTAGE_DETAIL_DEFAULT_PER_PAGE }) => {
  const payload = {
    beginTime,
    endTime,
    page: Math.max(OUTAGE_DETAIL_DEFAULT_PAGE, Math.round(safeNumber(page))),
    perPage: Math.max(
      OUTAGE_DETAIL_MIN_PAGE_SIZE,
      Math.min(OUTAGE_DETAIL_REMOTE_MAX_PER_PAGE, Math.round(safeNumber(perPage) || OUTAGE_DETAIL_DEFAULT_PER_PAGE)),
    ),
  }

  appendCountyOrCityScope(payload)

  const keyword = String(outageDetailSearchKeyword.value || '').trim()
  if (keyword) {
    payload.keyword = keyword
  }

  const outageNatureCode = normalizeOutageNatureCode(outageDetailSelectedNature.value)
  if (outageNatureCode) {
    payload.outageNature = outageNatureCode
  }

  return payload
}

const resolveOutageEventsResponseData = (response) => {
  const data = response?.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null
  }
  if (data.outageEvents && typeof data.outageEvents === 'object' && !Array.isArray(data.outageEvents)) {
    return data.outageEvents
  }
  return data
}

const normalizeOutageEventsSummary = (summary, fallbackTotal = 0) => {
  const data = summary && typeof summary === 'object' && !Array.isArray(summary) ? summary : {}
  const totalEvents = Math.max(safeNumber(data.totalEvents), Math.max(0, safeNumber(fallbackTotal)))
  const natureRatioList = Array.isArray(data.natureRatio) ? data.natureRatio : []
  const normalizedNatureRatio = natureRatioList.map((item) => ({
    name: String(item?.name || '').trim(),
    code: normalizeOutageNatureCode(item?.code || item?.name || item?.outageNature),
    value: Math.max(safeNumber(item?.value), 0),
    percent: Math.max(safeNumber(item?.percent), 0),
  }))

  const restoredEvents = Math.max(safeNumber(data.restoredEvents), 0)
  const unrestoredEvents = Math.max(safeNumber(data.unrestoredEvents), Math.max(totalEvents - restoredEvents, 0))
  const restoredRate = Number.isFinite(Number(data.restoredRate))
    ? Number(Number(data.restoredRate).toFixed(2))
    : totalEvents > 0
      ? Number(((restoredEvents / totalEvents) * 100).toFixed(2))
      : 0

  return {
    totalEvents,
    natureRatio: normalizedNatureRatio,
    restoredEvents,
    unrestoredEvents,
    restoredRate,
  }
}

const resolveOutageEventsSummaryResponseData = (response) => {
  const data = response?.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null
  }
  if (data.outageEventsSummary && typeof data.outageEventsSummary === 'object' && !Array.isArray(data.outageEventsSummary)) {
    return data.outageEventsSummary
  }
  return data
}

const resolveOutageEventDetailResponseData = (response) => {
  const data = response?.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null
  }
  if (data.outageEventDetail && typeof data.outageEventDetail === 'object' && !Array.isArray(data.outageEventDetail)) {
    return data.outageEventDetail
  }
  return data
}

const toDisplayText = (value, fallback = '-') => {
  const text = String(value ?? '').trim()
  return text || fallback
}

const joinNameList = (value) => {
  if (!Array.isArray(value)) {
    return ''
  }
  return value
    .map((item) => String(item ?? '').trim())
    .filter((item) => item !== '')
    .join('、')
}

const getOutageAffectedConsCount = (record, fallbackCount = 0) => {
  const directCount = readFieldValue(record, [
    'affectedUsers',
    'affected_users',
    'affectedConsCnt',
    'affected_cons_cnt',
  ])

  if (directCount !== undefined && directCount !== null && String(directCount).trim() !== '') {
    return Math.max(safeNumber(directCount), 0)
  }

  const importantUserCount = safeNumber(
    readFieldValue(record, ['importantUserCount', 'important_user_count', 'keyUserCount', 'key_user_count', 'keyUsers']),
  )
  const sensitiveUserCount = safeNumber(
    readFieldValue(record, ['sensitiveUserCount', 'sensitive_user_count', 'sensitiveUsers']),
  )
  const normalUserCount = safeNumber(readFieldValue(record, ['normalUserCount', 'normal_user_count', 'normalUsers']))
  const totalUserCount = importantUserCount + sensitiveUserCount + normalUserCount

  if (totalUserCount > 0) {
    return totalUserCount
  }

  return Math.max(safeNumber(fallbackCount), 0)
}

const mapOutageEventDetailForModal = (detailData, fallbackItem = null) => {
  const record = normalizeUserRecord(detailData)
  const fallback = fallbackItem && typeof fallbackItem === 'object' ? fallbackItem : {}
  const outageNumber = toDisplayText(
    readFieldValue(record, ['outageNumber', 'outage_number', 'eventNo', 'event_no', 'id']) || fallback?.outageNumber,
  )
  const beginTime = toDisplayText(
    readFieldValue(record, ['beginTime', 'begin_time', 'outageBeginTime', 'outage_begin_time']) || fallback?.beginTime,
  )
  const endTimeRaw = String(
    readFieldValue(record, ['endTime', 'end_time', 'outageEndTime', 'outage_end_time', 'restoreTime', 'restore_time']) || fallback?.endTime || '',
  ).trim()
  const hasEndTime = endTimeRaw !== '' && endTimeRaw !== '-' && endTimeRaw.toLowerCase() !== 'null'
  const restored = toBooleanFlag(readFieldValue(record, ['isRestored', 'restored'])) || hasEndTime
  const feederNamesText =
    joinNameList(readFieldValue(record, ['feederNames'])) ||
    toDisplayText(
      readFieldValue(record, ['rdtFeederName', 'rdt_feeder_name', 'feederName', 'feeder_name']) || fallback?.rdtFeederName,
    )
  const equipmentNamesText =
    joinNameList(readFieldValue(record, ['equipmentNames'])) ||
    toDisplayText(
      readFieldValue(record, ['faultEquipName', 'fault_equip_name', 'equipmentName', 'equipment_name']) || fallback?.faultEquipName,
    )

  return {
    ...fallback,
    ...record,
    id: toDisplayText(readFieldValue(record, ['id']) || fallback?.id || outageNumber),
    outageNumber,
    beginTime,
    status: restored ? '已复电' : '抢修中',
    endTime: hasEndTime ? endTimeRaw : '-',
    maintGroupName: toDisplayText(readFieldValue(record, ['maintGroupName', 'maint_group_name']) || fallback?.maintGroupName),
    countyName: toDisplayText(readFieldValue(record, ['countyName', 'county_name']) || fallback?.countyName),
    affectedConsCnt: getOutageAffectedConsCount(record, fallback?.affectedConsCnt),
    rdtFeederName: feederNamesText,
    rdtSubsName: toDisplayText(
      readFieldValue(record, ['substationName', 'substation_name', 'rdtSubsName', 'rdt_subs_name']) || fallback?.rdtSubsName,
    ),
    faultEquipName: equipmentNamesText,
    outageReason: toDisplayText(readFieldValue(record, ['outageReason', 'outage_reason']) || fallback?.outageReason),
    outageNature: outageNatureText(
      readFieldValue(record, ['outageNature', 'outage_nature']) || fallback?.outageNature,
    ),
  }
}

const buildOutageEventsSummaryPayload = ({ beginTime, endTime }) => {
  const payload = {
    beginTime,
    endTime,
  }

  appendCountyOrCityScope(payload)

  const keyword = String(outageDetailSearchKeyword.value || '').trim()
  if (keyword) {
    payload.keyword = keyword
  }

  const outageNatureCode = normalizeOutageNatureCode(outageDetailSelectedNature.value)
  if (outageNatureCode) {
    payload.outageNature = outageNatureCode
  }

  return payload
}

const loadRightPanelOutageEventsSummary = async ({ beginTime, endTime } = {}) => {
  if (!showOutageDetailPage.value) {
    return null
  }

  if (!beginTime || !endTime) {
    outageEventsSummaryData.value = null
    return null
  }

  const payload = buildOutageEventsSummaryPayload({ beginTime, endTime })
  const requestId = ++outageEventsSummaryRequestId

  outageEventsSummaryLoadingCount.value += 1
  try {
    const response = await queryRightPanelOutageEventsSummary(payload)
    if (requestId !== outageEventsSummaryRequestId) {
      return null
    }

    const remoteData = resolveOutageEventsSummaryResponseData(response) || {}
    outageEventsSummaryData.value = normalizeOutageEventsSummary(remoteData, 0)
    return outageEventsSummaryData.value
  } catch (error) {
    if (requestId !== outageEventsSummaryRequestId) {
      return null
    }
    console.error(error)
    outageEventsSummaryData.value = null
    return null
  } finally {
    outageEventsSummaryLoadingCount.value = Math.max(outageEventsSummaryLoadingCount.value - 1, 0)
  }
}

const mapFaultLocationEventTypes = (response) => {
  let data =
    response?.data?.data ??
    response?.data?.result ??
    response?.result?.data ??
    response?.result ??
    response?.data ??
    response
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      data = []
    }
  }
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.rows)
      ? data.rows
      : Array.isArray(data?.list)
        ? data.list
        : []

  return rows
    .map((item, index) => {
      const name = String(
        readFieldValue(item, ['real_time_event_type_name', 'realTimeEventTypeName', 'eventTypeName', 'name']),
      ).trim() || `事件类型${index + 1}`
      const count = Math.max(
        safeNumber(readFieldValue(item, ['real_time_event_num', 'realTimeEventNum', 'eventNum', 'count'])),
        0,
      )
      return {
        id: String(readFieldValue(item, ['real_time_event_type_id', 'realTimeEventTypeId', 'eventTypeId', 'id']) || name),
        name,
        count,
      }
    })
    .filter((item) => item.name)
}

const loadFaultLocationEventTypes = async ({ beginTime, endTime } = {}) => {
  if (!showOutageDetailPage.value) {
    return []
  }

  const requestId = ++faultLocationEventTypesRequestId
  faultLocationEventTypesLoadingCount.value += 1

  try {
    const response = await queryOutageUserFaultLocationEventTypes({
      beginTime: formatBackendDate(beginTime),
      endTime: formatBackendDate(endTime),
    })
    if (requestId !== faultLocationEventTypesRequestId) {
      return []
    }
    faultLocationEventTypesData.value = mapFaultLocationEventTypes(response)
    return faultLocationEventTypesData.value
  } catch (error) {
    if (requestId !== faultLocationEventTypesRequestId) {
      return []
    }
    console.error(error)
    faultLocationEventTypesData.value = []
    return []
  } finally {
    if (requestId === faultLocationEventTypesRequestId) {
      faultLocationEventTypesLoadingCount.value = Math.max(faultLocationEventTypesLoadingCount.value - 1, 0)
    }
  }
}

const resolveFaultLocationLinesResponseData = (response) => {
  let data =
    response?.data?.data ??
    response?.data?.result ??
    response?.result?.data ??
    response?.result ??
    response?.data ??
    response

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return null
    }
  }

  if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    data = data.data
  }

  if (!data || typeof data !== 'object') {
    return null
  }

  return data
}

const getFaultLocationLineRows = (data) => {
  if (Array.isArray(data)) {
    return data
  }
  if (Array.isArray(data?.rows)) {
    return data.rows
  }
  if (Array.isArray(data?.list)) {
    return data.list
  }
  return []
}

const resolveFaultLocationLineDetailRecord = (response) => {
  let data =
    response?.data?.data ??
    response?.data?.result ??
    response?.result?.data ??
    response?.result ??
    response?.data ??
    response

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return {}
    }
  }

  if (Array.isArray(data)) {
    return data[0] && typeof data[0] === 'object' ? data[0] : {}
  }

  if (!data || typeof data !== 'object') {
    return {}
  }

  const rows = Array.isArray(data.rows)
    ? data.rows
    : Array.isArray(data.list)
      ? data.list
      : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.result)
          ? data.result
          : []

  if (rows.length > 0) {
    return rows[0] && typeof rows[0] === 'object' ? rows[0] : {}
  }

  return data
}

const mapFaultLocationLineDetailForModal = (response) => {
  const record = resolveFaultLocationLineDetailRecord(response)

  return {
    lineId: toDisplayText(readFieldValue(record, ['line_id', 'lineId'])),
    lineName: toDisplayText(readFieldValue(record, ['line_name', 'lineName'])),
    outageReason: toDisplayText(readFieldValue(record, ['outage_reason', 'outageReason'])),
    outageTime: toDisplayText(readFieldValue(record, ['outage_time', 'outageTime'])),
    outageTypeName: toDisplayText(readFieldValue(record, ['outage_type_name', 'outageTypeName'])),
    subsName: toDisplayText(readFieldValue(record, ['subs_name', 'subsName'])),
    transTime: toDisplayText(readFieldValue(record, ['trans_time', 'transTime'])),
  }
}

const extractFaultLocationLineTypeNames = (rows = []) => {
  const names = []
  const seen = new Set()

  rows.forEach((item) => {
    const name = String(readFieldValue(item, ['outage_type_name', 'outageTypeName']) || '').trim()
    if (!name || seen.has(name)) {
      return
    }
    seen.add(name)
    names.push(name)
  })

  return names
}

const setFaultLocationLineTypeOptionsFromRows = (rows = [], { replace = false } = {}) => {
  const next = replace ? [] : [...faultLocationLineTypeOptions.value]
  const seen = new Set(next)

  extractFaultLocationLineTypeNames(rows).forEach((name) => {
    if (seen.has(name)) {
      return
    }
    seen.add(name)
    next.push(name)
  })

  faultLocationLineTypeOptions.value = next
}

const loadFaultLocationLineTypeOptions = async () => {
  if (!showOutageDetailPage.value) {
    return []
  }

  faultLocationLineTypesRequestId += 1
  return faultLocationLineTypeOptions.value
}

const mapOutageDetailRow = (item, index, page, perPage) => {
  const lineId = String(readFieldValue(item, ['line_id', 'lineId']) || '').trim()
  if (lineId) {
    const lineName = String(readFieldValue(item, ['line_name', 'lineName']) || '-').trim() || '-'
    const outageTypeName = String(readFieldValue(item, ['outage_type_name', 'outageTypeName']) || '-').trim() || '-'
    const subsName = String(readFieldValue(item, ['subs_name', 'subsName', 'rdtSubsName', 'rdt_subs_name']) || '-').trim() || '-'
    const rowIndex = (Math.max(page, 1) - 1) * Math.max(perPage, 1) + index

    return {
      ...item,
      id: `${lineId}-${rowIndex}`,
      lineId,
      lineName,
      outageNature: outageTypeName,
      subsName,
      outageNumber: lineId,
      countyName: lineName,
      affectedConsCnt: outageTypeName,
      beginTime: '-',
      status: '-',
      endTime: '-',
      rdtFeederId: lineId,
      rdtFeederName: lineName,
      rdtSubsName: subsName,
      outageReason: '-',
    }
  }

  const outageNumber = String(item?.outageNumber || item?.outage_number || item?.eventNo || '').trim() || '-'
  const countyName = toCountyDisplayName(
    readFieldValue(item, ['countyName', 'county_name', 'rdtCountyName', 'rdt_county_name']) || '-',
  ) || '-'
  const affectedConsCnt = getOutageAffectedConsCount(item)
  const outageNatureCode = item?.outageNature || item?.outage_nature || item?.code || ''
  const beginTime = String(item?.beginTime || item?.begin_time || '-').trim() || '-'
  const endTimeRaw = String(item?.endTime || item?.end_time || '').trim()
  const hasEndTime = endTimeRaw !== '' && endTimeRaw !== '-' && endTimeRaw.toLowerCase() !== 'null'
  const restoredByFlag = toBooleanFlag(item?.isRestored ?? item?.restored)
  const restored = restoredByFlag || hasEndTime
  const rowIndex = (Math.max(page, 1) - 1) * Math.max(perPage, 1) + index

  return {
    ...item,
    id: String(item?.id || `${outageNumber}-${rowIndex}`),
    outageNumber,
    countyName,
    affectedConsCnt,
    outageNature: outageNatureText(outageNatureCode),
    beginTime,
    status: restored ? '已复电' : '抢修中',
    endTime: hasEndTime ? endTimeRaw : '-',
    maintGroupName: String(item?.maintGroupName || item?.maint_group_name || '-').trim() || '-',
    equipmentId: String(item?.equipmentId || item?.equipment_id || item?.faultEquipId || item?.fault_equip_id || '').trim(),
    rdtSubsId: String(item?.rdtSubsId || item?.rdt_subs_id || item?.substationId || item?.substation_id || '').trim(),
    rdtFeederId: String(item?.rdtFeederId || item?.rdt_feeder_id || item?.feederId || item?.feeder_id || '').trim(),
    rdtFeederName: String(item?.rdtFeederName || item?.rdt_feeder_name || item?.feederName || item?.feeder_name || '-').trim() || '-',
    rdtFeederDevType: String(
      item?.rdtFeederDevType || item?.rdt_feeder_dev_type || item?.rdtFeederType || item?.rdt_feeder_type || item?.devType || item?.dev_type || '',
    ).trim(),
    rdtSubsName: String(item?.rdtSubsName || item?.rdt_subs_name || item?.substationName || item?.substation_name || '-').trim() || '-',
    faultEquipName: String(item?.faultEquipName || item?.fault_equip_name || item?.equipmentName || item?.equipment_name || '-').trim() || '-',
    outageReason: String(item?.outageReason || item?.outage_reason || '-').trim() || '-',
  }
}

const closeCountyWarningPopup = () => {
  countyWarningPopupVisible.value = false
  countyWarningPopupCounty.value = ''
  countyWarningPopupEvents.value = []
  countyWarningPopupLoading.value = false
  countyWarningPopupError.value = ''
  countyWarningPopupSelectedItem.value = null
  countyWarningPopupCurrentPage.value = 1
  countyWarningPopupTotal.value = 0
  countyWarningPopupRequestId += 1
}

const mapCountyWarningPopupDetailBars = (response) => {
  const rawData =
    response?.data?.data ??
    response?.data?.result ??
    response?.result?.data ??
    response?.result ??
    response?.data ??
    response
  const data = Array.isArray(rawData)
    ? rawData[0] || {}
    : rawData && typeof rawData === 'object'
      ? rawData
      : {}

  return [
    {
      key: 'key',
      label: '重点人数',
      count: Math.max(safeNumber(readFieldValue(data, ['key_users_cnt', 'keyUsersCnt'])), 0),
    },
    {
      key: 'sensitive',
      label: '敏感人数',
      count: Math.max(safeNumber(readFieldValue(data, ['sen_users_cnt', 'senUsersCnt'])), 0),
    },
    {
      key: 'total',
      label: '总人数',
      count: Math.max(safeNumber(readFieldValue(data, ['all_users_cnt', 'allUsersCnt'])), 0),
    },
  ]
}

const loadCountyWarningPopupPage = async ({ selectedItem, beginTime, endTime, page = 1 }) => {
  const requestId = ++countyWarningPopupRequestId
  void page

  countyWarningPopupLoading.value = true
  countyWarningPopupError.value = ''

  try {
    const payload = {
      county_id: getCountyWarningPopupCountyId(selectedItem),
      beginTime: formatBackendDate(beginTime),
      endTime: formatBackendDate(endTime),
    }
    const response = await queryOutageUserRegionWarningLightsDetail(payload)
    if (requestId !== countyWarningPopupRequestId) {
      return
    }

    countyWarningPopupCurrentPage.value = 1
    countyWarningPopupTotal.value = 3
    countyWarningPopupEvents.value = mapCountyWarningPopupDetailBars(response)
  } catch (error) {
    if (requestId !== countyWarningPopupRequestId) {
      return
    }
    console.error(error)
    countyWarningPopupEvents.value = []
    countyWarningPopupTotal.value = 0
    countyWarningPopupError.value = '区域警示灯详情加载失败，请稍后重试。'
  } finally {
    if (requestId === countyWarningPopupRequestId) {
      countyWarningPopupLoading.value = false
    }
  }
}

const openCountyWarningPopup = (item) => {
  const selectedItem = item && typeof item === 'object' ? item : {}
  const countyName = toCountyDisplayName(selectedItem.countyName || selectedItem.name || '供电单位')
  const beginTime = toBackendDateTime(queryStartTime.value)
  const endTime = toBackendDateTime(queryEndTime.value)
  const countyId = getCountyWarningPopupCountyId(selectedItem)

  countyWarningPopupVisible.value = true
  countyWarningPopupCounty.value = countyName
  countyWarningPopupEvents.value = []
  countyWarningPopupLoading.value = false
  countyWarningPopupError.value = ''
  countyWarningPopupSelectedItem.value = { ...selectedItem, countyId }
  countyWarningPopupCurrentPage.value = 1
  countyWarningPopupTotal.value = 0

  if (!countyId) {
    countyWarningPopupError.value = '当前警示灯缺少区县ID，无法查询详情。'
    return
  }

  void loadCountyWarningPopupPage({
    selectedItem: countyWarningPopupSelectedItem.value,
    beginTime,
    endTime,
    page: 1,
  })
}

const goCountyWarningPopupPage = (page) => {
  const targetPage = Math.max(1, Math.round(safeNumber(page) || 1))
  if (!countyWarningPopupVisible.value || !countyWarningPopupSelectedItem.value) {
    return
  }
  if (targetPage === countyWarningPopupCurrentPage.value) {
    return
  }

  void loadCountyWarningPopupPage({
    selectedItem: countyWarningPopupSelectedItem.value,
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
    page: targetPage,
  })
}

const loadRightPanelOutageEvents = async ({
  beginTime,
  endTime,
  page = outageDetailCurrentPage.value,
  perPage = outageDetailRowsPerPage.value,
} = {}) => {
  if (!showOutageDetailPage.value) {
    return null
  }

  if (!beginTime || !endTime) {
    outageDetailRows.value = []
    outageDetailTotal.value = 0
    outageDetailLoading.value = false
    return null
  }

  const payload = buildFaultLocationLinesPayload({ beginTime, endTime, page, perPage })
  const requestId = ++outageDetailListRequestId
  outageDetailLoading.value = true

  try {
    const response = await queryOutageUserFaultLocationLines(payload)
    if (requestId !== outageDetailListRequestId) {
      return null
    }

    const remoteData = resolveFaultLocationLinesResponseData(response) || {}
    const remoteList = getFaultLocationLineRows(remoteData)
    const resolvedPage = Math.max(
      OUTAGE_DETAIL_DEFAULT_PAGE,
      Math.round(safeNumber(remoteData.pageNum ?? remoteData.page_num ?? remoteData.page) || payload.pageNum),
    )
    const resolvedPerPage = payload.pageSize
    const resolvedTotal = Math.max(
      safeNumber(remoteData.totalNum ?? remoteData.total_num ?? remoteData.total),
      remoteList.length,
    )

    outageDetailCurrentPage.value = resolvedPage
    outageDetailRowsPerPage.value = resolvedPerPage
    outageDetailTotal.value = resolvedTotal
    outageDetailRows.value = remoteList.map((item, index) => mapOutageDetailRow(item, index, resolvedPage, resolvedPerPage))
    setFaultLocationLineTypeOptionsFromRows(remoteList)

    return {
      total: outageDetailTotal.value,
      page: outageDetailCurrentPage.value,
      perPage: outageDetailRowsPerPage.value,
      list: outageDetailRows.value,
    }
  } catch (error) {
    if (requestId !== outageDetailListRequestId) {
      return null
    }

    console.error(error)
    outageDetailRows.value = []
    outageDetailTotal.value = 0
    return null
  } finally {
    if (requestId === outageDetailListRequestId) {
      outageDetailLoading.value = false
    }
  }
}

const normalizeFaultLocationModeSummary = (rawModeData, modeKey, label) => {
  const data =
    rawModeData && typeof rawModeData === 'object' && !Array.isArray(rawModeData)
      ? rawModeData
      : {}
  const danger = Math.max(safeNumber(data?.danger ?? data?.red ?? data?.highImpact?.count ?? data?.highImpact), 0)
  const warning = Math.max(
    safeNumber(data?.warning ?? data?.yellow ?? data?.mediumImpact?.count ?? data?.mediumImpact),
    0,
  )
  const safe = Math.max(safeNumber(data?.safe ?? data?.green ?? data?.lowImpact?.count ?? data?.lowImpact), 0)
  const barsTotal = danger + warning + safe
  const total = Math.max(safeNumber(data?.total ?? data?.count), barsTotal)
  const matchedEvents = Math.max(safeNumber(data?.matchedEvents), 0)

  return {
    key: modeKey,
    label,
    total,
    matchedEvents,
    bars: [
      { key: 'danger', colorLabel: '红色', count: danger },
      { key: 'warning', colorLabel: '黄色', count: warning },
      { key: 'safe', colorLabel: '绿色', count: safe },
    ],
  }
}

const resolveFaultLocationResponseData = (response) => {
  let data = response?.data
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return null
    }
  }
  if (Array.isArray(data)) {
    data = data.find((item) => item && typeof item === 'object' && !Array.isArray(item)) || null
  }
  if (!data || typeof data !== 'object') {
    return null
  }
  if (data.faultLocation && typeof data.faultLocation === 'object' && !Array.isArray(data.faultLocation)) {
    return data.faultLocation
  }
  return data
}

const resolveOutageScopeResponseData = (response) => {
  let data = response?.data
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return null
    }
  }
  if (Array.isArray(data)) {
    data = data.find((item) => item && typeof item === 'object' && !Array.isArray(item)) || null
  }
  if (!data || typeof data !== 'object') {
    return null
  }
  if (data.outageScope && typeof data.outageScope === 'object' && !Array.isArray(data.outageScope)) {
    return data.outageScope
  }
  return data
}

const loadRightPanelFaultLocationSummary = async ({ beginTime, endTime, dimension = 'feeder' }) => {
  if (!beginTime || !endTime) {
    faultSummaryData.value = null
    return null
  }

  const modeKey = dimension === 'substation' ? 'substation' : 'feeder'
  const label = modeKey === 'substation' ? '变电站' : '线路'
  const payload = buildFaultLocationPayload({ beginTime, endTime, dimension: modeKey })
  if (modeKey === 'feeder') {
    faultSummaryData.value = null
  }

  faultLocationLoadingCount.value += 1
  try {
    const response = await queryOutageUserFaultLocation(payload)
    const remoteData = resolveFaultLocationResponseData(response) || {}
    const modeSummary = normalizeFaultLocationModeSummary(remoteData, modeKey, label)
    const currentModes = faultSummaryData.value?.modes && typeof faultSummaryData.value.modes === 'object'
      ? faultSummaryData.value.modes
      : {}

    faultSummaryData.value = {
      ...(faultSummaryData.value || {}),
      modes: {
        ...currentModes,
        [modeKey]: modeSummary,
      },
    }
    return modeSummary
  } catch (error) {
    console.error(error)
    if (modeKey === 'feeder') {
      faultSummaryData.value = null
    }
    return null
  } finally {
    faultLocationLoadingCount.value = Math.max(faultLocationLoadingCount.value - 1, 0)
  }
}

const loadRightPanelOutageScopeSummary = async ({ beginTime, endTime }) => {
  if (!beginTime || !endTime) {
    outageScopeSummaryData.value = null
    return null
  }

  outageScopeSummaryLoadingCount.value += 1
  try {
    const response = await queryOutageUserOutageScopeAssessment(buildOutageScopePayload({ beginTime, endTime }))
    const remoteData = resolveOutageScopeResponseData(response)
    outageScopeSummaryData.value = remoteData
    return remoteData
  } catch (error) {
    console.error(error)
    outageScopeSummaryData.value = null
    return null
  } finally {
    outageScopeSummaryLoadingCount.value = Math.max(outageScopeSummaryLoadingCount.value - 1, 0)
  }
}

const buildOutageScopeDetailPayload = ({ beginTime, endTime, page = 1, perPage = OUTAGE_CHAINS_REMOTE_PAGE_SIZE }) => ({
  beginTime: formatBackendDate(beginTime),
  endTime: formatBackendDate(endTime),
  pageNum: Math.max(1, Math.round(safeNumber(page) || 1)),
  pageSize: Math.max(1, Math.min(500, Math.round(safeNumber(perPage) || OUTAGE_CHAINS_REMOTE_PAGE_SIZE))),
  returnTotalNum: 'true',
})

const resolveOutageScopeDetailResponseData = (response) => {
  let data =
    response?.data?.data ??
    response?.data?.result ??
    response?.result?.data ??
    response?.result ??
    response?.data ??
    response

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return null
    }
  }

  if (Array.isArray(data)) {
    return {
      page: 1,
      total: data.length,
      list: data,
    }
  }

  if (!data || typeof data !== 'object') {
    return null
  }

  const list = Array.isArray(data.list)
    ? data.list
    : Array.isArray(data.rows)
      ? data.rows
      : Array.isArray(data.records)
        ? data.records
        : []

  return {
    page: data.pageNum ?? data.page_num ?? data.page ?? 1,
    total: data.totalNum ?? data.total_num ?? data.total ?? data.count ?? list.length,
    list,
  }
}

const mapOutageRangeChainRow = (item, index = 0) => {
  const toNameList = (list) => {
    if (!Array.isArray(list)) {
      return []
    }
    return list
      .map((name) => String(name || '').trim())
      .filter((name) => name !== '')
  }

  const importantUsers = toNameList(item?.importantUsers)
  const sensitiveUsers = toNameList(item?.sensitiveUsers)
  const lineId = String(readFieldValue(item, ['line_id', 'lineId']) || '').trim()
  const lineName = String(readFieldValue(item, ['line_name', 'lineName']) || '').trim()
  const outageScope = String(readFieldValue(item, ['outage_scope', 'outageScope']) || '').trim()
  const outageNumber = String(item?.outageNumber || item?.outage_number || lineId || '').trim() || '-'
  const rdtFeederId = String(item?.feederId || item?.rdtFeederId || item?.rdt_feeder_id || item?.feeder_id || lineId || '').trim()
  const rdtSubsId = String(item?.substationId || item?.rdtSubsId || item?.rdt_subs_id || item?.substation_id || '').trim()
  const rdtFeederName = String(item?.feederName || item?.rdtFeederName || item?.rdt_feeder_name || lineId || '-').trim() || '-'
  const rdtSubsName = String(item?.substationName || item?.rdtSubsName || item?.rdt_subs_name || '-').trim() || '-'
  const maintGroupName = String(item?.maintGroupName || item?.maint_group_name || '-').trim() || '-'
  const normalUserCount = Math.max(safeNumber(item?.normalUserCount), 0)
  const key = `${outageNumber}-${rdtFeederName}-${index}`

  return {
    key,
    outageNumber,
    lineName,
    rdtFeederId,
    rdtSubsId,
    rdtFeederName,
    rdtSubsName,
    maintGroupName,
    importantUsers,
    sensitiveUsers,
    importantUserText: outageScope || (importantUsers.length > 0 ? importantUsers.join('、') : '无'),
    sensitiveUserText: sensitiveUsers.length > 0 ? sensitiveUsers.join('、') : '无',
    normalUserCount,
  }
}

const getCountyWarningPopupCountyId = (selectedItem) => {
  const directCountyId = String(
    selectedItem?.countyId ||
      selectedItem?.county_id ||
      selectedItem?.rdtCountyId ||
      selectedItem?.rdt_county_id ||
      '',
  ).trim()
  if (directCountyId) {
    return directCountyId
  }

  const countyName = normalizeCountyName(selectedItem?.countyName || selectedItem?.name || '')
  const matchedCounty = countyList.value.find((item) => normalizeCountyName(item.countyName) === countyName)
  return String(matchedCounty?.countyId || '').trim()
}

const buildCountyWarningPopupChainsPayload = ({ selectedItem, beginTime, endTime, page }) => ({
  beginTime,
  endTime,
  countyId: getCountyWarningPopupCountyId(selectedItem),
  page: Math.max(1, Math.round(safeNumber(page) || 1)),
  perPage: COUNTY_WARNING_POPUP_CHAIN_PAGE_SIZE,
})

const getCountyWarningPopupUserCount = (item, countKeys, listKeys = []) => {
  for (const listKey of listKeys) {
    const value = item?.[listKey]
    if (Array.isArray(value)) {
      return value.length
    }
  }

  for (const countKey of countKeys) {
    const value = readFieldValue(item, [countKey])
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return Math.max(safeNumber(value), 0)
    }
  }

  return 0
}

const getCountyWarningPopupChainTimeValue = (item) => {
  const date =
    parseBackendDateTime(
      readFieldValue(item, [
        'beginTime',
        'begin_time',
        'outageBeginTime',
        'outage_begin_time',
        'startTime',
        'start_time',
        'outageTime',
        'outage_time',
        'occurTime',
        'occur_time',
      ]),
    ) ||
    parseBackendDateTime(
      readFieldValue(item, [
        'endTime',
        'end_time',
        'outageEndTime',
        'outage_end_time',
        'restoreTime',
        'restore_time',
      ]),
    )
  return date ? date.getTime() : 0
}

const getCountyWarningPopupChainKey = (item, index = 0) => {
  const outageNumber = String(readFieldValue(item, ['outageNumber', 'outage_number', 'eventNo', 'event_no']) || '').trim()
  if (outageNumber) {
    return outageNumber
  }

  return [
    readFieldValue(item, ['beginTime', 'begin_time']) || '',
    readFieldValue(item, ['feederId', 'feeder_id', 'rdtFeederId', 'rdt_feeder_id']) || '',
    readFieldValue(item, ['substationId', 'substation_id', 'rdtSubsId', 'rdt_subs_id']) || '',
    index,
  ].join('|')
}

const mapCountyWarningPopupChainEvent = (item, index = 0) => {
  const importantUserCount = getCountyWarningPopupUserCount(
    item,
    ['importantUserCount', 'important_user_count', 'keyUserCount', 'key_user_count', 'keyUsers'],
    ['importantUsers'],
  )
  const sensitiveUserCount = getCountyWarningPopupUserCount(
    item,
    ['sensitiveUserCount', 'sensitive_user_count', 'sensitiveUsers'],
    ['sensitiveUsers'],
  )
  const normalUserCount = getCountyWarningPopupUserCount(item, [
    'normalUserCount',
    'normal_user_count',
    'normalUsers',
  ])

  return {
    id: getCountyWarningPopupChainKey(item, index),
    outageNumber: String(readFieldValue(item, ['outageNumber', 'outage_number', 'eventNo', 'event_no']) || '-').trim() || '-',
    importantUserCount,
    sensitiveUserCount,
    normalUserCount,
    affectedConsCnt: importantUserCount + sensitiveUserCount + normalUserCount,
    sortTime: getCountyWarningPopupChainTimeValue(item),
  }
}

const loadRightPanelOutageChains = async ({ beginTime, endTime, page = outageRangeChainsCurrentPage.value } = {}) => {
  if (!showOutageRangeAssessmentPage.value) {
    return null
  }

  if (!beginTime || !endTime) {
    outageRangeChainsData.value = []
    outageRangeChainsTotal.value = 0
    outageRangeChainsLoading.value = false
    return null
  }

  const requestId = ++outageRangeChainsRequestId
  outageRangeChainsLoading.value = true

  try {
    const payload = buildOutageScopeDetailPayload({
      beginTime,
      endTime,
      page,
      perPage: OUTAGE_CHAINS_REMOTE_PAGE_SIZE,
    })
    const response = await queryOutageUserOutageScopeAssessmentDetail(payload)

    if (requestId !== outageRangeChainsRequestId) {
      return null
    }

    const remoteData = resolveOutageScopeDetailResponseData(response) || {}
    const resolvedPage = Math.max(1, Math.round(safeNumber(remoteData.page) || payload.pageNum))
    const list = Array.isArray(remoteData.list) ? remoteData.list : []
    const total = Math.max(safeNumber(remoteData.total), list.length)

    outageRangeChainsCurrentPage.value = resolvedPage
    outageRangeChainsTotal.value = total
    outageRangeChainsData.value = list.map((item, index) =>
      mapOutageRangeChainRow(item, (resolvedPage - 1) * OUTAGE_CHAINS_REMOTE_PAGE_SIZE + index),
    )
    return outageRangeChainsData.value
  } catch (error) {
    if (requestId !== outageRangeChainsRequestId) {
      return null
    }
    console.error(error)
    outageRangeChainsData.value = []
    outageRangeChainsTotal.value = 0
    return null
  } finally {
    if (requestId === outageRangeChainsRequestId) {
      outageRangeChainsLoading.value = false
    }
  }
}

const handleOpenTimeTrendDetailPage = () => {
  void loadCountyOutageFreqData({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
  })
}

const handleFaultLocationModeChange = (modeKey) => {
  outageDetailDimension.value = modeKey === 'substation' ? 'substation' : 'feeder'

  if (modeKey !== 'substation') {
    return
  }

  const existingSubstationMode = faultSummaryData.value?.modes?.substation
  if (existingSubstationMode && typeof existingSubstationMode === 'object') {
    return
  }

  const beginTime = toBackendDateTime(queryStartTime.value)
  const endTime = toBackendDateTime(queryEndTime.value)
  if (!beginTime || !endTime) {
    return
  }

  void loadRightPanelFaultLocationSummary({
    beginTime,
    endTime,
    dimension: 'substation',
  })
}

const loadDashboardData = async (customRange = null, options = {}) => {
  const includeDetailPages = options.includeDetailPages !== false
  loading.value = true
  dataError.value = ''
  dataNotice.value = ''
  tagStatsOverview.value = null
  countyStatsRows.value = []
  spatialDistributionRows.value = []
  countyEquipmentStatsSummary.value = null
  countyEquipmentListRows.value = []
  countyEquipmentPageRows.value = []
  countyEquipmentPageTotal.value = 0
  faultSummaryData.value = null
  outageScopeSummaryData.value = null
  countyWarningLightsData.value = []
  countyWarningPopupVisible.value = false
  countyWarningPopupCounty.value = ''
  countyWarningPopupEvents.value = []
  countyWarningPopupLoading.value = false
  countyWarningPopupError.value = ''
  countyWarningPopupSelectedItem.value = null
  countyWarningPopupCurrentPage.value = 1
  countyWarningPopupTotal.value = 0
  countyWarningPopupRequestId += 1
  outageRangeChainsData.value = []
  outageRangeChainsTotal.value = 0
  outageRangeChainsCurrentPage.value = 1
  outageEventsSummaryData.value = null
  faultLocationEventTypesData.value = []
  outageDetailRows.value = []
  outageDetailTotal.value = 0

  const beginTime = customRange?.beginTime || toBackendDateTime(queryStartTime.value)
  const endTime = customRange?.endTime || toBackendDateTime(queryEndTime.value)

  if (!beginTime || !endTime) {
    dataError.value = '请完整选择开始和结束时间。'
    window.alert(dataError.value)
    loading.value = false
    return
  }

  if (countyList.value.length === 0) {
    await loadCountyList()
  }

  try {
    const basePayload = {
      beginTime,
      endTime,
    }
    countyWarningLightsData.value = []

    const requests = [
      loadTagStatsOverview(basePayload),
      queryOutageEventsByPages(basePayload),
      queryOutageUsersByPages(basePayload),
      loadCountyTrendData(basePayload),
      loadSpatialDistributionRows(basePayload),
      loadRegionWarningLights(basePayload),
      loadRightPanelFaultLocationSummary({ ...basePayload, dimension: 'feeder' }),
      loadRightPanelOutageScopeSummary(basePayload),
    ]
    if (includeDetailPages && spaceDistributionDetailVisible.value) {
      requests.push(loadCountyEquipmentStatsSummary(basePayload))
      requests.push(loadCountyEquipmentListRows(basePayload))
      requests.push(loadCountyEquipmentPageRows({ ...basePayload, page: SPACE_EQUIPMENT_PAGE_NUMBER }))
    }

    const [
      tagStatsResult,
      listRecordsResult,
      usersResult,
      ...otherResults
    ] = await Promise.allSettled(requests)

    if (tagStatsResult.status === 'fulfilled') {
      tagStatsOverview.value = tagStatsResult.value
    }

    if (listRecordsResult.status === 'fulfilled') {
      outageIndexRecords.value = []
      outageEvents.value = listRecordsResult.value.map((item, index) => normalizeOutageEventRecord(item, index))
    }

    if (usersResult.status === 'fulfilled') {
      outageUsers.value = usersResult.value
    }

    const failedResult = [
      tagStatsResult,
      listRecordsResult,
      usersResult,
      ...otherResults,
    ].find((result) => result.status === 'rejected')

    if (failedResult) {
      console.error(failedResult.reason)
      dataError.value = `后端接口调用失败：${failedResult.reason?.message || '未知错误'}`
    }

    if (usersResult.status === 'fulfilled' && outageUsers.value.length === 0 && outageEvents.value.length > 0) {
      dataNotice.value = '用户清单接口返回为空，标签识别和设备影响明细可能偏小。'
    }

    if (listRecordsResult.status === 'fulfilled' && outageEvents.value.length === 0) {
      dataNotice.value = '接口调用成功，当前时间范围无停电事件数据。'
    }
  } catch (error) {
    console.error(error)
    dataError.value = `后端接口调用失败：${error?.message || '未知错误'}`
  } finally {
    loading.value = false
  }
}

const regionOptions = computed(() => {
  const names = countyList.value
    .map((item) => toCountyDisplayName(item.countyName))
    .filter((item) => item !== '')
  const uniqueNames = Array.from(new Set(names))
  return ['全部', ...uniqueNames.sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))]
})

const filteredOutageEvents = computed(() => {
  if (selectedRegion.value === '全部') {
    return outageEvents.value
  }
  const normalizedSelectedRegion = normalizeCountyName(selectedRegion.value)
  return outageEvents.value.filter((item) => normalizeCountyName(item.countyName) === normalizedSelectedRegion)
})

const countyRegionOptions = computed(() => regionOptions.value)
const selectedRegionCountyId = computed(() => getCountyIdByRegionName(selectedRegion.value))

const resolveCountyWarningHasOutage = (item, outageCount) => {
  if (!item || typeof item !== 'object') {
    return outageCount > 0
  }

  const explicitFlagKeys = ['hasOutage', 'hasWarning', 'warning', 'isWarning', 'alert']
  for (const key of explicitFlagKeys) {
    if (item[key] !== undefined && item[key] !== null && String(item[key]).trim() !== '') {
      return toBooleanFlag(item[key])
    }
  }

  const statusText = String(item.status || item.warningLevel || item.level || '')
    .trim()
    .toLowerCase()
  if (statusText) {
    if (['warning', 'danger', 'alert', 'outage', 'abnormal', 'fault', 'red', '1', 'true'].includes(statusText)) {
      return true
    }
    if (['safe', 'normal', 'green', '0', 'false'].includes(statusText)) {
      return false
    }
  }

  return outageCount > 0
}

const mapOverviewCountyWarningLights = (rawList) => {
  if (!Array.isArray(rawList)) {
    return []
  }

  const warningMap = new Map()
  rawList.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return
    }

    const countyName = toCountyDisplayName(
      item.countyName || item.county_name || item.name || item.county || item.countyLabel || '',
    )
    const countyId = String(
      item.countyId || item.county_id || item.rdtCountyId || item.rdt_county_id || item.id || '',
    ).trim()
    const countyKey = normalizeCountyName(countyName)
    if (!countyKey) {
      return
    }

    const outageCount = Math.max(
      safeNumber(
        item.outageCount ??
          item.outageEventCount ??
          item.warningCount ??
          item.eventCount ??
          item.count ??
          item.totalOutages,
      ),
      0,
    )
    const hasOutage = resolveCountyWarningHasOutage(item, outageCount)
    const existing = warningMap.get(countyKey)
    if (existing) {
      existing.outageCount += outageCount
      existing.hasOutage = existing.hasOutage || hasOutage || existing.outageCount > 0
      existing.countyId = existing.countyId || countyId
      return
    }

    warningMap.set(countyKey, {
      countyName,
      countyId,
      outageCount,
      hasOutage: hasOutage || outageCount > 0,
    })
  })

  return Array.from(warningMap.values()).sort((a, b) =>
    normalizeCountyName(a.countyName).localeCompare(normalizeCountyName(b.countyName), 'zh-Hans-CN'),
  )
}

const countyWarningLights = computed(() => {
  return countyWarningLightsData.value
})

const isTargetCityRecord = (item) => {
  const record = normalizeUserRecord(item)
  const cityName = String(
    readFieldValue(record, ['rdtCityName', 'rdt_city_name', 'cityName', 'city_name']) || '',
  ).trim()
  if (!cityName) {
    return true
  }
  return cityName === tagAndKeyUserTargetCityName
}

const filteredFaultOutageEvents = computed(() =>
  filteredOutageEvents.value.filter((item) => isTargetCityRecord(item)),
)

const faultLocationSummary = computed(() => {
  const remote = faultSummaryData.value
  if (remote && typeof remote === 'object') {
    const normalizeBarKey = (value) => {
      const rawKey = String(value || '').trim().toLowerCase()
      if (['danger', 'red', 'high', 'highimpact'].includes(rawKey)) {
        return 'danger'
      }
      if (['warning', 'yellow', 'medium', 'mediumimpact'].includes(rawKey)) {
        return 'warning'
      }
      if (['safe', 'green', 'low', 'lowimpact'].includes(rawKey)) {
        return 'safe'
      }
      return ''
    }

    const buildBarsFromUnknownSource = (...sources) => {
      const counters = {
        danger: 0,
        warning: 0,
        safe: 0,
      }

      sources.forEach((source) => {
        if (!source) {
          return
        }

        if (Array.isArray(source)) {
          source.forEach((item) => {
            if (!item || typeof item !== 'object') {
              return
            }
            const barKey = normalizeBarKey(item.key || item.color || item.name || item.label)
            if (!barKey) {
              return
            }
            counters[barKey] += Math.max(safeNumber(item.count ?? item.value ?? item.total), 0)
          })
          return
        }

        if (typeof source === 'object') {
          Object.entries(source).forEach(([rawKey, rawValue]) => {
            const barKey = normalizeBarKey(rawKey)
            if (!barKey) {
              return
            }
            counters[barKey] += Math.max(safeNumber(rawValue), 0)
          })
        }
      })

      return [
        { key: 'danger', colorLabel: '红色', count: counters.danger },
        { key: 'warning', colorLabel: '黄色', count: counters.warning },
        { key: 'safe', colorLabel: '绿色', count: counters.safe },
      ]
    }

    const buildModeSummary = (modeKey, modeLabel, modeData) => {
      const bars = buildBarsFromUnknownSource(modeData?.bars, modeData?.colorBars)
      const barsTotal = bars.reduce((sum, item) => sum + item.count, 0)
      const total = Math.max(
        safeNumber(modeData?.total ?? modeData?.matchedEvents ?? modeData?.count ?? barsTotal),
        barsTotal,
      )
      const matchedEvents = Math.max(safeNumber(modeData?.matchedEvents), 0)

      return {
        key: modeKey,
        label: modeLabel,
        total,
        matchedEvents,
        bars,
      }
    }

    const remoteModes = remote?.modes && typeof remote.modes === 'object' ? remote.modes : null
    if (remoteModes) {
      const feederMode = buildModeSummary('feeder', '线路', remoteModes.feeder ?? remoteModes.line ?? {})
      const substationMode = buildModeSummary('substation', '变电站', remoteModes.substation ?? {})
      const equipmentMode = buildModeSummary('equipment', '设备', remoteModes.equipment ?? {})

      return {
        feederTotal: feederMode.total,
        equipmentTotal: equipmentMode.total,
        modes: {
          feeder: feederMode,
          substation: substationMode,
          equipment: equipmentMode,
        },
      }
    }

    const highCount = Math.max(safeNumber(remote?.highImpact?.count ?? remote?.highImpact), 0)
    const mediumCount = Math.max(safeNumber(remote?.mediumImpact?.count ?? remote?.mediumImpact), 0)
    const lowCount = Math.max(safeNumber(remote?.lowImpact?.count ?? remote?.lowImpact), 0)
    const total = highCount + mediumCount + lowCount
    const bars = [
      { key: 'danger', colorLabel: '红色', count: highCount },
      { key: 'warning', colorLabel: '黄色', count: mediumCount },
      { key: 'safe', colorLabel: '绿色', count: lowCount },
    ]

    return {
      feederTotal: total,
      equipmentTotal: total,
      modes: {
        feeder: {
          key: 'feeder',
          label: '线路',
          total,
          bars,
        },
        substation: {
          key: 'substation',
          label: '变电站',
          total,
          bars,
        },
        equipment: {
          key: 'equipment',
          label: '设备',
          total,
          bars,
        },
      },
    }
  }

  const resolveAffectedUserCount = (item) => safeNumber(
    readFieldValue(item, [
      'affectedConsCnt',
      'affected_cons_cnt',
      'powerUserCnt',
      'power_user_cnt',
      'affectedUsers',
      'affected_users',
    ]),
  )

  const resolveBucketKey = (count) => {
    if (count > 5000) {
      return 'danger'
    }
    if (count >= 1000) {
      return 'warning'
    }
    return 'safe'
  }

  const buildModeStats = (getEntityName) => {
    const maxUserCountByEntity = new Map()

    filteredFaultOutageEvents.value.forEach((item) => {
      const entityName = String(getEntityName(item) || '').trim()
      if (!entityName || entityName === '-') {
        return
      }

      const affectedUsers = resolveAffectedUserCount(item)
      const prevMax = maxUserCountByEntity.get(entityName) || 0
      if (affectedUsers > prevMax) {
        maxUserCountByEntity.set(entityName, affectedUsers)
      }
    })

    const counters = {
      danger: 0,
      warning: 0,
      safe: 0,
    }

    maxUserCountByEntity.forEach((count) => {
      const bucket = resolveBucketKey(count)
      counters[bucket] += 1
    })

    return {
      total: maxUserCountByEntity.size,
      bars: [
        { key: 'danger', colorLabel: '红色', count: counters.danger },
        { key: 'warning', colorLabel: '黄色', count: counters.warning },
        { key: 'safe', colorLabel: '绿色', count: counters.safe },
      ],
    }
  }

  const feederStats = buildModeStats((item) => readFieldValue(item, ['rdtFeederName', 'rdt_feeder_name', 'feederName', 'feeder_name']))
  const substationStats = buildModeStats((item) => readFieldValue(item, ['rdtSubsName', 'rdt_subs_name', 'subsName', 'subs_name', 'substationName', 'substation_name']))
  const equipmentStats = buildModeStats((item) => readFieldValue(item, ['faultEquipName', 'fault_equip_name', 'equipmentName', 'equipment_name']))

  return {
    feederTotal: feederStats.total,
    equipmentTotal: equipmentStats.total,
    modes: {
        feeder: {
          key: 'feeder',
          label: '线路',
          total: feederStats.total,
          matchedEvents: Math.max(safeNumber(filteredFaultOutageEvents.value.length), 0),
          bars: feederStats.bars,
        },
        substation: {
          key: 'substation',
          label: '变电站',
          total: substationStats.total,
          matchedEvents: Math.max(safeNumber(filteredFaultOutageEvents.value.length), 0),
          bars: substationStats.bars,
        },
        equipment: {
          key: 'equipment',
          label: '设备',
          total: equipmentStats.total,
          matchedEvents: Math.max(safeNumber(filteredFaultOutageEvents.value.length), 0),
          bars: equipmentStats.bars,
        },
      },
    }
})

const outageNatureOverviewCards = computed(() => {
  const summary = outageEventsSummaryData.value
  const total = Math.max(safeNumber(summary?.totalEvents), 0)
  const baseMap = new Map([
    ['planned', { key: 'planned', label: '计划停电', count: 0, rate: 0, rateText: '0.0%' }],
    ['fault', { key: 'fault', label: '故障停电', count: 0, rate: 0, rateText: '0.0%' }],
    ['other', { key: 'other', label: '其他', count: 0, rate: 0, rateText: '0.0%' }],
  ])

  const ratioList = Array.isArray(summary?.natureRatio) ? summary.natureRatio : []
  ratioList.forEach((item) => {
    const key = normalizeOutageNatureCode(item?.code || item?.name || item?.outageNature)
    if (!key) {
      return
    }

    const count = Math.max(safeNumber(item?.value), 0)
    const rate = Number.isFinite(Number(item?.percent))
      ? Number(Number(item.percent).toFixed(1))
      : total > 0
        ? Number(((count / total) * 100).toFixed(1))
        : 0
    const current = baseMap.get(key)
    if (!current) {
      return
    }

    baseMap.set(key, {
      ...current,
      count,
      rate,
      rateText: `${rate.toFixed(1)}%`,
    })
  })

  return ['planned', 'fault', 'other'].map((key) => baseMap.get(key))
})

const outageNatureOverview = computed(() => {
  const colors = ['#4bfbac', '#ff5e63', '#3a8dff', '#ffd35d', '#a873ff', '#4de4ff']
  const total = faultLocationEventTypesData.value.reduce((sum, item) => sum + Math.max(safeNumber(item.count), 0), 0)
  const items = faultLocationEventTypesData.value.map((item, index) => {
    const count = Math.max(safeNumber(item.count), 0)
    const rate = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0
    return {
      ...item,
      count,
      rate,
      rateText: `${rate.toFixed(1)}%`,
      color: colors[index % colors.length],
    }
  })

  let cursor = 0
  const segments = items
    .filter((item) => item.count > 0)
    .map((item, index, list) => {
      const start = cursor
      const end = index === list.length - 1 ? 100 : Math.min(100, Number((cursor + item.rate).toFixed(1)))
      cursor = end
      return `${item.color} ${start}% ${end}%`
    })

  return {
    items,
    total,
    pieBackground: segments.length > 0
      ? `conic-gradient(${segments.join(', ')})`
      : 'conic-gradient(rgba(90, 128, 168, 0.34) 0% 100%)',
  }
})

const outageRestoreOverview = computed(() => {
  const summary = outageEventsSummaryData.value
  const total = Math.max(safeNumber(summary?.totalEvents), safeNumber(summary?.restoredEvents) + safeNumber(summary?.unrestoredEvents))
  const restoredCount = Math.max(safeNumber(summary?.restoredEvents), 0)
  const unrestoredCount = Math.max(safeNumber(summary?.unrestoredEvents), Math.max(total - restoredCount, 0))
  const restoredRate = Number.isFinite(Number(summary?.restoredRate))
    ? Number(Number(summary.restoredRate).toFixed(1))
    : total > 0
      ? Number(((restoredCount / total) * 100).toFixed(1))
      : 0

  return {
    total,
    restored: {
      count: restoredCount,
      rate: restoredRate,
      rateText: `${restoredRate.toFixed(1)}%`,
    },
    unrestored: {
      count: unrestoredCount,
    },
  }
})

const outageDetailTotalPages = computed(() =>
  Math.max(
    Math.ceil(Math.max(safeNumber(outageDetailTotal.value), 0) / Math.max(safeNumber(outageDetailRowsPerPage.value), OUTAGE_DETAIL_MIN_PAGE_SIZE)),
    1,
  ),
)

const pagedOutageDetailRows = computed(() => outageDetailRows.value)

const recalcOutageDetailRowsPerPage = () => {
  if (!showOutageDetailPage.value || outageDetailLoading.value) {
    return
  }

  const bodyEl = outageDetailGridBodyRef.value
  if (!bodyEl) {
    return
  }

  const headEl = bodyEl.querySelector('.outage-detail-grid-head')
  const rowEl = bodyEl.querySelector('.outage-detail-grid-row')
  const headHeight = headEl?.getBoundingClientRect().height || OUTAGE_DETAIL_FALLBACK_HEAD_HEIGHT
  const rowHeight = rowEl?.getBoundingClientRect().height || OUTAGE_DETAIL_FALLBACK_ROW_HEIGHT
  const availableHeight = bodyEl.clientHeight - headHeight
  const estimatedSize = Math.floor(availableHeight / rowHeight) - OUTAGE_DETAIL_PAGE_SIZE_BUFFER
  const nextSize = Math.max(
    OUTAGE_DETAIL_MIN_PAGE_SIZE,
    Math.min(OUTAGE_DETAIL_MAX_PAGE_SIZE, Number.isFinite(estimatedSize) ? estimatedSize : OUTAGE_DETAIL_MIN_PAGE_SIZE),
  )

  if (nextSize !== outageDetailRowsPerPage.value) {
    outageDetailRowsPerPage.value = nextSize
    outageDetailCurrentPage.value = OUTAGE_DETAIL_DEFAULT_PAGE
  }
}

const syncOutageDetailLayout = () => {
  recalcOutageDetailRowsPerPage()
}

const observeOutageDetailLayout = () => {
  if (typeof window === 'undefined' || typeof window.ResizeObserver !== 'function') {
    return
  }

  if (outageDetailLayoutObserver) {
    outageDetailLayoutObserver.disconnect()
  }

  outageDetailLayoutObserver = new window.ResizeObserver(() => {
    syncOutageDetailLayout()
  })

  if (outageDetailGridBodyRef.value) {
    outageDetailLayoutObserver.observe(outageDetailGridBodyRef.value)
  }
  if (outageDetailPaginationRef.value) {
    outageDetailLayoutObserver.observe(outageDetailPaginationRef.value)
  }
  if (outageDetailPageJumpRef.value) {
    outageDetailLayoutObserver.observe(outageDetailPageJumpRef.value)
  }
}

const outageDetailPageButtons = computed(() => {
  const total = outageDetailTotalPages.value
  const maxButtons = OUTAGE_DETAIL_MAX_PAGE_BUTTONS

  if (total <= maxButtons) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const half = Math.floor(maxButtons / 2)
  let start = outageDetailCurrentPage.value - half
  let end = outageDetailCurrentPage.value + half

  if (start < 1) {
    start = 1
    end = maxButtons
  }

  if (end > total) {
    end = total
    start = total - maxButtons + 1
  }

  const pages = []
  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }
  return pages
})

const displayOutageEvents = computed(() =>
  filteredOutageEvents.value.filter((item) => Boolean(normalizeCountyName(item.countyName))),
)

const visibleOutageEvents = computed(() => displayOutageEvents.value.slice(0, 8))

const outageSummary = computed(() => {
  const remote = outageScopeSummaryData.value
  if (remote && typeof remote === 'object') {
    const restoredEvents = Math.max(safeNumber(remote.restoredEvents), 0)
    const unrestoredEvents = Math.max(safeNumber(remote.unrestoredEvents ?? remote.activeEvents), 0)
    const totalEvents = Math.max(safeNumber(remote.totalEvents), restoredEvents + unrestoredEvents)
    return {
      totalEvents,
      totalUsers: Math.max(safeNumber(remote.affectedUsers), 0),
      totalEquipments: Math.max(safeNumber(remote.affectedEquipment), 0),
      affectedLines: Math.max(safeNumber(remote.lineCnt ?? remote.affectedLines), 0),
      affectedSubstations: Math.max(safeNumber(remote.subsCnt ?? remote.affectedSubstations), 0),
      activeEvents: unrestoredEvents,
    }
  }

  const totalEvents = filteredFaultOutageEvents.value.length
  const totalUsers = filteredFaultOutageEvents.value.reduce(
    (sum, item) => sum + safeNumber(item.affectedConsCnt || item.powerUserCnt),
    0,
  )
  const totalEquipments = filteredFaultOutageEvents.value.reduce(
    (sum, item) => sum + safeNumber(item.powerEquipCnt || item.affectedEquipmentCnt),
    0,
  )
  const affectedLineSet = new Set()
  const affectedSubstationSet = new Set()
  filteredFaultOutageEvents.value.forEach((item) => {
    const lineKey = String(
      readFieldValue(item, ['rdtFeederId', 'rdt_feeder_id', 'feederId', 'feeder_id', 'rdtFeederName', 'rdt_feeder_name']),
    ).trim()
    const substationKey = String(
      readFieldValue(item, ['rdtSubsId', 'rdt_subs_id', 'substationId', 'substation_id', 'rdtSubsName', 'rdt_subs_name']),
    ).trim()
    if (lineKey) {
      affectedLineSet.add(lineKey)
    }
    if (substationKey) {
      affectedSubstationSet.add(substationKey)
    }
  })
  const activeEvents = filteredFaultOutageEvents.value.filter((item) => String(item.outageFlag) === '0').length

  return {
    totalEvents,
    totalUsers,
    totalEquipments,
    affectedLines: affectedLineSet.size,
    affectedSubstations: affectedSubstationSet.size,
    activeEvents,
  }
})

const countyImpacts = computed(() => {
  const impactMap = new Map()

  filteredOutageEvents.value.forEach((item) => {
    const name = normalizeCountyName(item.countyName)
    if (!name) {
      return
    }
    const users = safeNumber(item.powerUserCnt || item.affectedConsCnt)
    impactMap.set(name, (impactMap.get(name) || 0) + users)
  })

  return Array.from(impactMap.entries())
    .map(([name, users]) => ({ name, users }))
    .sort((a, b) => b.users - a.users)
    .slice(0, 6)
})

const countyImpactMax = computed(() => {
  if (countyImpacts.value.length === 0) {
    return 1
  }
  return Math.max(...countyImpacts.value.map((item) => item.users), 1)
})

const KEY_INDUSTRY_KEYWORDS = ['工业', '通信', '卫星', '铁塔', '医院', '政府', '供水', '燃气', '应急']
const KEY_UNIT_KEYWORDS = [
  '医院',
  '政府',
  '供水',
  '燃气',
  '应急',
  '消防',
  '公安',
  '学校',
  '车站',
  '机场',
  '通信',
  '移动',
  '联通',
  '电信',
  '铁塔',
  '卫星',
]

const toPlainText = (value) => String(value || '').replaceAll(/\s+/g, '')

const hasKeyword = (text, keywords) => keywords.some((keyword) => text.includes(keyword))

const KEYWORD_MOJIBAKE_ALIASES = {
  工业: ['宸ヤ笟'],
  通信: ['閫氫俊'],
  卫星: ['鍗槦'],
  铁塔: ['閾佸'],
  医院: ['鍖婚櫌'],
  政府: ['鏀垮簻'],
  供水: ['渚涙按'],
  燃气: ['鐕冩皵'],
  应急: ['搴旀€', '搴旀'],
  消防: ['娑堥槻'],
  公安: ['鍏畨'],
  学校: ['瀛︽牎'],
  车站: ['杞︾珯'],
  机场: ['鏈哄満'],
  移动: ['绉诲姩'],
  联通: ['鑱旈€', '鑱旈'],
  电信: ['鐢典俊'],
  发电: ['鍙戠數'],
  电厂: ['鐢靛巶'],
  中压: ['涓帇'],
  低压非居民: ['浣庡帇闈炲眳姘'],
}

const withMojibakeAliases = (keywords) =>
  Array.from(new Set(keywords.flatMap((keyword) => [keyword, ...(KEYWORD_MOJIBAKE_ALIASES[keyword] || [])])))

const KEY_INDUSTRY_MATCHERS = withMojibakeAliases(KEY_INDUSTRY_KEYWORDS)
const KEY_UNIT_MATCHERS = withMojibakeAliases(KEY_UNIT_KEYWORDS)
const POWER_PLANT_MATCHERS = withMojibakeAliases(['发电', '电厂'])
const MID_VOLT_MATCHERS = withMojibakeAliases(['中压'])
const LOW_NON_RESIDENTIAL_MATCHERS = withMojibakeAliases(['低压非居民'])

const pickFirst = (obj, keys) => {
  for (const key of keys) {
    const value = obj?.[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value
    }
  }
  return ''
}

const readFieldValue = (record, keys = []) => {
  if (!record || typeof record !== 'object') {
    return ''
  }

  const direct = pickFirst(record, keys)
  if (String(direct || '').trim() !== '') {
    return direct
  }

  const loweredKeyMap = new Map(
    Object.keys(record).map((key) => [key.toLowerCase().replaceAll('_', ''), key]),
  )

  for (const key of keys) {
    const normalizedKey = String(key).toLowerCase().replaceAll('_', '')
    const matchedKey = loweredKeyMap.get(normalizedKey)
    if (!matchedKey) {
      continue
    }

    const value = record?.[matchedKey]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value
    }
  }

  return ''
}

const normalizeUserRecord = (item) => {
  let record = item

  if (typeof record === 'string') {
    try {
      record = JSON.parse(record)
    } catch {
      return {}
    }
  }

  if (!record || typeof record !== 'object') {
    return {}
  }

  const wrappedKeys = ['record', 'data', 'result', 'detail', 'outageUser', 'outageUserDetail']
  for (const key of wrappedKeys) {
    const wrapped = record?.[key]
    if (wrapped && typeof wrapped === 'object' && !Array.isArray(wrapped)) {
      return wrapped
    }
  }

  const entries = Object.entries(record)
  if (entries.length === 1) {
    const [onlyValue] = entries[0].slice(1)
    if (onlyValue && typeof onlyValue === 'object' && !Array.isArray(onlyValue)) {
      return onlyValue
    }
  }

  return record
}

const normalizeOutageEventRecord = (item, index = 0) => {
  const record = normalizeUserRecord(item)
  const outageNumberRaw = extractOutageNumberParam(record)
  const outageNumber = String(outageNumberRaw || '').trim()
  const eventId = String(
    readFieldValue(record, ['id', 'eventId', 'event_id', 'outageId', 'outage_id']) ||
      outageNumber ||
      `event-${index}`,
  )

  return {
    ...record,
    id: eventId,
    outageNumber,
    outageNumberRaw,
    countyName: normalizeCountyName(
      readFieldValue(record, ['countyName', 'county_name', 'rdtCountyName', 'rdt_county_name']),
    ),
    affectedConsCnt: readFieldValue(record, [
      'affectedConsCnt',
      'affected_cons_cnt',
      'affectedUsers',
      'affected_users',
      'totalUsers',
      'total_users',
    ]),
    powerUserCnt: readFieldValue(record, ['powerUserCnt', 'power_user_cnt', 'affectedUsers', 'affected_users']),
    outageNature: readFieldValue(record, ['outageNature', 'outage_nature', 'outageTypeName', 'outage_type_name']),
    beginTime: readFieldValue(record, ['beginTime', 'begin_time']),
    endTime: readFieldValue(record, ['endTime', 'end_time']),
    maintGroupName: readFieldValue(record, ['maintGroupName', 'maint_group_name']),
    rdtFeederId: readFieldValue(record, ['rdtFeederId', 'rdt_feeder_id', 'feederId', 'feeder_id']),
    rdtFeederName: readFieldValue(record, ['rdtFeederName', 'rdt_feeder_name']),
    rdtFeederDevType: readFieldValue(record, [
      'rdtFeederDevType',
      'rdt_feeder_dev_type',
      'rdtFeederType',
      'rdt_feeder_type',
      'devType',
      'dev_type',
    ]),
    rdtSubsName: readFieldValue(record, ['rdtSubsName', 'rdt_subs_name']),
    faultEquipName: readFieldValue(record, ['faultEquipName', 'fault_equip_name', 'equipmentName', 'equipment_name']),
    powerEquipCnt: readFieldValue(record, ['powerEquipCnt', 'power_equip_cnt', 'affectedEquipment', 'affected_equipment']),
    affectedEquipmentCnt: readFieldValue(record, [
      'affectedEquipmentCnt',
      'affected_equipment_cnt',
      'affectedEquipment',
      'affected_equipment',
    ]),
    outageFlag: readFieldValue(record, ['outageFlag', 'outage_flag', 'restored']),
  }
}

const classifyUserByScore = (user) => {
  const record = normalizeUserRecord(user)
  const tradeName = toPlainText(
    readFieldValue(record, ['tradeName', 'trade_name', 'trade', 'tradeTypeName', 'trade_type_name', 'industryName']),
  )
  const consName = toPlainText(readFieldValue(record, ['consName', 'cons_name', 'name', 'userName', 'orgName']))
  const consTypeName = toPlainText(
    readFieldValue(record, ['consTypeName', 'cons_type_name', 'consVoltTypeName', 'cons_volt_type_name']),
  )
  const consVoltType = toPlainText(readFieldValue(record, ['consVoltType', 'cons_volt_type', 'voltType', 'volt_type']))

  const tradeMatched = hasKeyword(tradeName, KEY_INDUSTRY_MATCHERS)
  const hasPowerPlantKeyword = hasKeyword(tradeName, POWER_PLANT_MATCHERS)
  const consMatched = hasKeyword(consName, KEY_UNIT_MATCHERS)
  const isMidVoltage = consVoltType === '01'
  const isLowNonResidential =
    consVoltType === '02' && (consTypeName.includes('低压非居民') || hasKeyword(consTypeName, LOW_NON_RESIDENTIAL_MATCHERS))

  let score = 0
  if (tradeMatched) score += 40
  if (hasPowerPlantKeyword) score += 25
  if (consMatched) score += 30
  if (isMidVoltage) score += 20
  if (isLowNonResidential) score += 10

  const isSensitive = score >= 60
  const isImportant = score >= 50

  return {
    sensitiveScore: score,
    importantScore: score,
    isSensitive,
    isImportant,
    isLivelihood: !isSensitive && !isImportant,
  }
}

const isInSelectedCounty = (countyName) => {
  if (selectedRegion.value === '全部') {
    return true
  }
  if (!String(countyName || '').trim()) {
    return true
  }
  return normalizeCountyName(countyName) === normalizeCountyName(selectedRegion.value)
}

const outageUsersBySelectedCounty = computed(() =>
  outageUsers.value.filter((item) => {
    const record = normalizeUserRecord(item)
    const countyName = readFieldValue(record, ['rdtCountyName', 'rdt_county_name', 'countyName', 'county_name'])
    return isInSelectedCounty(countyName)
  }),
)

const tagAndKeyUserSourceUsers = computed(() =>
  outageUsersBySelectedCounty.value.filter((item) => {
    const record = normalizeUserRecord(item)
    const cityName = String(
      readFieldValue(record, ['rdtCityName', 'rdt_city_name', 'cityName', 'city_name']) || '',
    ).trim()
    return !cityName || cityName === tagAndKeyUserTargetCityName
  }),
)

const localTagStats = computed(() => {
  const users = tagAndKeyUserSourceUsers.value
  let sensitive = 0
  let important = 0
  let livelihood = 0

  users.forEach((item) => {
    const classified = classifyUserByScore(item)
    if (classified.isSensitive) {
      sensitive += 1
    }
    if (classified.isImportant) {
      important += 1
    }
    if (!classified.isSensitive && !classified.isImportant) {
      livelihood += 1
    }
  })

  return {
    total: users.length,
    important,
    sensitive,
    livelihood,
  }
})

const tagStats = computed(() => {
  const remote = tagStatsOverview.value
  if (!remote) {
    return localTagStats.value
  }

  return {
    total: Math.max(safeNumber(remote.totalUsers), 0),
    important: Math.max(safeNumber(remote.keyUsers), 0),
    sensitive: Math.max(safeNumber(remote.sensitiveUsers), 0),
    livelihood: Math.max(safeNumber(remote.normalUsers), 0),
  }
})

const toPercent = (count, total) => {
  if (!total) {
    return 0
  }
  return Math.round((count / total) * 1000) / 10
}

const userTagPieData = computed(() => {
  const total = tagStats.value.total
  const important = tagStats.value.important
  const sensitive = tagStats.value.sensitive

  const importantRatio = toPercent(important, total)
  const sensitiveRatio = toPercent(sensitive, total)

  return [
    {
      key: 'important',
      title: '重要用户占比',
      count: important,
      total,
      ratio: importantRatio,
      ratioText: important > 0 && importantRatio === 0 ? '＜0.1%' : (important === 0 ? '0' : `${importantRatio}%`),
      color: '#f4a825',
    },
    {
      key: 'sensitive',
      title: '敏感用户占比',
      count: sensitive,
      total,
      ratio: sensitiveRatio,
      ratioText: sensitive > 0 && sensitiveRatio === 0 ? '＜0.1%' : (sensitive === 0 ? '0' : `${sensitiveRatio}%`),
      color: '#ff4d4f',
    },
  ]
})

const keyUsers = computed(() => {
  const list = tagAndKeyUserSourceUsers.value
    .map((item) => {
      const classified = classifyUserByScore(item)
      return {
        userId: item.consNo || item.userId || '-',
        name: item.consName || item.name || '未知用户',
        countyName: normalizeCountyName(item.rdtCountyName || item.countyName || ''),
        isImportant: classified.isImportant,
        isSensitive: classified.isSensitive,
        keyScore: Math.max(classified.sensitiveScore, classified.importantScore),
        outageNumber: item.outageNumber || '',
      }
    })
    .filter((item) => item.isImportant || item.isSensitive)
    .sort((a, b) => b.keyScore - a.keyScore)

  return list.slice(0, 8)
})

const sensitiveDemandAppealTypeMeta = [
  { key: 'category1', field: 'category1_cnt', fieldAliases: ['客户投诉'], label: '客户投诉', color: '#a988ff' },
  { key: 'category2', field: 'category2_cnt', fieldAliases: ['故障报修'], label: '故障报修', color: '#68d4ff' },
  { key: 'category3', field: 'category3_cnt', fieldAliases: ['特殊诉求'], label: '特殊诉求', color: '#87a9ff' },
  { key: 'category4', field: 'category4_cnt', fieldAliases: ['业务办理'], label: '业务办理', color: '#67f5a6' },
  { key: 'category5', field: 'category5_cnt', fieldAliases: ['复电进度'], label: '复电进度', color: '#ffd96b' },
  { key: 'category6', field: 'category6_cnt', fieldAliases: ['其他类别'], label: '其他类别', color: '#ff8fa3' },
]

const SENSITIVE_DEMAND_USER_TAG_COLORS = {
  important: '#35cfff',
  sensitive: '#ff5b7d',
  special: '#ffd23f',
}

const sensitiveDemandUserTagMeta = [
  { key: 'important', label: '重要客户', color: SENSITIVE_DEMAND_USER_TAG_COLORS.important },
  { key: 'sensitive', label: '敏感客户', color: SENSITIVE_DEMAND_USER_TAG_COLORS.sensitive },
  { key: 'special', label: '特殊客户', color: SENSITIVE_DEMAND_USER_TAG_COLORS.special },
]

const sensitiveDemandAutoDetailMeta = [
  {
    key: 'important',
    label: '重要客户',
    color: SENSITIVE_DEMAND_USER_TAG_COLORS.important,
    typeCountQuery: querySensitiveAppealKeyUserTypeCount,
    listQuery: querySensitiveAppealKeyUsers,
    detailQuery: querySensitiveAppealKeyUserDetail,
    typeNameField: 'impt_cust_type_name',
    filterField: 'impt_cust_type_name',
  },
  {
    key: 'sensitive',
    label: '敏感客户',
    color: SENSITIVE_DEMAND_USER_TAG_COLORS.sensitive,
    typeCountQuery: querySensitiveAppealSensitiveUserTypeCount,
    listQuery: querySensitiveAppealSensitiveUsers,
    detailQuery: querySensitiveAppealSensitiveUserDetail,
    typeNameField: 'sensitive_cust_type_name',
    filterField: 'sensitive_cust_type_name',
  },
  {
    key: 'special',
    label: '特殊客户',
    color: SENSITIVE_DEMAND_USER_TAG_COLORS.special,
    typeCountQuery: querySensitiveAppealSpecialUserTypeCount,
    listQuery: querySensitiveAppealSpecialUsers,
    detailQuery: querySensitiveAppealSpecialUserDetail,
    typeNameField: 'spcl_cust_type_name',
    filterField: 'spcl_cust_type_name',
  },
]

const sensitiveDemandUserTypeFieldMeta = {
  important: [
    { key: 'medical', field: 'medical_cnt', fieldAliases: ['医疗卫生类客户'], label: '医疗卫生类客户', color: SENSITIVE_DEMAND_USER_TAG_COLORS.important },
    { key: 'education', field: 'education_cnt', fieldAliases: ['教育机构类客户'], label: '教育机构类客户', color: '#1769ff' },
    { key: 'gov', field: 'gov_cnt', fieldAliases: ['党政机关类客户'], label: '党政机关类客户', color: '#00f2a9' },
    { key: 'comuni', field: 'comuni_cnt', fieldAliases: ['信息通信类客户'], label: '信息通信类客户', color: '#9b5cff' },
    { key: 'water', field: 'water_cnt', fieldAliases: ['城市供水类客户'], label: '城市供水类客户', color: '#0080a8' },
    { key: 'heat', field: 'heat_cnt', fieldAliases: ['城市供热类客户'], label: '城市供热类客户', color: '#ff8a00' },
    { key: 'gas', field: 'gas_cnt', fieldAliases: ['城市燃气类客户'], label: '城市燃气类客户', color: '#b84cff' },
    { key: 'traffic', field: 'traffic_cnt', fieldAliases: ['交通运输类客户'], label: '交通运输类客户', color: '#8bdc2f' },
  ],
  sensitive: [
    { key: 'medium', field: '中度敏感客户', fieldAliases: ['type1_cnt'], label: '中度敏感客户', color: SENSITIVE_DEMAND_USER_TAG_COLORS.sensitive },
    { key: 'extreme', field: '极端敏感客户', fieldAliases: ['type2_cnt'], label: '极端敏感客户', color: '#ff8a00' },
    { key: 'light', field: '轻度敏感客户', fieldAliases: ['type3_cnt'], label: '轻度敏感客户', color: '#b84cff' },
    { key: 'high', field: '高度敏感客户', fieldAliases: ['type4_cnt'], label: '高度敏感客户', color: '#ff2bb3' },
  ],
  special: [
    { key: 'unreasonable', field: '不合理诉求客户', fieldAliases: ['unreasonable_appeal_cnt', 'unreasonable_appeal'], label: '不合理诉求客户', color: SENSITIVE_DEMAND_USER_TAG_COLORS.special },
    { key: 'other', field: '其他类客户', fieldAliases: ['other_special_customer_cnt', 'other_special_customer'], label: '其他类客户', color: '#ff7a00' },
    { key: 'malicious', field: '恶意诉求客户', fieldAliases: ['malicious_appeal_cnt', 'malicious_appeal'], label: '恶意诉求客户', color: '#8bdc2f' },
    { key: 'arrears', field: '拖欠电费客户', fieldAliases: ['electricity_arrears_cnt', 'electricity_arrears'], label: '拖欠电费客户', color: '#d14b9f' },
    { key: 'suspected', field: '疑似套取信息客户', fieldAliases: ['suspected_information_extraction_cnt', 'suspected_information_extraction'], label: '疑似套取信息客户', color: '#35cfff' },
    { key: 'theft', field: '窃电或违约用电客户', fieldAliases: ['electricity_theft_or_breach_cnt', 'electricity_theft_or_breach'], label: '窃电或违约用电客户', color: '#9b5cff' },
    { key: 'harassing', field: '骚扰来电客户', fieldAliases: ['harassing_call_cnt', 'harassing_call'], label: '骚扰来电客户', color: '#67f5a6' },
  ],
}

const showSensitiveDemandAutoDetail = ref(false)
const selectedSensitiveDemandAutoDetailKey = ref('sensitive')
const selectedSensitiveDemandUserKey = ref('')
const intelligentAnalysisSelectedUser = ref(null)
const emotionEvolutionAnalysisValue = ref('')
const emotionEvolutionAnalysisLoading = ref(false)
const emotionEvolutionAnalysisError = ref('')
const intelligentWarningValue = ref('')
const intelligentWarningLoading = ref(false)
const intelligentWarningError = ref('')
const intelligentReceiptValue = ref('')
const intelligentReceiptLoading = ref(false)
const intelligentReceiptError = ref('')
const sensitiveDemandTopUsersData = ref([])
const sensitiveDemandUserTagCountsData = ref({
  important: 0,
  sensitive: 0,
  special: 0,
})
const sensitiveDemandUserTypeRowsData = ref({
  important: [],
  sensitive: [],
  special: [],
})
const sensitiveDemandDatePayload = ref(null)
const sensitiveDemandLoading = ref(false)
const sensitiveDemandError = ref('')
const sensitiveDemandAutoDetailRows = ref([])
const sensitiveDemandAutoDetailTotal = ref(0)
const sensitiveDemandAutoDetailLoading = ref(false)
const sensitiveDemandAutoDetailError = ref('')
const sensitiveDemandAutoDetailDetailLoading = ref(false)
const sensitiveDemandRequestedDateKey = ref('')
const sensitiveDemandLoadedDateKey = ref('')
let sensitiveDemandRequestId = 0
let sensitiveDemandAutoDetailRequestId = 0
let sensitiveDemandUserAppealRequestId = 0
let sensitiveDemandAutoDetailTypeCountRequestId = 0
let emotionEvolutionAnalysisRequestId = 0
let intelligentWarningRequestId = 0
let intelligentReceiptRequestId = 0

const sensitiveDemandTopUsers = computed(() => sensitiveDemandTopUsersData.value)

const selectedSensitiveDemandUser = computed(() =>
  sensitiveDemandTopUsers.value.find((item) => item.key === selectedSensitiveDemandUserKey.value) ||
    sensitiveDemandTopUsers.value[0] ||
    null,
)

const toSensitiveAppealDate = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length >= 8 ? digits.slice(0, 8) : ''
}

const getSensitiveDemandUserCustNo = (user) => {
  const record = normalizeUserRecord(user)
  return String(readFieldValue(record, ['cust_no', 'custNo', 'consNo', 'cons_no']) || '').trim()
}

const getEmotionEvolutionErrorMessage = (error) => {
  const message = String(error?.message || '').trim()
  if (message.includes('HTTP 404') || message.includes('no user appeal data found')) {
    return '暂无可分析的客户诉求数据'
  }
  if (message.includes('cust_no is required')) {
    return '暂无客户编号，无法发起情绪演变分析'
  }
  if (message.includes('endTime')) {
    return '查询日期格式异常，请重新选择日期'
  }
  return '智能分析服务暂不可用，请稍后重试'
}

const loadEmotionEvolutionAnalysis = async (user) => {
  const requestId = ++emotionEvolutionAnalysisRequestId
  emotionEvolutionAnalysisValue.value = ''
  emotionEvolutionAnalysisError.value = ''

  if (!user) {
    emotionEvolutionAnalysisLoading.value = false
    return
  }

  const custNo = getSensitiveDemandUserCustNo(user)
  const endTime = sensitiveDemandDatePayload.value?.endTime || toSensitiveAppealDate(queryEndTime.value)

  if (!custNo) {
    emotionEvolutionAnalysisLoading.value = false
    emotionEvolutionAnalysisError.value = '暂无客户编号，无法发起情绪演变分析'
    return
  }

  if (!endTime) {
    emotionEvolutionAnalysisLoading.value = false
    emotionEvolutionAnalysisError.value = '查询日期格式异常，请重新选择日期'
    return
  }

  emotionEvolutionAnalysisLoading.value = true

  try {
    const response = await querySensitiveAppealEmotionEvolution({
      cust_no: custNo,
      endTime,
    })
    if (requestId !== emotionEvolutionAnalysisRequestId) {
      return
    }

    const value = String(response?.value ?? response?.data?.value ?? '').trim()
    emotionEvolutionAnalysisValue.value = value
    emotionEvolutionAnalysisError.value = value ? '' : '情绪演变分析暂无返回内容'
  } catch (error) {
    if (requestId === emotionEvolutionAnalysisRequestId) {
      console.error(error)
      emotionEvolutionAnalysisError.value = getEmotionEvolutionErrorMessage(error)
    }
  } finally {
    if (requestId === emotionEvolutionAnalysisRequestId) {
      emotionEvolutionAnalysisLoading.value = false
    }
  }
}

const getIntelligentWarningErrorMessage = (error) => {
  const message = String(error?.message || '').trim()
  if (message.includes('HTTP 404') || message.includes('no user appeal data found')) {
    return '暂无可分析的客户诉求数据'
  }
  if (message.includes('cust_no is required')) {
    return '暂无客户编号，无法发起智能预警'
  }
  if (message.includes('endTime')) {
    return '查询日期格式异常，请重新选择日期'
  }
  return '智能分析服务暂不可用，请稍后重试'
}

const loadIntelligentWarning = async (user) => {
  const requestId = ++intelligentWarningRequestId
  intelligentWarningValue.value = ''
  intelligentWarningError.value = ''

  if (!user) {
    intelligentWarningLoading.value = false
    return
  }

  const custNo = getSensitiveDemandUserCustNo(user)
  const endTime = sensitiveDemandDatePayload.value?.endTime || toSensitiveAppealDate(queryEndTime.value)

  if (!custNo) {
    intelligentWarningLoading.value = false
    intelligentWarningError.value = '暂无客户编号，无法发起智能预警'
    return
  }

  if (!endTime) {
    intelligentWarningLoading.value = false
    intelligentWarningError.value = '查询日期格式异常，请重新选择日期'
    return
  }

  intelligentWarningLoading.value = true

  try {
    const response = await querySensitiveAppealIntelligentWarning({
      cust_no: custNo,
      endTime,
    })
    if (requestId !== intelligentWarningRequestId) {
      return
    }

    const value = String(response?.value ?? response?.data?.value ?? '').trim()
    intelligentWarningValue.value = value
    intelligentWarningError.value = value ? '' : '智能预警暂无返回内容'
  } catch (error) {
    if (requestId === intelligentWarningRequestId) {
      console.error(error)
      intelligentWarningError.value = getIntelligentWarningErrorMessage(error)
    }
  } finally {
    if (requestId === intelligentWarningRequestId) {
      intelligentWarningLoading.value = false
    }
  }
}

const getIntelligentReceiptErrorMessage = (error) => {
  const message = String(error?.message || '').trim()
  if (message.includes('HTTP 404') || message.includes('no user appeal data found')) {
    return '暂无可分析的客户诉求数据'
  }
  if (message.includes('cust_no is required')) {
    return '暂无客户编号，无法生成智能回单'
  }
  if (message.includes('endTime')) {
    return '查询日期格式异常，请重新选择日期'
  }
  return '智能分析服务暂不可用，请稍后重试'
}

const loadIntelligentReceipt = async (user) => {
  const requestId = ++intelligentReceiptRequestId
  intelligentReceiptValue.value = ''
  intelligentReceiptError.value = ''

  if (!user) {
    intelligentReceiptLoading.value = false
    return
  }

  const custNo = getSensitiveDemandUserCustNo(user)
  const endTime = sensitiveDemandDatePayload.value?.endTime || toSensitiveAppealDate(queryEndTime.value)

  if (!custNo) {
    intelligentReceiptLoading.value = false
    intelligentReceiptError.value = '暂无客户编号，无法生成智能回单'
    return
  }

  if (!endTime) {
    intelligentReceiptLoading.value = false
    intelligentReceiptError.value = '查询日期格式异常，请重新选择日期'
    return
  }

  intelligentReceiptLoading.value = true

  try {
    const response = await querySensitiveAppealIntelligentReceipt({
      cust_no: custNo,
      endTime,
    })
    if (requestId !== intelligentReceiptRequestId) {
      return
    }

    const value = String(response?.value ?? response?.data?.value ?? '').trim()
    intelligentReceiptValue.value = value
    intelligentReceiptError.value = value ? '' : '智能回单暂无返回内容'
  } catch (error) {
    if (requestId === intelligentReceiptRequestId) {
      console.error(error)
      intelligentReceiptError.value = getIntelligentReceiptErrorMessage(error)
    }
  } finally {
    if (requestId === intelligentReceiptRequestId) {
      intelligentReceiptLoading.value = false
    }
  }
}

const buildSensitiveAppealDatePayload = (range = {}) => {
  const beginTime = toSensitiveAppealDate(range.beginTime)
  const endTime = toSensitiveAppealDate(range.endTime)
  if (!beginTime || !endTime) {
    return null
  }
  return {
    beginTime,
    endTime,
  }
}

const getSensitiveDemandDateKey = (payload) =>
  payload?.beginTime && payload?.endTime ? `${payload.beginTime}|${payload.endTime}` : ''

const getCurrentSensitiveDemandDatePayload = () =>
  buildSensitiveAppealDatePayload({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
  })

const isCurrentSensitiveDemandDateLoaded = () => {
  const dateKey = getSensitiveDemandDateKey(getCurrentSensitiveDemandDatePayload())
  if (!dateKey) {
    return false
  }
  return sensitiveDemandLoadedDateKey.value === dateKey ||
    (sensitiveDemandLoading.value && sensitiveDemandRequestedDateKey.value === dateKey)
}

const getSensitiveAppealArrayData = (response) => {
  const data = response?.data
  if (Array.isArray(data)) {
    return data
  }
  if (Array.isArray(data?.rows)) {
    return data.rows
  }
  if (Array.isArray(data?.list)) {
    return data.list
  }
  if (data && typeof data === 'object') {
    return [data]
  }
  return []
}

const getSensitiveAppealFirstRecord = (response) => {
  const visit = (source, depth = 0) => {
    if (depth > 4 || source === undefined || source === null) {
      return {}
    }

    if (typeof source === 'string') {
      try {
        return visit(JSON.parse(source), depth + 1)
      } catch {
        return {}
      }
    }

    if (Array.isArray(source)) {
      return visit(source[0], depth + 1)
    }

    if (typeof source !== 'object') {
      return {}
    }

    const hasCountField = Object.keys(source).some((key) => /cnt$/i.test(String(key)))
    if (hasCountField) {
      return source
    }

    for (const key of ['data', 'rows', 'list', 'records', 'result']) {
      const record = visit(source[key], depth + 1)
      if (Object.keys(record).length > 0) {
        return record
      }
    }

    return source
  }

  return visit(response)
}

const getSensitiveAppealPageData = (response) => {
  const data = response?.data && typeof response.data === 'object' && !Array.isArray(response.data)
    ? response.data
    : {}
  const rows = Array.isArray(data.rows)
    ? data.rows
    : Array.isArray(data.list)
      ? data.list
      : []
  return {
    rows,
    total: Math.max(safeNumber(data.totalNum ?? data.total ?? rows.length), 0),
    pageNum: Math.max(safeNumber(data.pageNum ?? data.page ?? 1), 1),
    pageSize: Math.max(safeNumber(data.pageSize ?? data.perPage ?? SENSITIVE_DEMAND_AUTO_DETAIL_PAGE_SIZE), 1),
  }
}

const mapSensitiveDemandTopUser = (item, index) => {
  const consNo = String(readFieldValue(item, ['cust_no', 'custNo', 'consNo', 'cons_no']) || '').trim()
  const consName = String(readFieldValue(item, ['cust_name', 'custName', 'consName', 'cons_name']) || '').trim()
  const phone = String(readFieldValue(item, ['calling_number', 'callingNumber', 'phone']) || '').trim()
  const typeCounts = sensitiveDemandAppealTypeMeta.reduce((result, meta) => {
    result[meta.key] = Math.max(safeNumber(readFieldValue(item, [meta.field, ...(meta.fieldAliases || []), meta.key])), 0)
    return result
  }, {})
  return {
    key: consNo || `${consName || 'sensitive-demand-user'}-${index}`,
    consNo,
    consName,
    phone,
    address: String(readFieldValue(item, ['addr', 'address']) || '').trim(),
    count: Math.max(safeNumber(readFieldValue(item, ['appeal_cnt', 'appealCnt', 'count'])), 0),
    typeCounts,
    demandContents: [],
    warningBasis: [],
  }
}

const mapSensitiveDemandAppealRecords = (records = []) =>
  records.map((item, index) => ({
    key: `${readFieldValue(item, ['cust_no', 'custNo', 'consNo', 'cons_no']) || 'appeal'}-${index}`,
    time: String(readFieldValue(item, ['acpt_time', 'acptTime', 'time']) || '').trim(),
    content: String(readFieldValue(item, ['acpt_cont', 'acptCont', 'content']) || '').trim(),
  })).filter((item) => item.time || item.content)

const mergeSensitiveDemandUserAppeals = (user, appealRows = []) => {
  const first = appealRows[0] || {}
  const demandContents = mapSensitiveDemandAppealRecords(appealRows)
  return {
    ...(user || {}),
    userAppealInfo: {
      consName: String(first.cust_name || '').trim(),
      consNo: String(first.cust_no || '').trim(),
      phone: String(first.calling_number || '').trim(),
      address: String(first.addr || '').trim(),
      appeals: appealRows.map((item, index) => ({
        key: `${String(item.cust_no || 'appeal').trim()}-${index}`,
        time: String(item.acpt_time || '').trim(),
        content: String(item.acpt_cont || '').trim(),
      })).filter((item) => item.time || item.content),
    },
    consNo: String(readFieldValue(first, ['cust_no', 'custNo', 'consNo', 'cons_no']) || user?.consNo || '').trim(),
    consName: String(readFieldValue(first, ['cust_name', 'custName', 'consName', 'cons_name']) || user?.consName || '').trim(),
    phone: String(readFieldValue(first, ['calling_number', 'callingNumber', 'phone']) || user?.phone || '').trim(),
    address: String(readFieldValue(first, ['addr', 'address']) || user?.address || '').trim(),
    demandContents,
    warningBasis: [],
  }
}

const loadSensitiveDemandUserAppeals = async (user) => {
  const requestId = ++sensitiveDemandUserAppealRequestId
  if (!user) {
    intelligentAnalysisSelectedUser.value = null
    return
  }

  intelligentAnalysisSelectedUser.value = user
  if (!sensitiveDemandDatePayload.value) {
    return
  }

  const payload = {
    ...sensitiveDemandDatePayload.value,
  }
  if (user.consNo) {
    payload.cust_no = user.consNo
  } else if (user.consName) {
    payload.cust_name = user.consName
  } else {
    return
  }

  try {
    const response = await querySensitiveAppealUserAppeals(payload)
    if (requestId !== sensitiveDemandUserAppealRequestId) {
      return
    }
    const rows = getSensitiveAppealArrayData(response)
    intelligentAnalysisSelectedUser.value = rows.length
      ? mergeSensitiveDemandUserAppeals(user, rows)
      : user
  } catch (error) {
    if (requestId === sensitiveDemandUserAppealRequestId) {
      console.error(error)
      intelligentAnalysisSelectedUser.value = user
    }
  }
}

const searchIntelligentAnalysisUser = async () => {
  const rawKeyword = String(intelligentAnalysisSearchInput.value || '').trim()
  const keyword = rawKeyword.toLowerCase()
  if (!keyword) {
    await loadSensitiveDemandUserAppeals(sensitiveDemandTopUsers.value[0] || null)
    return
  }

  const matchedUser = sensitiveDemandTopUsers.value.find((item) => {
    const consNo = String(item.consNo || '').toLowerCase()
    const consName = String(item.consName || '').toLowerCase()
    return consNo.includes(keyword) || consName.includes(keyword)
  })

  if (!sensitiveDemandDatePayload.value) {
    intelligentAnalysisSelectedUser.value = matchedUser || null
    return
  }

  const payload = {
    ...sensitiveDemandDatePayload.value,
  }
  if (matchedUser?.consNo) {
    payload.cust_no = matchedUser.consNo
  } else if (/^\d+$/.test(rawKeyword)) {
    payload.cust_no = rawKeyword
  } else {
    payload.cust_name = rawKeyword
  }

  try {
    const response = await querySensitiveAppealUserAppeals(payload)
    const rows = getSensitiveAppealArrayData(response)
    intelligentAnalysisSelectedUser.value = rows.length
      ? mergeSensitiveDemandUserAppeals(matchedUser || null, rows)
      : null
  } catch (error) {
    console.error(error)
    intelligentAnalysisSelectedUser.value = null
  }
}

const clearIntelligentAnalysisUserSearch = () => {
  void loadSensitiveDemandUserAppeals(sensitiveDemandTopUsers.value[0] || null)
}

const sensitiveDemandTypeRows = computed(() =>
  sensitiveDemandAppealTypeMeta.map((item) => ({
    ...item,
    count: Math.max(safeNumber(selectedSensitiveDemandUser.value?.typeCounts?.[item.key]), 0),
  })),
)

const sensitiveDemandTypeTotal = computed(() =>
  sensitiveDemandTypeRows.value.reduce((sum, item) => sum + Math.max(safeNumber(item.count), 0), 0),
)

const activeSensitiveDemandTypeKey = ref('')

const sensitiveDemandPieBackground = computed(() => buildPieBackground(sensitiveDemandTypeRows.value.map((item) => ({
  ...item,
  rate: sensitiveDemandTypeTotal.value ? (item.count / sensitiveDemandTypeTotal.value) * 100 : 0,
}))))

const sensitiveDemandPieSegments = computed(() => {
  let cursor = 0
  return sensitiveDemandTypeRows.value
    .map((item) => {
      const value = sensitiveDemandTypeTotal.value ? (item.count / sensitiveDemandTypeTotal.value) * 100 : 0
      const start = cursor
      cursor = Math.min(100, cursor + value)
      return {
        ...item,
        start,
        value,
      }
    })
    .filter((item) => item.value > 0)
})

const activeSensitiveDemandType = computed(() =>
  sensitiveDemandTypeRows.value.find((item) => item.key === activeSensitiveDemandTypeKey.value) || null,
)

const sensitiveDemandPieCenterValue = computed(() =>
  activeSensitiveDemandType.value?.count ?? sensitiveDemandTypeTotal.value,
)

const sensitiveDemandPieCenterLabel = computed(() =>
  activeSensitiveDemandType.value
    ? `${activeSensitiveDemandType.value.label} ${
      sensitiveDemandTypeTotal.value
        ? ((Math.max(safeNumber(activeSensitiveDemandType.value.count), 0) / sensitiveDemandTypeTotal.value) * 100).toFixed(1)
        : '0.0'
    }%`
    : '诉求次数',
)

const sensitiveDemandUserTagCounts = computed(() => sensitiveDemandUserTagCountsData.value)

const sensitiveDemandUserTagTotal = computed(() => {
  const counts = sensitiveDemandUserTagCounts.value
  return sensitiveDemandUserTagMeta.reduce((sum, item) => sum + Math.max(safeNumber(counts[item.key]), 0), 0)
})

const sensitiveDemandUserTagRows = computed(() => {
  const counts = sensitiveDemandUserTagCounts.value
  return sensitiveDemandUserTagMeta.map((item) => {
    const count = Math.max(safeNumber(counts[item.key]), 0)
    return {
      ...item,
      count,
      rate: sensitiveDemandUserTagTotal.value ? (count / sensitiveDemandUserTagTotal.value) * 100 : 0,
    }
  })
})

const sensitiveDemandUserTagPieBackground = computed(() =>
  buildPieBackground(sensitiveDemandUserTagRows.value),
)

const activeSensitiveDemandUserTagKey = ref('')

const sensitiveDemandUserTagPieSegments = computed(() => {
  let cursor = 0
  return sensitiveDemandUserTagRows.value
    .map((item) => {
      const value = Math.max(0, Number(item.rate) || 0)
      const start = cursor
      cursor = Math.min(100, cursor + value)
      return {
        ...item,
        start,
        value,
      }
    })
    .filter((item) => item.value > 0)
})

const activeSensitiveDemandUserTag = computed(() =>
  sensitiveDemandUserTagRows.value.find((item) => item.key === activeSensitiveDemandUserTagKey.value) || null,
)

const sensitiveDemandUserTagPieCenterValue = computed(() =>
  activeSensitiveDemandUserTag.value?.count ?? sensitiveDemandUserTagTotal.value,
)

const sensitiveDemandUserTagPieCenterLabel = computed(() =>
  activeSensitiveDemandUserTag.value
    ? `${activeSensitiveDemandUserTag.value.label} ${
      sensitiveDemandUserTagTotal.value
        ? ((Math.max(safeNumber(activeSensitiveDemandUserTag.value.count), 0) / sensitiveDemandUserTagTotal.value) * 100).toFixed(1)
        : '0.0'
    }%`
    : '诉求用户',
)

const sensitiveDemandAutoDetailGroups = computed(() =>
  sensitiveDemandAutoDetailMeta.map((group) => {
    const sourceRows = sensitiveDemandUserTypeRowsData.value[group.key] || []
    const total = sourceRows.reduce((sum, item) => sum + Math.max(safeNumber(item.count), 0), 0)
    const rows = sourceRows.map((item) => {
      const count = Math.max(safeNumber(item.count), 0)
      const rate = total ? (count / total) * 100 : 0
      return {
        ...item,
        count,
        rate,
        rateText: `${rate.toFixed(1)}%`,
      }
    })
    return {
      ...group,
      total,
      rows,
      pieBackground: buildSeparatedPieBackground(rows),
    }
  }),
)

const selectedSensitiveDemandAutoDetailGroup = computed(() =>
  sensitiveDemandAutoDetailGroups.value.find((item) => item.key === selectedSensitiveDemandAutoDetailKey.value) ||
    sensitiveDemandAutoDetailGroups.value[0],
)

const activeSensitiveDemandAutoDetailCategoryKey = ref('')

const sensitiveDemandAutoDetailPieSegments = computed(() => {
  let cursor = 0
  return (selectedSensitiveDemandAutoDetailGroup.value?.rows || [])
    .map((item) => {
      const value = Math.max(0, Number(item.rate) || 0)
      const start = cursor
      cursor = Math.min(100, cursor + value)
      return {
        ...item,
        start,
        value,
      }
    })
    .filter((item) => item.value > 0)
})

const activeSensitiveDemandAutoDetailCategory = computed(() =>
  selectedSensitiveDemandAutoDetailGroup.value?.rows.find(
    (item) => item.key === activeSensitiveDemandAutoDetailCategoryKey.value,
  ) || null,
)

const sensitiveDemandAutoDetailPieCenterValue = computed(() =>
  activeSensitiveDemandAutoDetailCategory.value?.count ?? selectedSensitiveDemandAutoDetailGroup.value?.total ?? 0,
)

const sensitiveDemandAutoDetailPieCenterLabel = computed(() =>
  activeSensitiveDemandAutoDetailCategory.value
    ? `${activeSensitiveDemandAutoDetailCategory.value.label} ${activeSensitiveDemandAutoDetailCategory.value.rateText}`
    : selectedSensitiveDemandAutoDetailGroup.value?.label ?? '',
)

const SENSITIVE_DEMAND_AUTO_DETAIL_PAGE_SIZE = 10
const selectedSensitiveDemandAutoDetailTableCategoryKey = ref('')
const sensitiveDemandAutoDetailSearchInput = ref('')
const sensitiveDemandAutoDetailSearchKeyword = ref('')
const sensitiveDemandAutoDetailCurrentPage = ref(1)
const sensitiveDemandAutoDetailJumpPageInput = ref('')
const selectedSensitiveDemandAutoDetailTableUser = ref(null)

const selectedSensitiveDemandAutoDetailTableCategory = computed(() =>
  selectedSensitiveDemandAutoDetailTableCategoryKey.value
    ? selectedSensitiveDemandAutoDetailGroup.value?.rows.find(
      (item) => item.key === selectedSensitiveDemandAutoDetailTableCategoryKey.value,
    ) || null
    : null,
)

const sensitiveDemandAutoDetailTableRows = computed(() => sensitiveDemandAutoDetailRows.value)

const filteredSensitiveDemandAutoDetailTableRows = computed(() => {
  const keyword = sensitiveDemandAutoDetailSearchKeyword.value.trim().toLowerCase()
  if (!keyword) {
    return sensitiveDemandAutoDetailTableRows.value
  }

  return sensitiveDemandAutoDetailTableRows.value.filter((item) =>
    item.consNo.toLowerCase().includes(keyword) ||
      item.consName.toLowerCase().includes(keyword),
  )
})

const sensitiveDemandAutoDetailTotalPages = computed(() =>
  Math.max(Math.ceil(sensitiveDemandAutoDetailTotal.value / SENSITIVE_DEMAND_AUTO_DETAIL_PAGE_SIZE), 1),
)

const sensitiveDemandAutoDetailPageRows = computed(() => filteredSensitiveDemandAutoDetailTableRows.value)

const sensitiveDemandAutoDetailPageButtons = computed(() => {
  const total = sensitiveDemandAutoDetailTotalPages.value
  const maxButtons = 5
  if (total <= maxButtons) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const half = Math.floor(maxButtons / 2)
  let start = sensitiveDemandAutoDetailCurrentPage.value - half
  let end = sensitiveDemandAutoDetailCurrentPage.value + half
  if (start < 1) {
    start = 1
    end = maxButtons
  }
  if (end > total) {
    end = total
    start = total - maxButtons + 1
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const applySensitiveDemandAutoDetailSearch = () => {
  sensitiveDemandAutoDetailSearchKeyword.value = sensitiveDemandAutoDetailSearchInput.value.trim()
  sensitiveDemandAutoDetailCurrentPage.value = 1
  sensitiveDemandAutoDetailJumpPageInput.value = ''
  void loadSensitiveDemandAutoDetailRows()
}

const goSensitiveDemandAutoDetailPage = (page) => {
  const target = Math.max(1, Math.min(sensitiveDemandAutoDetailTotalPages.value, Math.round(Number(page) || 1)))
  sensitiveDemandAutoDetailCurrentPage.value = target
}

const jumpToSensitiveDemandAutoDetailPage = () => {
  const input = String(sensitiveDemandAutoDetailJumpPageInput.value ?? '').trim()
  if (!input) {
    return
  }
  const parsed = Number(input)
  if (!Number.isFinite(parsed)) {
    return
  }
  goSensitiveDemandAutoDetailPage(parsed)
  sensitiveDemandAutoDetailJumpPageInput.value = String(sensitiveDemandAutoDetailCurrentPage.value)
}

const mapSensitiveDemandUserTypeCountRows = (groupKey, response) => {
  const record = getSensitiveAppealFirstRecord(response)
  return (sensitiveDemandUserTypeFieldMeta[groupKey] || [])
    .map((item) => ({
      ...item,
      count: Math.max(safeNumber(readFieldValue(record, [item.field, ...(item.fieldAliases || []), item.key])), 0),
    }))
}

const loadSensitiveDemandAutoDetailTypeCounts = async () => {
  const group = sensitiveDemandAutoDetailMeta.find((item) => item.key === selectedSensitiveDemandAutoDetailKey.value)
  if (!group?.typeCountQuery || !sensitiveDemandDatePayload.value) {
    return
  }

  const requestId = ++sensitiveDemandAutoDetailTypeCountRequestId
  try {
    const response = await group.typeCountQuery(sensitiveDemandDatePayload.value)
    if (requestId !== sensitiveDemandAutoDetailTypeCountRequestId) {
      return
    }
    sensitiveDemandUserTypeRowsData.value = {
      ...sensitiveDemandUserTypeRowsData.value,
      [group.key]: mapSensitiveDemandUserTypeCountRows(group.key, response),
    }
  } catch (error) {
    if (requestId === sensitiveDemandAutoDetailTypeCountRequestId) {
      console.error(error)
      sensitiveDemandUserTypeRowsData.value = {
        ...sensitiveDemandUserTypeRowsData.value,
        [group.key]: [],
      }
    }
  }
}

const mapSensitiveDemandAutoDetailRow = (item, index, group) => {
  const consNo = String(readFieldValue(item, ['cust_no', 'custNo', 'consNo', 'cons_no']) || '').trim()
  const consName = String(readFieldValue(item, ['cust_name', 'custName', 'consName', 'cons_name']) || '').trim()
  const phone = String(readFieldValue(item, ['calling_number', 'callingNumber', 'phone']) || '').trim()
  const userType = String(readFieldValue(item, [group?.typeNameField]) || '').trim()
  return {
    key: `${group?.key || 'user'}-${consNo || consName || index}-${index}`,
    consNo,
    consName,
    phone,
    userType,
    demandContents: [],
  }
}

const loadSensitiveDemandAutoDetailRows = async () => {
  const group = selectedSensitiveDemandAutoDetailGroup.value
  if (!group?.listQuery || !sensitiveDemandDatePayload.value) {
    sensitiveDemandAutoDetailRows.value = []
    sensitiveDemandAutoDetailTotal.value = 0
    return
  }

  const requestId = ++sensitiveDemandAutoDetailRequestId
  sensitiveDemandAutoDetailLoading.value = true
  sensitiveDemandAutoDetailError.value = ''
  const payload = {
    ...sensitiveDemandDatePayload.value,
    returnTotalNum: 'true',
    pageNum: String(sensitiveDemandAutoDetailCurrentPage.value),
    pageSize: String(SENSITIVE_DEMAND_AUTO_DETAIL_PAGE_SIZE),
  }
  const keyword = sensitiveDemandAutoDetailSearchKeyword.value.trim()
  if (keyword) {
    if (/^\d+$/.test(keyword)) {
      payload.cust_no = keyword
    } else {
      payload.cust_name = keyword
    }
  }

  const category = selectedSensitiveDemandAutoDetailTableCategory.value
  const categoryFilterValue = category?.filterValue || category?.label
  if (categoryFilterValue && group.filterField) {
    payload[group.filterField] = categoryFilterValue
  }

  try {
    const response = await group.listQuery(payload)
    if (requestId !== sensitiveDemandAutoDetailRequestId) {
      return
    }
    const result = getSensitiveAppealPageData(response)
    sensitiveDemandAutoDetailRows.value = result.rows.map((item, index) =>
      mapSensitiveDemandAutoDetailRow(item, index, group),
    )
    sensitiveDemandAutoDetailTotal.value = result.total
  } catch (error) {
    if (requestId !== sensitiveDemandAutoDetailRequestId) {
      return
    }
    console.error(error)
    sensitiveDemandAutoDetailRows.value = []
    sensitiveDemandAutoDetailTotal.value = 0
    sensitiveDemandAutoDetailError.value = error?.message || '客户诉求数据加载失败'
  } finally {
    if (requestId === sensitiveDemandAutoDetailRequestId) {
      sensitiveDemandAutoDetailLoading.value = false
    }
  }
}

const openSensitiveDemandAutoDetailTableUser = async (item) => {
  selectedSensitiveDemandAutoDetailTableUser.value = item
  const group = selectedSensitiveDemandAutoDetailGroup.value
  if (!item?.consNo || !group?.detailQuery || !sensitiveDemandDatePayload.value) {
    return
  }

  sensitiveDemandAutoDetailDetailLoading.value = true
  try {
    const response = await group.detailQuery({
      ...sensitiveDemandDatePayload.value,
      cust_no: item.consNo,
    })
    const rows = getSensitiveAppealArrayData(response)
    if (selectedSensitiveDemandAutoDetailTableUser.value?.key === item.key) {
      selectedSensitiveDemandAutoDetailTableUser.value = {
        ...item,
        demandContents: mapSensitiveDemandAppealRecords(rows),
      }
    }
  } catch (error) {
    console.error(error)
  } finally {
    sensitiveDemandAutoDetailDetailLoading.value = false
  }
}

const loadSensitiveDemandData = async (rangePayload) => {
  const datePayload = buildSensitiveAppealDatePayload(rangePayload)
  const dateKey = getSensitiveDemandDateKey(datePayload)
  sensitiveDemandDatePayload.value = datePayload
  sensitiveDemandTopUsersData.value = []
  sensitiveDemandUserTagCountsData.value = {
    important: 0,
    sensitive: 0,
    special: 0,
  }
  sensitiveDemandUserTypeRowsData.value = {
    important: [],
    sensitive: [],
    special: [],
  }
  sensitiveDemandAutoDetailRows.value = []
  sensitiveDemandAutoDetailTotal.value = 0
  selectedSensitiveDemandUserKey.value = ''
  intelligentAnalysisSelectedUser.value = null

  if (!datePayload) {
    sensitiveDemandRequestedDateKey.value = ''
    sensitiveDemandLoadedDateKey.value = ''
    return null
  }

  const requestId = ++sensitiveDemandRequestId
  sensitiveDemandRequestedDateKey.value = dateKey
  sensitiveDemandLoading.value = true
  sensitiveDemandError.value = ''

  try {
    const [
      topUsersResult,
      userTypeResult,
    ] = await Promise.allSettled([
      querySensitiveAppealTypeTop5(datePayload),
      querySensitiveAppealUserTypeCount(datePayload),
    ])

    if (requestId !== sensitiveDemandRequestId) {
      return null
    }

    if (topUsersResult.status === 'fulfilled') {
      sensitiveDemandTopUsersData.value = getSensitiveAppealArrayData(topUsersResult.value)
        .map((item, index) => mapSensitiveDemandTopUser(item, index))
        .filter((item) => item.consNo || item.consName)
      selectedSensitiveDemandUserKey.value = sensitiveDemandTopUsersData.value[0]?.key || ''
    }

    if (userTypeResult.status === 'fulfilled') {
      const record = getSensitiveAppealArrayData(userTypeResult.value)[0] || {}
      sensitiveDemandUserTagCountsData.value = {
        important: Math.max(safeNumber(readFieldValue(record, ['key_cnt', 'keyCnt'])), 0),
        sensitive: Math.max(safeNumber(readFieldValue(record, ['sensitive_cnt', 'sensitiveCnt'])), 0),
        special: Math.max(safeNumber(readFieldValue(record, ['spcl_cnt', 'spclCnt', 'special_cnt'])), 0),
      }
    }

    selectedSensitiveDemandAutoDetailTableCategoryKey.value = ''

    if (topUsersResult.status === 'rejected') {
      console.error(topUsersResult.reason)
      sensitiveDemandError.value = topUsersResult.reason?.message || '诉求归集TOP 5接口调用失败'
    }

    ;[
      userTypeResult,
    ].filter((result) => result.status === 'rejected')
      .forEach((result) => console.error(result.reason))

    if (showSensitiveDemandAutoDetail.value) {
      await loadSensitiveDemandAutoDetailTypeCounts()
      await loadSensitiveDemandAutoDetailRows()
    }

    sensitiveDemandLoadedDateKey.value = dateKey
  } catch (error) {
    if (requestId === sensitiveDemandRequestId) {
      console.error(error)
      sensitiveDemandError.value = error?.message || '敏感诉求接口调用失败'
    }
  } finally {
    if (requestId === sensitiveDemandRequestId) {
      sensitiveDemandLoading.value = false
    }
  }

  return null
}

watch(selectedSensitiveDemandAutoDetailKey, () => {
  activeSensitiveDemandAutoDetailCategoryKey.value = ''
  selectedSensitiveDemandAutoDetailTableCategoryKey.value = ''
  sensitiveDemandAutoDetailSearchInput.value = ''
  sensitiveDemandAutoDetailSearchKeyword.value = ''
  sensitiveDemandAutoDetailCurrentPage.value = 1
  sensitiveDemandAutoDetailJumpPageInput.value = ''
  selectedSensitiveDemandAutoDetailTableUser.value = null
  void loadSensitiveDemandAutoDetailTypeCounts()
  void loadSensitiveDemandAutoDetailRows()
})

watch(selectedSensitiveDemandAutoDetailTableCategoryKey, () => {
  sensitiveDemandAutoDetailCurrentPage.value = 1
  sensitiveDemandAutoDetailJumpPageInput.value = ''
  selectedSensitiveDemandAutoDetailTableUser.value = null
  void loadSensitiveDemandAutoDetailRows()
})

watch(selectedSensitiveDemandUserKey, () => {
  void loadSensitiveDemandUserAppeals(selectedSensitiveDemandUser.value)
})

watch(
  [
    () => getSensitiveDemandUserCustNo(intelligentAnalysisSelectedUser.value),
    () => sensitiveDemandDatePayload.value?.endTime || toSensitiveAppealDate(queryEndTime.value),
  ],
  ([custNo]) => {
    if (!custNo) {
      void loadEmotionEvolutionAnalysis(null)
      return
    }

    void loadEmotionEvolutionAnalysis(intelligentAnalysisSelectedUser.value)
  },
)

watch(
  [
    () => getSensitiveDemandUserCustNo(intelligentAnalysisSelectedUser.value),
    () => sensitiveDemandDatePayload.value?.endTime || toSensitiveAppealDate(queryEndTime.value),
  ],
  ([custNo]) => {
    if (!custNo) {
      void loadIntelligentWarning(null)
      return
    }

    void loadIntelligentWarning(intelligentAnalysisSelectedUser.value)
  },
)

watch(
  [
    () => getSensitiveDemandUserCustNo(intelligentAnalysisSelectedUser.value),
    () => sensitiveDemandDatePayload.value?.endTime || toSensitiveAppealDate(queryEndTime.value),
  ],
  ([custNo]) => {
    if (!custNo) {
      void loadIntelligentReceipt(null)
      return
    }

    void loadIntelligentReceipt(intelligentAnalysisSelectedUser.value)
  },
)

watch(showSensitiveDemandAutoDetail, (visible) => {
  if (visible) {
    sensitiveDemandAutoDetailSearchInput.value = ''
    sensitiveDemandAutoDetailSearchKeyword.value = ''
    if (selectedSensitiveDemandAutoDetailKey.value !== 'sensitive') {
      selectedSensitiveDemandAutoDetailKey.value = 'sensitive'
      return
    }
    void loadSensitiveDemandAutoDetailTypeCounts()
    void loadSensitiveDemandAutoDetailRows()
  }
})

watch(sensitiveDemandAutoDetailCurrentPage, () => {
  void loadSensitiveDemandAutoDetailRows()
})

const outageRangeChains = computed(() => {
  return outageRangeChainsData.value
})

const outageNatureText = (value) => {
  const plain = String(value || '').trim()
  if (plain === '01' || plain === '1') {
    return '计划停电'
  }
  if (plain === '02' || plain === '2') {
    return '故障停电'
  }
  if (plain.includes('计划')) {
    return '计划停电'
  }
  if (plain.includes('故障')) {
    return '故障停电'
  }
  return '其他'
}

const KEY_USER_PIE_COLOR_SET = [
  '#3ed6ff',
  '#66f7c8',
  '#f6c35f',
  '#ff8f7d',
  '#8aa2ff',
  '#f490ff',
  '#7be28f',
  '#f7a26a',
]

const buildPieBackground = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 'conic-gradient(rgba(124, 166, 201, 0.24) 0% 100%)'
  }

  let cursor = 0
  const segments = items.map((item) => {
    const start = cursor
    const step = Math.max(0, Number(item.rate) || 0)
    cursor = Math.min(100, cursor + step)
    return `${item.color} ${start}% ${cursor}%`
  })

  if (cursor < 100) {
    segments.push(`rgba(124, 166, 201, 0.24) ${cursor}% 100%`)
  }

  return `conic-gradient(${segments.join(', ')})`
}

const buildSeparatedPieBackground = (items = [], gap = 0.8) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 'conic-gradient(rgba(124, 166, 201, 0.24) 0% 100%)'
  }

  let cursor = 0
  const separatorColor = 'rgba(2, 13, 28, 0.82)'
  const segments = []

  items.forEach((item) => {
    const start = cursor
    const step = Math.max(0, Number(item.rate) || 0)
    const end = Math.min(100, cursor + step)
    const separatorWidth = step > gap * 2 ? gap : 0
    const colorEnd = Math.max(start, end - separatorWidth)

    if (step > 0) {
      segments.push(`${item.color} ${start}% ${colorEnd}%`)
      if (separatorWidth > 0) {
        segments.push(`${separatorColor} ${colorEnd}% ${end}%`)
      }
    }

    cursor = end
  })

  if (cursor < 100) {
    segments.push(`rgba(124, 166, 201, 0.24) ${cursor}% 100%`)
  }

  return segments.length
    ? `conic-gradient(${segments.join(', ')})`
    : 'conic-gradient(rgba(124, 166, 201, 0.24) 0% 100%)'
}

const keyUserCountyStats = computed(() => {
  const totalUsers = Math.max(tagStats.value.total, 0)
  return countyStatsRows.value.map((item) => {
    const countyName = normalizeCountyName(item?.name || '')
    const keyUserCount = safeNumber(item?.importantCount)
    const ratio = toPercent(keyUserCount, totalUsers)
    return {
      countyName,
      keyUserCount,
      ratio,
      ratioText: `${ratio}%`,
    }
  })
})

const buildKeyUserDetailBasePayload = () => {
  const beginTime = toBackendDateTime(queryStartTime.value)
  const endTime = toBackendDateTime(queryEndTime.value)
  if (!beginTime || !endTime) {
    return null
  }

  const payload = {
    beginTime,
    endTime,
  }
  appendCountyOrCityScope(payload)

  if (countyUserListSnapshotDate) {
    payload.snapshotDate = countyUserListSnapshotDate
  } else {
    if (countyUserListSnapshotStartDate) {
      payload.snapshotStartDate = countyUserListSnapshotStartDate
    }
    if (countyUserListSnapshotEndDate) {
      payload.snapshotEndDate = countyUserListSnapshotEndDate
    }
  }

  if (countyUserListOutageCounts.has(countyUserListOutageCount)) {
    payload.outageCount = countyUserListOutageCount
  }

  return payload
}

const buildKeyUserTagsChartPayload = () => {
  const beginTime = formatBackendDate(toBackendDateTime(queryStartTime.value))
  const endTime = formatBackendDate(toBackendDateTime(queryEndTime.value))
  if (!beginTime || !endTime) {
    return null
  }

  return appendCountyOrCityScope({
    beginTime,
    endTime,
  })
}

const buildKeyUserTagsListPayload = () => {
  const payload = buildKeyUserTagsChartPayload()
  if (!payload) {
    return null
  }

  const selectedFilterValue = String(keyUserDetailSelectedFilterValue.value || '').trim()
  const isFrequencyFilter = KEY_USER_FREQUENCY_FILTER_VALUES.has(selectedFilterValue)
  payload.pageNum = isFrequencyFilter ? '1' : String(keyUserDetailCurrentPage.value)
  payload.pageSize = String(isFrequencyFilter ? KEY_USER_FREQUENCY_FILTER_PAGE_SIZE : KEY_USER_DETAIL_ROWS_PER_PAGE)
  payload.returnTotalNum = 'true'

  const keyword = keyUserDetailSearchKeyword.value.trim()
  if (keyword) {
    if (/^\d+$/.test(keyword)) {
      payload.custNo = keyword
    } else {
      payload.custName = keyword
    }
  }

  if (KEY_USER_FILTER_VALUES.has(selectedFilterValue)) {
    payload.isKey = '1'
  } else if (selectedFilterValue === 'sensitive') {
    payload.isSen = '1'
  }

  return payload
}

const resolveKeyUserTagsChartRows = (response) => {
  let data = response?.data
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return []
    }
  }

  if (Array.isArray(data)) {
    return data
  }
  if (Array.isArray(data?.list)) {
    return data.list
  }
  if (Array.isArray(data?.rows)) {
    return data.rows
  }
  if (Array.isArray(data?.data)) {
    return data.data
  }
  return []
}

const toUserTagsChartCount = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(value, 0)
  }

  const normalized = String(value ?? '').trim().replaceAll(',', '')
  const direct = Number(normalized)
  if (Number.isFinite(direct)) {
    return Math.max(direct, 0)
  }

  const matched = normalized.match(/\d+(?:\.\d+)?/)
  return matched ? Math.max(Number(matched[0]) || 0, 0) : 0
}

const mapKeyUserDetailStats = (response) => {
  const rows = resolveKeyUserTagsChartRows(response)
  const keyUserByTrade = rows.map((item) => ({
    tradeName: String(readFieldValue(item, ['tradeName', 'trade_name', 'label', 'name']) || '').trim() || '未知行业',
    userCount: toUserTagsChartCount(
      readFieldValue(item, ['keyUsersCnt', 'key_users_cnt', 'keyUserCnt', 'key_user_cnt', 'keyUsersCount', 'keyUsers']),
    ),
  }))
  const sensitiveUserByTrade = rows.map((item) => ({
    tradeName: String(readFieldValue(item, ['tradeName', 'trade_name', 'label', 'name']) || '').trim() || '未知行业',
    userCount: Math.max(
      safeNumber(readFieldValue(item, ['sensitiveUsersCnt', 'sensitive_users_cnt', 'sensitiveUsers', 'sensitive_users'])),
      0,
    ),
  }))

  return {
    summary: {
      keyUsers: keyUserByTrade.reduce((sum, item) => sum + item.userCount, 0),
      sensitiveUsers: sensitiveUserByTrade.reduce((sum, item) => sum + item.userCount, 0),
    },
    keyUserByTrade,
    sensitiveUserByTrade,
    outageNatureDistribution: [],
  }
}

const isKeyUserDetailMockDate = (payload) =>
  payload?.beginTime === KEY_USER_DETAIL_MOCK_DATE && payload?.endTime === KEY_USER_DETAIL_MOCK_DATE

const withKeyUserDetailMockStats = (stats, payload) => {
  if (!isKeyUserDetailMockDate(payload) || safeNumber(stats?.summary?.keyUsers) > 0) {
    return stats
  }

  return {
    ...stats,
    summary: {
      ...stats.summary,
      keyUsers: KEY_USER_DETAIL_MOCK_ROWS.length,
    },
    keyUserByTrade: KEY_USER_DETAIL_MOCK_TRADE_DISTRIBUTION.map((item) => ({ ...item })),
  }
}

const mapCountyUserListResult = (response) => {
  let data = response?.data
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      data = {}
    }
  }
  data = data && typeof data === 'object' && !Array.isArray(data)
    ? data
    : {}
  const list = Array.isArray(data?.rows)
    ? data.rows
    : Array.isArray(data?.list)
      ? data.list
      : Array.isArray(data?.data)
        ? data.data
        : []
  return {
    list,
    total: Math.max(safeNumber(data?.totalNum ?? data?.total ?? list.length), 0),
    page: Math.max(safeNumber(data?.pageNum ?? data?.page), 1),
    perPage: Math.max(safeNumber(data?.pageSize ?? data?.perPage), 0),
  }
}

const buildKeyUserDetailMockListResult = (payload) => {
  const keyword = String(payload?.custNo || payload?.custName || '').trim().toLowerCase()
  const filteredRows = keyword
    ? KEY_USER_DETAIL_MOCK_ROWS.filter((item) =>
      item.consNo.toLowerCase().includes(keyword) || item.consName.toLowerCase().includes(keyword),
    )
    : KEY_USER_DETAIL_MOCK_ROWS
  const page = Math.max(safeNumber(payload?.pageNum), 1)
  const perPage = Math.max(safeNumber(payload?.pageSize), KEY_USER_DETAIL_ROWS_PER_PAGE)
  const start = (page - 1) * perPage

  return {
    list: filteredRows.slice(start, start + perPage),
    total: filteredRows.length,
    page,
    perPage,
  }
}

const loadKeyUserDetailStats = async () => {
  const payload = buildKeyUserTagsChartPayload()
  if (!payload) {
    keyUserDetailStatsData.value = {
      summary: null,
      keyUserByTrade: [],
      sensitiveUserByTrade: [],
      outageNatureDistribution: [],
    }
    keyUserDetailStatsLoadingCount.value = 0
    return
  }

  const requestId = keyUserDetailStatsRequestId + 1
  keyUserDetailStatsRequestId = requestId
  keyUserDetailStatsLoadingCount.value += 1
  try {
    const response = await queryOutageUserTagsChart(payload)
    if (requestId !== keyUserDetailStatsRequestId) {
      return
    }
    keyUserDetailStatsData.value = withKeyUserDetailMockStats(mapKeyUserDetailStats(response), payload)
  } catch {
    if (requestId !== keyUserDetailStatsRequestId) {
      return
    }
    keyUserDetailStatsData.value = withKeyUserDetailMockStats({
      summary: null,
      keyUserByTrade: [],
      sensitiveUserByTrade: [],
      outageNatureDistribution: [],
    }, payload)
  } finally {
    if (requestId === keyUserDetailStatsRequestId) {
      keyUserDetailStatsLoadingCount.value = Math.max(keyUserDetailStatsLoadingCount.value - 1, 0)
    }
  }
}

const mapKeyUserDetailRow = (item, index) => {
  const isSensitive = toBooleanFlag(
    readFieldValue(item, ['isSen', 'is_sen', 'isSensitiveUser', 'is_sensitive_user', 'sensitiveUser', 'sensitive_user']),
  )
  const isKey = toBooleanFlag(
    readFieldValue(item, ['isKey', 'is_key', 'isKeyUser', 'is_key_user', 'keyUser', 'key_user']),
  )
  const consNo = String(readFieldValue(item, ['consNo', 'cons_no', 'custNo', 'cust_no', 'userNo', 'user_no']) || '').trim() || '-'
  const consName = String(readFieldValue(item, ['consName', 'cons_name', 'custName', 'cust_name', 'userName', 'user_name']) || '').trim() || '-'
  const countyName = toCountyDisplayName(
    readFieldValue(item, ['countyName', 'county_name', 'rdtCountyName', 'rdt_county_name']) || '-',
  ) || '-'
  const tradeName = String(readFieldValue(item, ['tradeName', 'trade_name', 'industryName', 'industry_name']) || '').trim()
  const outageNumber = String(extractOutageNumberParam(item) || '').trim()
  const outageNature = readFieldValue(item, ['custTypeName', 'cust_type_name', 'outageNature', 'outage_nature', 'outageType', 'outage_type'])
  const frequencySeed = Array.from(consNo).reduce(
    (total, character, characterIndex) => total + character.charCodeAt(0) * (characterIndex + 1),
    0,
  )
  const weeklyOutageCountRaw = readFieldValue(item, [
    'weeklyOutageCount',
    'weekly_outage_count',
    'weekOutageCount',
    'week_outage_count',
  ])
  const consecutiveOutageDaysRaw = readFieldValue(item, [
    'consecutiveOutageDays',
    'consecutive_outage_days',
    'continuousOutageDays',
    'continuous_outage_days',
  ])
  const weeklyOutageCount = weeklyOutageCountRaw === undefined || weeklyOutageCountRaw === null || weeklyOutageCountRaw === ''
    ? frequencySeed % 5
    : Math.max(safeNumber(weeklyOutageCountRaw), 0)
  const consecutiveOutageDays = consecutiveOutageDaysRaw === undefined || consecutiveOutageDaysRaw === null || consecutiveOutageDaysRaw === ''
    ? Math.floor(frequencySeed / 5) % 4
    : Math.max(safeNumber(consecutiveOutageDaysRaw), 0)
  const keyUserLevel = isSensitive && isKey ? '重点+敏感' : (isSensitive ? '敏感' : (isKey ? '重点' : '-'))
  return {
    id: `${consNo}-${index}`,
    consNo,
    consName,
    countyName,
    tradeName: tradeName || '未知行业',
    keyUserLevel,
    isKey,
    isSensitive,
    consAddr: String(readFieldValue(item, ['consAddr', 'cons_addr', 'address', 'addr']) || '-').trim() || '-',
    outageNature: String(outageNature || '').trim() || '-',
    equipmentName: '-',
    tgName: '-',
    meterId: '-',
    outageNumber,
    weeklyOutageCount,
    consecutiveOutageDays,
    isFrequentOutage: consecutiveOutageDays >= 3 || weeklyOutageCount >= 3,
  }
}

const filterKeyUserRowsBySelectedValue = (rows, selectedFilterValue) => {
  if (KEY_USER_FILTER_VALUES.has(selectedFilterValue)) {
    const keyUserRows = rows.filter((item) => item.isKey)
    if (selectedFilterValue === 'key-frequent') {
      return keyUserRows.filter((item) => item.isFrequentOutage)
    }
    if (selectedFilterValue === 'key-non-frequent') {
      return keyUserRows.filter((item) => !item.isFrequentOutage)
    }
    return keyUserRows
  }
  if (selectedFilterValue === 'sensitive') {
    return rows.filter((item) => item.isSensitive)
  }
  return rows
}

const resolveCountyUserOutageNumber = (record) => {
  const outageNumber = String(
    readFieldValue(record, [
      'outageNumber',
      'outage_number',
      'outageNo',
      'outage_no',
      'outageNum',
      'outage_num',
      'eventNo',
      'event_no',
      'eventNumber',
      'event_number',
      'outageId',
      'outage_id',
    ]) || '',
  ).trim()

  if (outageNumber) {
    return outageNumber
  }

  return String(extractOutageNumberParam(record) || '').trim()
}

const matchKeyUserRowOutageNumber = (item) => {
  const directOutageNumber = resolveCountyUserOutageNumber(item)
  if (directOutageNumber) {
    return directOutageNumber
  }

  const consNo = String(item?.consNo || '').trim()
  if (!consNo) {
    return ''
  }

  const targetCounty = normalizeCountyName(item?.countyName || '')
  const targetTradeName = String(item?.tradeName || '').trim()
  const targetNatureText = outageNatureText(item?.outageNature || '')
  let fallbackOutageNumber = ''

  const sourceCandidates = [
    ...outageUsersBySelectedCounty.value,
    ...tagAndKeyUserSourceUsers.value,
    ...outageUsers.value,
  ]

  for (const sourceUser of sourceCandidates) {
    const record = normalizeUserRecord(sourceUser)
    const recordConsNo = String(readFieldValue(record, ['consNo', 'cons_no', 'userNo', 'userId']) || '').trim()
    if (recordConsNo !== consNo) {
      continue
    }

    const recordOutageNumber = resolveCountyUserOutageNumber(record)
    if (!recordOutageNumber) {
      continue
    }
    if (!fallbackOutageNumber) {
      fallbackOutageNumber = recordOutageNumber
    }

    const recordCounty = normalizeCountyName(
      readFieldValue(record, ['rdtCountyName', 'rdt_county_name', 'countyName', 'county_name']),
    )
    const recordTradeName = String(readFieldValue(record, ['tradeName', 'trade_name', 'industryName']) || '').trim()
    const recordNatureText = outageNatureText(
      readFieldValue(record, ['outageNature', 'outage_nature', 'outageTypeName', 'outage_type_name']),
    )

    const countyMatched = !targetCounty || !recordCounty || recordCounty === targetCounty
    const tradeMatched = !targetTradeName || !recordTradeName || recordTradeName === targetTradeName
    const natureMatched = targetNatureText === '其他' || recordNatureText === '其他' || recordNatureText === targetNatureText

    if (countyMatched && tradeMatched && natureMatched) {
      return recordOutageNumber
    }
  }

  return fallbackOutageNumber
}

const loadKeyUserDetailRows = async () => {
  const payload = buildKeyUserTagsListPayload()
  if (!payload) {
    keyUserDetailListRequestId += 1
    keyUserDetailRows.value = []
    keyUserDetailTotal.value = 0
    keyUserDetailLoading.value = false
    return
  }

  const requestId = keyUserDetailListRequestId + 1
  keyUserDetailListRequestId = requestId
  keyUserDetailLoading.value = true

  try {
    const response = await queryOutageUserTags(payload)
    if (requestId !== keyUserDetailListRequestId) {
      return
    }

    let result = mapCountyUserListResult(response)
    const selectedFilterValue = String(keyUserDetailSelectedFilterValue.value || '').trim()
    let rows = result.list.map((item, index) => mapKeyUserDetailRow(item, index))
    let filteredRows = filterKeyUserRowsBySelectedValue(rows, selectedFilterValue)
    if (
      isKeyUserDetailMockDate(payload)
      && KEY_USER_FILTER_VALUES.has(selectedFilterValue)
      && !rows.some((item) => item.isKey)
    ) {
      result = buildKeyUserDetailMockListResult(payload)
      rows = result.list.map((item, index) => mapKeyUserDetailRow(item, index))
      filteredRows = filterKeyUserRowsBySelectedValue(rows, selectedFilterValue)
    }
    if (KEY_USER_FREQUENCY_FILTER_VALUES.has(selectedFilterValue)) {
      const start = (keyUserDetailCurrentPage.value - 1) * KEY_USER_DETAIL_ROWS_PER_PAGE
      keyUserDetailRows.value = filteredRows.slice(start, start + KEY_USER_DETAIL_ROWS_PER_PAGE)
      keyUserDetailTotal.value = filteredRows.length
    } else {
      keyUserDetailRows.value = filteredRows
      keyUserDetailTotal.value = filteredRows.length < rows.length ? filteredRows.length : result.total
    }

    const perPage = KEY_USER_FREQUENCY_FILTER_VALUES.has(selectedFilterValue)
      ? KEY_USER_DETAIL_ROWS_PER_PAGE
      : (result.perPage > 0 ? result.perPage : KEY_USER_DETAIL_ROWS_PER_PAGE)
    const totalPages = Math.max(Math.ceil(keyUserDetailTotal.value / perPage), 1)
    if (keyUserDetailCurrentPage.value > totalPages) {
      keyUserDetailCurrentPage.value = totalPages
    }
  } catch {
    if (requestId !== keyUserDetailListRequestId) {
      return
    }
    const selectedFilterValue = String(keyUserDetailSelectedFilterValue.value || '').trim()
    if (
      isKeyUserDetailMockDate(payload)
      && KEY_USER_FILTER_VALUES.has(selectedFilterValue)
    ) {
      const result = buildKeyUserDetailMockListResult(payload)
      const rows = result.list.map((item, index) => mapKeyUserDetailRow(item, index))
      const filteredRows = filterKeyUserRowsBySelectedValue(rows, selectedFilterValue)
      if (KEY_USER_FREQUENCY_FILTER_VALUES.has(selectedFilterValue)) {
        const start = (keyUserDetailCurrentPage.value - 1) * KEY_USER_DETAIL_ROWS_PER_PAGE
        keyUserDetailRows.value = filteredRows.slice(start, start + KEY_USER_DETAIL_ROWS_PER_PAGE)
        keyUserDetailTotal.value = filteredRows.length
      } else {
        keyUserDetailRows.value = filteredRows
        keyUserDetailTotal.value = result.total
      }
    } else {
      keyUserDetailRows.value = []
      keyUserDetailTotal.value = 0
    }
  } finally {
    if (requestId === keyUserDetailListRequestId) {
      keyUserDetailLoading.value = false
    }
  }
}

const keyUserNaturePieData = computed(() => {
  const natureList = keyUserDetailStatsData.value.outageNatureDistribution
  const summaryTotal = safeNumber(keyUserDetailStatsData.value?.summary?.total)
  const totalFromItems = natureList.reduce((sum, item) => sum + Math.max(safeNumber(item?.userCount), 0), 0)
  const total = Math.max(summaryTotal, totalFromItems)

  return natureList.map((item) => {
    const label = String(item?.outageNature || '').trim() || '其他'
    const count = Math.max(safeNumber(item?.userCount), 0)
    const percentageRaw = item?.percentage
    const rate = percentageRaw !== undefined && percentageRaw !== null
      ? Math.max(safeNumber(percentageRaw), 0)
      : toPercent(count, total)
    const normalized = outageNatureText(label)
    const color = normalized === '故障停电' ? '#ff5a5f' : (normalized === '计划停电' ? '#4bfbac' : '#3a8dff')
    return {
      key: label,
      label: normalized,
      count,
      rate,
      color,
      rateText: `${rate}%`,
    }
  })
})

const keyUserNaturePieBackground = computed(() => buildPieBackground(keyUserNaturePieData.value))

const keyUserIndustryPieData = computed(() => {
  const list = keyUserDetailStatsData.value.keyUserByTrade
  const summaryTotal = safeNumber(keyUserDetailStatsData.value?.summary?.keyUsers)
  const totalFromItems = list.reduce((sum, item) => sum + Math.max(safeNumber(item?.userCount), 0), 0)
  const total = Math.max(summaryTotal, totalFromItems)
  if (total <= 0) {
    return []
  }

  return list
    .map((item) => ({
      key: String(item?.tradeType || item?.tradeName || ''),
      label: String(item?.tradeName || '').trim() || '未知行业',
      count: Math.max(safeNumber(item?.userCount), 0),
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((item, index) => {
      const rate = toPercent(item.count, total)
      return {
        ...item,
        rate,
        rateText: `${rate}%`,
        color: KEY_USER_PIE_COLOR_SET[index % KEY_USER_PIE_COLOR_SET.length],
      }
    })
})

const keyUserIndustryTotal = computed(() => {
  const summaryTotal = safeNumber(keyUserDetailStatsData.value?.summary?.keyUsers)
  if (summaryTotal > 0) {
    return summaryTotal
  }
  return keyUserIndustryPieData.value.reduce((sum, item) => sum + item.count, 0)
})

const keyUserIndustryPieBackground = computed(() => buildPieBackground(keyUserIndustryPieData.value))

const sensitiveUserIndustryPieData = computed(() => {
  const list = keyUserDetailStatsData.value.sensitiveUserByTrade
  const summaryTotal = safeNumber(keyUserDetailStatsData.value?.summary?.sensitiveUsers)
  const totalFromItems = list.reduce((sum, item) => sum + Math.max(safeNumber(item?.userCount), 0), 0)
  const total = Math.max(summaryTotal, totalFromItems)
  if (total <= 0) {
    return []
  }

  return list
    .map((item) => ({
      key: String(item?.tradeType || item?.tradeName || ''),
      label: String(item?.tradeName || '').trim() || '未知行业',
      count: Math.max(safeNumber(item?.userCount), 0),
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((item, index) => {
      const rate = toPercent(item.count, total)
      return {
        ...item,
        rate,
        rateText: `${rate}%`,
        color: KEY_USER_PIE_COLOR_SET[index % KEY_USER_PIE_COLOR_SET.length],
      }
    })
})

const sensitiveUserIndustryPieBackground = computed(() => buildPieBackground(sensitiveUserIndustryPieData.value))
const sensitiveUserIndustryTotal = computed(() => {
  const summaryTotal = safeNumber(keyUserDetailStatsData.value?.summary?.sensitiveUsers)
  if (summaryTotal > 0) {
    return summaryTotal
  }
  return sensitiveUserIndustryPieData.value.reduce((sum, item) => sum + item.count, 0)
})

const keyUserFilterCategoryOptions = computed(() => [
  { value: 'level', label: '重点|敏感' },
])

const keyUserFilterValueOptions = computed(() => [
  { value: 'key', label: '重点用户' },
  { value: 'sensitive', label: '敏感用户' },
])

const filteredKeyUserDetailRows = computed(() => keyUserDetailRows.value)

const keyUserDetailTotalPages = computed(() =>
  Math.max(Math.ceil(keyUserDetailTotal.value / KEY_USER_DETAIL_ROWS_PER_PAGE), 1),
)

const keyUserDetailPageButtons = computed(() => {
  const total = keyUserDetailTotalPages.value
  const maxButtons = KEY_USER_DETAIL_MAX_PAGE_BUTTONS

  if (total <= maxButtons) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const half = Math.floor(maxButtons / 2)
  let start = keyUserDetailCurrentPage.value - half
  let end = keyUserDetailCurrentPage.value + half

  if (start < 1) {
    start = 1
    end = maxButtons
  }

  if (end > total) {
    end = total
    start = total - maxButtons + 1
  }

  const pages = []
  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }
  return pages
})

const pagedKeyUserDetailRows = computed(() => {
  return keyUserDetailRows.value
})

const USER_CONS_TYPE_ORDER = ['低压居民', '低压非居民', '中压']
const USER_DETAIL_TYPE_OPTIONS = [...USER_CONS_TYPE_ORDER]
const LOW_RESIDENTIAL_MATCHERS = withMojibakeAliases(['低压居民'])

const resolveConsTypeCategory = (record) => {
  const consTypeName = toPlainText(readFieldValue(record, ['consTypeName', 'cons_type_name', 'consType', 'consVoltTypeName']))
  const consType = toPlainText(readFieldValue(record, ['consType']))
  const consVoltType = toPlainText(readFieldValue(record, ['consVoltType', 'voltType']))

  if (consVoltType === '01' || hasKeyword(consTypeName, MID_VOLT_MATCHERS)) {
    return '中压'
  }

  if (consType === '02' || hasKeyword(consTypeName, LOW_NON_RESIDENTIAL_MATCHERS)) {
    return '低压非居民'
  }

  if (consType === '03' || hasKeyword(consTypeName, LOW_RESIDENTIAL_MATCHERS)) {
    return '低压居民'
  }

  if (consTypeName.includes('中压')) {
    return '中压'
  }

  if (consTypeName.includes('低压') && consTypeName.includes('非')) {
    return '低压非居民'
  }

  if (consTypeName.includes('低压')) {
    return '低压居民'
  }

  return '低压居民'
}

const USER_TYPE_CHART_TICK_COUNT = 5

const buildUserTypeChart = (mode) => {
  const buckets = new Map(
    USER_CONS_TYPE_ORDER.map((label) => [
      label,
      {
        label,
        normalCount: 0,
        highlightCount: 0,
        total: 0,
      },
    ]),
  )

  tagAndKeyUserSourceUsers.value.forEach((item) => {
    const record = normalizeUserRecord(item)
    const category = resolveConsTypeCategory(record)
    const bucket = buckets.get(category)
    if (!bucket) {
      return
    }

    const classified = classifyUserByScore(record)
    const isHighlight = mode === 'important' ? classified.isImportant : classified.isSensitive
    if (isHighlight) {
      bucket.highlightCount += 1
    } else {
      bucket.normalCount += 1
    }
    bucket.total += 1
  })

  const rows = USER_CONS_TYPE_ORDER.map((label) => buckets.get(label))
  const maxTotal = Math.max(...rows.map((item) => item?.total || 0), 0)
  const tickStep = Math.max(Math.ceil(maxTotal / (USER_TYPE_CHART_TICK_COUNT - 1)), 1)
  const axisMax = tickStep * (USER_TYPE_CHART_TICK_COUNT - 1)
  const ticks = Array.from({ length: USER_TYPE_CHART_TICK_COUNT }, (_, index) => axisMax - index * tickStep)

  const bars = rows.map((item) => {
    const normalRatio = axisMax > 0 ? (item.normalCount / axisMax) * 100 : 0
    const highlightRatio = axisMax > 0 ? (item.highlightCount / axisMax) * 100 : 0

    return {
      ...item,
      normalRatio,
      highlightRatio,
      highlightBottom: normalRatio,
    }
  })

  return {
    ticks,
    bars,
  }
}

const importantUserTypeChart = computed(() => buildUserTypeChart('important'))
const sensitiveUserTypeChart = computed(() => buildUserTypeChart('sensitive'))

const keyUserTimeTrend = computed(() => {
  const beginTime = toBackendDateTime(queryStartTime.value)
  const endTime = toBackendDateTime(queryEndTime.value)
  const fallback = buildDefaultCountyTrendData(beginTime, endTime)
  const source = countyTrendData.value || {}
  const labels = Array.isArray(source.labels) && source.labels.length > 0 ? source.labels : fallback.labels
  const timeLabels = Array.isArray(source.timeLabels) && source.timeLabels.length > 0
    ? source.timeLabels
    : fallback.timeLabels
  const sensitiveSeries =
    Array.isArray(source.sensitiveSeries) && source.sensitiveSeries.length > 0
      ? source.sensitiveSeries
      : fallback.sensitiveSeries
  const importantSeries =
    Array.isArray(source.importantSeries) && source.importantSeries.length > 0
      ? source.importantSeries
      : fallback.importantSeries

  return { labels, timeLabels, sensitiveSeries, importantSeries }
})

const keyUserCountRows = computed(() => {
  return spatialDistributionRows.value
})

const spaceDistributionDeviceRows = computed(() => {
  const deviceMap = new Map()

  const toDisplayText = (value) => {
    const text = String(value ?? '').trim()
    return text || '-'
  }

  const buildUserDisplayText = (record) => {
    const consNo = toDisplayText(readFieldValue(record, ['consNo', 'cons_no', 'userNo', 'user_id', 'userId']))
    const consName = toDisplayText(readFieldValue(record, ['consName', 'cons_name', 'userName', 'name']))
    const countyName = toDisplayText(
      normalizeCountyName(readFieldValue(record, ['rdtCountyName', 'rdt_county_name', 'countyName', 'county_name'])),
    )
    const consAddr = toDisplayText(readFieldValue(record, ['consAddr', 'cons_addr', 'consAddress', 'address']))

    return `${consNo} / ${consName} / ${countyName} / ${consAddr}`
  }

  tagAndKeyUserSourceUsers.value.forEach((item) => {
    const record = normalizeUserRecord(item)
    const deviceNoRaw = readFieldValue(record, [
      'faultEquipNo',
      'fault_equip_no',
      'equipmentNo',
      'equipment_no',
      'equipNo',
      'equip_no',
      'faultEquipId',
      'fault_equip_id',
      'equipmentId',
      'equipment_id',
      'deviceNo',
      'device_no',
    ])
    const deviceNameRaw = readFieldValue(record, [
      'faultEquipName',
      'fault_equip_name',
      'equipmentName',
      'equipment_name',
      'equipName',
      'equip_name',
      'deviceName',
      'device_name',
    ])

    const deviceNo = toDisplayText(deviceNoRaw)
    const deviceName = toDisplayText(deviceNameRaw)
    const deviceKey = `${deviceNo}||${deviceName}`

    if (!deviceMap.has(deviceKey)) {
      deviceMap.set(deviceKey, {
        key: deviceKey,
        deviceNo,
        deviceName,
        importantUserSet: new Set(),
        sensitiveUserSet: new Set(),
      })
    }

    const classified = classifyUserByScore(record)
    const userText = buildUserDisplayText(record)
    const current = deviceMap.get(deviceKey)

    if (classified.isImportant) {
      current.importantUserSet.add(userText)
    }

    if (classified.isSensitive) {
      current.sensitiveUserSet.add(userText)
    }
  })

  return Array.from(deviceMap.values())
    .map((item) => {
      const importantUserList = Array.from(item.importantUserSet)
      const sensitiveUserList = Array.from(item.sensitiveUserSet)
      return {
        key: item.key,
        deviceNo: item.deviceNo,
        deviceName: item.deviceName,
        importantUserCount: importantUserList.length,
        sensitiveUserCount: sensitiveUserList.length,
        importantUserList,
        sensitiveUserList,
      }
    })
    .sort((a, b) => {
      if (a.importantUserCount !== b.importantUserCount) {
        return b.importantUserCount - a.importantUserCount
      }
      if (a.sensitiveUserCount !== b.sensitiveUserCount) {
        return b.sensitiveUserCount - a.sensitiveUserCount
      }
      return String(a.deviceName || '').localeCompare(String(b.deviceName || ''), 'zh-Hans-CN')
    })
})

const resolveUserDetailTypeFilter = (record, consTypeName) => {
  const normalizedTypeName = toPlainText(consTypeName)

  if (normalizedTypeName.includes('低压非居民') || hasKeyword(normalizedTypeName, LOW_NON_RESIDENTIAL_MATCHERS)) {
    return '低压非居民'
  }

  if (normalizedTypeName.includes('低压居民') || hasKeyword(normalizedTypeName, LOW_RESIDENTIAL_MATCHERS)) {
    return '低压居民'
  }

  if (
    normalizedTypeName.includes('中压') ||
    normalizedTypeName.includes('高压') ||
    hasKeyword(normalizedTypeName, MID_VOLT_MATCHERS)
  ) {
    return '中压'
  }

  return resolveConsTypeCategory(record)
}

const userDetailRows = computed(() =>
  tagAndKeyUserSourceUsers.value.map((item, index) => {
    const record = normalizeUserRecord(item)
    const consNo = readFieldValue(record, ['consNo', 'cons_no', 'userNo', 'userId', 'consumerNo'])
    const consName = readFieldValue(record, ['consName', 'cons_name', 'name', 'userName'])
    const consTypeName = readFieldValue(record, ['consTypeName', 'cons_type_name', 'consType'])
    const consAddr = readFieldValue(record, ['consAddr', 'cons_addr', 'consAddress', 'address'])
    const fallbackNo = readFieldValue(record, ['outageNumber', 'id'])
    const fallbackName = readFieldValue(record, ['rdtFeederName', 'faultEquipName'])
    const outageNature = readFieldValue(record, ['outageNature', 'outage_nature'])
    const tradeName = readFieldValue(record, ['tradeName', 'trade_name', 'industryName'])
    const ctime = readFieldValue(record, ['ctime', 'beginTime', 'begin_time'])
    const endTime = readFieldValue(record, ['endTime', 'end_time'])
    const equipmentName = readFieldValue(record, ['equipmentName', 'equipment_name', 'faultEquipName'])

    return {
      id: buildUserRecordKey(record) || String(index),
      consNo: consNo || fallbackNo || '-',
      consName: consName || fallbackName || '-',
      consTypeName: consTypeName || '-',
      consTypeFilterCategory: resolveUserDetailTypeFilter(record, consTypeName),
      consAddr: consAddr || '-',
      outageNature: outageNatureText(outageNature),
      tradeName: tradeName || '-',
      ctime: ctime || '-',
      endTime: endTime || '-',
      equipmentName: equipmentName || '-',
    }
  }),
)

const filteredUserDetailRows = computed(() => {
  const keyword = userDetailSearchKeyword.value.trim().toLowerCase()
  const selectedType = userDetailSelectedType.value

  return userDetailRows.value.filter((item) => {
    const consNo = String(item.consNo || '').toLowerCase()
    const consName = String(item.consName || '').toLowerCase()
    const matchedKeyword = !keyword || consNo.includes(keyword) || consName.includes(keyword)
    const matchedType = !selectedType || item.consTypeFilterCategory === selectedType
    return matchedKeyword && matchedType
  })
})
const userDetailTotalPages = computed(() =>
  Math.max(Math.ceil(filteredUserDetailRows.value.length / userDetailRowsPerPage.value), 1),
)

const pagedUserDetailRows = computed(() => {
  const start = (userDetailCurrentPage.value - 1) * userDetailRowsPerPage.value
  return filteredUserDetailRows.value.slice(start, start + userDetailRowsPerPage.value)
})

const recalcUserDetailRowsPerPage = () => {
  if (!showUserDetailPage.value) {
    return
  }

  const bodyEl = userDetailGridBodyRef.value
  if (!bodyEl) {
    return
  }

  const headEl = bodyEl.querySelector('.user-detail-grid-head')
  const rowEl = bodyEl.querySelector('.user-detail-grid-row')
  const headHeight = headEl?.getBoundingClientRect().height || USER_DETAIL_FALLBACK_HEAD_HEIGHT
  const rowHeight = rowEl?.getBoundingClientRect().height || USER_DETAIL_FALLBACK_ROW_HEIGHT
  const availableHeight = bodyEl.clientHeight - headHeight
  const estimatedSize = Math.floor(Math.max(availableHeight, 0) / Math.max(rowHeight, 1))
  const adjustedSize = estimatedSize + 1
  const nextSize = Math.max(
    USER_DETAIL_MIN_PAGE_SIZE,
    Math.min(USER_DETAIL_MAX_PAGE_SIZE, Number.isFinite(adjustedSize) ? adjustedSize : USER_DETAIL_MIN_PAGE_SIZE),
  )

  if (nextSize !== userDetailRowsPerPage.value) {
    userDetailRowsPerPage.value = nextSize
  }
}

const recalcUserDetailMaxPageButtons = () => {
  if (!showUserDetailPage.value) {
    return
  }

  const paginationEl = userDetailPaginationRef.value
  if (!paginationEl) {
    return
  }

  const style = window.getComputedStyle(paginationEl)
  const gap = Number.parseFloat(style.columnGap || style.gap || String(USER_DETAIL_PAGE_BUTTON_GAP)) || USER_DETAIL_PAGE_BUTTON_GAP
  const jumpWidth = userDetailPageJumpRef.value?.offsetWidth || 0
  const width = Math.max(paginationEl.clientWidth - jumpWidth - gap, 0)
  const estimatedButtons = Math.floor((width + gap) / (USER_DETAIL_PAGE_BUTTON_MIN_WIDTH + gap))

  let nextCount = Number.isFinite(estimatedButtons) ? estimatedButtons : USER_DETAIL_MIN_PAGE_BUTTONS
  nextCount = Math.max(USER_DETAIL_MIN_PAGE_BUTTONS, Math.min(USER_DETAIL_MAX_PAGE_BUTTONS, nextCount))
  if (nextCount % 2 === 0) {
    nextCount -= 1
  }
  nextCount = Math.max(USER_DETAIL_MIN_PAGE_BUTTONS, nextCount)

  if (nextCount !== userDetailMaxPageButtons.value) {
    userDetailMaxPageButtons.value = nextCount
  }
}

const syncUserDetailLayout = () => {
  recalcUserDetailRowsPerPage()
  recalcUserDetailMaxPageButtons()
}

const observeUserDetailLayout = () => {
  if (typeof window === 'undefined' || typeof window.ResizeObserver !== 'function') {
    return
  }

  if (userDetailLayoutObserver) {
    userDetailLayoutObserver.disconnect()
  }

  userDetailLayoutObserver = new window.ResizeObserver(() => {
    syncUserDetailLayout()
  })

  if (userDetailGridBodyRef.value) {
    userDetailLayoutObserver.observe(userDetailGridBodyRef.value)
  }
  if (userDetailPaginationRef.value) {
    userDetailLayoutObserver.observe(userDetailPaginationRef.value)
  }
  if (userDetailPageJumpRef.value) {
    userDetailLayoutObserver.observe(userDetailPageJumpRef.value)
  }
}

const userDetailPageButtons = computed(() => {
  const total = userDetailTotalPages.value
  const maxButtons = userDetailMaxPageButtons.value

  if (total <= maxButtons) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const half = Math.floor(maxButtons / 2)
  let start = userDetailCurrentPage.value - half
  let end = userDetailCurrentPage.value + half

  if (start < 1) {
    start = 1
    end = maxButtons
  }

  if (end > total) {
    end = total
    start = total - maxButtons + 1
  }

  const pages = []
  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }
  return pages
})

const openUserDetailPage = () => {
  showUserDetailPage.value = true
  userDetailSearchInput.value = ''
  userDetailSearchKeyword.value = ''
  userDetailSelectedType.value = ''
  userDetailJumpPageInput.value = ''
  userDetailCurrentPage.value = 1
  nextTick(() => {
    observeUserDetailLayout()
    syncUserDetailLayout()
  })
}

const openOutageRangeAssessmentPage = () => {
  showOutageRangeAssessmentPage.value = true
  outageRangeChainsCurrentPage.value = 1
  outageRangeChainsLoading.value = true
  void loadRightPanelOutageChains({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
    page: 1,
  })
}

const closeOutageRangeAssessmentPage = () => {
  showOutageRangeAssessmentPage.value = false
  outageRangeChainsRequestId += 1
  outageRangeChainsLoading.value = false
}

const goOutageRangeAssessmentPage = (page) => {
  const targetPage = Math.max(1, Math.round(safeNumber(page) || 1))
  if (!showOutageRangeAssessmentPage.value) {
    return
  }
  if (targetPage === outageRangeChainsCurrentPage.value) {
    return
  }
  outageRangeChainsCurrentPage.value = targetPage
  void loadRightPanelOutageChains({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
    page: targetPage,
  })
}

const reloadKeyUserDetailList = () => {
  void loadKeyUserDetailRows()
}

const openKeyUserDetailPage = async () => {
  showKeyUserDetailPage.value = true
  keyUserDetailSearchInput.value = ''
  keyUserDetailSearchKeyword.value = ''
  keyUserDetailSelectedFilterCategory.value = 'level'
  keyUserDetailSelectedFilterValue.value = 'key'
  keyUserDetailJumpPageInput.value = ''
  keyUserDetailCurrentPage.value = 1
  selectedKeyUserCounty.value = ''
  keyUserDetailLoading.value = true
  closeKeyUserDetailModal()
  await loadKeyUserDetailStats()
  await loadKeyUserDetailRows()
  nextTick(() => {
    syncMapMarkers()
  })
}

const closeKeyUserDetailModal = () => {
  keyUserDetailModalVisible.value = false
  selectedKeyUserDetail.value = null
}

const closeKeyUserDetailPage = () => {
  showKeyUserDetailPage.value = false
  selectedKeyUserCounty.value = ''
  closeKeyUserDetailModal()
  if (infoWindow) {
    infoWindow.close()
  }
  syncMapMarkers()
}

const openKeyUserDetailModal = (item) => {
  selectedKeyUserDetail.value = item
  keyUserDetailModalVisible.value = true
  void syncOneMapMeterBoxId(item?.consNo, item, 'userTag')
}

const applyKeyUserDetailSearch = () => {
  keyUserDetailSearchKeyword.value = keyUserDetailSearchInput.value.trim()
  keyUserDetailCurrentPage.value = 1
  reloadKeyUserDetailList()
}

const goKeyUserDetailPage = (page) => {
  if (page < 1 || page > keyUserDetailTotalPages.value) {
    return
  }
  keyUserDetailCurrentPage.value = page
  reloadKeyUserDetailList()
}

const jumpToKeyUserDetailPage = () => {
  const input = String(keyUserDetailJumpPageInput.value ?? '').trim()
  if (!input) {
    return
  }

  const parsed = Number(input)
  if (!Number.isFinite(parsed)) {
    return
  }

  const target = Math.min(keyUserDetailTotalPages.value, Math.max(1, Math.round(parsed)))
  goKeyUserDetailPage(target)
  keyUserDetailJumpPageInput.value = String(target)
}

const closeUserDetailModal = () => {
  userDetailModalVisible.value = false
  selectedUserDetail.value = null
}

const closeUserDetailPage = () => {
  showUserDetailPage.value = false
  if (userDetailLayoutObserver) {
    userDetailLayoutObserver.disconnect()
    userDetailLayoutObserver = null
  }
  closeUserDetailModal()
}

const openUserDetailModal = (item) => {
  selectedUserDetail.value = item
  userDetailModalVisible.value = true
  void syncOneMapMeterBoxId(item?.consNo)
}

const applyUserDetailSearch = () => {
  userDetailSearchKeyword.value = userDetailSearchInput.value.trim()
  userDetailCurrentPage.value = 1
}

const goUserDetailPage = (page) => {
  if (page < 1 || page > userDetailTotalPages.value) {
    return
  }
  userDetailCurrentPage.value = page
}

const jumpToUserDetailPage = () => {
  const input = String(userDetailJumpPageInput.value ?? '').trim()
  if (!input) {
    return
  }

  const parsed = Number(input)
  if (!Number.isFinite(parsed)) {
    return
  }

  const target = Math.min(userDetailTotalPages.value, Math.max(1, Math.round(parsed)))
  goUserDetailPage(target)
  userDetailJumpPageInput.value = String(target)
}

const reloadOutageDetailLineRows = () => {
  if (!showOutageDetailPage.value || suppressOutageDetailAutoReload) {
    return
  }

  void loadRightPanelOutageEvents({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
    page: outageDetailCurrentPage.value,
    perPage: outageDetailRowsPerPage.value,
  })
}

const openOutageDetailPage = (modeKey = 'feeder') => {
  outageDetailDimension.value = modeKey === 'substation' ? 'substation' : 'feeder'
  suppressOutageDetailAutoReload = true
  showOutageDetailPage.value = true
  outageDetailSearchInput.value = ''
  outageDetailSearchKeyword.value = ''
  outageDetailSelectedNature.value = ''
  outageDetailJumpPageInput.value = ''
  outageDetailCurrentPage.value = OUTAGE_DETAIL_DEFAULT_PAGE
  outageEventsSummaryData.value = null
  faultLocationEventTypesData.value = []
  faultLocationLineTypeOptions.value = []
  outageDetailRows.value = []
  outageDetailTotal.value = 0
  outageDetailLoading.value = false
  closeOutageDetailModal()
  void loadFaultLocationEventTypes({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
  })
  nextTick(() => {
    syncOutageDetailLayout()
    suppressOutageDetailAutoReload = false
    observeOutageDetailLayout()
    void loadFaultLocationLineTypeOptions({
      beginTime: toBackendDateTime(queryStartTime.value),
      endTime: toBackendDateTime(queryEndTime.value),
    })
    reloadOutageDetailLineRows()
  })
}

const closeOutageDetailModal = () => {
  outageEventDetailRequestId += 1
  outageDetailModalVisible.value = false
  selectedOutageDetail.value = null
}

const loadFaultLocationLineDetailForModal = async (item, requestId) => {
  const lineId = String(readFieldValue(item, ['line_id', 'lineId', 'rdtFeederId', 'rdt_feeder_id']) || '').trim()
  if (!lineId) {
    return
  }

  try {
    const response = await queryOutageUserFaultLocationLinesDetail({
      beginTime: formatBackendDate(toBackendDateTime(queryStartTime.value)),
      endTime: formatBackendDate(toBackendDateTime(queryEndTime.value)),
      line_id: lineId,
    })
    if (requestId !== outageEventDetailRequestId || !outageDetailModalVisible.value) {
      return
    }
    selectedOutageDetail.value = mapFaultLocationLineDetailForModal(response)
  } catch (error) {
    if (requestId === outageEventDetailRequestId) {
      console.error(error)
    }
  }
}

const closeOutageDetailPage = () => {
  suppressOutageDetailAutoReload = false
  showOutageDetailPage.value = false
  outageEventDetailRequestId += 1
  outageEventsSummaryRequestId += 1
  outageEventsSummaryData.value = null
  faultLocationEventTypesRequestId += 1
  faultLocationEventTypesData.value = []
  faultLocationLineTypesRequestId += 1
  faultLocationLineTypeOptions.value = []
  outageDetailListRequestId += 1
  outageDetailLoading.value = false
  if (outageDetailLayoutObserver) {
    outageDetailLayoutObserver.disconnect()
    outageDetailLayoutObserver = null
  }
  closeOutageDetailModal()
}

const openOutageDetailModal = (item) => {
  const requestId = ++outageEventDetailRequestId
  selectedOutageDetail.value = null
  outageDetailModalVisible.value = true
  void loadFaultLocationLineDetailForModal(item, requestId)
}

const applyOutageDetailSearch = () => {
  outageDetailSearchKeyword.value = outageDetailSearchInput.value.trim()
  outageDetailCurrentPage.value = OUTAGE_DETAIL_DEFAULT_PAGE
  void loadFaultLocationEventTypes({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
  })
  outageDetailRows.value = []
  outageDetailTotal.value = 0
  void loadFaultLocationLineTypeOptions({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
  })
  reloadOutageDetailLineRows()
}

const goOutageDetailPage = (page) => {
  if (page < 1 || page > outageDetailTotalPages.value) {
    return
  }
  outageDetailCurrentPage.value = page
}

const jumpToOutageDetailPage = () => {
  const input = String(outageDetailJumpPageInput.value ?? '').trim()
  if (!input) {
    return
  }

  const parsed = Number(input)
  if (!Number.isFinite(parsed)) {
    return
  }

  const target = Math.min(outageDetailTotalPages.value, Math.max(1, Math.round(parsed)))
  goOutageDetailPage(target)
  outageDetailJumpPageInput.value = String(target)
}

const eventNatureText = (event) => outageNatureText(event?.outageNature)

const eventNatureClass = (event) => {
  const nature = String(event?.outageNature || '').trim()
  if (nature === '01') {
    return 'planned'
  }
  if (nature === '02') {
    return 'fault'
  }
  return 'other'
}

const mapStatusText = computed(() => {
  if (loading.value) {
    return '数据加载中...'
  }
  if (dataError.value) {
    return dataError.value
  }
  if (dataNotice.value) {
    return dataNotice.value
  }
  if (mapError.value) {
    return mapError.value
  }
  return '已连接后端接口'
})

watch(
  regionOptions,
  (options) => {
    if (!options.includes(selectedRegion.value)) {
      selectedRegion.value = '全部'
    }
  },
  { immediate: true },
)

watch(
  displayOutageEvents,
  (list) => {
    if (list.length === 0) {
      selectedEventId.value = ''
      return
    }

    if (!list.some((item) => getEventId(item) === selectedEventId.value)) {
      selectedEventId.value = getEventId(list[0])
    }
  },
  { immediate: true },
)

watch(outageDetailRows, (rows) => {
  if (rows.length === 0) {
    outageDetailCurrentPage.value = OUTAGE_DETAIL_DEFAULT_PAGE
    closeOutageDetailModal()
    nextTick(() => {
      syncOutageDetailLayout()
    })
    return
  }

  if (outageDetailCurrentPage.value > outageDetailTotalPages.value) {
    outageDetailCurrentPage.value = outageDetailTotalPages.value
  }

  nextTick(() => {
    syncOutageDetailLayout()
  })
})

watch(selectedRegion, (regionName) => {
  outageDetailCurrentPage.value = 1
  closeOutageDetailModal()
  if (countyWarningPopupVisible.value) {
    closeCountyWarningPopup()
  }
  if (regionName === '全部') {
    selectedKeyUserCounty.value = ''
  } else {
    selectedKeyUserCounty.value = regionName
  }

  syncCountyFocusToMapFrame()
  nextTick(() => {
    syncMapMarkers()
    syncKeyUserCountyMarkersToMapFrame()
  })

  void loadTagStatsOverview({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
  })
  void loadCountyTrendData({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
  })
  void loadSpatialDistributionRows({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
  })
  faultSummaryData.value = null
  outageScopeSummaryData.value = null
  void loadRightPanelFaultLocationSummary({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
    dimension: 'feeder',
  })
  void loadRightPanelOutageScopeSummary({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
  })
  if (spaceDistributionDetailVisible.value) {
    void loadCountyEquipmentStatsSummary({
      beginTime: toBackendDateTime(queryStartTime.value),
      endTime: toBackendDateTime(queryEndTime.value),
    })
    void loadCountyEquipmentListRows({
      beginTime: toBackendDateTime(queryStartTime.value),
      endTime: toBackendDateTime(queryEndTime.value),
    })
    void loadCountyEquipmentPageRows({
      beginTime: toBackendDateTime(queryStartTime.value),
      endTime: toBackendDateTime(queryEndTime.value),
      page: SPACE_EQUIPMENT_PAGE_NUMBER,
    })
  }

  if (showOutageDetailPage.value) {
    outageDetailCurrentPage.value = OUTAGE_DETAIL_DEFAULT_PAGE
    void loadFaultLocationEventTypes({
      beginTime: toBackendDateTime(queryStartTime.value),
      endTime: toBackendDateTime(queryEndTime.value),
    })
    outageDetailRows.value = []
    outageDetailTotal.value = 0
    faultLocationLineTypeOptions.value = []
    void loadFaultLocationLineTypeOptions({
      beginTime: toBackendDateTime(queryStartTime.value),
      endTime: toBackendDateTime(queryEndTime.value),
    })
    reloadOutageDetailLineRows()
  }

  if (showOutageRangeAssessmentPage.value) {
    outageRangeChainsCurrentPage.value = 1
    void loadRightPanelOutageChains({
      beginTime: toBackendDateTime(queryStartTime.value),
      endTime: toBackendDateTime(queryEndTime.value),
      page: 1,
    })
  }

  if (showKeyUserDetailPage.value) {
    keyUserDetailCurrentPage.value = 1
    void loadKeyUserDetailStats()
    void loadKeyUserDetailRows()
  }
})

watch(outageDetailSelectedNature, () => {
  outageDetailCurrentPage.value = OUTAGE_DETAIL_DEFAULT_PAGE
  if (!showOutageDetailPage.value) {
    return
  }
  outageDetailRows.value = []
  outageDetailTotal.value = 0
  reloadOutageDetailLineRows()
})

watch([outageDetailCurrentPage, outageDetailRowsPerPage], () => {
  reloadOutageDetailLineRows()
})

watch([showOutageDetailPage, outageDetailGridBodyRef, outageDetailPaginationRef, outageDetailPageJumpRef], ([visible]) => {
  if (!visible) {
    return
  }

  nextTick(() => {
    observeOutageDetailLayout()
    syncOutageDetailLayout()
  })
})

watch(filteredUserDetailRows, (rows) => {
  if (rows.length === 0) {
    userDetailCurrentPage.value = 1
    closeUserDetailModal()
    nextTick(() => {
      syncUserDetailLayout()
    })
    return
  }

  if (userDetailCurrentPage.value > userDetailTotalPages.value) {
    userDetailCurrentPage.value = userDetailTotalPages.value
  }

  nextTick(() => {
    syncUserDetailLayout()
  })
})

watch([showUserDetailPage, userDetailGridBodyRef, userDetailPaginationRef, userDetailPageJumpRef], ([visible]) => {
  if (!visible) {
    return
  }

  nextTick(() => {
    observeUserDetailLayout()
    syncUserDetailLayout()
  })
})

watch(filteredKeyUserDetailRows, (rows) => {
  if (rows.length === 0) {
    closeKeyUserDetailModal()
    return
  }

  if (keyUserDetailCurrentPage.value > keyUserDetailTotalPages.value) {
    keyUserDetailCurrentPage.value = keyUserDetailTotalPages.value
    reloadKeyUserDetailList()
  }
})

watch(keyUserDetailSelectedFilterValue, () => {
  keyUserDetailCurrentPage.value = 1
  reloadKeyUserDetailList()
})

watch(showKeyUserDetailPage, (visible) => {
  if (!visible) {
    selectedKeyUserCounty.value = ''
  }

  nextTick(() => {
    syncMapMarkers()
    syncKeyUserCountyMarkersToMapFrame()
  })
})

watch(
  keyUserCountyStats,
  () => {
    if (!showKeyUserDetailPage.value) {
      return
    }
    syncMapMarkers()
    syncKeyUserCountyMarkersToMapFrame()
  },
  { deep: true },
)

const applyTimeFilter = async () => {
  if (activePageTab.value === 'sensitiveDemand') {
    const beginTime = toBackendDateTime(queryStartTime.value)
    const endTime = toBackendDateTime(queryEndTime.value)
    if (!beginTime || !endTime) {
      dataError.value = '请完整选择开始和结束时间。'
      window.alert(dataError.value)
      return
    }

    loading.value = true
    try {
      await loadSensitiveDemandData({
        beginTime,
        endTime,
      })
    } finally {
      loading.value = false
    }
    return
  }

  await loadDashboardData()
  activeMapEvent.value = null

  if (showOutageDetailPage.value) {
    outageDetailCurrentPage.value = OUTAGE_DETAIL_DEFAULT_PAGE
    const beginTime = toBackendDateTime(queryStartTime.value)
    const endTime = toBackendDateTime(queryEndTime.value)
    outageDetailRows.value = []
    outageDetailTotal.value = 0
    faultLocationLineTypeOptions.value = []
    await loadFaultLocationEventTypes({
      beginTime,
      endTime,
    })
    await loadFaultLocationLineTypeOptions({
      beginTime,
      endTime,
    })
    reloadOutageDetailLineRows()
  }

  if (showOutageRangeAssessmentPage.value) {
    outageRangeChainsCurrentPage.value = 1
    await loadRightPanelOutageChains({
      beginTime: toBackendDateTime(queryStartTime.value),
      endTime: toBackendDateTime(queryEndTime.value),
      page: 1,
    })
  }

  if (showKeyUserDetailPage.value) {
    keyUserDetailCurrentPage.value = 1
    await loadKeyUserDetailStats()
    await loadKeyUserDetailRows()
  }

  if (!mapInstance) {
    return
  }

  syncMapMarkers()
  if (infoWindow) {
    infoWindow.close()
  }
}

const handleOpenSpaceDistributionDetailPage = () => {
  spaceDistributionDetailVisible.value = true
  countyEquipmentStatsSummary.value = null
  countyEquipmentListRows.value = []
  countyEquipmentPageRows.value = []
  countyEquipmentPageTotal.value = 0
  void loadCountyEquipmentStatsSummary({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
  })
  void loadCountyEquipmentListRows({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
  })
  void loadCountyEquipmentPageRows({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
    page: SPACE_EQUIPMENT_PAGE_NUMBER,
  })
}

const handleGoSpaceDistributionDetailPage = (page) => {
  void loadCountyEquipmentPageRows({
    beginTime: toBackendDateTime(queryStartTime.value),
    endTime: toBackendDateTime(queryEndTime.value),
    page,
  })
}

const handleSelectSpaceDistributionTopDevice = (item) => {
  locateSpaceDistributionDeviceOnMapFrame(item)
}

const handleCloseSpaceDistributionDetailPage = () => {
  spaceDistributionDetailVisible.value = false
  countyEquipmentStatsSummary.value = null
  countyEquipmentListRows.value = []
  countyEquipmentPageRows.value = []
  countyEquipmentPageTotal.value = 0
}

const toggleLeftPanel = () => {
  isLeftCollapsed.value = !isLeftCollapsed.value
  if (isLeftCollapsed.value) {
    spaceDistributionDetailVisible.value = false
    countyEquipmentStatsSummary.value = null
    countyEquipmentListRows.value = []
    countyEquipmentPageRows.value = []
    countyEquipmentPageTotal.value = 0
    closeOutageRangeAssessmentPage()
    closeOutageDetailPage()
    closeUserDetailPage()
    closeKeyUserDetailPage()
  }
}

const toggleRightPanel = () => {
  isRightCollapsed.value = !isRightCollapsed.value
  if (isRightCollapsed.value) {
    closeOutageRangeAssessmentPage()
    closeOutageDetailPage()
  }
}

const switchPageTab = (tab) => {
  const shouldResetOutagePages = activePageTab.value === 'sensitiveDemand' && tab !== 'sensitiveDemand'
  activePageTab.value = ['outageAnalysis', 'outageUsers', 'sensitiveDemand'].includes(tab)
    ? tab
    : 'outageUsers'
  if (shouldResetOutagePages) {
    closeCountyWarningPopup()
    handleCloseSpaceDistributionDetailPage()
    closeOutageRangeAssessmentPage()
    closeOutageDetailPage()
    closeUserDetailPage()
    closeKeyUserDetailPage()
  }
  if (activePageTab.value !== 'sensitiveDemand') {
    showSensitiveDemandAutoDetail.value = false
  }
  if (activePageTab.value !== 'outageUsers') {
    spaceDistributionDetailVisible.value = false
    countyEquipmentStatsSummary.value = null
    countyEquipmentListRows.value = []
    countyEquipmentPageRows.value = []
    countyEquipmentPageTotal.value = 0
  }
  if (activePageTab.value === 'sensitiveDemand') {
    void applyTimeFilter()
  } else if (activePageTab.value === 'outageUsers') {
    void loadDashboardData(null, { includeDetailPages: false })
  }
}

const resolveRegionOptionName = (regionName) => {
  const displayName = toCountyDisplayName(regionName)
  if (!displayName || displayName === '全部') {
    return '全部'
  }
  const normalizedName = normalizeCountyName(displayName)
  const matchedRegion = regionOptions.value.find(
    (item) => item !== '全部' && normalizeCountyName(item) === normalizedName,
  )
  return matchedRegion || displayName
}

const focusRegion = (regionName) => {
  selectedRegion.value = resolveRegionOptionName(regionName)
  const center = getCountyCenter(regionName)
  if (mapInstance && center) {
    mapInstance.setZoomAndCenter(9, center)
  }
}

const locateKeyUser = (user) => {
  if (!user) {
    return
  }

  const targetOutageNumber = String(user.outageNumber || '').trim()
  const matchedEvent = outageEvents.value.find(
    (item) => String(extractOutageNumberParam(item) || '').trim() === targetOutageNumber,
  )
  if (matchedEvent) {
    selectedEventId.value = getEventId(matchedEvent)
    openEventInfo(matchedEvent)
    return
  }

  if (user.countyName) {
    focusRegion(user.countyName)
  }
}

const loadAmapScript = (() => {
  let promise

  return () => {
    if (window.AMap) {
      return Promise.resolve(window.AMap)
    }

    if (promise) {
      return promise
    }

    if (!amapKey) {
      return Promise.reject(new Error('高德地图 Key 未配置'))
    }

    window._AMapSecurityConfig = {
      securityJsCode: amapSecurityJsCode,
    }

    promise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}`
      script.async = true
      script.onload = () => {
        if (window.AMap) {
          resolve(window.AMap)
          return
        }
        reject(new Error('AMap SDK loaded, but AMap is undefined'))
      }
      script.onerror = () => reject(new Error('Failed to load AMap SDK'))
      document.head.appendChild(script)
    })

    return promise
  }
})()

const clearDistrictOverlays = () => {
  if (!mapInstance || districtOverlays.length === 0) {
    return
  }
  mapInstance.remove(districtOverlays)
  districtOverlays = []
}

const clearEventMarkers = () => {
  if (!mapInstance || eventMarkers.length === 0) {
    return
  }
  mapInstance.remove(eventMarkers)
  eventMarkers = []
}

const clearKeyUserCountyMarkers = () => {
  if (!mapInstance || keyUserCountyMarkers.length === 0) {
    return
  }
  mapInstance.remove(keyUserCountyMarkers)
  keyUserCountyMarkers = []
}

const buildEventMarkerContent = (event, isActive) => {
  const markerNode = document.createElement('div')
  markerNode.className = `outage-event-marker ${eventNatureClass(event)} ${isActive ? 'active' : ''}`.trim()

  const inner = document.createElement('span')
  inner.className = 'outage-event-marker-label'
  inner.textContent = safeNumber(event.affectedConsCnt || event.powerUserCnt)

  markerNode.appendChild(inner)
  return markerNode
}

const buildKeyUserCountyMarkerContent = (countyStat, isActive) => {
  const markerNode = document.createElement('div')
  markerNode.className = `key-user-region-marker ${isActive ? 'active' : ''}`.trim()
  markerNode.title = `${countyStat.countyName}：${countyStat.keyUserCount}户`
  return markerNode
}

const escapeHtml = (value = '') =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const openEventInfo = (event) => {
  if (!mapInstance || !amapSdk || !event) {
    return
  }

  const position = getCountyCenter(event.countyName)
  selectedEventId.value = getEventId(event)

  const content = `
    <div class="map-info-window">
      <h4>${escapeHtml(event.rdtFeederName || event.faultEquipName || '停电事件')}</h4>
      <p>事件号：${escapeHtml(event.outageNumber || '-')}</p>
      <p>区域：${escapeHtml(normalizeCountyName(event.countyName) || '未知')}</p>
      <p>类型：${escapeHtml(eventNatureText(event))}</p>
      <p>时间：${escapeHtml(event.beginTime || '-')}</p>
      <p>影响用户：${safeNumber(event.affectedConsCnt || event.powerUserCnt)} 户</p>
      <p>影响设备：${safeNumber(event.affectedEquipmentCnt || event.powerEquipCnt)} 台</p>
    </div>
  `

  if (!infoWindow) {
    infoWindow = new amapSdk.InfoWindow({
      isCustom: false,
      offset: new amapSdk.Pixel(0, -20),
      autoMove: true,
    })
  }

  infoWindow.setContent(content)
  infoWindow.open(mapInstance, position)
  mapInstance.setZoomAndCenter(10, position)
}

const openKeyUserCountyInfo = (countyStat) => {
  if (!mapInstance || !amapSdk || !countyStat) {
    return
  }

  const position = getCountyCenter(countyStat.countyName)
  selectedKeyUserCounty.value = countyStat.countyName

  const content = `
    <div class="map-info-window">
      <h4>${escapeHtml(countyStat.countyName || '未知区域')}</h4>
      <p>重点用户户数：${safeNumber(countyStat.keyUserCount)} 户</p>
      <p>占比：${escapeHtml(countyStat.ratioText || '0%')}</p>
    </div>
  `

  if (!infoWindow) {
    infoWindow = new amapSdk.InfoWindow({
      isCustom: false,
      offset: new amapSdk.Pixel(0, -20),
      autoMove: true,
    })
  }

  infoWindow.setContent(content)
  infoWindow.open(mapInstance, position)
  syncMapMarkers()
}

const syncEventMarkers = () => {
  if (!mapInstance || !amapSdk) {
    return
  }

  clearEventMarkers()
  if (!activeMapEvent.value) {
    return
  }

  const event = activeMapEvent.value
  const marker = new amapSdk.Marker({
    position: getCountyCenter(event.countyName),
    content: buildEventMarkerContent(event, getEventId(event) === selectedEventId.value),
    offset: new amapSdk.Pixel(-14, -14),
    extData: event,
  })

  marker.on('click', () => {
    const markerData = marker.getExtData()
    if (markerData) {
      openEventInfo(markerData)
    }
  })

  eventMarkers = [marker]
  mapInstance.add(eventMarkers)
}

const syncKeyUserCountyMarkers = () => {
  if (!mapInstance || !amapSdk) {
    return
  }

  clearKeyUserCountyMarkers()
  if (!showKeyUserDetailPage.value) {
    return
  }

  const markerList = keyUserCountyStats.value.map((countyStat) => {
    const marker = new amapSdk.Marker({
      position: getCountyCenter(countyStat.countyName),
      content: buildKeyUserCountyMarkerContent(countyStat, countyStat.countyName === selectedKeyUserCounty.value),
      offset: new amapSdk.Pixel(-12, -12),
      extData: countyStat,
      zIndex: countyStat.countyName === selectedKeyUserCounty.value ? 130 : 120,
    })

    marker.on('click', () => {
      const markerData = marker.getExtData()
      if (markerData) {
        openKeyUserCountyInfo(markerData)
      }
    })

    return marker
  })

  keyUserCountyMarkers = markerList
  if (markerList.length > 0) {
    mapInstance.add(markerList)
  }
}

const syncMapMarkers = () => {
  if (showKeyUserDetailPage.value) {
    clearEventMarkers()
    syncKeyUserCountyMarkers()
    return
  }

  clearKeyUserCountyMarkers()
  syncEventMarkers()
}

const applyTangshanHighlight = (AMap) =>
  new Promise((resolve, reject) => {
    AMap.plugin('AMap.DistrictSearch', () => {
      const districtSearch = new AMap.DistrictSearch({
        level: 'city',
        subdistrict: 0,
        extensions: 'all',
      })

      districtSearch.search('唐山市', (status, result) => {
        const boundaries = result?.districtList?.[0]?.boundaries || []
        if (status !== 'complete' || boundaries.length === 0) {
          reject(new Error('Failed to load Tangshan district boundary'))
          return
        }

        clearDistrictOverlays()

        const worldRing = [
          [-360, 90],
          [360, 90],
          [360, -90],
          [-360, -90],
        ]

        const dimPolygon = new AMap.Polygon({
          path: [worldRing, ...boundaries],
          strokeOpacity: 0,
          fillColor: '#000A19',
          fillOpacity: 0.48,
          zIndex: 80,
        })

        const highlightPolygons = boundaries.map((path) => {
          return new AMap.Polygon({
            path,
            strokeColor: '#5BC6FF',
            strokeWeight: 3,
            strokeOpacity: 0.95,
            fillColor: '#1A79DD',
            fillOpacity: 0.22,
            zIndex: 89,
          })
        })

        districtOverlays = [dimPolygon, ...highlightPolygons]
        mapInstance.add(districtOverlays)
        resolve()
      })
    })
  })

watch([activeMapEvent, selectedEventId], () => {
  syncMapMarkers()
})

onMounted(async () => {
  window.addEventListener('message', handleMapFrameMessage)
  await loadCountyList()
  await loadDashboardData()

  if (!mapRef.value) {
    return
  }

  try {
    mapError.value = ''
    const AMap = await loadAmapScript()
    amapSdk = AMap

    mapInstance = new AMap.Map(mapRef.value, {
      viewMode: '3D',
      center: tangshanCenter,
      zoom: 8.2,
      pitch: 36,
      mapStyle: 'amap://styles/blue',
      features: ['bg', 'road', 'building', 'point'],
      showLabel: true,
      dragEnable: true,
      zoomEnable: true,
      doubleClickZoom: true,
      scrollWheel: true,
      touchZoom: true,
    })

    mapInstance.setStatus({
      dragEnable: true,
      zoomEnable: true,
      doubleClickZoom: true,
      scrollWheel: true,
      touchZoom: true,
    })

    await applyTangshanHighlight(AMap)
    syncMapMarkers()
  } catch (error) {
    console.error(error)
    mapError.value = '地图初始化失败，请检查高德 Key 与网络连接。'
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMapFrameMessage)
  if (outageDetailLayoutObserver) {
    outageDetailLayoutObserver.disconnect()
    outageDetailLayoutObserver = null
  }

  if (userDetailLayoutObserver) {
    userDetailLayoutObserver.disconnect()
    userDetailLayoutObserver = null
  }

  clearEventMarkers()
  clearKeyUserCountyMarkers()
  clearDistrictOverlays()

  if (infoWindow) {
    infoWindow.close()
    infoWindow = null
  }

  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
  }

  amapSdk = null
})
</script>

<template>
  <div class="screen">
    <section class="map-stage map-stage-background">
      <iframe
        ref="mapFrameRef"
        class="map-container"
        src="/singleLineMap_mapOnly.html"
        title="唐山地图"
        loading="eager"
        style="border: 0"
        @load="handleMapFrameLoad"
      ></iframe>
    </section>

    <header class="topbar">
      <svg
        class="topbar-wing"
        viewBox="0 0 1000 52"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="topbar-wing-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#0a3748" stop-opacity="0.12" />
            <stop offset="0.32" stop-color="#087c80" stop-opacity="0.74" />
            <stop offset="0.5" stop-color="#0b9690" stop-opacity="0.9" />
            <stop offset="0.68" stop-color="#087c80" stop-opacity="0.74" />
            <stop offset="1" stop-color="#0a3748" stop-opacity="0.12" />
          </linearGradient>
          <filter id="topbar-wing-glow" x="-10%" y="-20%" width="120%" height="150%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          class="topbar-wing-fill"
          d="M0 1 H1000 V4 C820 5 735 8 680 15 C640 20 655 43 600 50 H400 C345 43 360 20 320 15 C265 8 180 5 0 4 Z"
        />
        <path
          class="topbar-wing-line"
          d="M0 4 C180 5 265 8 320 15 C360 20 345 43 400 50 H600 C655 43 640 20 680 15 C735 8 820 5 1000 4"
        />
        <path
          class="topbar-wing-inner-line"
          d="M20 7 C190 8 272 10 325 17 C365 22 354 40 405 47 H595 C646 40 635 22 675 17 C728 10 810 8 980 7"
        />
        <g class="topbar-wing-lights" filter="url(#topbar-wing-glow)">
          <circle cx="326" cy="17" r="1.8" />
          <circle cx="339" cy="21" r="1.4" />
          <circle cx="350" cy="26" r="1.2" />
          <circle cx="650" cy="26" r="1.2" />
          <circle cx="661" cy="21" r="1.4" />
          <circle cx="674" cy="17" r="1.8" />
        </g>
      </svg>
      <h1>停电辅助决策</h1>
    </header>

    <main class="dashboard">
      <aside class="panel panel-left" :class="{ collapsed: isLeftCollapsed }">
        <button class="panel-toggle left-toggle" @click="toggleLeftPanel">
          {{ isLeftCollapsed ? '>' : '<' }}
        </button>

        <div v-show="!isLeftCollapsed" class="panel-inner">
          <section class="card module-card">
            <template v-if="activePageTab === 'outageAnalysis'">
              <div class="analysis-empty-panel"></div>
            </template>

            <template v-else-if="activePageTab === 'outageUsers'">
              <div class="module-title-row">
                <h2>停电用户分析</h2>
              </div>

              <UserTagModuleCard
                :tag-stats="tagStats"
                :loading="tagStatsLoading"
                :user-tag-pie-data="userTagPieData"
                :show-user-detail-page="showUserDetailPage"
                :important-user-type-chart="importantUserTypeChart"
                :sensitive-user-type-chart="sensitiveUserTypeChart"
                :user-detail-type-options="USER_DETAIL_TYPE_OPTIONS"
                :user-detail-search-input="userDetailSearchInput"
                :user-detail-selected-type="userDetailSelectedType"
                :paged-user-detail-rows="pagedUserDetailRows"
                :filtered-user-detail-rows-length="filteredUserDetailRows.length"
                :user-detail-page-buttons="userDetailPageButtons"
                :user-detail-current-page="userDetailCurrentPage"
                :user-detail-jump-page-input="userDetailJumpPageInput"
                :user-detail-total-pages="userDetailTotalPages"
                :user-detail-modal-visible="userDetailModalVisible"
                :selected-user-detail="selectedUserDetail"
                :user-detail-grid-body-ref-setter="setUserDetailGridBodyRef"
                :user-detail-pagination-ref-setter="setUserDetailPaginationRef"
                :user-detail-page-jump-ref-setter="setUserDetailPageJumpRef"
                :show-key-user-detail-page="showKeyUserDetailPage"
                :key-user-industry-pie-data="keyUserIndustryPieData"
                :key-user-industry-pie-background="keyUserIndustryPieBackground"
                :key-user-industry-total="keyUserIndustryTotal"
                :sensitive-user-industry-pie-data="sensitiveUserIndustryPieData"
                :sensitive-user-industry-pie-background="sensitiveUserIndustryPieBackground"
                :sensitive-user-industry-total="sensitiveUserIndustryTotal"
                :key-user-nature-pie-data="keyUserNaturePieData"
                :key-user-nature-pie-background="keyUserNaturePieBackground"
                :key-user-stats-loading="keyUserDetailStatsLoading"
                :key-user-search-input="keyUserDetailSearchInput"
                :key-user-filter-category="keyUserDetailSelectedFilterCategory"
                :key-user-filter-value="keyUserDetailSelectedFilterValue"
                :key-user-filter-category-options="keyUserFilterCategoryOptions"
                :key-user-filter-value-options="keyUserFilterValueOptions"
                :paged-key-user-rows="pagedKeyUserDetailRows"
                :filtered-key-user-rows-length="keyUserDetailTotal"
                :key-user-page-buttons="keyUserDetailPageButtons"
                :key-user-current-page="keyUserDetailCurrentPage"
                :key-user-jump-page-input="keyUserDetailJumpPageInput"
                :key-user-total-pages="keyUserDetailTotalPages"
                :key-user-detail-loading="keyUserDetailLoading"
                :key-user-detail-modal-visible="keyUserDetailModalVisible"
                :selected-key-user-detail="selectedKeyUserDetail"
                @open-user-detail="openUserDetailPage"
                @close-user-detail="closeUserDetailPage"
                @update:user-detail-search-input="userDetailSearchInput = $event"
                @apply-user-detail-search="applyUserDetailSearch"
                @update:user-detail-selected-type="userDetailSelectedType = $event"
                @open-user-detail-modal="openUserDetailModal"
                @go-user-detail-page="goUserDetailPage"
                @update:user-detail-jump-page-input="userDetailJumpPageInput = $event"
                @jump-to-user-detail-page="jumpToUserDetailPage"
                @close-user-detail-modal="closeUserDetailModal"
                @open-key-user-detail="openKeyUserDetailPage"
                @close-key-user-detail="closeKeyUserDetailPage"
                @update:key-user-search-input="keyUserDetailSearchInput = $event"
                @apply-key-user-search="applyKeyUserDetailSearch"
                @update:key-user-filter-category="keyUserDetailSelectedFilterCategory = $event"
                @update:key-user-filter-value="keyUserDetailSelectedFilterValue = $event"
                @open-key-user-modal="openKeyUserDetailModal"
                @go-key-user-page="goKeyUserDetailPage"
                @update:key-user-jump-page-input="keyUserDetailJumpPageInput = $event"
                @jump-to-key-user-page="jumpToKeyUserDetailPage"
                @close-key-user-modal="closeKeyUserDetailModal"
              />

              <KeyUserTimeTrendCard
                :start-time="queryStartTime"
                :end-time="queryEndTime"
                :county-id="selectedRegionCountyId"
                :outage-freq-data="countyOutageFreqData"
                :users="tagAndKeyUserSourceUsers"
                :time-segments="keyUserTimeTrend.labels"
                :time-sub-segments="keyUserTimeTrend.timeLabels"
                :sensitive-series="keyUserTimeTrend.sensitiveSeries"
                :important-series="keyUserTimeTrend.importantSeries"
                :loading="countyTrendLoading"
                :outage-freq-loading="countyOutageFreqLoading"
                @open-detail-page="handleOpenTimeTrendDetailPage"
                @locate-user-meter-box="syncOneMapMeterBoxId"
              />

              <KeyUserCountBarCard
                :rows="keyUserCountRows"
                :selected-region="selectedRegion"
                :detail-rows="countyEquipmentListRows"
                :table-rows="countyEquipmentPageRows"
                :table-total="countyEquipmentPageTotal"
                :summary-stats="countyEquipmentStatsSummary"
                :overview-loading="loading || spatialDistributionLoading"
                :equipment-stats-loading="countyEquipmentStatsLoading"
                :loading="spaceDistributionDetailLoading"
                @open-detail-page="handleOpenSpaceDistributionDetailPage"
                @go-detail-page="handleGoSpaceDistributionDetailPage"
                @close-detail-page="handleCloseSpaceDistributionDetailPage"
                @select-top-device="handleSelectSpaceDistributionTopDevice"
              />
            </template>

            <template v-else-if="activePageTab === 'sensitiveDemand'">
              <section v-if="showSensitiveDemandAutoDetail" class="sensitive-demand-auto-detail-page">
                <header class="sensitive-demand-auto-detail-head">
                  <h2>自动化识别</h2>
                  <div class="sensitive-demand-auto-detail-actions">
                    <button type="button" class="user-detail-close" @click="showSensitiveDemandAutoDetail = false">×</button>
                  </div>
                </header>
                <div class="sensitive-demand-auto-detail-content">
                  <section class="sensitive-demand-auto-detail-half sensitive-demand-auto-detail-pies">
                    <div class="sensitive-demand-auto-detail-module-actions">
                      <select v-model="selectedSensitiveDemandAutoDetailKey" class="region-select">
                        <option
                          v-for="group in sensitiveDemandAutoDetailGroups"
                          :key="`auto-detail-option-${group.key}`"
                          :value="group.key"
                        >
                          {{ group.label }}
                        </option>
                      </select>
                    </div>
                    <article class="sensitive-demand-auto-detail-pie-card">
                      <div
                        class="tag-pie sensitive-demand-pie sensitive-demand-detail-pie"
                        :style="{ '--demand-pie-bg': selectedSensitiveDemandAutoDetailGroup?.pieBackground }"
                        @mouseleave="activeSensitiveDemandAutoDetailCategoryKey = ''"
                      >
                        <svg class="sensitive-demand-pie-hit-area" viewBox="0 0 100 100" aria-hidden="true">
                          <circle
                            v-for="item in sensitiveDemandAutoDetailPieSegments"
                            :key="`sensitive-demand-auto-detail-pie-${item.key}`"
                            class="sensitive-demand-pie-hit-segment"
                            cx="50"
                            cy="50"
                            r="39.5"
                            pathLength="100"
                            :stroke-dasharray="`${item.value} ${100 - item.value}`"
                            :stroke-dashoffset="-item.start"
                            @mouseenter="activeSensitiveDemandAutoDetailCategoryKey = item.key"
                            @focus="activeSensitiveDemandAutoDetailCategoryKey = item.key"
                          />
                        </svg>
                        <div class="tag-pie-center sensitive-demand-auto-pie-center">
                          <strong>{{ sensitiveDemandAutoDetailPieCenterValue }}</strong>
                          <span>{{ sensitiveDemandAutoDetailPieCenterLabel }}</span>
                        </div>
                      </div>
                    </article>
                    <article class="sensitive-demand-auto-detail-list-card">
                      <div
                        class="sensitive-demand-auto-detail-list"
                        :class="{ 'is-important': selectedSensitiveDemandAutoDetailGroup?.key === 'important' }"
                      >
                        <div
                          v-for="item in selectedSensitiveDemandAutoDetailGroup?.rows || []"
                          :key="item.key"
                          class="sensitive-demand-auto-detail-row"
                        >
                          <span class="sensitive-demand-type-dot" :style="{ background: item.color }"></span>
                          <span class="sensitive-demand-type-label" :title="item.label">{{ item.label }}</span>
                          <strong>{{ item.count }}人</strong>
                          <em>{{ item.rateText }}</em>
                        </div>
                      </div>
                    </article>
                  </section>
                  <section class="sensitive-demand-auto-detail-half sensitive-demand-auto-detail-spare">
                    <div class="sensitive-demand-auto-detail-query">
                      <input
                        v-model="sensitiveDemandAutoDetailSearchInput"
                        class="sensitive-demand-auto-detail-search"
                        type="text"
                        placeholder="搜索客户编号或姓名"
                        @keydown.enter.prevent="applySensitiveDemandAutoDetailSearch"
                      />
                      <button
                        type="button"
                        class="sensitive-demand-auto-detail-query-btn"
                        @click="applySensitiveDemandAutoDetailSearch"
                      >
                        查询
                      </button>
                      <select v-model="selectedSensitiveDemandAutoDetailTableCategoryKey" class="region-select">
                        <option value="">全部</option>
                        <option
                          v-for="item in selectedSensitiveDemandAutoDetailGroup?.rows || []"
                          :key="`auto-detail-table-category-${item.key}`"
                          :value="item.key"
                        >
                          {{ item.label }}
                        </option>
                      </select>
                    </div>

                    <div class="sensitive-demand-auto-detail-table-wrap">
                      <div class="sensitive-demand-auto-detail-table sensitive-demand-auto-detail-table-head">
                        <span>用户编号</span>
                        <span>姓名</span>
                        <span>电话</span>
                        <span>用户类型</span>
                        <span>详情</span>
                      </div>
                      <div class="sensitive-demand-auto-detail-table-body">
                        <div
                          v-for="item in sensitiveDemandAutoDetailPageRows"
                          :key="item.key"
                          class="sensitive-demand-auto-detail-table sensitive-demand-auto-detail-table-row"
                        >
                          <span :title="item.consNo">{{ item.consNo }}</span>
                          <span :title="item.consName">{{ item.consName }}</span>
                          <span :title="item.phone">{{ item.phone }}</span>
                          <span :title="item.userType">{{ item.userType }}</span>
                          <button
                            type="button"
                            class="detail-btn"
                            @click="openSensitiveDemandAutoDetailTableUser(item)"
                          >
                            详情
                          </button>
                        </div>
                        <p
                          v-if="sensitiveDemandAutoDetailLoading"
                          class="empty-tip sensitive-demand-auto-detail-empty"
                        >
                          客户诉求数据加载中...
                        </p>
                        <p
                          v-else-if="sensitiveDemandAutoDetailError"
                          class="empty-tip sensitive-demand-auto-detail-empty"
                        >
                          {{ sensitiveDemandAutoDetailError }}
                        </p>
                        <p
                          v-else-if="sensitiveDemandAutoDetailPageRows.length === 0"
                          class="empty-tip sensitive-demand-auto-detail-empty"
                        >
                          暂无客户诉求数据
                        </p>
                      </div>
                    </div>

                    <div class="sensitive-demand-auto-detail-pagination">
                      <span>共 {{ sensitiveDemandAutoDetailTotal }} 条</span>
                      <button
                        v-for="page in sensitiveDemandAutoDetailPageButtons"
                        :key="`sensitive-demand-auto-detail-page-${page}`"
                        type="button"
                        class="page-btn"
                        :class="{ active: page === sensitiveDemandAutoDetailCurrentPage }"
                        @click="goSensitiveDemandAutoDetailPage(page)"
                      >
                        {{ page }}
                      </button>
                      <div class="user-detail-page-jump">
                        <input
                          v-model="sensitiveDemandAutoDetailJumpPageInput"
                          type="number"
                          min="1"
                          :max="sensitiveDemandAutoDetailTotalPages"
                          class="user-detail-page-input"
                          placeholder="页码"
                          @keyup.enter="jumpToSensitiveDemandAutoDetailPage"
                        />
                        <button
                          type="button"
                          class="user-detail-page-jump-btn"
                          @click="jumpToSensitiveDemandAutoDetailPage"
                        >
                          跳转
                        </button>
                      </div>
                    </div>
                  </section>
                </div>

                <div
                  v-if="selectedSensitiveDemandAutoDetailTableUser"
                  class="user-detail-modal-mask sensitive-demand-auto-detail-modal-mask"
                  @click.self="selectedSensitiveDemandAutoDetailTableUser = null"
                >
                  <article class="user-detail-modal sensitive-demand-auto-detail-modal">
                    <button
                      type="button"
                      class="user-detail-modal-close"
                      @click="selectedSensitiveDemandAutoDetailTableUser = null"
                    >
                      ×
                    </button>
                    <h4>客户诉求详情</h4>
                    <div class="user-detail-modal-content sensitive-demand-auto-detail-modal-content">
                      <p><span>用户编号：</span>{{ selectedSensitiveDemandAutoDetailTableUser.consNo }}</p>
                      <p><span>姓名：</span>{{ selectedSensitiveDemandAutoDetailTableUser.consName }}</p>
                      <p><span>电话：</span>{{ selectedSensitiveDemandAutoDetailTableUser.phone }}</p>
                      <p><span>用户类型：</span>{{ selectedSensitiveDemandAutoDetailTableUser.userType }}</p>
                      <div class="sensitive-demand-auto-detail-demands">
                        <h5>诉求内容</h5>
                        <p v-if="sensitiveDemandAutoDetailDetailLoading" class="empty-tip">详情加载中...</p>
                        <ul>
                          <li
                            v-for="item in selectedSensitiveDemandAutoDetailTableUser.demandContents"
                            :key="`${selectedSensitiveDemandAutoDetailTableUser.key}-${item.time}`"
                          >
                            <strong>{{ item.time }}</strong>
                            <span>{{ item.content }}</span>
                          </li>
                        </ul>
                        <p
                          v-if="!sensitiveDemandAutoDetailDetailLoading && !selectedSensitiveDemandAutoDetailTableUser.demandContents?.length"
                          class="empty-tip"
                        >
                          暂无诉求详情
                        </p>
                      </div>
                      <p><span>判定规则：</span></p>
                    </div>
                  </article>
                </div>
              </section>

              <div v-else class="sensitive-demand-left-layout">
                <section class="sensitive-demand-module sensitive-demand-top-module">
                  <div class="module-title-row">
                    <h2>诉求归集TOP 5</h2>
                  </div>

                  <div class="sensitive-demand-top-content">
                    <div class="sensitive-demand-user-list">
                      <div
                        v-for="item in sensitiveDemandTopUsers"
                        :key="item.key"
                        class="sensitive-demand-user-item"
                        :class="{ active: item.key === selectedSensitiveDemandUserKey }"
                        @click="selectedSensitiveDemandUserKey = item.key"
                      >
                        <div class="sensitive-demand-user-info">
                          <p :title="item.consNo">用户编号：{{ item.consNo }}</p>
                          <p :title="item.consName">用户姓名：{{ item.consName }}</p>
                          <p :title="item.phone">用户电话：{{ item.phone }}</p>
                        </div>
                        <div class="sensitive-demand-user-count">
                          <strong>{{ item.count }}</strong>
                          <span>次</span>
                        </div>
                      </div>
                      <p v-if="sensitiveDemandLoading" class="empty-tip">敏感诉求数据加载中...</p>
                      <p v-else-if="sensitiveDemandError" class="empty-tip">{{ sensitiveDemandError }}</p>
                      <p v-else-if="sensitiveDemandTopUsers.length === 0" class="empty-tip">暂无诉求归集数据</p>
                    </div>

                    <div class="sensitive-demand-type-panel">
                      <div class="sensitive-demand-type-head">
                        <h3>诉求类型</h3>
                      </div>
                      <div
                        class="tag-pie sensitive-demand-pie"
                        :style="{ '--demand-pie-bg': sensitiveDemandPieBackground }"
                        @mouseleave="activeSensitiveDemandTypeKey = ''"
                      >
                        <svg class="sensitive-demand-pie-hit-area" viewBox="0 0 100 100" aria-hidden="true">
                          <circle
                            v-for="item in sensitiveDemandPieSegments"
                            :key="`sensitive-demand-pie-${item.key}`"
                            class="sensitive-demand-pie-hit-segment"
                            cx="50"
                            cy="50"
                            r="39.5"
                            pathLength="100"
                            :stroke-dasharray="`${item.value} ${100 - item.value}`"
                            :stroke-dashoffset="-item.start"
                            @mouseenter="activeSensitiveDemandTypeKey = item.key"
                            @focus="activeSensitiveDemandTypeKey = item.key"
                          />
                        </svg>
                        <div class="tag-pie-center sensitive-demand-pie-center">
                          <strong>{{ sensitiveDemandPieCenterValue }}</strong>
                          <span>{{ sensitiveDemandPieCenterLabel }}</span>
                        </div>
                      </div>
                      <div class="sensitive-demand-type-legend">
                        <div
                          v-for="item in sensitiveDemandTypeRows"
                          :key="item.key"
                          class="sensitive-demand-type-legend-item"
                        >
                          <span class="sensitive-demand-type-dot" :style="{ background: item.color }"></span>
                          <span class="sensitive-demand-type-label" :title="item.label">{{ item.label }}</span>
                          <strong>{{ item.count }}次</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <SensitiveDemandWorkOrderStatsCard />

                <section
                  class="sensitive-demand-module sensitive-demand-auto-module"
                  @click="showSensitiveDemandAutoDetail = true"
                >
                  <div class="module-title-row">
                    <h2>自动化识别</h2>
                  </div>
                  <div class="sensitive-demand-type-panel sensitive-demand-auto-panel">
                    <div
                      class="tag-pie sensitive-demand-pie sensitive-demand-auto-pie"
                      :style="{ '--demand-pie-bg': sensitiveDemandUserTagPieBackground }"
                      @mouseleave="activeSensitiveDemandUserTagKey = ''"
                    >
                      <svg class="sensitive-demand-pie-hit-area" viewBox="0 0 100 100" aria-hidden="true">
                        <circle
                          v-for="item in sensitiveDemandUserTagPieSegments"
                          :key="`sensitive-demand-user-tag-pie-${item.key}`"
                          class="sensitive-demand-pie-hit-segment"
                          cx="50"
                          cy="50"
                          r="39.5"
                          pathLength="100"
                          :stroke-dasharray="`${item.value} ${100 - item.value}`"
                          :stroke-dashoffset="-item.start"
                          @mouseenter="activeSensitiveDemandUserTagKey = item.key"
                          @focus="activeSensitiveDemandUserTagKey = item.key"
                        />
                      </svg>
                      <div class="tag-pie-center sensitive-demand-auto-pie-center">
                        <strong>{{ sensitiveDemandUserTagPieCenterValue }}</strong>
                        <span>{{ sensitiveDemandUserTagPieCenterLabel }}</span>
                      </div>
                    </div>
                    <div class="sensitive-demand-type-legend sensitive-demand-auto-legend">
                      <div
                        v-for="item in sensitiveDemandUserTagRows"
                        :key="item.key"
                        class="sensitive-demand-type-legend-item sensitive-demand-auto-legend-item"
                      >
                        <span class="sensitive-demand-type-dot" :style="{ background: item.color }"></span>
                        <span class="sensitive-demand-type-label" :title="item.label">{{ item.label }}</span>
                        <strong>{{ item.count }}人</strong>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </template>
          </section>
        </div>
      </aside>

      <aside class="panel panel-right" :class="{ collapsed: isRightCollapsed }">
        <button class="panel-toggle right-toggle" @click="toggleRightPanel">
          {{ isRightCollapsed ? '<' : '>' }}
        </button>

        <div v-show="!isRightCollapsed" class="panel-inner">
          <OutageUserAnalysisPanel
            v-if="activePageTab === 'outageAnalysis'"
            :selected-region="selectedRegion"
            :end-date="queryEndTime"
          />

          <section v-else-if="activePageTab === 'outageUsers'" class="card module-card">
            <CountyWarningLightsCard
              :county-warning-lights="countyWarningLights"
              :loading="loading"
              :popup-visible="countyWarningPopupVisible"
              :popup-county-name="countyWarningPopupCounty"
              :popup-events="countyWarningPopupEvents"
              :popup-loading="countyWarningPopupLoading"
              :popup-error="countyWarningPopupError"
              :popup-current-page="countyWarningPopupCurrentPage"
              :popup-total="countyWarningPopupTotal"
              @select-county="openCountyWarningPopup"
              @close-popup="closeCountyWarningPopup"
              @change-popup-page="goCountyWarningPopupPage"
            />

            <FaultLocationModuleCard
              :selected-fault-county="selectedRegion"
              :county-region-options="countyRegionOptions"
              :fault-location-summary="faultLocationSummary"
              :filtered-fault-outage-events-length="filteredFaultOutageEvents.length"
              :fault-location-loading="faultLocationLoading"
              :show-outage-detail-page="showOutageDetailPage"
              :outage-nature-overview="outageNatureOverview"
              :outage-events-summary-loading="faultLocationEventTypesLoading"
              :outage-restore-overview="outageRestoreOverview"
              :outage-detail-search-input="outageDetailSearchInput"
              :outage-detail-selected-nature="outageDetailSelectedNature"
              :outage-detail-nature-options="faultLocationLineTypeOptions"
              :paged-outage-detail-rows="pagedOutageDetailRows"
              :filtered-outage-detail-rows-length="outageDetailTotal"
              :outage-detail-page-buttons="outageDetailPageButtons"
              :outage-detail-current-page="outageDetailCurrentPage"
              :outage-detail-jump-page-input="outageDetailJumpPageInput"
              :outage-detail-total-pages="outageDetailTotalPages"
              :outage-detail-loading="outageDetailLoading"
              :outage-detail-modal-visible="outageDetailModalVisible"
              :outage-detail-dimension="outageDetailDimension"
              :selected-outage-detail="selectedOutageDetail"
              :outage-detail-grid-body-ref-setter="setOutageDetailGridBodyRef"
              :outage-detail-pagination-ref-setter="setOutageDetailPaginationRef"
              :outage-detail-page-jump-ref-setter="setOutageDetailPageJumpRef"
              @update:selected-fault-county="selectedRegion = $event"
              @open-outage-detail="openOutageDetailPage"
              @fault-mode-change="handleFaultLocationModeChange"
              @close-outage-detail="closeOutageDetailPage"
              @update:outage-detail-search-input="outageDetailSearchInput = $event"
              @apply-outage-detail-search="applyOutageDetailSearch"
              @update:outage-detail-selected-nature="outageDetailSelectedNature = $event"
              @open-outage-detail-modal="openOutageDetailModal"
              @go-outage-detail-page="goOutageDetailPage"
              @update:outage-detail-jump-page-input="outageDetailJumpPageInput = $event"
              @jump-to-outage-detail-page="jumpToOutageDetailPage"
              @close-outage-detail-modal="closeOutageDetailModal"
            />

            <OutageRangeAssessmentCard
              :outage-summary="outageSummary"
              :outage-summary-loading="outageScopeSummaryLoading"
              :outage-range-chains="outageRangeChains"
              :outage-range-total="outageRangeChainsTotal"
              :outage-range-current-page="outageRangeChainsCurrentPage"
              :outage-range-loading="outageRangeChainsLoading"
              :show-outage-range-assessment-page="showOutageRangeAssessmentPage"
              @open-outage-range-detail="openOutageRangeAssessmentPage"
              @go-outage-range-page="goOutageRangeAssessmentPage"
              @close-outage-range-detail="closeOutageRangeAssessmentPage"
            />
          </section>

          <section v-else class="card module-card sensitive-demand-module">
            <SearchBox
              :model-value="intelligentAnalysisSearchInput"
              @update:model-value="intelligentAnalysisSearchInput = $event"
              @search="searchIntelligentAnalysisUser"
              @clear="clearIntelligentAnalysisUserSearch"
            />

            <UserPersonalInfoPanel :user="intelligentAnalysisSelectedUser?.userAppealInfo || null" />
            <EmotionEvolutionAnalysisPanel
              :user="intelligentAnalysisSelectedUser"
              :analysis-value="emotionEvolutionAnalysisValue"
              :loading="emotionEvolutionAnalysisLoading"
              :error="emotionEvolutionAnalysisError"
            />
            <IntelligentWarningPanel
              :user="intelligentAnalysisSelectedUser"
              :warning-value="intelligentWarningValue"
              :loading="intelligentWarningLoading"
              :error="intelligentWarningError"
            />
            <ReplyAssistantPanel
              :user="intelligentAnalysisSelectedUser"
              :receipt-value="intelligentReceiptValue"
              :loading="intelligentReceiptLoading"
              :error="intelligentReceiptError"
            />
          </section>
        </div>
      </aside>

      <section class="global-filter-bar">
        <div class="page-tab-switch">
          <button
            type="button"
            class="page-tab-btn"
            :class="{ active: activePageTab === 'outageAnalysis' }"
            @click="switchPageTab('outageAnalysis')"
          >
            停电用户分析
          </button>
          <button
            type="button"
            class="page-tab-btn"
            :class="{ active: activePageTab === 'outageUsers' }"
            @click="switchPageTab('outageUsers')"
          >
            停电用户
          </button>
          <button
            type="button"
            class="page-tab-btn"
            :class="{ active: activePageTab === 'sensitiveDemand' }"
            @click="switchPageTab('sensitiveDemand')"
          >
            敏感诉求
          </button>
        </div>

        <label v-if="activePageTab === 'outageUsers'" class="global-county-field">
          <select v-model="selectedRegion" class="region-select global-county-select">
            <option v-for="item in regionOptions" :key="`global-county-${item}`" :value="item">{{ item }}</option>
          </select>
        </label>

        <div v-if="activePageTab !== 'outageAnalysis'" class="time-filter-bar global-time-filter">
          <label class="time-filter-field">
            <input v-model="queryEndTime" type="date" class="time-filter-input" />
          </label>
        </div>
      </section>

      <section class="dashboard-spacer"></section>
    </main>

  </div>
</template>

