<script setup>
import { computed, ref, watch } from 'vue'
import {
  queryOutageAnalysisImpactCounts,
  queryOutageAnalysisWarningCounts,
} from '../api/outage'

const props = defineProps({
  data: {
    type: Object,
    default: null,
  },
  cityId: {
    type: String,
    default: '',
  },
  countyId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['range-change'])

const ranges = [
  { key: 'today', label: '本日' },
  { key: 'sevenDays', label: '七日' },
  { key: 'history', label: '历史' },
]

const activeRange = ref('today')
const liveImpact = ref(null)
const impactLoading = ref(false)
const impactLoadError = ref('')
const liveWarnings = ref(null)
const warningLoading = ref(false)
const warningLoadError = ref('')
const warningRuleDialogOpen = ref(false)
const historyDialogOpen = ref(false)
const historyBeginInput = ref('')
const historyEndInput = ref('')
const historyMinTime = ref('')
const historyMaxTime = ref('')
const historyRange = ref(null)
const historyValidationError = ref('')
const rangeEndTime = ref('')
let impactRequestId = 0
let warningRequestId = 0

const padDatePart = (value) => String(value).padStart(2, '0')

const formatLocalDateTime = (date) => [
  date.getFullYear(),
  padDatePart(date.getMonth() + 1),
  padDatePart(date.getDate()),
].join('-') + `T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}`

const subtractOneMonth = (date) => {
  const result = new Date(date)
  const originalDay = result.getDate()
  result.setDate(1)
  result.setMonth(result.getMonth() - 1)
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
  result.setDate(Math.min(originalDay, lastDay))
  return result
}

const toApiDateTime = (value) => String(value || '').replace('T', ' ')
rangeEndTime.value = toApiDateTime(formatLocalDateTime(new Date()))

const overviewItems = computed(() => [
  { key: 'urban', label: '城网用户', icon: 'urban', value: props.data?.overview?.urban },
  { key: 'rural', label: '农网用户', icon: 'rural', value: props.data?.overview?.rural },
])

const keyOverviewItems = computed(() => [
  { key: 'important', label: '重要用户', value: props.data?.overview?.important },
  { key: 'coalToElectricity', label: '煤改电用户', value: props.data?.overview?.coalToElectricity },
])

const importantTypeLegend = computed(() => [
  { key: 'important', label: '重要用户', color: '#ff8b2d', value: props.data?.userTypes?.important?.important },
  { key: 'coalToElectricity', label: '煤改电客户', color: '#25bc83', value: props.data?.userTypes?.important?.coalToElectricity },
  { key: 'other', label: '其他客户', color: '#2d8df0', value: props.data?.userTypes?.important?.other },
])

const usageTypeLegend = computed(() => [
  { key: 'industrial', label: '大工业用电', color: '#4167ed', value: props.data?.userTypes?.usage?.industrial },
  { key: 'commercial', label: '中小化肥', color: '#219ce5', value: props.data?.userTypes?.usage?.commercial },
  { key: 'residential', label: '居民生活用电', color: '#7ca9f5', value: props.data?.userTypes?.usage?.residential },
  { key: 'agricultural', label: '农业生产用电', color: '#70c6f2', value: props.data?.userTypes?.usage?.agricultural },
  { key: 'irrigation', label: '贫困县农业排灌用电', color: '#8baff3', value: props.data?.userTypes?.usage?.irrigation },
])

const warningRules = [
  { key: 'extreme', label: '极度风险', compactLabel: '极度\n风险', threshold: '≥ 7次/日', color: '#96242f' },
  { key: 'exceptional', label: '特大风险', compactLabel: '特大\n风险', threshold: '6次/日', color: '#c62532' },
  { key: 'severe', label: '重大风险', compactLabel: '重大\n风险', threshold: '5次/日', color: '#df3d40' },
  { key: 'major', label: '较大风险', compactLabel: '较大\n风险', threshold: '4次/日', color: '#f0712e' },
  { key: 'medium', label: '中度风险', compactLabel: '中度\n风险', threshold: '3次/日', color: '#eea72b' },
  { key: 'mild', label: '轻度风险', compactLabel: '轻度\n风险', threshold: '2次/日', color: '#3dbd82' },
]

const warningSource = computed(() => liveWarnings.value || props.data?.warnings || {})

const warningLevels = computed(() => warningRules.map((rule) => ({
  ...rule,
  label: rule.compactLabel,
  value: warningSource.value[rule.key],
})))

const impactSource = computed(() => liveImpact.value || props.data?.impact || {})

const impactLevels = computed(() => [
  { key: 'veryHigh', label: '影响户数极大', range: '>1000', color: '#e23b33', value: impactSource.value.veryHigh },
  { key: 'high', label: '影响户数较大', range: '>500~≤1000', color: '#ffbd24', value: impactSource.value.high },
  { key: 'medium', label: '影响户数中度', range: '>100~≤500', color: '#1cb1d0', value: impactSource.value.medium },
  { key: 'low', label: '影响户数轻度', range: '≤100', color: '#48c890', value: impactSource.value.low },
])

const hasValue = (value) => Number.isFinite(Number(value)) && Number(value) >= 0
const displayValue = (value) => (hasValue(value) ? Number(value) : '--')

const ratioText = (item) => {
  if (!hasValue(item?.outage) || !hasValue(item?.total)) {
    return null
  }
  return {
    outage: Number(item.outage),
    total: Number(item.total),
  }
}

const donutStyle = (items) => {
  const validItems = items.filter((item) => hasValue(item.value) && Number(item.value) > 0)
  const total = validItems.reduce((sum, item) => sum + Number(item.value), 0)
  if (total <= 0) {
    return { background: 'conic-gradient(#d7e8e8 0 100%)' }
  }

  let cursor = 0
  const stops = validItems.map((item) => {
    const start = cursor
    cursor += (Number(item.value) / total) * 100
    return `${item.color} ${start}% ${cursor}%`
  })
  return { background: `conic-gradient(${stops.join(',')})` }
}

const impactBarWidth = (value) => {
  if (!hasValue(value)) {
    return '0%'
  }
  const values = impactLevels.value.map((item) => Number(item.value)).filter(Number.isFinite)
  const max = Math.max(...values, 0)
  return max > 0 ? `${Math.max(0, Math.min(100, (Number(value) / max) * 100))}%` : '0%'
}

const selectRange = (range) => {
  if (range === 'history') {
    const now = new Date()
    const lowerBound = subtractOneMonth(now)
    lowerBound.setHours(0, 0, 0, 0)
    historyMinTime.value = formatLocalDateTime(lowerBound)
    historyMaxTime.value = formatLocalDateTime(now)
    historyBeginInput.value = historyRange.value?.beginInput || historyMinTime.value
    historyEndInput.value = historyRange.value?.endInput || historyMaxTime.value
    historyValidationError.value = ''
    historyDialogOpen.value = true
    return
  }

  rangeEndTime.value = toApiDateTime(formatLocalDateTime(new Date()))
  activeRange.value = range
  emit('range-change', range)
}

const closeHistoryDialog = () => {
  historyDialogOpen.value = false
  historyValidationError.value = ''
}

const resetHistoryRange = () => {
  historyBeginInput.value = historyMinTime.value
  historyEndInput.value = historyMaxTime.value
  historyValidationError.value = ''
}

const confirmHistoryRange = () => {
  if (!historyBeginInput.value || !historyEndInput.value) {
    historyValidationError.value = '请选择完整的开始时间和结束时间'
    return
  }

  const beginTime = new Date(historyBeginInput.value)
  const endTime = new Date(historyEndInput.value)
  const lowerBound = new Date(historyMinTime.value)
  const upperBound = new Date(historyMaxTime.value)
  if ([beginTime, endTime, lowerBound, upperBound].some((date) => Number.isNaN(date.getTime()))) {
    historyValidationError.value = '时间格式不正确，请重新选择'
    return
  }
  if (beginTime < lowerBound || endTime > upperBound) {
    historyValidationError.value = '仅可查询距离本日最近一个月内的数据'
    return
  }
  if (beginTime > endTime) {
    historyValidationError.value = '开始时间不能晚于结束时间'
    return
  }

  historyRange.value = {
    beginInput: historyBeginInput.value,
    endInput: historyEndInput.value,
    beginTime: toApiDateTime(historyBeginInput.value),
    endTime: toApiDateTime(historyEndInput.value),
  }
  activeRange.value = 'history'
  emit('range-change', 'history')
  closeHistoryDialog()
}

const buildAnalysisPayload = () => {
  const cityId = String(props.cityId || '').trim()
  const countyId = String(props.countyId || '').trim()
  if (!cityId && !countyId) {
    return null
  }

  const payload = { rangeType: activeRange.value }
  if (activeRange.value === 'history') {
    if (!historyRange.value) {
      return null
    }
    payload.beginTime = historyRange.value.beginTime
    payload.endTime = historyRange.value.endTime
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

const loadImpactCounts = async () => {
  const payload = buildAnalysisPayload()
  if (!payload) {
    liveImpact.value = null
    impactLoadError.value = ''
    return
  }

  const currentRequestId = ++impactRequestId
  impactLoading.value = true
  impactLoadError.value = ''
  liveImpact.value = null

  try {
    const response = await queryOutageAnalysisImpactCounts(payload)
    if (currentRequestId !== impactRequestId) {
      return
    }
    const impact = response?.data?.impact
    liveImpact.value = impact && typeof impact === 'object' ? impact : null
    if (!liveImpact.value) {
      impactLoadError.value = '返回数据格式不正确'
    }
  } catch (error) {
    if (currentRequestId !== impactRequestId) {
      return
    }
    impactLoadError.value = error?.message || '数据加载失败'
    liveImpact.value = null
  } finally {
    if (currentRequestId === impactRequestId) {
      impactLoading.value = false
    }
  }
}

const loadWarningCounts = async () => {
  const payload = buildAnalysisPayload()
  if (!payload) {
    liveWarnings.value = null
    warningLoadError.value = ''
    return
  }

  const currentRequestId = ++warningRequestId
  warningLoading.value = true
  warningLoadError.value = ''
  liveWarnings.value = null

  try {
    const response = await queryOutageAnalysisWarningCounts(payload)
    if (currentRequestId !== warningRequestId) {
      return
    }
    const warnings = response?.data?.warnings
    liveWarnings.value = warnings && typeof warnings === 'object' ? warnings : null
    if (!liveWarnings.value) {
      warningLoadError.value = '返回数据格式不正确'
    }
  } catch (error) {
    if (currentRequestId !== warningRequestId) {
      return
    }
    warningLoadError.value = error?.message || '数据加载失败'
    liveWarnings.value = null
  } finally {
    if (currentRequestId === warningRequestId) {
      warningLoading.value = false
    }
  }
}

watch(
  [
    activeRange,
    () => props.cityId,
    () => props.countyId,
    () => historyRange.value?.beginTime,
    () => historyRange.value?.endTime,
    rangeEndTime,
  ],
  () => {
    void loadImpactCounts()
    void loadWarningCounts()
  },
  { immediate: true },
)
</script>

<template>
  <section class="outage-overview-panel">
    <header class="overview-header">
      <div class="overview-heading">
        <span class="heading-arrows" aria-hidden="true"><i></i><i></i></span>
        <h2>停电用户概览</h2>
      </div>
      <div class="overview-ranges" role="tablist" aria-label="概览时间范围">
        <button
          v-for="range in ranges"
          :key="range.key"
          type="button"
          role="tab"
          :aria-selected="activeRange === range.key"
          :class="{ active: activeRange === range.key }"
          @click="selectRange(range.key)"
        >
          {{ range.label }}
        </button>
      </div>
    </header>

    <div class="overview-content">
      <section class="overview-summary-card" aria-label="停电用户数量概览">
        <div class="overview-network-list">
          <article v-for="item in overviewItems" :key="item.key" class="network-item">
            <div class="network-icon" :class="item.icon" aria-hidden="true">
              <svg v-if="item.icon === 'urban'" viewBox="0 0 84 56">
                <path d="M10 40 42 25l32 15-32 12z" />
                <path d="M19 37 42 27l23 10-23 9z" class="icon-platform" />
                <path d="M35 30V15m14 15V20" class="icon-line" />
                <circle cx="35" cy="13" r="3" class="icon-node" />
                <circle cx="49" cy="18" r="3" class="icon-node" />
              </svg>
              <svg v-else viewBox="0 0 84 56">
                <path d="M10 40 42 25l32 15-32 12z" />
                <path d="M19 37 42 27l23 10-23 9z" class="icon-platform" />
                <path d="M42 31V15m-5 4h10m-9-4h8m-6-4h4" class="icon-line" />
                <path d="m38 25 4 7 4-7" class="icon-line" />
              </svg>
            </div>
            <div class="network-value">
              <template v-if="ratioText(item.value)">
                <strong>{{ ratioText(item.value).outage }}</strong>
                <span>/</span>
                <b>{{ ratioText(item.value).total }}</b><small>户</small>
              </template>
              <template v-else><strong>--</strong><span>/</span><b>--</b><small>户</small></template>
            </div>
            <p>{{ item.label }}</p>
          </article>
        </div>

        <div class="overview-key-list">
          <p v-for="item in keyOverviewItems" :key="item.key">
            <span>{{ item.label }}</span>
            <template v-if="ratioText(item.value)">
              <strong>{{ ratioText(item.value).outage }}</strong><i>/</i><b>{{ ratioText(item.value).total }}</b><small>户</small>
            </template>
            <template v-else><strong>--</strong><i>/</i><b>--</b><small>户</small></template>
          </p>
        </div>
      </section>

      <section class="overview-section user-type-section">
        <h3>停电用户类型</h3>
        <div class="donut-grid">
          <article class="donut-card">
            <div class="donut-graphic" :style="donutStyle(importantTypeLegend)">
              <span>重要及<br />关键用户</span>
            </div>
            <div class="donut-legend compact">
              <span v-for="item in importantTypeLegend" :key="item.key">
                <i :style="{ backgroundColor: item.color }"></i>{{ item.label }}
              </span>
            </div>
          </article>

          <article class="donut-card">
            <div class="donut-graphic" :style="donutStyle(usageTypeLegend)">
              <span>用电类型</span>
            </div>
            <div class="donut-legend usage">
              <span v-for="item in usageTypeLegend" :key="item.key">
                <i :style="{ backgroundColor: item.color }"></i>{{ item.label }}
              </span>
            </div>
          </article>
        </div>
      </section>

      <section class="overview-section warning-section" :aria-busy="warningLoading">
        <div class="section-heading-row">
          <h3>频繁停电用户预警</h3>
          <div class="warning-heading-actions">
            <span v-if="warningLoading">加载中...</span>
            <span v-else-if="warningLoadError" class="warning-load-error">加载失败</span>
            <button
              type="button"
              class="warning-rule-button"
              @click="warningRuleDialogOpen = true"
            >
              预警规则
            </button>
          </div>
        </div>
        <div class="warning-list">
          <article
            v-for="item in warningLevels"
            :key="item.key"
            class="warning-item"
            :style="{ '--warning-color': item.color }"
          >
            <div class="warning-badge"><span>{{ item.label }}</span></div>
            <div class="warning-eye" aria-hidden="true"><i></i></div>
            <p><strong>{{ displayValue(item.value) }}</strong><small>户</small></p>
          </article>
        </div>
      </section>

      <section class="overview-section impact-section" :aria-busy="impactLoading">
        <h3>停电影响户数分析</h3>
        <div class="impact-legend">
          <span v-for="item in impactLevels" :key="item.key">
            <i :style="{ backgroundColor: item.color }"></i>{{ item.label }}{{ item.range }}
          </span>
        </div>
        <div class="impact-list">
          <article v-for="item in impactLevels" :key="item.key" class="impact-row">
            <span>{{ item.label }}</span>
            <div class="impact-track">
              <i :style="{ width: impactBarWidth(item.value), backgroundColor: item.color }"></i>
            </div>
            <strong>{{ displayValue(item.value) }}</strong>
          </article>
        </div>
        <p class="impact-note">
          （注：按停电影响户数规模统计停电次数）
          <span v-if="impactLoading">加载中...</span>
          <span v-else-if="impactLoadError" class="impact-error">加载失败</span>
        </p>
      </section>
    </div>
  </section>

  <Teleport to="body">
    <div
      v-if="historyDialogOpen"
      class="history-dialog-backdrop"
      @click.self="closeHistoryDialog"
      @keydown.esc="closeHistoryDialog"
    >
      <section
        class="history-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-dialog-title"
      >
        <header class="history-dialog-header">
          <h3 id="history-dialog-title">选择历史时间范围</h3>
          <button type="button" aria-label="关闭" @click="closeHistoryDialog">×</button>
        </header>
        <div class="history-dialog-body">
          <p class="history-dialog-hint">仅可查询距离本日最近一个月内的任意时间段</p>
          <div class="history-time-range">
            <label>
              <span>开始时间</span>
              <input
                v-model="historyBeginInput"
                type="datetime-local"
                step="1"
                :min="historyMinTime"
                :max="historyEndInput || historyMaxTime"
              />
            </label>
            <i aria-hidden="true">至</i>
            <label>
              <span>结束时间</span>
              <input
                v-model="historyEndInput"
                type="datetime-local"
                step="1"
                :min="historyBeginInput || historyMinTime"
                :max="historyMaxTime"
              />
            </label>
          </div>
          <p v-if="historyValidationError" class="history-dialog-error" role="alert">
            {{ historyValidationError }}
          </p>
        </div>
        <footer class="history-dialog-footer">
          <button type="button" class="history-reset-button" @click="resetHistoryRange">重置</button>
          <button type="button" @click="closeHistoryDialog">取消</button>
          <button type="button" class="history-confirm-button" @click="confirmHistoryRange">确定</button>
        </footer>
      </section>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="warningRuleDialogOpen"
      class="history-dialog-backdrop"
      @click.self="warningRuleDialogOpen = false"
      @keydown.esc="warningRuleDialogOpen = false"
    >
      <section
        class="history-dialog warning-rule-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="warning-rule-dialog-title"
      >
        <header class="history-dialog-header">
          <h3 id="warning-rule-dialog-title">频繁停电用户预警规则</h3>
          <button type="button" aria-label="关闭" @click="warningRuleDialogOpen = false">×</button>
        </header>
        <div class="warning-rule-dialog-body">
          <p>以同一自然日内单个用户的停电次数判定风险，停电0次或1次不纳入预警。</p>
          <div class="warning-rule-grid">
            <article
              v-for="rule in warningRules"
              :key="rule.key"
              :style="{ '--warning-color': rule.color }"
            >
              <i></i>
              <strong>{{ rule.label }}</strong>
              <span>{{ rule.threshold }}</span>
            </article>
          </div>
          <ul>
            <li><b>本日：</b>统计今日00:00:00至当前时刻内各风险等级的用户数。</li>
            <li><b>七日：</b>逐日判定风险等级，再累计最近七日各等级的用户数。</li>
            <li><b>历史：</b>在最近一个月内选择任意时段，按日判定后累计；首尾日期按实际选择的时刻统计。</li>
          </ul>
        </div>
        <footer class="history-dialog-footer">
          <button
            type="button"
            class="history-confirm-button"
            @click="warningRuleDialogOpen = false"
          >
            知道了
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.outage-overview-panel {
  --overview-green: #11b890;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: grid;
  grid-template-rows: 42px minmax(0, 1fr);
  border: 1px solid rgba(63, 211, 214, 0.9);
  border-radius: 5px;
  color: #253538;
  background: linear-gradient(180deg, rgba(245, 255, 254, 0.98), rgba(231, 247, 246, 0.98));
  box-shadow: inset 0 0 16px rgba(53, 197, 197, 0.08);
}

.overview-header {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 0 8px;
  background: linear-gradient(100deg, #25cbbf, #8ce4d7 58%, #edf9f5);
  border-bottom: 1px solid rgba(39, 190, 184, 0.48);
}

.overview-heading {
  display: flex;
  align-items: center;
  gap: 7px;
}

.overview-heading h2 {
  color: #fff;
  font-size: 18px;
  line-height: 1;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 111, 109, 0.28);
}

.heading-arrows {
  display: inline-flex;
  gap: 1px;
}

.heading-arrows i {
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 8px solid #d1fff8;
}

.heading-arrows i + i {
  border-left-color: #81f5e8;
}

.overview-ranges {
  align-self: stretch;
  display: flex;
  align-items: stretch;
}

.overview-ranges button {
  position: relative;
  min-width: 36px;
  padding: 0 5px;
  border: 0;
  color: #526467;
  background: transparent;
  font-size: 14px;
  cursor: pointer;
}

.overview-ranges button.active {
  color: #0a9f91;
  font-weight: 700;
}

.overview-ranges button.active::after {
  content: '';
  position: absolute;
  left: 5px;
  right: 5px;
  bottom: 2px;
  height: 2px;
  background: #1ad5c2;
}

.overview-content {
  min-height: 0;
  overflow: hidden;
  display: grid;
  grid-template-rows: minmax(112px, 0.9fr) minmax(220px, 1.55fr) minmax(158px, 1.12fr) minmax(190px, 1.28fr);
  padding: 14px 15px 12px;
}

.overview-summary-card {
  min-height: 0;
  display: grid;
  grid-template-columns: 56% 44%;
  border: 1px solid #3ac9bd;
  border-radius: 7px;
  overflow: hidden;
  background: rgba(241, 252, 251, 0.82);
}

.overview-network-list {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
}

.network-item {
  min-width: 0;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 1px;
  padding: 5px 3px;
}

.network-item + .network-item {
  border-left: 1px solid rgba(74, 198, 188, 0.28);
}

.network-icon {
  width: min(72px, 84%);
  color: #20abd0;
  filter: drop-shadow(0 7px 7px rgba(22, 168, 184, 0.2));
}

.network-icon.rural {
  color: #25bd83;
}

.network-icon svg {
  display: block;
  width: 100%;
  height: auto;
  fill: currentColor;
}

.network-icon .icon-platform {
  fill: rgba(230, 255, 252, 0.95);
}

.network-icon .icon-line {
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.network-icon .icon-node {
  fill: #eaffff;
  stroke: currentColor;
  stroke-width: 2;
}

.network-value {
  display: flex;
  align-items: baseline;
  gap: 3px;
  white-space: nowrap;
}

.network-value strong,
.overview-key-list strong {
  color: #ff4d54;
  font-size: 16px;
}

.network-value b,
.overview-key-list b {
  color: #213238;
  font-size: 16px;
}

.network-value span,
.overview-key-list i {
  color: #3bc2ae;
  font-style: normal;
}

.network-value small,
.overview-key-list small {
  font-size: 11px;
}

.network-item p {
  color: #667579;
  font-size: 12px;
}

.overview-key-list {
  min-width: 0;
  display: grid;
  align-content: center;
  gap: 17px;
  padding: 8px 10px 8px 14px;
  border-left: 1px solid rgba(74, 198, 188, 0.28);
}

.overview-key-list p {
  display: flex;
  align-items: baseline;
  gap: 3px;
  white-space: nowrap;
}

.overview-key-list p > span {
  min-width: 64px;
  color: #293b3e;
  font-size: 13px;
}

.overview-section {
  min-height: 0;
  padding-top: 13px;
}

.overview-section h3 {
  position: relative;
  padding-left: 12px;
  color: #1e2e32;
  font-size: 16px;
  line-height: 22px;
}

.overview-section h3::before {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  width: 3px;
  height: 17px;
  border-radius: 3px;
  background: #0dc290;
}

.user-type-section {
  display: grid;
  grid-template-rows: 25px minmax(0, 1fr);
}

.donut-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.donut-card {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(108px, 1fr) auto;
  justify-items: center;
  align-items: center;
}

.donut-graphic {
  width: min(142px, 74%);
  aspect-ratio: 1;
  border-radius: 50%;
  position: relative;
  display: grid;
  place-items: center;
  filter: drop-shadow(0 8px 5px rgba(25, 181, 177, 0.13));
}

.donut-graphic::before {
  content: '';
  position: absolute;
  inset: 24%;
  border-radius: 50%;
  background: #f3fbfa;
  box-shadow: 0 0 0 1px rgba(77, 177, 174, 0.12);
}

.donut-graphic span {
  position: relative;
  z-index: 1;
  color: #5f6c70;
  font-size: 12px;
  line-height: 1.35;
  text-align: center;
}

.donut-legend {
  width: 100%;
  min-height: 30px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 9px;
  color: #6c797d;
  font-size: 9px;
  line-height: 1.2;
}

.donut-legend.usage {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, auto));
  justify-content: center;
  column-gap: 7px;
}

.donut-legend span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.donut-legend i,
.impact-legend i {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: 50%;
}

.warning-section {
  display: grid;
  grid-template-rows: 28px minmax(0, 1fr);
}

.section-heading-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.warning-heading-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}

.warning-heading-actions > span {
  color: #718083;
  font-size: 10px;
}

.warning-heading-actions > .warning-load-error {
  color: #c74343;
}

.warning-rule-button {
  height: 25px;
  padding: 0 11px;
  border: 0;
  border-radius: 13px;
  color: #fff;
  background: #14ad82;
  font-size: 11px;
  cursor: pointer;
}

.warning-list {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 7px;
  align-items: stretch;
  padding: 7px 8px 0;
}

.warning-item {
  min-width: 0;
  display: grid;
  grid-template-rows: minmax(54px, 1fr) 20px 25px;
  justify-items: center;
}

.warning-badge {
  width: 100%;
  max-width: 56px;
  position: relative;
  display: grid;
  place-items: center;
  padding: 5px;
  color: #fff;
  background: var(--warning-color);
  clip-path: polygon(14% 0, 86% 0, 100% 14%, 100% 86%, 86% 100%, 14% 100%, 0 86%, 0 14%);
}

.warning-badge span {
  white-space: pre-line;
  text-align: center;
  font-size: 12px;
  line-height: 1.45;
}

.warning-eye {
  width: 100%;
  position: relative;
  display: grid;
  place-items: center;
}

.warning-eye::before {
  content: '';
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid var(--warning-color);
  transform: translateY(-2px);
}

.warning-eye::after {
  content: '';
  position: absolute;
  left: 4px;
  right: 4px;
  bottom: 0;
  height: 6px;
  border-top: 2px solid var(--warning-color);
  border-radius: 50%;
}

.warning-eye i {
  position: absolute;
  bottom: 2px;
  width: 7px;
  height: 7px;
  border: 2px solid var(--warning-color);
  border-radius: 50%;
  background: #edf8f7;
}

.warning-item p {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.warning-item p strong {
  color: var(--warning-color);
  font-size: 18px;
  line-height: 1;
}

.warning-item p small {
  color: #4d5b5e;
  font-size: 10px;
}

.impact-section {
  display: grid;
  grid-template-rows: 25px auto minmax(0, 1fr) auto;
}

.impact-legend {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px 16px;
  margin: 1px 0 7px;
  padding: 8px 10px;
  color: #687679;
  background: rgba(201, 231, 231, 0.55);
  font-size: 10px;
}

.impact-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.impact-list {
  min-height: 0;
  display: grid;
  align-content: space-around;
  gap: 5px;
  padding: 0 10px;
}

.impact-row {
  min-width: 0;
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) 28px;
  align-items: center;
  gap: 6px;
  color: #344548;
  font-size: 11px;
}

.impact-track {
  height: 13px;
  overflow: hidden;
  border-radius: 8px;
  background: #dceaea;
}

.impact-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width 0.25s ease;
}

