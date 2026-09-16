<script setup>
import { computed, ref, watch } from 'vue'
import {
  queryOutageAnalysisImpactDailyTrend,
  queryOutageAnalysisWarningCounts,
  queryOutageUserAnalysisOverview,
} from '../api/outage'
import StackedBarChart from './StackedBarChart.vue'

const props = defineProps({
  selectedRegion: {
    type: String,
    default: '全部',
  },
  cityId: {
    type: String,
    default: '',
  },
  countyId: {
    type: String,
    default: '',
  },
  endDate: {
    type: String,
    default: '',
  },
})

const rangeOptions = [
  { key: 'sevenDays', label: '七日' },
  { key: 'thirtyDays', label: '三十日' },
  { key: 'history', label: '历史' },
]

const warningRules = [
  { key: 'extreme', label: '极度风险', color: '#96242f' },
  { key: 'exceptional', label: '特大风险', color: '#c62532' },
  { key: 'severe', label: '重大风险', color: '#df3d40' },
  { key: 'major', label: '较大风险', color: '#f0712e' },
  { key: 'medium', label: '中度风险', color: '#eea72b' },
  { key: 'mild', label: '轻度风险', color: '#3dbd82' },
]

const impactRules = [
  { key: 'veryHigh', label: '影响户数极大', color: '#d83a3f' },
  { key: 'high', label: '影响户数较大', color: '#f0a821' },
  { key: 'medium', label: '影响户数中度', color: '#17b7c5' },
  { key: 'low', label: '影响户数轻度', color: '#41bd91' },
]

const safeValue = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : 0
}

const buildWarningChart = (daily = []) => ({
  labels: daily.map((item) => String(item?.date || '').slice(5)),
  series: warningRules.map((rule) => ({
    key: rule.key,
    name: rule.label,
    color: rule.color,
    values: daily.map((item) => safeValue(item?.[rule.key])),
  })),
})

const buildImpactChart = (daily = []) => ({
  labels: daily.map((item) => String(item?.date || '').slice(5)),
  series: impactRules.map((rule) => ({
    key: rule.key,
    name: rule.label,
    color: rule.color,
    values: daily.map((item) => safeValue(item?.[rule.key])),
  })),
})

const selectedRange = ref('sevenDays')
const rangeEndTime = ref('')
const historyDialogOpen = ref(false)
const historyBeginInput = ref('')
const historyMinDate = ref('')
const historyMaxStartDate = ref('')
const historyRange = ref(null)
const historyValidationError = ref('')

const createEmptyPanelData = () => ({
  userTypes: { labels: [], series: [] },
  frequentWarnings: { labels: [], series: [] },
  outageImpact: { labels: [], series: [] },
})

const panelData = ref(createEmptyPanelData())
const warningChartData = ref(buildWarningChart())
const impactChartData = ref(buildImpactChart())
const loading = ref(false)
const loadError = ref('')
const warningLoading = ref(false)
const warningLoadError = ref('')
const impactLoading = ref(false)
const impactLoadError = ref('')
let requestId = 0
let warningRequestId = 0
let impactRequestId = 0

const padDateTime = (value) => String(value).padStart(2, '0')

const formatLocalDateTime = (date) =>
  `${date.getFullYear()}-${padDateTime(date.getMonth() + 1)}-${padDateTime(date.getDate())}`
  + `T${padDateTime(date.getHours())}:${padDateTime(date.getMinutes())}:${padDateTime(date.getSeconds())}`

const formatApiDateTime = (date) => formatLocalDateTime(date).replace('T', ' ')

const formatDateInput = (date) =>
  `${date.getFullYear()}-${padDateTime(date.getMonth() + 1)}-${padDateTime(date.getDate())}`

const subtractOneMonth = (date) => {
  const result = new Date(date)
  const originalDay = result.getDate()
  result.setDate(1)
  result.setMonth(result.getMonth() - 1)
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
  result.setDate(Math.min(originalDay, lastDay))
  return result
}

