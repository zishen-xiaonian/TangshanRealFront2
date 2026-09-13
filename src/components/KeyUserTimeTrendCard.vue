<script setup>
import '../style.css'
import { computed, ref, watch } from 'vue'
import { queryOutageEventOutageDetail, queryOutageUserTimeTrendUsers } from '../api/outage'

const props = defineProps({
  startTime: {
    type: [String, Date],
    default: '',
  },
  endTime: {
    type: [String, Date],
    default: '',
  },
  countyId: {
    type: String,
    default: '',
  },
  outageFreqData: {
    type: Object,
    default: null,
  },
  outageFreqLoading: {
    type: Boolean,
    default: false,
  },
  users: {
    type: Array,
    default: () => [],
  },
  timeSegments: {
    type: Array,
    default: () => [],
  },
  timeSubSegments: {
    type: Array,
    default: () => [],
  },
  sensitiveSeries: {
    type: Array,
    default: () => [],
  },
  importantSeries: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: '时间趋势',
  },
  sensitiveLabel: {
    type: String,
    default: '敏感用户',
  },
  importantLabel: {
    type: String,
    default: '重要用户',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['open-detail-page', 'locate-user-meter-box'])

const DEFAULT_SEGMENT_COUNT = 5
const DEFAULT_POINT_COUNT = DEFAULT_SEGMENT_COUNT + 1
const SVG_WIDTH = 720
const SVG_HEIGHT = 260
const CHART_PADDING = {
  top: 18,
  right: 36,
  bottom: 88,
  left: 52,
}

const DETAIL_PAGE_SIZE = 10
const DETAIL_MODAL_PAGE_SIZE = 10
const DETAIL_PAGE_MAX_BUTTONS = 7
const DETAIL_MODAL_PAGE_MAX_BUTTONS = 5
const defaultTangshanCityId = '16401'
const countyListCityId = import.meta.env.VITE_TANGSHAN_CITY_ID || defaultTangshanCityId

const detailPageVisible = ref(false)
const detailSearchInput = ref('')
const detailSearchKeyword = ref('')
const detailTimeRangeFilter = ref('2')
const detailOutageCountFilter = ref('all')
const detailCurrentPage = ref(1)
const detailJumpPageInput = ref('')
const detailModalVisible = ref(false)
const detailModalViewportCentered = ref(false)
const selectedUserDetail = ref(null)
const detailModalLoading = ref(false)
const detailModalError = ref('')
const detailModalRequestId = ref(0)
const detailModalCurrentPage = ref(1)
const detailModalPerPage = ref(DETAIL_MODAL_PAGE_SIZE)
const detailModalTotal = ref(0)
const detailModalRemotePages = ref(0)
const detailModalJumpPageInput = ref('')
const detailTableRows = ref([])
const detailTableTotal = ref(0)
const detailTablePerPage = ref(DETAIL_PAGE_SIZE)
const detailTableLoading = ref(false)
const detailTableError = ref('')
const detailTableRequestId = ref(0)
const hoveredImportantOutagePieKey = ref('')
const hoveredSensitiveOutagePieKey = ref('')

const toDate = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const text = String(value ?? '').trim()
  if (!text) {
    return null
  }

  const normalized = text.replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const toText = (value, fallback = '-') => {
  const text = String(value ?? '').trim()
  return text || fallback
}

const readFieldValue = (record, keys = []) => {
  if (!record || typeof record !== 'object') {
    return ''
  }

  for (const key of keys) {
    const direct = record?.[key]
    if (direct !== undefined && direct !== null && String(direct).trim() !== '') {
      return direct
    }
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

const formatTimeLabel = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '--:--'
  }
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

const formatDateTimeLabel = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '-'
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

const toBackendDateTime = (value, dateBoundary = 'end') => {
  if (value instanceof Date) {
    return formatDateTimeLabel(value)
  }

  const text = String(value ?? '').trim()
  if (!text) {
    return ''
  }

  const normalized = text.replace('T', ' ')
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const timeText = dateBoundary === 'start' ? '00:00:00' : '23:59:59'
    return `${normalized} ${timeText}`
  }
  return normalized.length === 16 ? `${normalized}:00` : normalized
}

const subtractMonthsFromBackendDateTime = (dateTimeText, monthCount) => {
  const matched = String(dateTimeText || '').trim().match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  )
  if (!matched) {
    return ''
  }

  const [, yearText, monthText, dayText, hourText = '00', minuteText = '00', secondText = '00'] = matched
  const sourceYear = Number(yearText)
  const sourceMonthIndex = Number(monthText) - 1
  const sourceDay = Number(dayText)
  const targetMonthBase = sourceYear * 12 + sourceMonthIndex - Math.max(Number(monthCount) || 0, 0)
  const targetYear = Math.floor(targetMonthBase / 12)
  const targetMonthIndex = ((targetMonthBase % 12) + 12) % 12
  const targetMonthLastDay = new Date(targetYear, targetMonthIndex + 1, 0).getDate()
  const targetDay = Math.min(sourceDay, targetMonthLastDay)

  return formatDateTimeLabel(
    new Date(
      targetYear,
      targetMonthIndex,
      targetDay,
      Number(hourText),
      Number(minuteText),
      Number(secondText),
    ),
  )
}

const getDetailModalQueryRange = () => {
  const endTime = toBackendDateTime(props.endTime, 'end')
  const monthCount = detailTimeRangeFilter.value === '1' ? 1 : 2
  const beginTime = subtractMonthsFromBackendDateTime(endTime, monthCount)

  return {
    beginTime: beginTime || toBackendDateTime(props.startTime, 'start'),
    endTime,
  }
}

const toBackendDate = (value) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return ''
    }
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }

  const text = String(value ?? '').trim()
  if (/^\d{8}$/.test(text)) {
    return text
  }

  const matched = text.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/)
  if (matched) {
    return `${matched[1]}${matched[2]}${matched[3]}`
  }

  const date = toDate(text)
  if (!date) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

const toCountArray = (values, length) =>
  Array.from({ length }, (_, index) => Math.max(Number(values?.[index]) || 0, 0))

const isSensitiveUser = (record) => {
  if (record?.isSensitive === true) {
    return true
  }

  const levelText = String(record?.keyUserLevel || record?.userLevel || record?.label || '').trim()
  return levelText.includes('敏感')
}

const isImportantUser = (record) => {
  if (record?.isImportant === true) {
    return true
  }

  const levelText = String(record?.keyUserLevel || record?.userLevel || record?.label || '').trim()
  return levelText.includes('重点') || levelText.includes('重要')
}

const pickUserTime = (record) => {
  const keys = [
    'ctime',
    'beginTime',
    'begin_time',
    'outageBeginTime',
    'outage_begin_time',
    'eventTime',
    'event_time',
    'statTime',
    'stat_time',
  ]

  for (const key of keys) {
    const value = record?.[key]
    if (value === undefined || value === null || String(value).trim() === '') {
      continue
    }
    const date = toDate(value)
    if (date) {
      return date
    }
  }

  return null
}

