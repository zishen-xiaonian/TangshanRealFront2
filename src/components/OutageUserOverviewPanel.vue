<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['range-change'])

const ranges = [
  { key: 'today', label: '本日' },
  { key: 'sevenDays', label: '七日' },
  { key: 'history', label: '历史' },
]

const activeRange = ref('today')

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

const warningLevels = computed(() => [
  { key: 'extreme', label: '极度\n风险', color: '#96242f', value: props.data?.warnings?.extreme },
  { key: 'exceptional', label: '特大\n风险', color: '#c62532', value: props.data?.warnings?.exceptional },
  { key: 'severe', label: '重大\n风险', color: '#df3d40', value: props.data?.warnings?.severe },
  { key: 'major', label: '较大\n风险', color: '#f0712e', value: props.data?.warnings?.major },
  { key: 'medium', label: '中度\n风险', color: '#eea72b', value: props.data?.warnings?.medium },
  { key: 'mild', label: '轻度\n风险', color: '#3dbd82', value: props.data?.warnings?.mild },
])

const impactLevels = computed(() => [
  { key: 'veryHigh', label: '影响户数极大', range: '>1000', color: '#e23b33', value: props.data?.impact?.veryHigh },
  { key: 'high', label: '影响户数较大', range: '500~1000', color: '#ffbd24', value: props.data?.impact?.high },
  { key: 'medium', label: '影响户数中度', range: '100~500', color: '#1cb1d0', value: props.data?.impact?.medium },
  { key: 'low', label: '影响户数轻度', range: '<100', color: '#48c890', value: props.data?.impact?.low },
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
  activeRange.value = range
  emit('range-change', range)
}
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

      <section class="overview-section warning-section">
        <div class="section-heading-row">
          <h3>频繁停电用户预警</h3>
          <button type="button" class="warning-rule-button">预警规则</button>
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

      <section class="overview-section impact-section">
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
        <p class="impact-note">（注：按停电影响户数规模统计停电次数）</p>
      </section>
    </div>
  </section>
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

.warning-rule-button {
  height: 25px;
  padding: 0 11px;
  border: 0;
  border-radius: 13px;
  color: #fff;
  background: #14ad82;
  font-size: 11px;
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
