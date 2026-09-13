<script setup>
import { computed } from 'vue'

const props = defineProps({
  labels: {
    type: Array,
    default: () => [],
  },
  series: {
    type: Array,
    default: () => [],
  },
  unit: {
    type: String,
    default: '用户数',
  },
})

const chartWidth = 520
const chartHeight = 190
const plotLeft = 38
const plotRight = 8
const plotTop = 8
const plotBottom = 32
const plotWidth = chartWidth - plotLeft - plotRight
const plotHeight = chartHeight - plotTop - plotBottom
const tickCount = 5

const safeNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

const niceStep = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return 1
  }

  const exponent = Math.floor(Math.log10(value))
  const fraction = value / 10 ** exponent
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return niceFraction * 10 ** exponent
}

const normalizedSeries = computed(() =>
  props.series.map((item, index) => ({
    key: String(item?.key || `series-${index}`),
    name: String(item?.name || `系列${index + 1}`),
    color: String(item?.color || '#16b8c2'),
    values: props.labels.map((_, valueIndex) => safeNumber(item?.values?.[valueIndex])),
  })),
)

const totals = computed(() =>
  props.labels.map((_, labelIndex) =>
    normalizedSeries.value.reduce((total, item) => total + safeNumber(item.values[labelIndex]), 0),
  ),
)

const axisMax = computed(() => {
  const maximum = Math.max(...totals.value, 0)
  return niceStep(maximum / tickCount) * tickCount
})

const gridLines = computed(() =>
  Array.from({ length: tickCount + 1 }, (_, index) => {
    const value = (axisMax.value / tickCount) * index
    return {
      value,
      label: Number.isInteger(value) ? String(value) : value.toFixed(1),
      y: plotTop + plotHeight - (value / axisMax.value) * plotHeight,
    }
  }),
)

const bars = computed(() => {
  if (props.labels.length === 0) {
    return []
  }

  const slotWidth = plotWidth / props.labels.length
  const barWidth = Math.max(7, Math.min(22, slotWidth * 0.58))

  return props.labels.map((label, labelIndex) => {
    let accumulated = 0
    const segments = normalizedSeries.value.map((item) => {
      const value = safeNumber(item.values[labelIndex])
      const height = (value / axisMax.value) * plotHeight
      const segment = {
        key: item.key,
        name: item.name,
        color: item.color,
        value,
        height,
        y: plotTop + plotHeight - ((accumulated + value) / axisMax.value) * plotHeight,
      }
      accumulated += value
      return segment
    })

    return {
      label: String(label),
      total: accumulated,
      x: plotLeft + slotWidth * labelIndex + (slotWidth - barWidth) / 2,
      centerX: plotLeft + slotWidth * (labelIndex + 0.5),
      width: barWidth,
      segments,
    }
  })
})

const xLabelFontSize = computed(() => (props.labels.length > 12 ? 9 : 10))
</script>

<template>
  <div class="stacked-bar-chart">
    <div class="stacked-chart-meta">
      <span class="stacked-chart-unit">{{ unit }}</span>
      <div class="stacked-chart-legend" aria-label="图例">
        <span v-for="item in normalizedSeries" :key="item.key" class="stacked-chart-legend-item">
          <i :style="{ backgroundColor: item.color }"></i>
          {{ item.name }}
        </span>
      </div>
    </div>

    <svg
      class="stacked-chart-svg"
      :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
      role="img"
      :aria-label="`${unit}堆叠柱状图`"
      preserveAspectRatio="none"
    >
      <g class="stacked-chart-grid">
        <g v-for="line in gridLines" :key="line.value">
          <line :x1="plotLeft" :x2="chartWidth - plotRight" :y1="line.y" :y2="line.y" />
          <text :x="plotLeft - 6" :y="line.y + 3" text-anchor="end">{{ line.label }}</text>
        </g>
      </g>

      <line
        class="stacked-chart-axis"
        :x1="plotLeft"
        :x2="plotLeft"
        :y1="plotTop"
        :y2="plotTop + plotHeight"
      />
      <line
        class="stacked-chart-axis"
        :x1="plotLeft"
        :x2="chartWidth - plotRight"
        :y1="plotTop + plotHeight"
        :y2="plotTop + plotHeight"
      />

      <g v-for="bar in bars" :key="bar.label" class="stacked-chart-column">
        <rect
          v-for="segment in bar.segments"
          :key="`${bar.label}-${segment.key}`"
          :x="bar.x"
          :y="segment.y"
          :width="bar.width"
          :height="Math.max(segment.height, segment.value > 0 ? 1 : 0)"
          :fill="segment.color"
        >
          <title>{{ bar.label }} · {{ segment.name }}：{{ segment.value }}</title>
        </rect>
        <text
          class="stacked-chart-x-label"
          :x="bar.centerX"
          :y="chartHeight - 10"
          :font-size="xLabelFontSize"
          text-anchor="middle"
        >
          {{ bar.label }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.stacked-bar-chart {
  width: 100%;
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  color: #324b51;
}

.stacked-chart-meta {
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.stacked-chart-unit {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 600;
  color: #263c42;
}

.stacked-chart-legend {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  column-gap: 9px;
  row-gap: 3px;
}

.stacked-chart-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  color: #5f6b6f;
  font-size: 10px;
  line-height: 1.2;
}

.stacked-chart-legend-item i {
  width: 9px;
  height: 9px;
  flex: 0 0 9px;
}

.stacked-chart-svg {
  width: 100%;
  height: 100%;
  min-height: 120px;
  overflow: visible;
}

.stacked-chart-grid line {
  stroke: rgba(70, 118, 124, 0.18);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.stacked-chart-grid text,
.stacked-chart-x-label {
  fill: #718084;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

.stacked-chart-grid text {
  font-size: 10px;
}

.stacked-chart-axis {
  stroke: rgba(50, 95, 101, 0.38);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.stacked-chart-column rect {
  transition: opacity 0.18s ease, filter 0.18s ease;
}

.stacked-chart-column:hover rect {
  filter: brightness(1.06);
}

.stacked-chart-column:hover rect:not(:hover) {
  opacity: 0.86;
}
</style>