const pickUserBeginTime = (record) =>
  readFieldValue(record, [
    'ctime',
    'beginTime',
    'begin_time',
    'outageBeginTime',
    'outage_begin_time',
    'eventTime',
    'event_time',
    'statTime',
    'stat_time',
  ])

const pickUserEndTime = (record) =>
  readFieldValue(record, [
    'endTime',
    'end_time',
    'outageEndTime',
    'outage_end_time',
    'restoreTime',
    'restore_time',
  ])

const resolvePointCount = computed(() => {
  const providedLength = Math.max(
    Number(props.timeSegments?.length) || 0,
    Number(props.sensitiveSeries?.length) || 0,
    Number(props.importantSeries?.length) || 0,
  )
  return providedLength >= 2 ? providedLength : DEFAULT_POINT_COUNT
})

const buildDefaultTimePoints = (start, end, pointCount) => {
  if (!start || !end || start.getTime() >= end.getTime()) {
    return Array.from({ length: pointCount }, (_, index) => `时间点${index + 1}`)
  }

  const totalSpan = end.getTime() - start.getTime()
  const step = totalSpan / (pointCount - 1)

  return Array.from({ length: pointCount }, (_, index) =>
    formatTimeLabel(new Date(start.getTime() + step * index)),
  )
}

const chartSourceData = computed(() => {
  const pointCount = resolvePointCount.value
  const start = toDate(props.startTime)
  const end = toDate(props.endTime)
  const labels =
    props.timeSegments.length === pointCount ? props.timeSegments : buildDefaultTimePoints(start, end, pointCount)
  const timeLabels =
    props.timeSubSegments.length === pointCount
      ? props.timeSubSegments
      : Array.from({ length: pointCount }, () => '--:--')

  if (props.sensitiveSeries.length > 0 || props.importantSeries.length > 0) {
    return {
      labels,
      timeLabels,
      sensitiveCounts: toCountArray(props.sensitiveSeries, pointCount),
      importantCounts: toCountArray(props.importantSeries, pointCount),
    }
  }

  if (!start || !end || start.getTime() >= end.getTime()) {
    return {
      labels,
      timeLabels,
      sensitiveCounts: toCountArray([], pointCount),
      importantCounts: toCountArray([], pointCount),
    }
  }

  const segmentCount = pointCount - 1
  const totalSpan = end.getTime() - start.getTime()
  const step = totalSpan / segmentCount
  const sensitiveCounts = toCountArray([], pointCount)
  const importantCounts = toCountArray([], pointCount)

  props.users.forEach((item) => {
    const record = item || {}
    const userTime = pickUserTime(record)
    if (!userTime) {
      return
    }

    const timestamp = userTime.getTime()
    const startMs = start.getTime()
    const endMs = end.getTime()
    if (timestamp < startMs || timestamp > endMs) {
      return
    }

    const rawIndex = timestamp === endMs ? segmentCount - 1 : Math.floor((timestamp - startMs) / step)
    const segmentIndex = Math.min(segmentCount - 1, Math.max(0, rawIndex))
    const pointIndex = segmentIndex + 1

    if (isSensitiveUser(record)) {
      sensitiveCounts[pointIndex] += 1
    }
    if (isImportantUser(record)) {
      importantCounts[pointIndex] += 1
    }
  })

  for (let i = 1; i < pointCount; i += 1) {
    sensitiveCounts[i] += sensitiveCounts[i - 1]
    importantCounts[i] += importantCounts[i - 1]
  }

  return {
    labels,
    timeLabels,
    sensitiveCounts,
    importantCounts,
  }
})

const yAxisMax = computed(() => {
  const allValues = [...chartSourceData.value.sensitiveCounts, ...chartSourceData.value.importantCounts]
  const maxValue = Math.max(...allValues, 0)
  if (maxValue <= 0) {
    return 4
  }
  const step = Math.max(1, Math.ceil(maxValue / 4))
  return step * 4
})

const yAxisStep = computed(() => Math.max(1, yAxisMax.value / 4))

const plotWidth = SVG_WIDTH - CHART_PADDING.left - CHART_PADDING.right
const plotHeight = SVG_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom

const calcX = (index, pointCount) => {
  if (pointCount <= 1) {
    return CHART_PADDING.left
  }
  return CHART_PADDING.left + (plotWidth * index) / (pointCount - 1)
}

const calcY = (value) => CHART_PADDING.top + plotHeight - (Math.max(value, 0) / yAxisMax.value) * plotHeight

const yTicks = computed(() =>
  Array.from({ length: 5 }, (_, index) => {
    const value = yAxisMax.value - yAxisStep.value * index
    return {
      value: Math.round(value),
      y: CHART_PADDING.top + (plotHeight * index) / 4,
    }
  }),
)

const sensitivePoints = computed(() => {
  const pointCount = chartSourceData.value.labels.length
  return chartSourceData.value.sensitiveCounts.map((value, index) => ({
    value,
    label: chartSourceData.value.labels[index] || `时间点${index + 1}`,
    timeLabel: chartSourceData.value.timeLabels[index] || '--:--',
    x: calcX(index, pointCount),
    y: calcY(value),
  }))
})

const importantPoints = computed(() => {
  const pointCount = chartSourceData.value.labels.length
  return chartSourceData.value.importantCounts.map((value, index) => ({
    value,
    label: chartSourceData.value.labels[index] || `时间点${index + 1}`,
    timeLabel: chartSourceData.value.timeLabels[index] || '--:--',
    x: calcX(index, pointCount),
    y: calcY(value),
  }))
})

const getXAxisLabelAnchor = (index, total) => {
  if (index === 0) {
    return 'start'
  }
  if (index === total - 1) {
    return 'end'
  }
  return 'middle'
}

const getXAxisLabelOffsetX = (index, total) => {
  if (total < 6) {
    return 0
  }
  if (index === 0) {
    return -8
  }
  if (index === 1) {
    return 8
  }
  if (index === total - 2) {
    return -8
  }
  if (index === total - 1) {
    return 8
  }
  return 0
}

const pointsToPath = (points) =>
  points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')

const sensitivePath = computed(() => pointsToPath(sensitivePoints.value))
const importantPath = computed(() => pointsToPath(importantPoints.value))

const inRange = (time, start, end) => {
  if (!(time instanceof Date) || Number.isNaN(time.getTime())) {
    return false
  }
  if (start && time.getTime() < start.getTime()) {
    return false
  }
  if (end && time.getTime() > end.getTime()) {
    return false
  }
  return true
}

const buildPeriodText = (beginRaw, endRaw) => {
  const beginDate = toDate(beginRaw)
  const endDate = toDate(endRaw)
  const beginText = beginDate ? formatDateTimeLabel(beginDate) : toText(beginRaw)
  const endText = endDate ? formatDateTimeLabel(endDate) : (toText(endRaw, '') || '未复电')
  return `${beginText} ~ ${endText}`
}

