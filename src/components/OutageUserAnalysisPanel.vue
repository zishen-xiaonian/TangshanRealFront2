<script setup>
import { computed, ref, watch } from 'vue'
import { queryOutageUserAnalysisOverview } from '../api/outage'
import { createMockOutageUserAnalysis } from '../mock/outageUserAnalysis'
import StackedBarChart from './StackedBarChart.vue'

const props = defineProps({
  selectedRegion: {
    type: String,
    default: '全部',
  },
  endDate: {
    type: String,
    default: '',
  },
})

const rangeOptions = [
  { key: 'sevenDays', label: '七日', days: 7 },
  { key: 'thirtyDays', label: '三十日', days: 30 },
  { key: 'history', label: '历史', days: 0 },
]

const selectedRange = ref('thirtyDays')
const panelData = ref(createMockOutageUserAnalysis(selectedRange.value, props.endDate))
const loading = ref(false)
const usingMock = ref(true)
const loadError = ref('')
let requestId = 0

const useMockData = String(import.meta.env.VITE_OUTAGE_USER_ANALYSIS_USE_MOCK ?? 'true')
  .trim()
  .toLowerCase() !== 'false'

const parseDate = (value) => {
  const matched = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (matched) {
    return new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
  }
  return new Date()
}

const formatBackendDateTime = (date, endOfDay = false) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day} ${endOfDay ? '23:59:59' : '00:00:00'}`
}

const buildQueryPayload = () => {
  const option = rangeOptions.find((item) => item.key === selectedRange.value) || rangeOptions[1]
  const end = parseDate(props.endDate)
  const begin = new Date(end)
  if (option.days > 0) {
    begin.setDate(begin.getDate() - option.days + 1)
  }

  return {
    rangeType: option.key,
    countyName: props.selectedRegion === '全部' ? '' : props.selectedRegion,
    beginTime: option.days > 0 ? formatBackendDateTime(begin) : '',
    endTime: formatBackendDateTime(end, true),
  }
}

const safeValue = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : 0
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
  const fallback = createMockOutageUserAnalysis(selectedRange.value, props.endDate)

  if (useMockData) {
    panelData.value = fallback
    usingMock.value = true
    loadError.value = ''
    return
  }

  loading.value = true
  loadError.value = ''
  try {
    const response = await queryOutageUserAnalysisOverview(buildQueryPayload())
    if (currentRequestId !== requestId) {
      return
    }
    panelData.value = normalizeResponse(response, fallback)
    usingMock.value = false
  } catch (error) {
    if (currentRequestId !== requestId) {
      return
    }
    console.warn('[outage-analysis] 接口加载失败，已使用示例数据：', error)
    panelData.value = fallback
    usingMock.value = true
    loadError.value = error?.message || '接口暂不可用'
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}

const dataSourceText = computed(() => {
  if (loading.value) {
    return '数据加载中'
  }
  if (loadError.value) {
    return '接口未就绪 · 示例数据'
  }
  return usingMock.value ? '示例数据' : '实时数据'
})

watch(
  [selectedRange, () => props.selectedRegion, () => props.endDate],
  () => {
    void loadPanelData()
  },
  { immediate: true },
)
</script>

<template>
  <section class="card outage-user-analysis-panel" :aria-busy="loading">
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
          @click="selectedRange = option.key"
        >
          {{ option.label }}
        </button>
      </div>

      <span class="outage-analysis-source" :class="{ live: !usingMock }">{{ dataSourceText }}</span>
    </header>

    <article class="outage-analysis-chart-section">
      <h3>停电用户类型</h3>
      <StackedBarChart
        :labels="panelData.userTypes.labels"
        :series="panelData.userTypes.series"
        unit="用户数"
      />
    </article>

    <article class="outage-analysis-chart-section">
      <h3>频繁停电预警</h3>
      <StackedBarChart
        :labels="panelData.frequentWarnings.labels"
        :series="panelData.frequentWarnings.series"
        unit="用户数"
      />
    </article>

    <article class="outage-analysis-chart-section">
      <h3>停电影响用户分析</h3>
      <StackedBarChart
        :labels="panelData.outageImpact.labels"
        :series="panelData.outageImpact.series"
        unit="停电次数"
      />
    </article>
  </section>
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
  color: #087f8e;
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