.impact-row strong {
  font-size: 12px;
}

.impact-note {
  padding: 7px 10px 0;
  color: #344548;
  font-size: 10px;
}

.impact-note span {
  margin-left: 4px;
}

.impact-error {
  color: #c74343;
}

.history-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(4, 23, 31, 0.48);
}

.history-dialog {
  width: min(620px, calc(100vw - 32px));
  overflow: hidden;
  border-radius: 8px;
  color: #425256;
  background: #fff;
  box-shadow: 0 18px 48px rgba(0, 25, 35, 0.35);
}

.history-dialog-header {
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  color: #fff;
  background: linear-gradient(90deg, #20bda2, #dff5f0);
}

.history-dialog-header h3 {
  font-size: 15px;
  font-weight: 600;
}

.history-dialog-header button {
  width: 30px;
  height: 30px;
  border: 0;
  color: #7a898c;
  background: transparent;
  font-size: 25px;
  line-height: 1;
  cursor: pointer;
}

.history-dialog-body {
  padding: 24px 20px 18px;
}

.history-dialog-hint {
  margin-bottom: 14px;
  color: #778689;
  font-size: 13px;
}

.history-time-range {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: end;
  gap: 12px;
}

.history-time-range label {
  min-width: 0;
  display: grid;
  gap: 7px;
}

.history-time-range label span {
  color: #59686b;
  font-size: 13px;
}

.history-time-range input {
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

.history-time-range input:focus {
  border-color: #16b99c;
  box-shadow: 0 0 0 2px rgba(22, 185, 156, 0.12);
}

.history-time-range > i {
  padding-bottom: 11px;
  color: #526164;
  font-size: 13px;
  font-style: normal;
}

.history-dialog-error {
  margin-top: 10px;
  color: #d74c4c;
  font-size: 12px;
}

.history-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  padding: 12px 20px;
  border-top: 1px solid #e3eceb;
}

.history-dialog-footer button {
  min-width: 62px;
  height: 32px;
  border: 1px solid #c6d5d3;
  border-radius: 4px;
  color: #536164;
  background: #fff;
  cursor: pointer;
}

.history-dialog-footer .history-reset-button {
  margin-right: auto;
  border-color: transparent;
  color: #17ad96;
}

.history-dialog-footer .history-confirm-button {
  border-color: #18b99d;
  color: #fff;
  background: #18b99d;
}

.warning-rule-dialog {
  width: min(680px, calc(100vw - 32px));
}

.warning-rule-dialog-body {
  padding: 22px 20px 18px;
}

.warning-rule-dialog-body > p {
  margin-bottom: 16px;
  color: #68777a;
  font-size: 13px;
  line-height: 1.6;
}

.warning-rule-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

.warning-rule-grid article {
  min-width: 0;
  display: grid;
  justify-items: center;
  gap: 7px;
  padding: 13px 4px 11px;
  border: 1px solid color-mix(in srgb, var(--warning-color) 38%, white);
  border-radius: 6px;
  background: color-mix(in srgb, var(--warning-color) 7%, white);
}

.warning-rule-grid article i {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--warning-color);
}

.warning-rule-grid article strong {
  color: var(--warning-color);
  font-size: 13px;
  white-space: nowrap;
}

.warning-rule-grid article span {
  color: #526164;
  font-size: 12px;
  white-space: nowrap;
}

.warning-rule-dialog-body ul {
  display: grid;
  gap: 8px;
  margin: 18px 0 0;
  padding-left: 20px;
  color: #5d6c6f;
  font-size: 12px;
  line-height: 1.55;
}

.warning-rule-dialog-body li::marker {
  color: #18b99d;
}

.warning-rule-dialog-body b {
  color: #354649;
}

@media (max-width: 620px) {
  .history-time-range {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .history-time-range > i {
    padding: 0;
    text-align: center;
  }

  .warning-rule-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-height: 820px) {
  .overview-content {
    grid-template-rows: minmax(104px, 0.84fr) minmax(188px, 1.38fr) minmax(145px, 1.02fr) minmax(165px, 1.18fr);
    padding-top: 10px;
  }

  .overview-section {
    padding-top: 8px;
  }

  .donut-graphic {
    width: min(118px, 67%);
  }

  .warning-list {
    padding-top: 4px;
  }
}
</style>