const buildUserOutageRows = (matchUser) => {
  const start = toDate(props.startTime)
  const end = toDate(props.endTime)
  const grouped = new Map()

  props.users.forEach((rawItem, index) => {
    const record = rawItem && typeof rawItem === 'object' ? rawItem : {}
    if (!matchUser(record)) {
      return
    }

    const beginRaw = pickUserBeginTime(record)
    const beginDate = toDate(beginRaw)
    if (start && end && start.getTime() < end.getTime() && !inRange(beginDate, start, end)) {
      return
    }

    const consNo = toText(readFieldValue(record, ['consNo', 'cons_no', 'userNo', 'userId', 'consumerNo']), '')
    const consName = toText(readFieldValue(record, ['consName', 'cons_name', 'name', 'userName', 'orgName']), '')
    const fallbackNo = toText(readFieldValue(record, ['outageNumber', 'id']), '')
    const fallbackName = toText(readFieldValue(record, ['rdtFeederName', 'faultEquipName']), '')
    const userId = consNo || fallbackNo || `用户${index + 1}`
    const userName = consName || fallbackName || userId
    const userKey = `${userId}|${userName}`

    if (!grouped.has(userKey)) {
      grouped.set(userKey, {
        id: userKey,
        consNo: consNo || '-',
        consName: userName || '-',
        userLevel: isSensitiveUser(record) ? '敏感' : '重点',
        countyName: toText(readFieldValue(record, ['countyName', 'county_name', 'rdtCountyName', 'rdt_county_name'])),
        tradeName: toText(readFieldValue(record, ['tradeName', 'trade_name', 'tradeTypeName', 'industryName'])),
        consAddr: toText(readFieldValue(record, ['consAddr', 'cons_addr', 'consAddress', 'address'])),
        consTypeName: toText(readFieldValue(record, ['consTypeName', 'cons_type_name', 'consType'])),
        outageEvents: [],
        outageEventKeys: new Set(),
      })
    }

    const row = grouped.get(userKey)
    row.userLevel = isSensitiveUser(record) ? '敏感' : row.userLevel

    const endRaw = pickUserEndTime(record)
    const outageNumber = toText(readFieldValue(record, ['outageNumber', 'outage_number', 'eventNo', 'event_id', 'id']), '-')
    const periodText = buildPeriodText(beginRaw, endRaw)
    const eventKey = `${outageNumber}|${periodText}`
    if (row.outageEventKeys.has(eventKey)) {
      return
    }
    row.outageEventKeys.add(eventKey)

    row.outageEvents.push({
      eventKey,
      outageNumber,
      periodText,
      beginTime: toDate(beginRaw) ? formatDateTimeLabel(toDate(beginRaw)) : toText(beginRaw),
      endTime: toDate(endRaw) ? formatDateTimeLabel(toDate(endRaw)) : (toText(endRaw, '') || '未复电'),
      outageNature: toText(readFieldValue(record, ['outageNature', 'outage_nature'])),
      equipmentName: toText(readFieldValue(record, ['equipmentName', 'equipment_name', 'faultEquipName'])),
      feederName: toText(readFieldValue(record, ['rdtFeederName', 'rdt_feeder_name', 'feederName'])),
      maintGroupName: toText(readFieldValue(record, ['maintGroupName', 'maint_group_name'])),
    })
  })

  return Array.from(grouped.values())
    .map((row) => {
      const sortedEvents = row.outageEvents.slice().sort((a, b) => String(b.beginTime).localeCompare(String(a.beginTime)))
      return {
        ...row,
        outageCount: sortedEvents.length,
        outagePeriodsText: sortedEvents.map((item) => item.periodText).join('；'),
        outageEvents: sortedEvents,
      }
    })
    .sort((a, b) => {
      if (b.outageCount !== a.outageCount) {
        return b.outageCount - a.outageCount
      }
      return String(a.consName).localeCompare(String(b.consName), 'zh-CN')
    })
}

const importantUserOutageRows = computed(() => buildUserOutageRows((record) => isImportantUser(record)))
const sensitiveUserOutageRows = computed(() => buildUserOutageRows((record) => isSensitiveUser(record)))

const DETAIL_OUTAGE_BUCKETS = [
  {
    key: '1',
    label: '1次',
    color: '#58e7a2',
    match: (count) => count === 1,
  },
  {
    key: '2',
    label: '2次',
    color: '#ffd35d',
    match: (count) => count === 2,
  },
  {
    key: '3+',
    label: '3次及以上',
    color: '#ff6363',
    match: (count) => count >= 3,
  },
]

const buildOutagePieSummary = (rows = []) => {
  const totalUsers = rows.length
  return DETAIL_OUTAGE_BUCKETS.map((bucket) => {
    const count = rows.filter((item) => bucket.match(item.outageCount)).length
    const rate = totalUsers > 0 ? Number(((count / totalUsers) * 100).toFixed(1)) : 0
    return {
      key: bucket.key,
      label: bucket.label,
      color: bucket.color,
      count,
      rate,
      rateText: `${rate.toFixed(1)}%`,
    }
  })
}

const toNonNegativeNumber = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null
  }
  return numeric
}

const resolveOutageBucketKey = (label, index) => {
  const text = String(label || '').trim()
  if (text.includes('3') || text.includes('+') || text.includes('以上')) {
    return '3+'
  }
  if (text.includes('2')) {
    return '2'
  }
  if (text.includes('1')) {
    return '1'
  }

  if (index === 0) {
    return '1'
  }
  if (index === 1) {
    return '2'
  }
  return '3+'
}

const buildOutagePieSummaryFromApi = (group) => {
  const distribution = Array.isArray(group?.distribution) ? group.distribution : null
  if (!distribution) {
    return null
  }

  const total = toNonNegativeNumber(group?.total) ?? 0
  const countMap = new Map(DETAIL_OUTAGE_BUCKETS.map((item) => [item.key, 0]))
  const rateMap = new Map()

  distribution.forEach((item, index) => {
    const key = resolveOutageBucketKey(item?.label, index)
    if (!countMap.has(key)) {
      return
    }
    const count = toNonNegativeNumber(item?.count) ?? 0
    countMap.set(key, count)
    const percentage = toNonNegativeNumber(item?.percentage)
    if (percentage !== null) {
      rateMap.set(key, percentage)
    }
  })

  return DETAIL_OUTAGE_BUCKETS.map((bucket) => {
    const count = countMap.get(bucket.key) ?? 0
    const rawRate = rateMap.has(bucket.key)
      ? rateMap.get(bucket.key)
      : (total > 0 ? (count / total) * 100 : 0)
    const rate = Number(rawRate.toFixed(1))
    return {
      key: bucket.key,
      label: bucket.label,
      color: bucket.color,
      count,
      rate,
      rateText: `${rate.toFixed(1)}%`,
    }
  })
}