const parseDateInput = (value) => {
  const matched = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!matched) {
    return null
  }
  const date = new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const formatBackendDateTime = (date, endOfDay = false) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day} ${endOfDay ? '23:59:59' : '00:00:00'}`
}

rangeEndTime.value = formatApiDateTime(new Date())

const openHistoryDialog = () => {
  const now = new Date()
  const lowerBound = subtractOneMonth(now)
  lowerBound.setHours(0, 0, 0, 0)
  const latestStart = addDays(now, -6)
  latestStart.setHours(0, 0, 0, 0)
  historyMinDate.value = formatDateInput(lowerBound)
  historyMaxStartDate.value = formatDateInput(latestStart)
  historyBeginInput.value = historyRange.value?.beginInput || historyMaxStartDate.value
  historyValidationError.value = ''
  historyDialogOpen.value = true
}

const closeHistoryDialog = () => {
  historyDialogOpen.value = false
  historyValidationError.value = ''
}

const resetHistoryRange = () => {
  historyBeginInput.value = historyMaxStartDate.value
  historyValidationError.value = ''
}

const historyEndDisplay = computed(() => {
  const beginTime = parseDateInput(historyBeginInput.value)
  return beginTime ? formatDateInput(addDays(beginTime, 6)) : ''
})

const showHistoryValidation = (message, usePopup = false) => {
  historyValidationError.value = message
  if (usePopup && typeof window !== 'undefined') {
    window.alert(message)
  }
}

const confirmHistoryRange = () => {
  if (!historyBeginInput.value) {
    showHistoryValidation('请选择历史查询的开始日期')
    return
  }

  const beginTime = parseDateInput(historyBeginInput.value)
  const lowerBound = parseDateInput(historyMinDate.value)
  const latestStart = parseDateInput(historyMaxStartDate.value)
  if (!beginTime || !lowerBound || !latestStart) {
    showHistoryValidation('时间格式不正确，请重新选择')
    return
  }
  if (beginTime < lowerBound) {
    showHistoryValidation('仅可查询距离本日最近一个月内的数据')
    return
  }
  if (beginTime > latestStart) {
    showHistoryValidation('历史查询必须选择完整的7天时间范围', true)
    return
  }

  beginTime.setHours(0, 0, 0, 0)
  const endTime = addDays(beginTime, 6)
  const now = new Date()
  if (formatDateInput(endTime) === formatDateInput(now)) {
    endTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0)
  } else {
    endTime.setHours(23, 59, 59, 0)
  }

  historyRange.value = {
    beginInput: historyBeginInput.value,
    beginTime: formatApiDateTime(beginTime),
    endTime: formatApiDateTime(endTime),
  }
  selectedRange.value = 'history'
  closeHistoryDialog()
}

const selectRange = (range) => {
  if (range === 'history') {
    openHistoryDialog()
    return
  }
  rangeEndTime.value = formatApiDateTime(new Date())
  selectedRange.value = range
}

const buildQueryPayload = () => {
  if (selectedRange.value === 'history' && historyRange.value) {
    return {
      rangeType: 'history',
      countyName: props.selectedRegion === '全部' ? '' : props.selectedRegion,
      beginTime: historyRange.value.beginTime,
      endTime: historyRange.value.endTime,
    }
  }

  const end = new Date()
  const begin = addDays(end, selectedRange.value === 'thirtyDays' ? -29 : -6)

  return {
    rangeType: selectedRange.value,
    countyName: props.selectedRegion === '全部' ? '' : props.selectedRegion,
    beginTime: formatBackendDateTime(begin),
    endTime: formatApiDateTime(end),
  }
}

const buildAnalysisPayload = (includeHistoryDays = false) => {
  const cityId = String(props.cityId || '').trim()
  const countyId = String(props.countyId || '').trim()
  if (!cityId && !countyId) {
    return null
  }

  const payload = { rangeType: selectedRange.value }
  if (selectedRange.value === 'history') {
    if (!historyRange.value) {
      return null
    }
    payload.beginTime = historyRange.value.beginTime
    payload.endTime = historyRange.value.endTime
    if (includeHistoryDays) {
      payload.historyDays = 7
    }
  } else {
    payload.endTime = rangeEndTime.value
  }

  if (countyId) {
    payload.countyId = countyId
  } else {
    payload.cityId = cityId
  }
  return payload
}

const normalizeChart = (source, fallback, rootLabels = []) => {
  const labels = Array.isArray(source?.labels)
    ? source.labels.map((item) => String(item))
    : Array.isArray(rootLabels)
      ? rootLabels.map((item) => String(item))
      : []
  const sourceSeries = Array.isArray(source?.series) ? source.series : []

  if (labels.length === 0 || sourceSeries.length === 0) {
    return fallback
  }

  return {
    labels,
    series: sourceSeries.map((item, index) => {
      const fallbackSeries = fallback.series.find(
        (candidate) => candidate.key === item?.key || candidate.name === item?.name,
      ) || fallback.series[index]
      return {
        key: String(item?.key || fallbackSeries?.key || `series-${index}`),
        name: String(item?.name || fallbackSeries?.name || `系列${index + 1}`),
        color: String(item?.color || fallbackSeries?.color || '#18aeb8'),
        values: labels.map((_, valueIndex) => safeValue(item?.values?.[valueIndex])),
      }
    }),
  }
}

const normalizeResponse = (response, fallback) => {
  const root = response?.data?.data ?? response?.data ?? response?.result ?? response
  if (!root || typeof root !== 'object') {
    return fallback
  }

  const rootLabels = Array.isArray(root.labels) ? root.labels : []
  return {
    userTypes: normalizeChart(root.userTypes, fallback.userTypes, rootLabels),
    frequentWarnings: normalizeChart(root.frequentWarnings, fallback.frequentWarnings, rootLabels),
    outageImpact: normalizeChart(root.outageImpact, fallback.outageImpact, rootLabels),
  }
}

const loadPanelData = async () => {
  const currentRequestId = ++requestId
  const emptyData = createEmptyPanelData()

  panelData.value = emptyData
  loading.value = true
  loadError.value = ''
  try {
    const response = await queryOutageUserAnalysisOverview(buildQueryPayload())
    if (currentRequestId !== requestId) {
      return
    }
    panelData.value = normalizeResponse(response, emptyData)
  } catch (error) {
    if (currentRequestId !== requestId) {
      return
    }
    console.warn('[outage-analysis] 接口加载失败：', error)
    panelData.value = emptyData
    loadError.value = error?.message || '接口暂不可用'
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}

const loadWarningCounts = async () => {
  const currentRequestId = ++warningRequestId
  const payload = buildAnalysisPayload(true)
  warningChartData.value = buildWarningChart()
  warningLoadError.value = ''
  if (!payload) {
    warningLoading.value = false
    return
  }

  warningLoading.value = true
  try {
    const response = await queryOutageAnalysisWarningCounts(payload)
    if (currentRequestId !== warningRequestId) {
      return
    }
    const daily = response?.data?.daily
    if (!Array.isArray(daily)) {
      throw new Error('频繁停电预警接口返回格式不正确')
    }
    warningChartData.value = buildWarningChart(daily)
  } catch (error) {
    if (currentRequestId !== warningRequestId) {
      return
    }
    warningChartData.value = buildWarningChart()
    warningLoadError.value = error?.message || '数据加载失败'
  } finally {
    if (currentRequestId === warningRequestId) {
      warningLoading.value = false
    }
  }
}

const loadImpactDailyTrend = async () => {
  const currentRequestId = ++impactRequestId
  const payload = buildAnalysisPayload()
  impactChartData.value = buildImpactChart()
  impactLoadError.value = ''
  if (!payload) {
    impactLoading.value = false
    return
  }

  impactLoading.value = true
  try {
    const response = await queryOutageAnalysisImpactDailyTrend(payload)
    if (currentRequestId !== impactRequestId) {
      return
    }
    const daily = response?.data?.daily
    if (!Array.isArray(daily)) {
      throw new Error('停电影响用户分析接口返回格式不正确')
    }
    impactChartData.value = buildImpactChart(daily)
  } catch (error) {
    if (currentRequestId !== impactRequestId) {
      return
    }
    impactChartData.value = buildImpactChart()
    impactLoadError.value = error?.message || '数据加载失败'
  } finally {
    if (currentRequestId === impactRequestId) {
      impactLoading.value = false
    }
  }
}

watch(
  [selectedRange, () => props.selectedRegion, () => props.endDate, historyRange],
  () => {
    void loadPanelData()
  },
  { immediate: true },
)

watch(
  [
    selectedRange,
    () => props.cityId,
    () => props.countyId,
    () => historyRange.value?.beginTime,
    () => historyRange.value?.endTime,
  ],
  () => {
    if (selectedRange.value !== 'history') {
      rangeEndTime.value = formatApiDateTime(new Date())
    }
    void Promise.all([loadWarningCounts(), loadImpactDailyTrend()])
  },
  { immediate: true },
)
</script>

<template>
  <section
    class="card outage-user-analysis-panel"
    :aria-busy="loading || warningLoading || impactLoading"
  >
    <header class="outage-analysis-header">
      <div class="outage-analysis-title">
        <span class="outage-analysis-title-mark" aria-hidden="true"><i></i><i></i></span>
        <h2>停电用户分析</h2>
      </div>

      <div class="outage-analysis-range" role="tablist" aria-label="日期范围">
        <button
          v-for="option in rangeOptions"
          :key="option.key"
          type="button"
          role="tab"
          :aria-selected="selectedRange === option.key"
          :class="{ active: selectedRange === option.key }"
          @click="selectRange(option.key)"
        >
          {{ option.label }}
        </button>
      </div>

    </header>

    <article class="outage-analysis-chart-section">
      <h3>停电用户类型</h3>
      <StackedBarChart
        :labels="panelData.userTypes.labels"
        :series="panelData.userTypes.series"
        unit="用户数"
      />
    </article>

    <article class="outage-analysis-chart-section" :aria-busy="warningLoading">
      <div class="outage-analysis-section-heading">
        <h3>频繁停电预警</h3>
        <span v-if="warningLoading" class="outage-analysis-status">加载中...</span>
        <span v-else-if="warningLoadError" class="outage-analysis-status error" :title="warningLoadError">
          加载失败
        </span>
      </div>
      <StackedBarChart
        :labels="warningChartData.labels"
        :series="warningChartData.series"
        unit="用户数"
      />
    </article>

    <article class="outage-analysis-chart-section" :aria-busy="impactLoading">
      <div class="outage-analysis-section-heading">
        <h3>停电影响用户分析</h3>
        <span v-if="impactLoading" class="outage-analysis-status">加载中...</span>
        <span v-else-if="impactLoadError" class="outage-analysis-status error" :title="impactLoadError">
          加载失败
        </span>
      </div>
      <StackedBarChart
        :labels="impactChartData.labels"
        :series="impactChartData.series"
        unit="停电次数"
      />
    </article>
  </section>

  <Teleport to="body">
    <div
      v-if="historyDialogOpen"
      class="analysis-history-backdrop"
      @click.self="closeHistoryDialog"
      @keydown.esc="closeHistoryDialog"
    >
      <section
        class="analysis-history-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-history-dialog-title"
      >
        <header class="analysis-history-dialog-header">
          <h3 id="analysis-history-dialog-title">选择历史开始日期</h3>
          <button type="button" aria-label="关闭" @click="closeHistoryDialog">×</button>
        </header>
        <div class="analysis-history-dialog-body">
          <p>仅可查询最近一个月内的数据，系统将从开始日期起固定查询连续7个自然日</p>
          <div class="analysis-history-time-range">
            <label>
              <span>开始日期</span>
              <input
                v-model="historyBeginInput"
                type="date"
                :min="historyMinDate"
                :max="historyMaxStartDate"
              />
            </label>
            <i aria-hidden="true">至</i>
            <label>
              <span>结束日期（自动计算）</span>
              <output>{{ historyEndDisplay || '请选择开始日期' }}</output>
            </label>
          </div>
          <p v-if="historyValidationError" class="analysis-history-error" role="alert">
            {{ historyValidationError }}
          </p>
        </div>
        <footer class="analysis-history-dialog-footer">
          <button type="button" class="reset" @click="resetHistoryRange">重置</button>
          <button type="button" @click="closeHistoryDialog">取消</button>
          <button type="button" class="confirm" @click="confirmHistoryRange">确定</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.outage-user-analysis-panel {
  --analysis-aqua: #10adb7;
  --analysis-aqua-deep: #087f8e;
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: 44px repeat(3, minmax(0, 1fr));
  overflow: hidden;
  padding: 0;
  border-radius: 3px;
  border-color: rgba(63, 211, 214, 0.84);
  color: #243b40;
  background:
    linear-gradient(90deg, rgba(168, 235, 231, 0.18) 0 1px, transparent 1px 18px),
    linear-gradient(180deg, rgba(241, 255, 253, 0.97), rgba(214, 248, 244, 0.96));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.64),
    0 0 18px rgba(24, 209, 215, 0.2);
}

.outage-analysis-header {
  min-width: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 12px;
  border-bottom: 1px solid rgba(31, 183, 190, 0.76);
  background:
    linear-gradient(115deg, rgba(69, 224, 216, 0.96) 0%, rgba(169, 244, 235, 0.92) 47%, rgba(244, 255, 252, 0.9) 100%),
    repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0 8px, rgba(25, 194, 200, 0.14) 8px 16px);
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.76);
}

.outage-analysis-header::after {
  content: "";
  position: absolute;
  left: 51%;
  bottom: 0;
  width: 50px;
  height: 4px;
  transform: skewX(-32deg);
  background: linear-gradient(90deg, #ff9e24 0 8px, transparent 8px 14px, #23ccd3 14px 50px);
}

.outage-analysis-title {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.outage-analysis-title h2 {
  white-space: nowrap;
  color: #fff;
  font-size: 19px;
  line-height: 1.2;
  letter-spacing: 0.4px;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.82);
}

.outage-analysis-title-mark {
  display: inline-flex;
  gap: 2px;
  align-items: center;
}

.outage-analysis-title-mark i {
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 8px solid #13bbc3;
  filter: drop-shadow(0 0 4px rgba(0, 165, 177, 0.38));
}

.outage-analysis-range {
  display: flex;
  align-self: stretch;
  align-items: center;
  gap: 3px;
  padding-right: 2px;
}

.outage-analysis-range button {
  height: 100%;
  position: relative;
  border: 0;
  color: #455b5f;
  background: transparent;
  padding: 0 7px;
  font-size: 14px;
  cursor: pointer;
}

.outage-analysis-range button::after {
  content: "";
  position: absolute;
  left: 7px;
  right: 7px;
  bottom: 3px;
  height: 2px;
  background: transparent;
}

.outage-analysis-range button:hover,
.outage-analysis-range button.active {
  color: #0797a3;
}

.outage-analysis-range button.active::after {
  background: #0fc1c7;
  box-shadow: 0 0 7px rgba(15, 193, 199, 0.46);
}

.outage-analysis-source {
  position: absolute;
  right: 10px;
  bottom: -17px;
  z-index: 3;
  border: 1px solid rgba(221, 158, 28, 0.42);
  border-radius: 8px;
  color: #8a691b;
  background: rgba(255, 248, 219, 0.9);
  padding: 1px 6px;
  font-size: 9px;
  line-height: 1.35;
  pointer-events: none;
}

.outage-analysis-source.live {
  border-color: rgba(21, 166, 142, 0.42);
  color: #087d69;
  background: rgba(221, 255, 244, 0.92);
}

.outage-analysis-chart-section {
  min-height: 0;
  display: grid;
  grid-template-rows: 28px minmax(0, 1fr);
  padding: 9px 10px 5px;
  border-top: 1px solid rgba(43, 181, 186, 0.32);
  background: rgba(243, 255, 253, 0.34);
}

.outage-analysis-chart-section:nth-of-type(even) {
  background: rgba(221, 249, 246, 0.34);
}

.outage-analysis-chart-section h3 {
  position: relative;
  display: flex;
  align-items: center;
  color: #253b3f;
  padding-left: 13px;
  font-size: 15px;
  line-height: 1.2;
}

.outage-analysis-section-heading {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.outage-analysis-status {
  overflow: hidden;
  color: #718083;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.outage-analysis-status.error {
  color: #c74343;
}

.outage-analysis-chart-section h3::before {
  content: "";
  position: absolute;
  left: 0;
  top: 5px;
  bottom: 5px;
  width: 3px;
  border-radius: 2px;
  background: linear-gradient(180deg, #19c8bd, #0e9d8f);
  box-shadow: 0 0 6px rgba(21, 188, 177, 0.36);
}

.analysis-history-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(4, 23, 31, 0.48);
}

.analysis-history-dialog {
  width: min(620px, calc(100vw - 32px));
  overflow: hidden;
  border-radius: 8px;
  color: #425256;
  background: #fff;
  box-shadow: 0 18px 48px rgba(0, 25, 35, 0.35);
}

.analysis-history-dialog-header {
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  color: #fff;
  background: linear-gradient(90deg, #20bda2, #dff5f0);
}

.analysis-history-dialog-header h3 {
  font-size: 15px;
  font-weight: 600;
}

.analysis-history-dialog-header button {
  width: 30px;
  height: 30px;
  border: 0;
  color: #7a898c;
  background: transparent;
  font-size: 25px;
  line-height: 1;
  cursor: pointer;
}

.analysis-history-dialog-body {
  padding: 24px 20px 18px;
}

.analysis-history-dialog-body > p:first-child {
  margin-bottom: 14px;
  color: #778689;
  font-size: 13px;
}

.analysis-history-time-range {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: end;
  gap: 12px;
}

.analysis-history-time-range label {
  min-width: 0;
  display: grid;
  gap: 7px;
}

.analysis-history-time-range label span {
  color: #59686b;
  font-size: 13px;
}

.analysis-history-time-range input,
.analysis-history-time-range output {
  width: 100%;
  height: 40px;
  box-sizing: border-box;
  border: 1px solid #b9d4d2;
  border-radius: 4px;
  padding: 0 9px;
  color: #455457;
  background: #fff;
  font: inherit;
  outline: none;
}

.analysis-history-time-range output {
  display: flex;
  align-items: center;
  color: #59686b;
  background: #f4f8f7;
}

.analysis-history-time-range input:focus {
  border-color: #16b99c;
  box-shadow: 0 0 0 2px rgba(22, 185, 156, 0.12);
}

.analysis-history-time-range > i {
  padding-bottom: 11px;
  color: #526164;
  font-size: 13px;
  font-style: normal;
}

.analysis-history-error {
  margin-top: 10px;
  color: #d74c4c;
  font-size: 12px;
}

.analysis-history-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  padding: 12px 20px;
  border-top: 1px solid #e3eceb;
}

.analysis-history-dialog-footer button {
  min-width: 62px;
  height: 32px;
  border: 1px solid #c6d5d3;
  border-radius: 4px;
  color: #536164;
  background: #fff;
  cursor: pointer;
}

.analysis-history-dialog-footer .reset {
  margin-right: auto;
  border-color: transparent;
  color: #17ad96;
}

.analysis-history-dialog-footer .confirm {
  border-color: #18b99d;
  color: #fff;
  background: #18b99d;
}

@media (max-width: 620px) {
  .analysis-history-time-range {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .analysis-history-time-range > i {
    padding: 0;
    text-align: center;
  }
}

@media (max-height: 760px) {
  .outage-user-analysis-panel {
    grid-template-rows: 40px repeat(3, minmax(0, 1fr));
  }

  .outage-analysis-chart-section {
    grid-template-rows: 24px minmax(0, 1fr);
    padding-top: 5px;
  }

  .outage-analysis-chart-section h3 {
    font-size: 14px;
  }
}
</style>
