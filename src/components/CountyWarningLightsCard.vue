<script setup>
import '../style.css'
import { computed } from 'vue'

const props = defineProps({
  countyWarningLights: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  popupVisible: {
    type: Boolean,
    default: false,
  },
  popupCountyName: {
    type: String,
    default: '',
  },
  popupEvents: {
    type: Array,
    default: () => [],
  },
  popupLoading: {
    type: Boolean,
    default: false,
  },
  popupError: {
    type: String,
    default: '',
  },
  popupCurrentPage: {
    type: Number,
    default: 1,
  },
  popupTotal: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['select-county', 'close-popup', 'change-popup-page'])

const popupChartBars = computed(() => {
  const maxCount = Math.max(...props.popupEvents.map((item) => Number(item?.count) || 0), 0)
  return props.popupEvents.map((item) => {
    const count = Math.max(Number(item?.count) || 0, 0)
    return {
      key: item?.key || item?.label,
      label: item?.label || '-',
      count,
      percent: maxCount > 0 ? (count / maxCount) * 100 : 0,
    }
  })
})
</script>

<template>
  <article class="module-block county-warning-lights-block">
    <div class="county-warning-lights-head">
      <h3>区县警示灯</h3>
      <p>唐山全区县停电状态</p>
    </div>

    <ul class="county-warning-lights-grid">
      <li v-for="item in props.countyWarningLights" :key="item.countyName" class="county-warning-light-item">
        <button
          type="button"
          class="county-warning-light-btn"
          :class="{ active: props.popupVisible && props.popupCountyName === item.countyName }"
          @click="emit('select-county', item)"
        >
          <span class="county-warning-light-dot" :class="item.hasOutage ? 'danger' : 'safe'"></span>
          <span class="county-warning-light-name">{{ item.countyName }}</span>
        </button>
      </li>
      <li v-if="props.loading && props.countyWarningLights.length === 0" class="county-warning-light-loading">
        <span class="county-warning-light-spinner" aria-hidden="true"></span>
        <span>数据加载中...</span>
      </li>
    </ul>

    <teleport to="body">
      <div v-if="props.popupVisible" class="county-warning-popup-mask">
        <div class="county-warning-popup-card">
          <div class="county-warning-popup-head">
            <h4>{{ props.popupCountyName || '供电单位' }}</h4>
            <button type="button" class="county-warning-popup-close" aria-label="关闭" @click="emit('close-popup')">×</button>
          </div>
          <div class="county-warning-popup-body">
            <div v-if="props.popupLoading" class="county-warning-popup-loading">
              <span class="county-warning-light-spinner" aria-hidden="true"></span>
              <span>数据加载中...</span>
            </div>
            <p v-else-if="props.popupError" class="county-warning-popup-empty">{{ props.popupError }}</p>
            <p v-else-if="props.popupEvents.length === 0" class="county-warning-popup-empty">当前暂无人数数据</p>
            <template v-else>
              <div class="county-warning-bar-chart" aria-label="区域警示灯人数柱状图">
                <div class="county-warning-chart-y-axis">
                  <span>人数</span>
                </div>
                <div class="county-warning-chart-plot">
                  <div class="county-warning-chart-grid" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div
                    v-for="bar in popupChartBars"
                    :key="bar.key"
                    class="county-warning-chart-bar-item"
                    :class="`is-${bar.key}`"
                  >
                    <strong>{{ bar.count }}</strong>
                    <span class="county-warning-chart-bar-track">
                      <span
                        class="county-warning-chart-bar-fill"
                        :style="{ height: `${bar.percent}%`, minHeight: bar.count > 0 ? '2px' : '0' }"
                      ></span>
                    </span>
                    <em>{{ bar.label }}</em>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </teleport>
  </article>
</template>