const buildOutagePieBackground = (items = []) => {
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

const resolveOutagePieHoverKey = (event, items = []) => {
  const rect = event.currentTarget?.getBoundingClientRect()
  if (!rect || !Array.isArray(items) || items.length === 0) {
    return ''
  }

  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const dx = event.clientX - centerX
  const dy = event.clientY - centerY
  const radius = Math.min(rect.width, rect.height) / 2
  const distance = Math.sqrt(dx * dx + dy * dy)
  if (distance < radius * 0.48 || distance > radius) {
    return ''
  }

  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI
  const percent = ((angle + 360) % 360) / 3.6
  let cursor = 0

  for (const item of items) {
    const step = Math.max(0, Number(item.rate) || 0)
    const next = cursor + step
    if (percent >= cursor && percent <= next) {
      return item.key
    }
    cursor = next
  }

  return ''
}

const importantOutagePieSummary = computed(() => {
  const apiSummary = buildOutagePieSummaryFromApi(props.outageFreqData?.keyUsers)
  return apiSummary || buildOutagePieSummary(importantUserOutageRows.value)
})
const sensitiveOutagePieSummary = computed(() => {
  const apiSummary = buildOutagePieSummaryFromApi(props.outageFreqData?.sensitiveUsers)
  return apiSummary || buildOutagePieSummary(sensitiveUserOutageRows.value)
})
const importantOutagePieBackground = computed(() => buildOutagePieBackground(importantOutagePieSummary.value))
const sensitiveOutagePieBackground = computed(() => buildOutagePieBackground(sensitiveOutagePieSummary.value))
const hoveredImportantOutagePieItem = computed(() =>
  importantOutagePieSummary.value.find((item) => item.key === hoveredImportantOutagePieKey.value) || null,
)
const hoveredSensitiveOutagePieItem = computed(() =>
  sensitiveOutagePieSummary.value.find((item) => item.key === hoveredSensitiveOutagePieKey.value) || null,
)
const importantOutageTotal = computed(() => {
  const apiTotal = toNonNegativeNumber(props.outageFreqData?.keyUsers?.total)
  if (apiTotal !== null) {
    return Math.round(apiTotal)
  }
  return importantUserOutageRows.value.length
})
const sensitiveOutageTotal = computed(() => {
  const apiTotal = toNonNegativeNumber(props.outageFreqData?.sensitiveUsers?.total)
  if (apiTotal !== null) {
    return Math.round(apiTotal)
  }
  return sensitiveUserOutageRows.value.length
})

const updateImportantOutagePieHover = (event) => {
  hoveredImportantOutagePieKey.value = resolveOutagePieHoverKey(event, importantOutagePieSummary.value)
}

const updateSensitiveOutagePieHover = (event) => {
  hoveredSensitiveOutagePieKey.value = resolveOutagePieHoverKey(event, sensitiveOutagePieSummary.value)
}

const mapDetailTableRow = (record, index, page = detailCurrentPage.value) => {
  const consNo = toText(readFieldValue(record, ['consNo', 'cons_no', 'userNo', 'userId', 'consumerNo']))
  const consName = toText(readFieldValue(record, ['consName', 'cons_name', 'name', 'userName', 'orgName']))
  const intervalOne = Math.max(Number(readFieldValue(record, ['intervalOne', 'interval_one'])) || 0, 0)
  const intervalTwo = Math.max(Number(readFieldValue(record, ['intervalTwo', 'interval_two'])) || 0, 0)
  const outageCount = Math.max(Number(readFieldValue(record, ['total'])) || 0, 0)
  const outagePeriodsText = toText(
    readFieldValue(record, [
      'outagePeriodsText',
      'outagePeriodText',
      'outagePeriods',
      'outageTimePeriods',
      'outagePeriod',
      'periodText',
    ]),
    '-',
  )
  const outageEvents = Array.isArray(record?.outageEvents) ? record.outageEvents : []
  const id = `${consNo}-${consName}-${page}-${index + 1}`

  return {
    id,
    consNo,
    consName,
    userLevel: toText(readFieldValue(record, ['userLevel', 'keyUserLevel', 'label', 'level'])),
    countyName: toText(readFieldValue(record, ['countyName', 'county_name', 'rdtCountyName', 'rdt_county_name'])),
    tradeName: toText(readFieldValue(record, ['tradeName', 'trade_name', 'tradeTypeName', 'industryName'])),
    consAddr: toText(readFieldValue(record, ['consAddr', 'cons_addr', 'consAddress', 'address'])),
    consTypeName: toText(readFieldValue(record, ['consTypeName', 'cons_type_name', 'consType'])),
    intervalOne,
    intervalTwo,
    outageCount,
    outagePeriodsText,
    outageEvents,
  }
}

const parseDetailTableData = (response) => {
  let data = response?.data ?? response
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      data = {}
    }
  }

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.list)
      ? data.list
      : Array.isArray(data?.rows)
        ? data.rows
        : Array.isArray(data?.data)
          ? data.data
          : []

  return {
    list,
    total: Math.max(Number(data?.totalNum ?? data?.total ?? data?.totalCount ?? list.length) || 0, 0),
    page: Math.max(Number(data?.pageNum ?? data?.page ?? detailCurrentPage.value) || 1, 1),
    perPage: Math.max(Number(data?.pageSize ?? data?.perPage ?? DETAIL_PAGE_SIZE) || DETAIL_PAGE_SIZE, 1),
  }
}

const parseDetailModalData = (response) => {
  const root = response?.result || response?.data?.result || response?.data || response || {}
  const records = Array.isArray(root?.records)
    ? root.records
    : Array.isArray(root?.list)
      ? root.list
      : Array.isArray(root?.rows)
        ? root.rows
        : []
  const current = Math.max(Number(root?.current ?? root?.page ?? detailModalCurrentPage.value) || 1, 1)
  const total = Math.max(Number(root?.total ?? root?.totalCount ?? records.length) || 0, 0)
  const perPage = Math.max(Number(root?.size ?? root?.perPage ?? root?.pageSize ?? DETAIL_MODAL_PAGE_SIZE) || DETAIL_MODAL_PAGE_SIZE, 1)
  const pages = Math.max(Number(root?.pages ?? root?.totalPages ?? 0) || 0, 0)

  return {
    records,
    current,
    total,
    perPage,
    pages,
  }
}

const mapDetailOutageEvents = (outages) =>
  (Array.isArray(outages) ? outages : []).map((item, index) => {
    const outageNumber = toText(readFieldValue(item, ['outageNumber', 'outage_number', 'eventNo', 'event_id', 'id']), '-')
    const beginTime = toText(readFieldValue(item, ['beginTime', 'begin_time', 'outageBeginTime']), '-')
    const endTimeRaw = toText(readFieldValue(item, ['endTime', 'end_time', 'outageEndTime']), '')
    const endTime = endTimeRaw || '未复电'
    return {
      eventKey: `${outageNumber}|${beginTime}|${endTime}|${index + 1}`,
      outageNumber,
      periodText: `${beginTime} ~ ${endTime}`,
      beginTime,
      endTime,
    }
  })

const mapUserOutageDetailData = (detailData, fallbackRow = null) => {
  const fallbackOutages = Array.isArray(fallbackRow?.outageEvents) ? fallbackRow.outageEvents : []
  const detailOutages = mapDetailOutageEvents(detailData?.outages)
  const outages = detailOutages.length > 0 ? detailOutages : fallbackOutages
  const fallbackOutageCount = Number(fallbackRow?.outageCount) || 0
  const outageCountRaw = readFieldValue(detailData, ['outageCount', 'outage_count'])
  const hasResolvedOutageCount = String(outageCountRaw ?? '').trim() !== ''
  const resolvedOutageCount = Number(outageCountRaw)

  return {
    id: fallbackRow?.id || `user-detail-${Date.now()}`,
    consNo: toText(readFieldValue(detailData, ['consNo', 'cons_no']), fallbackRow?.consNo || '-'),
    consNoRaw: String(readFieldValue(detailData, ['consNo', 'cons_no']) || fallbackRow?.consNo || '').trim(),
    consName: toText(readFieldValue(detailData, ['consName', 'cons_name']), fallbackRow?.consName || '-'),
    userLevel: toText(fallbackRow?.userLevel || ''),
    outageCount: hasResolvedOutageCount && Number.isFinite(resolvedOutageCount) && resolvedOutageCount >= 0
      ? resolvedOutageCount
      : Math.max(fallbackOutageCount, outages.length),
    countyName: toText(readFieldValue(detailData, ['countyName', 'county_name']), fallbackRow?.countyName || '-'),
    tradeName: toText(
      readFieldValue(detailData, ['tradeName', 'trade_name', 'tradeTypeName', 'industryName']),
      fallbackRow?.tradeName || '-',
    ),
    consAddr: toText(readFieldValue(detailData, ['consAddr', 'cons_addr', 'consAddress', 'address']), fallbackRow?.consAddr || '-'),
    consTypeName: toText(fallbackRow?.consTypeName || '-'),
    outageEvents: outages,
  }
}

const mapModalUserDetailFromOutageResponse = (record, total, fallbackRow = null) => {
  const resolvedTotal = Number(total)
  const fallbackOutageCount = Math.max(Number(fallbackRow?.outageCount) || 0, 0)

  return {
    ...fallbackRow,
    consNo: toText(readFieldValue(record, ['consNo']), fallbackRow?.consNo || '-'),
    consNoRaw: String(readFieldValue(record, ['consNo']) || fallbackRow?.consNoRaw || fallbackRow?.consNo || '').trim(),
    consName: toText(readFieldValue(record, ['consName']), fallbackRow?.consName || '-'),
    outageCount: Number.isFinite(resolvedTotal) && resolvedTotal > 0 ? resolvedTotal : fallbackOutageCount,
    countyName: toText(readFieldValue(record, ['rdtCountyName']), fallbackRow?.countyName || '-'),
    tradeName: toText(readFieldValue(record, ['tradeName']), fallbackRow?.tradeName || '-'),
    consAddr: toText(readFieldValue(record, ['consAddr']), fallbackRow?.consAddr || '-'),
  }
}

const loadDetailTableRows = async (targetPage = detailCurrentPage.value) => {
  const beginTime = toBackendDate(props.startTime)
  const endTime = toBackendDate(props.endTime)
  if (!beginTime || !endTime) {
    detailTableRows.value = []
    detailTableTotal.value = 0
    detailTablePerPage.value = DETAIL_PAGE_SIZE
    detailTableLoading.value = false
    detailTableError.value = ''
    return
  }

  const payload = {
    beginTime,
    endTime,
    intervalType: detailTimeRangeFilter.value === '1' ? 'one' : 'two',
    outageLevel: detailOutageCountFilter.value === 'all'
      ? ''
      : detailOutageCountFilter.value === '3+'
        ? '3'
        : detailOutageCountFilter.value,
    pageNum: String(Math.max(1, Number(targetPage) || 1)),
    pageSize: String(DETAIL_PAGE_SIZE),
    returnTotalNum: 'true',
  }
  const countyId = String(props.countyId || '').trim()
  if (countyId) {
    payload.countyId = countyId
  } else if (countyListCityId) {
    payload.cityId = countyListCityId
  }

  const keyword = detailSearchKeyword.value.trim()
  if (keyword) {
    if (/^\d+$/.test(keyword)) {
      payload.custNo = keyword
    } else {
      payload.custName = keyword
    }
  }

  const requestId = detailTableRequestId.value + 1
  detailTableRequestId.value = requestId
  detailTableLoading.value = true
  detailTableError.value = ''
  detailTableRows.value = []

  try {
    const response = await queryOutageUserTimeTrendUsers(payload)
    if (requestId !== detailTableRequestId.value) {
      return
    }

    const data = parseDetailTableData(response)
    detailCurrentPage.value = data.page
    detailTablePerPage.value = data.perPage
    detailTableTotal.value = data.total
    detailTableRows.value = data.list.map((item, index) => mapDetailTableRow(item, index, data.page))
  } catch {
    if (requestId !== detailTableRequestId.value) {
      return
    }
    detailTableRows.value = []
    detailTableTotal.value = 0
    detailTablePerPage.value = DETAIL_PAGE_SIZE
    detailTableError.value = '重点用户停电明细加载失败，请稍后重试。'
  } finally {
    if (requestId === detailTableRequestId.value) {
      detailTableLoading.value = false
    }
  }
}

const detailTotalPages = computed(() => {
  if (detailTableTotal.value <= 0) {
    return 1
  }
  return Math.max(Math.ceil(detailTableTotal.value / detailTablePerPage.value), 1)
})

const detailModalTotalPages = computed(() => {
  if (detailModalRemotePages.value > 0) {
    return detailModalRemotePages.value
  }
  if (detailModalTotal.value <= 0) {
    return 1
  }
  return Math.max(Math.ceil(detailModalTotal.value / detailModalPerPage.value), 1)
})

const pagedImportantUserOutageRows = computed(() => {
  if (detailOutageCountFilter.value === '1') {
    return detailTableRows.value.filter((item) => item.outageCount === 1)
  }
  if (detailOutageCountFilter.value === '2') {
    return detailTableRows.value.filter((item) => item.outageCount === 2)
  }
  if (detailOutageCountFilter.value === '3+') {
    return detailTableRows.value.filter((item) => item.outageCount >= 3)
  }
  return detailTableRows.value
})

const detailPageButtons = computed(() => {
  const total = detailTotalPages.value
  if (total <= DETAIL_PAGE_MAX_BUTTONS) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const half = Math.floor(DETAIL_PAGE_MAX_BUTTONS / 2)
  let start = detailCurrentPage.value - half
  let end = detailCurrentPage.value + half
  if (start < 1) {
    start = 1
    end = DETAIL_PAGE_MAX_BUTTONS
  }
  if (end > total) {
    end = total
    start = total - DETAIL_PAGE_MAX_BUTTONS + 1
  }

  const pages = []
  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }
  return pages
})

const detailModalPageButtons = computed(() => {
  const total = detailModalTotalPages.value
  if (total <= DETAIL_MODAL_PAGE_MAX_BUTTONS) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const half = Math.floor(DETAIL_MODAL_PAGE_MAX_BUTTONS / 2)
  let start = detailModalCurrentPage.value - half
  let end = detailModalCurrentPage.value + half
  if (start < 1) {
    start = 1
    end = DETAIL_MODAL_PAGE_MAX_BUTTONS
  }
  if (end > total) {
    end = total
    start = total - DETAIL_MODAL_PAGE_MAX_BUTTONS + 1
  }

  const pages = []
  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }
  return pages
})

const emitSelectedUserMeterBoxLocation = () => {
  if (!selectedUserDetail.value) {
    return
  }
  emit(
    'locate-user-meter-box',
    selectedUserDetail.value.consNoRaw || selectedUserDetail.value.consNo,
    selectedUserDetail.value,
    'timeTrend',
  )
}

const loadUserOutageEvents = async (targetPage = 1) => {
  const selected = selectedUserDetail.value
  if (!selected) {
    return
  }

  const consNo = String(selected.consNoRaw || selected.consNo || '').trim()
  if (!consNo || consNo === '-') {
    selectedUserDetail.value = {
      ...selected,
      outageEvents: [],
    }
    detailModalTotal.value = 0
    detailModalRemotePages.value = 0
    detailModalError.value = '用户编号为空，无法查询停电记录。'
    return
  }

  const { beginTime, endTime } = getDetailModalQueryRange()
  if (!beginTime || !endTime) {
    selectedUserDetail.value = {
      ...selected,
      outageEvents: [],
    }
    detailModalTotal.value = 0
    detailModalRemotePages.value = 0
    detailModalError.value = '查询时间为空，无法查询停电记录。'
    emitSelectedUserMeterBoxLocation()
    return
  }

  const requestId = detailModalRequestId.value + 1
  detailModalRequestId.value = requestId
  detailModalLoading.value = true
  detailModalError.value = ''

  try {
    const response = await queryOutageEventOutageDetail({
      beginTime,
      endTime,
      page: Math.max(1, Number(targetPage) || 1),
      perPage: DETAIL_MODAL_PAGE_SIZE,
      consNos: [consNo],
    })
    if (requestId !== detailModalRequestId.value) {
      return
    }

    const data = parseDetailModalData(response)
    detailModalCurrentPage.value = data.current
    detailModalPerPage.value = data.perPage
    detailModalTotal.value = data.total
    detailModalRemotePages.value = data.pages
    selectedUserDetail.value = {
      ...mapModalUserDetailFromOutageResponse(data.records[0], data.total, selectedUserDetail.value),
      outageEvents: mapDetailOutageEvents(data.records),
    }
    emitSelectedUserMeterBoxLocation()
  } catch {
    if (requestId !== detailModalRequestId.value) {
      return
    }
    selectedUserDetail.value = {
      ...selectedUserDetail.value,
      outageEvents: [],
    }
    detailModalTotal.value = 0
    detailModalRemotePages.value = 0
    detailModalError.value = '停电记录加载失败，请稍后重试。'
    emitSelectedUserMeterBoxLocation()
  } finally {
    if (requestId === detailModalRequestId.value) {
      detailModalLoading.value = false
    }
  }
}

const openDetailPage = () => {
  detailSearchInput.value = ''
  detailSearchKeyword.value = ''
  detailPageVisible.value = true
  emit('open-detail-page')
  void loadDetailTableRows(1)
}

const closeDetailPage = () => {
  detailPageVisible.value = false
  detailTableRequestId.value += 1
  detailTableLoading.value = false
  detailModalRequestId.value += 1
  detailModalLoading.value = false
  detailModalError.value = ''
  detailModalCurrentPage.value = 1
  detailModalPerPage.value = DETAIL_MODAL_PAGE_SIZE
  detailModalTotal.value = 0
  detailModalRemotePages.value = 0
  detailModalJumpPageInput.value = ''
  detailModalVisible.value = false
  detailModalViewportCentered.value = false
  selectedUserDetail.value = null
}

const applyDetailSearch = () => {
  detailSearchKeyword.value = detailSearchInput.value.trim()
  detailJumpPageInput.value = ''
  goDetailPage(1)
}

const goDetailPage = (page) => {
  if (!Number.isFinite(page)) {
    return
  }
  const target = Math.max(1, Math.min(detailTotalPages.value, page))
  detailCurrentPage.value = target
  detailJumpPageInput.value = ''
  if (detailPageVisible.value) {
    void loadDetailTableRows(target)
  }
}

const jumpToDetailPage = () => {
  const input = String(detailJumpPageInput.value ?? '').trim()
  if (!input) {
    return
  }
  const parsed = Number(input)
  if (!Number.isFinite(parsed)) {
    return
  }
  goDetailPage(Math.round(parsed))
}

const openUserDetailModal = (item, options = {}) => {
  detailModalViewportCentered.value = Boolean(options.viewportCentered)
  detailModalVisible.value = true
  detailModalLoading.value = false
  detailModalError.value = ''
  detailModalCurrentPage.value = 1
  detailModalPerPage.value = DETAIL_MODAL_PAGE_SIZE
  detailModalTotal.value = 0
  detailModalRemotePages.value = 0
  detailModalJumpPageInput.value = ''
  selectedUserDetail.value = {
    ...mapUserOutageDetailData({}, item),
    outageEvents: [],
  }
  void loadUserOutageEvents(1)
}

const closeUserDetailModal = () => {
  detailModalRequestId.value += 1
  detailModalLoading.value = false
  detailModalError.value = ''
  detailModalCurrentPage.value = 1
  detailModalPerPage.value = DETAIL_MODAL_PAGE_SIZE
  detailModalTotal.value = 0
  detailModalRemotePages.value = 0
  detailModalJumpPageInput.value = ''
  detailModalVisible.value = false
  detailModalViewportCentered.value = false
  selectedUserDetail.value = null
}

const goDetailModalEventPage = (page) => {
  if (!Number.isFinite(page)) {
    return
  }
  const target = Math.max(1, Math.min(detailModalTotalPages.value, page))
  detailModalCurrentPage.value = target
  detailModalJumpPageInput.value = ''
  void loadUserOutageEvents(target)
}

const jumpToDetailModalEventPage = () => {
  const input = String(detailModalJumpPageInput.value ?? '').trim()
  if (!input) {
    return
  }
  const parsed = Number(input)
  if (!Number.isFinite(parsed)) {
    return
  }
  goDetailModalEventPage(Math.round(parsed))
}

watch(
  () => detailTotalPages.value,
  (total) => {
    if (detailCurrentPage.value > total) {
      detailCurrentPage.value = total
    }
  },
  { immediate: true },
)

watch(detailOutageCountFilter, () => {
  goDetailPage(1)
})

watch(detailTimeRangeFilter, () => {
  goDetailPage(1)
})

watch(
  () => [props.startTime, props.endTime, props.countyId],
  () => {
    detailCurrentPage.value = 1
    detailJumpPageInput.value = ''
    if (detailPageVisible.value) {
      void loadDetailTableRows(1)
    }
  },
)
</script>

<template>
  <section
    class="key-user-time-trend-card"
    :class="{ clickable: !detailPageVisible }"
    role="button"
    tabindex="0"
    @click="!detailPageVisible && openDetailPage()"
    @keydown.enter.prevent="!detailPageVisible && openDetailPage()"
    @keydown.space.prevent="!detailPageVisible && openDetailPage()"
  >
    <template v-if="!detailPageVisible">
      <header class="trend-head">
        <h4>{{ props.title }}</h4>
        <div class="trend-legend" aria-label="图例">
          <span class="trend-legend-item sensitive">
            <i aria-hidden="true"></i>
            {{ props.sensitiveLabel }}
          </span>
          <span class="trend-legend-item important">
            <i aria-hidden="true"></i>
            {{ props.importantLabel }}
          </span>
        </div>
      </header>

      <div class="trend-chart-wrap">
        <svg class="trend-chart" :viewBox="`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`" preserveAspectRatio="none">
          <g class="trend-grid">
            <line
              v-for="tick in yTicks"
              :key="`grid-${tick.value}-${tick.y}`"
              :x1="CHART_PADDING.left"
              :x2="SVG_WIDTH - CHART_PADDING.right"
              :y1="tick.y"
              :y2="tick.y"
            />
          </g>

          <g class="trend-y-axis-labels">
            <text
              v-for="tick in yTicks"
              :key="`y-label-${tick.value}-${tick.y}`"
              :x="CHART_PADDING.left - 8"
              :y="tick.y + 4"
              text-anchor="end"
            >
              {{ tick.value }}
            </text>
          </g>

          <line
            class="trend-x-axis"
            :x1="CHART_PADDING.left"
            :x2="SVG_WIDTH - CHART_PADDING.right"
            :y1="SVG_HEIGHT - CHART_PADDING.bottom"
            :y2="SVG_HEIGHT - CHART_PADDING.bottom"
          />

          <path class="trend-line sensitive" :d="sensitivePath"></path>
          <path class="trend-line important" :d="importantPath"></path>

          <g class="trend-point-group sensitive">
            <circle
              v-for="point in sensitivePoints"
              :key="`sensitive-point-${point.x}-${point.y}`"
              :cx="point.x"
              :cy="point.y"
              r="3.5"
            />
          </g>

          <g class="trend-point-group important">
            <circle
              v-for="point in importantPoints"
              :key="`important-point-${point.x}-${point.y}`"
              :cx="point.x"
              :cy="point.y"
              r="3.5"
            />
          </g>

          <g class="trend-x-labels">
            <text
              v-for="(point, index) in sensitivePoints"
              :key="`x-label-${point.x}-${point.label}-${point.timeLabel}`"
              :x="point.x + getXAxisLabelOffsetX(index, sensitivePoints.length)"
              :y="SVG_HEIGHT - CHART_PADDING.bottom + 22"
              :text-anchor="getXAxisLabelAnchor(index, sensitivePoints.length)"
            >
              <tspan :x="point.x + getXAxisLabelOffsetX(index, sensitivePoints.length)">{{ point.label }}</tspan>
            </text>
          </g>
        </svg>
        <div v-if="props.loading" class="trend-loading">
          <span class="trend-loading-spinner" aria-hidden="true"></span>
          <span>数据加载中...</span>
        </div>
      </div>
    </template>

    <section v-else class="trend-detail-layer" @click.stop>
      <header class="trend-detail-head">
        <h4>重点用户停电明细</h4>
        <button type="button" class="trend-detail-close" @click="closeDetailPage">×</button>
      </header>

      <section class="trend-detail-pie-grid">
        <article class="tag-pie-card trend-detail-pie-card">
          <p class="tag-pie-title">重点用户停电次数分布</p>
          <div class="trend-detail-pie-content">
            <div
              class="tag-pie trend-detail-tag-pie"
              :style="{ background: importantOutagePieBackground }"
              @mousemove="updateImportantOutagePieHover"
              @mouseleave="hoveredImportantOutagePieKey = ''"
            >
              <div class="tag-pie-center">
                <template v-if="props.outageFreqLoading">
                  <strong class="trend-detail-pie-loading-text">数据加载中...</strong>
                </template>
                <template v-else-if="hoveredImportantOutagePieItem">
                  <strong class="trend-detail-pie-hover-label">{{ hoveredImportantOutagePieItem.label }}</strong>
                  <span>{{ hoveredImportantOutagePieItem.count }}人 / {{ hoveredImportantOutagePieItem.rateText }}</span>
                </template>
                <template v-else>
                  <strong>{{ importantOutageTotal }}</strong>
                  <span>重点用户</span>
                </template>
              </div>
            </div>
            <ul class="trend-detail-pie-legend">
              <li
                v-for="item in importantOutagePieSummary"
                :key="`important-pie-${item.key}`"
                @mouseenter="hoveredImportantOutagePieKey = item.key"
                @mouseleave="hoveredImportantOutagePieKey = ''"
              >
                <i :style="{ background: item.color }"></i>
                <span>{{ item.label }}</span>
                <em>{{ item.count }}人 / {{ item.rateText }}</em>
              </li>
            </ul>
          </div>
        </article>

        <article class="tag-pie-card trend-detail-pie-card">
          <p class="tag-pie-title">敏感用户停电次数分布</p>
          <div class="trend-detail-pie-content">
            <div
              class="tag-pie trend-detail-tag-pie"
              :style="{ background: sensitiveOutagePieBackground }"
              @mousemove="updateSensitiveOutagePieHover"
              @mouseleave="hoveredSensitiveOutagePieKey = ''"
            >
              <div class="tag-pie-center">
                <template v-if="props.outageFreqLoading">
                  <strong class="trend-detail-pie-loading-text">数据加载中...</strong>
                </template>
                <template v-else-if="hoveredSensitiveOutagePieItem">
                  <strong class="trend-detail-pie-hover-label">{{ hoveredSensitiveOutagePieItem.label }}</strong>
                  <span>{{ hoveredSensitiveOutagePieItem.count }}人 / {{ hoveredSensitiveOutagePieItem.rateText }}</span>
                </template>
                <template v-else>
                  <strong>{{ sensitiveOutageTotal }}</strong>
                  <span>敏感用户</span>
                </template>
              </div>
            </div>
            <ul class="trend-detail-pie-legend">
              <li
                v-for="item in sensitiveOutagePieSummary"
                :key="`sensitive-pie-${item.key}`"
                @mouseenter="hoveredSensitiveOutagePieKey = item.key"
                @mouseleave="hoveredSensitiveOutagePieKey = ''"
              >
                <i :style="{ background: item.color }"></i>
                <span>{{ item.label }}</span>
                <em>{{ item.count }}人 / {{ item.rateText }}</em>
              </li>
            </ul>
          </div>
        </article>
      </section>

      <section class="trend-detail-table-module">
        <div class="trend-detail-query-bar">
          <input
            v-model="detailSearchInput"
            type="text"
            class="trend-detail-query-input"
            placeholder="请输入用户编号或姓名"
            @keyup.enter="applyDetailSearch"
          />
          <button type="button" class="trend-detail-query-btn" :disabled="detailTableLoading" @click="applyDetailSearch">
            查询
          </button>
          <div class="trend-detail-count-filter-wrap">
            <span class="trend-detail-count-filter-label">时间</span>
            <select v-model="detailTimeRangeFilter" class="trend-detail-count-filter">
              <option value="1">近期1个月</option>
              <option value="2">近期2个月</option>
            </select>
          </div>
          <div class="trend-detail-count-filter-wrap">
            <span class="trend-detail-count-filter-label">停电次数</span>
            <select v-model="detailOutageCountFilter" class="trend-detail-count-filter">
              <option value="all">全部</option>
              <option value="3+">3次及以上</option>
            </select>
          </div>
        </div>

        <div class="trend-detail-grid-wrap">
          <ul class="trend-detail-grid-body">
            <li class="trend-detail-grid trend-detail-grid-head">
              <span>用户编号</span>
              <span>用户名称</span>
              <span title="区县">区县</span>
              <span title="停电次数">停电次数</span>
              <span>详情</span>
            </li>
            <li v-for="item in pagedImportantUserOutageRows" :key="item.id" class="trend-detail-grid trend-detail-grid-row">
              <span class="trend-detail-cell hover-expand-cell" :data-full="item.consNo">
                <span class="trend-detail-cell-text">{{ item.consNo }}</span>
              </span>
              <span class="trend-detail-cell hover-expand-cell" :data-full="item.consName">
                <span class="trend-detail-cell-text">{{ item.consName }}</span>
              </span>
              <span class="trend-detail-cell hover-expand-cell" :data-full="item.countyName">
                <span class="trend-detail-cell-text">{{ item.countyName }}</span>
              </span>
              <span class="trend-detail-cell hover-expand-cell" :data-full="String(item.outageCount)">
                <span class="trend-detail-cell-text">{{ item.outageCount }}</span>
              </span>
              <button type="button" class="detail-btn" @click="openUserDetailModal(item)">详情</button>
            </li>
          </ul>

          <p v-if="detailTableLoading" class="empty-tip">重点用户停电明细加载中...</p>
          <p v-else-if="detailTableError" class="empty-tip">{{ detailTableError }}</p>
          <p v-else-if="pagedImportantUserOutageRows.length === 0" class="empty-tip">当前时间段暂无重点用户停电明细。</p>
        </div>

        <footer class="user-detail-pagination" v-if="detailTableTotal > 0">
          <span class="outage-range-page-state">第 {{ detailCurrentPage }} / {{ detailTotalPages }} 页</span>
          <button
            v-for="page in detailPageButtons"
            :key="`key-user-time-detail-page-${page}`"
            type="button"
            class="page-btn"
            :class="{ active: page === detailCurrentPage }"
            @click="goDetailPage(page)"
          >
            {{ page }}
          </button>

          <div class="user-detail-page-jump">
            <input
              v-model="detailJumpPageInput"
              type="number"
              min="1"
              :max="detailTotalPages"
              class="user-detail-page-input"
              placeholder="页码"
              @keyup.enter="jumpToDetailPage"
            />
            <button type="button" class="user-detail-page-jump-btn" @click="jumpToDetailPage">跳转</button>
          </div>
        </footer>
      </section>

      <div
        v-if="detailModalVisible && selectedUserDetail"
        class="user-detail-modal-mask"
        :class="{ 'time-detail-user-modal-mask': detailModalViewportCentered }"
        @click.self="closeUserDetailModal"
      >
        <article class="user-detail-modal">
          <button type="button" class="user-detail-modal-close" @click="closeUserDetailModal">×</button>
          <h4>用户详情</h4>
          <div class="user-detail-modal-content">
            <p><span>用户编号：</span>{{ selectedUserDetail.consNo }}</p>
            <p><span>用户名称：</span>{{ selectedUserDetail.consName }}</p>
            <p><span>停电次数：</span>{{ selectedUserDetail.outageCount }}</p>
            <p><span>所属区县：</span>{{ selectedUserDetail.countyName }}</p>
            <p><span>所属行业：</span>{{ selectedUserDetail.tradeName }}</p>
            <p><span>用户地址：</span>{{ selectedUserDetail.consAddr }}</p>
            <div class="trend-detail-event-list">
              <h5>停电记录</h5>
              <p v-if="detailModalLoading" class="empty-tip">用户详情加载中...</p>
              <p v-else-if="detailModalError" class="empty-tip">{{ detailModalError }}</p>
              <p v-else-if="selectedUserDetail.outageEvents.length === 0" class="empty-tip">当前时间段暂无停电记录。</p>
              <ul v-else>
                <li v-for="event in selectedUserDetail.outageEvents" :key="event.eventKey">
                  <strong>{{ event.outageNumber }}</strong>
                  <span>停电开始时间：{{ event.beginTime }}</span>
                  <span>复电时间：{{ event.endTime }}</span>
                </li>
              </ul>
              <footer v-if="detailModalTotal > 0 && detailModalTotalPages > 1" class="user-detail-pagination trend-detail-event-pagination">
                <button
                  v-for="page in detailModalPageButtons"
                  :key="`time-detail-event-page-${page}`"
                  type="button"
                  class="page-btn"
                  :class="{ active: page === detailModalCurrentPage }"
                  :disabled="detailModalLoading"
                  @click="goDetailModalEventPage(page)"
                >
                  {{ page }}
                </button>

                <div class="outage-detail-page-jump">
                  <input
                    v-model="detailModalJumpPageInput"
                    type="number"
                    min="1"
                    :max="detailModalTotalPages"
                    class="outage-detail-page-input"
                    placeholder="页码"
                    :disabled="detailModalLoading"
                    @keyup.enter="jumpToDetailModalEventPage"
                  />
                  <button
                    type="button"
                    class="outage-detail-page-jump-btn"
                    :disabled="detailModalLoading"
                    @click="jumpToDetailModalEventPage"
                  >
                    跳转
                  </button>
                </div>
              </footer>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

