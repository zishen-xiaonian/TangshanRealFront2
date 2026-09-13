<script setup>
import '../style.css'
import { computed, ref, watch } from 'vue'
import WorkOrderDataExportButton from './WorkOrderDataExportButton.vue'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  selectedRegion: {
    type: String,
    default: '全部',
  },
  title: {
    type: String,
    default: '空间分布',
  },
  importantLabel: {
    type: String,
    default: '重点用户户数',
  },
  sensitiveLabel: {
    type: String,
    default: '敏感用户户数',
  },
  detailRows: {
    type: Array,
    default: () => [],
  },
  tableRows: {
    type: Array,
    default: () => [],
  },
  tableTotal: {
    type: Number,
    default: 0,
  },
  summaryStats: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  overviewLoading: {
    type: Boolean,
    default: false,
  },
  equipmentStatsLoading: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['open-detail-page', 'go-detail-page', 'close-detail-page', 'select-top-device'])

const toCount = (value) => Math.max(0, Number(value) || 0)
const TREND_MIN_TRACK_PERCENT = 10
const TREND_VALUE_DIGIT_WIDTH = 7
const TREND_VALUE_INLINE_PADDING = 8
const TREND_VALUE_MIN_WIDTH = 18

const getTrendValueMinWidth = (count) => {
  if (count <= 0) {
    return 0
  }

  return Math.max(String(count).length * TREND_VALUE_DIGIT_WIDTH + TREND_VALUE_INLINE_PADDING, TREND_VALUE_MIN_WIDTH)
}

const normalizedRows = computed(() =>
  props.rows.map((item, index) => {
    const name = String(item?.name || item?.label || '').trim() || `数据${index + 1}`
    const importantCount = toCount(item?.importantCount ?? item?.important)
    const sensitiveCount = toCount(item?.sensitiveCount ?? item?.sensitive)
    return {
      name,
      importantCount,
      sensitiveCount,
    }
  }),
)

const maxImportantCount = computed(() =>
  normalizedRows.value.reduce((max, item) => Math.max(max, item.importantCount), 0),
)
const maxSensitiveCount = computed(() =>
  normalizedRows.value.reduce((max, item) => Math.max(max, item.sensitiveCount), 0),
)

const displayRows = computed(() => {
  const importantBase = maxImportantCount.value || 1
  const sensitiveBase = maxSensitiveCount.value || 1
  return normalizedRows.value.map((item) => {
    return {
      ...item,
      importantTrackPercent: item.importantCount > 0
        ? Math.max((item.importantCount / importantBase) * 100, TREND_MIN_TRACK_PERCENT)
        : 0,
      sensitiveTrackPercent: item.sensitiveCount > 0
        ? Math.max((item.sensitiveCount / sensitiveBase) * 100, TREND_MIN_TRACK_PERCENT)
        : 0,
    }
  })
})

const combinedDisplayRows = computed(() =>
  [...displayRows.value].sort((a, b) =>
    Math.max(b.importantCount, b.sensitiveCount) - Math.max(a.importantCount, a.sensitiveCount) ||
      b.importantCount - a.importantCount ||
      b.sensitiveCount - a.sensitiveCount,
  ),
)

const emptyText = computed(() => '')

const buildSingleBarStyle = (percent, count) => {
  if (count <= 0 || percent <= 0) {
    return {
      width: '0%',
      minWidth: '0px',
    }
  }

  return {
    width: `${percent}%`,
    minWidth: `${getTrendValueMinWidth(count)}px`,
  }
}

const detailPageVisible = ref(false)
const detailModalVisible = ref(false)
const selectedDetailRow = ref(null)
const detailModalLoading = ref(false)
const detailModalError = ref('')
const detailModalRequestId = ref(0)
const selectedTopDeviceId = ref('')
const DETAIL_PAGE_SIZE = 10
const DETAIL_PAGE_MAX_BUTTONS = 5
const detailCurrentPage = ref(1)
const detailJumpPageInput = ref('')

const normalizeEquipmentRows = (rows) =>
  rows.map((item, index) => {
    const equipmentId = String(item?.equipmentId || item?.deviceNo || '').trim() || '-'
    const equipmentType = String(item?.equipmentType || item?.equipment_type || item?.type || '').trim()
    const deviceNo = String(item?.deviceNo || item?.equipmentId || '').trim() || '-'
    const deviceName = String(item?.deviceName || item?.equipmentName || '').trim() || '-'
    const importantUserCount = toCount(item?.importantUserCount ?? item?.keyUsersCnt ?? item?.keyUsers)
    const sensitiveUserCount = toCount(
      item?.sensitiveUserCount ?? item?.senUsersCnt ?? item?.sensitiveUsersCnt ?? item?.sensitiveUsers,
    )
    const outageEventCount = toCount(item?.outageEventCount ?? item?.outageCount)
    const totalUserCountSource = item?.allUsersCnt ?? item?.totalUserCount
    const totalUserCount = totalUserCountSource == null
      ? importantUserCount + sensitiveUserCount
      : toCount(totalUserCountSource)
    const importantUserList = Array.isArray(item?.importantUserList) ? item.importantUserList : []
    const sensitiveUserList = Array.isArray(item?.sensitiveUserList) ? item.sensitiveUserList : []

    return {
      id: String(item?.key || `${deviceNo}-${deviceName}-${index}`),
      equipmentId,
      equipmentType,
      deviceNo,
      deviceName,
      importantUserCount,
      sensitiveUserCount,
      outageEventCount,
      totalUserCount,
      importantUserList,
      sensitiveUserList,
    }
  })

const normalizedDetailRows = computed(() => normalizeEquipmentRows(props.detailRows))
const normalizedTableRows = computed(() => normalizeEquipmentRows(props.tableRows))

const top5RankedRows = computed(() => normalizedDetailRows.value.slice(0, 5))
const deviceImpactEmptyText = computed(() =>
  props.loading ? '数据加载中...' : '当前区域暂无设备影响用户数据。',
)
const selectedDeviceEmptyText = computed(() =>
  props.loading ? '数据加载中...' : '暂无设备数据。',
)

const detailTotalPages = computed(() => Math.max(Math.ceil(props.tableTotal / DETAIL_PAGE_SIZE), 1))

const pagedDetailRows = computed(() => normalizedTableRows.value)

const spaceDetailExportRows = computed(() =>
  pagedDetailRows.value.map((item) => ({
    设备编号: item.deviceNo,
    设备名称: item.deviceName,
    重点用户数: item.importantUserCount,
    敏感用户数: item.sensitiveUserCount,
    总户数: item.totalUserCount,
  })),
)

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

const topDeviceMaxImpact = computed(() =>
  top5RankedRows.value.reduce((max, item) => Math.max(max, item.totalUserCount), 0),
)

const selectedTopDevice = computed(() => {
  if (!selectedTopDeviceId.value) {
    return top5RankedRows.value[0] || null
  }

  return top5RankedRows.value.find((item) => item.id === selectedTopDeviceId.value) || top5RankedRows.value[0] || null
})

const summaryStats = computed(() => {
  if (props.summaryStats && typeof props.summaryStats === 'object') {
    return {
      affectedDeviceCount: toCount(props.summaryStats.affectedDeviceCount ?? props.summaryStats.equipmentCount),
      importantUserTotal: toCount(props.summaryStats.importantUserTotal ?? props.summaryStats.keyUsersCnt),
      sensitiveUserTotal: toCount(props.summaryStats.sensitiveUserTotal ?? props.summaryStats.sensitiveUsersCnt),
    }
  }

  const rows = normalizedDetailRows.value
  const affectedDeviceCount = rows.length
  const importantUserTotal = rows.reduce((sum, item) => sum + item.importantUserCount, 0)
  const sensitiveUserTotal = rows.reduce((sum, item) => sum + item.sensitiveUserCount, 0)

  return {
    affectedDeviceCount,
    importantUserTotal,
    sensitiveUserTotal,
  }
})

watch(
  top5RankedRows,
  (rows) => {
    if (rows.length === 0) {
      selectedTopDeviceId.value = ''
      return
    }

    const exists = rows.some((item) => item.id === selectedTopDeviceId.value)
    if (!exists) {
      selectedTopDeviceId.value = rows[0].id
    }
  },
  { immediate: true },
)

watch(
  detailTotalPages,
  (total) => {
    if (detailCurrentPage.value > total) {
      detailCurrentPage.value = total
    }
  },
  { immediate: true },
)

const openDetailPage = () => {
  detailPageVisible.value = true
  detailCurrentPage.value = 1
  detailJumpPageInput.value = ''
  emit('open-detail-page')
}

const closeDetailPage = () => {
  detailPageVisible.value = false
  detailModalVisible.value = false
  detailModalLoading.value = false
  detailModalError.value = ''
  selectedDetailRow.value = null
  detailModalRequestId.value += 1
  detailCurrentPage.value = 1
  detailJumpPageInput.value = ''
  emit('close-detail-page')
}

const openDetailModal = (item) => {
  const equipmentId = String(item?.equipmentId || item?.deviceNo || '').trim()
  selectedDetailRow.value = {
    ...(item || {}),
    equipmentId: equipmentId || '-',
    deviceNo: String(item?.deviceNo || equipmentId || '').trim() || '-',
    deviceName: String(item?.deviceName || '').trim() || '-',
    importantUserCount: toCount(item?.importantUserCount),
    sensitiveUserCount: toCount(item?.sensitiveUserCount),
    totalUserCount: toCount(item?.totalUserCount ?? item?.allUsersCnt),
    importantUserList: Array.isArray(item?.importantUserList) ? item.importantUserList : [],
    sensitiveUserList: Array.isArray(item?.sensitiveUserList) ? item.sensitiveUserList : [],
  }
  emit('select-top-device', selectedDetailRow.value)
  detailModalVisible.value = true
  detailModalLoading.value = false
  detailModalError.value = ''
}

const closeDetailModal = () => {
  detailModalVisible.value = false
  detailModalLoading.value = false
  detailModalError.value = ''
  selectedDetailRow.value = null
  detailModalRequestId.value += 1
}

const selectTopDevice = (item) => {
  selectedTopDeviceId.value = item?.id || ''
  emit('select-top-device', item || null)
}

const goDetailPage = (page) => {
  if (!Number.isFinite(page)) {
    return
  }
  const targetPage = Math.max(1, Math.min(detailTotalPages.value, Math.round(page)))
  detailCurrentPage.value = targetPage
  detailJumpPageInput.value = ''
  emit('go-detail-page', targetPage)
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
  goDetailPage(parsed)
}

const buildTopBarStyle = (totalCount) => {
  if (totalCount <= 0 || topDeviceMaxImpact.value <= 0) {
    return { width: '0%' }
  }

  return {
    width: `${(totalCount / topDeviceMaxImpact.value) * 100}%`,
  }
}

const formatPercent = (value) => `${value.toFixed(1)}%`
</script>

<template>
  <section
    class="key-user-time-trend-card module-clickable space-distribution-card"
    role="button"
    tabindex="0"
    @click="!detailPageVisible && openDetailPage()"
    @keydown.enter.prevent="!detailPageVisible && openDetailPage()"
    @keydown.space.prevent="!detailPageVisible && openDetailPage()"
  >
    <header class="trend-head">
      <h4>{{ props.title }}</h4>
      <div class="trend-legend" aria-label="图例">
        <span class="trend-legend-item important">
          <i aria-hidden="true"></i>
          {{ props.importantLabel }}
        </span>
        <span class="trend-legend-item sensitive">
          <i aria-hidden="true"></i>
          {{ props.sensitiveLabel }}
        </span>
      </div>
    </header>

    <div class="trend-chart-wrap space-trend-chart-wrap">
      <div v-if="displayRows.length > 0" class="space-split-chart">
        <div v-for="row in combinedDisplayRows" :key="row.name" class="space-split-row">
          <div class="trend-row-name" :title="row.name">{{ row.name }}</div>
          <div class="trend-row-bars">
            <div class="trend-row-track">
              <div
                class="trend-row-single-bar important"
                :style="buildSingleBarStyle(row.importantTrackPercent, row.importantCount)"
              >
                <span v-if="row.importantCount > 0" class="trend-row-value">{{ row.importantCount }}</span>
              </div>
            </div>
          </div>
          <span class="space-split-gap" aria-hidden="true"></span>
          <div class="trend-row-bars">
            <div class="trend-row-track">
              <div
                class="trend-row-single-bar sensitive"
                :style="buildSingleBarStyle(row.sensitiveTrackPercent, row.sensitiveCount)"
              >
                <span v-if="row.sensitiveCount > 0" class="trend-row-value">{{ row.sensitiveCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="props.overviewLoading" class="trend-empty space-overview-loading">
        <span class="space-loading-spinner" aria-hidden="true"></span>
        <span>数据加载中...</span>
      </div>

      <div v-else class="trend-empty">{{ emptyText }}</div>
    </div>

    <section v-if="detailPageVisible" class="card key-user-detail-layer" @click.stop>
      <header class="key-user-detail-layer-head">
        <h3>空间分布</h3>
        <button type="button" class="user-detail-close" @click.stop="closeDetailPage">×</button>
      </header>

      <div class="space-detail-layout">
        <section class="space-summary-panel">
          <h4>设备影响摘要</h4>
          <div class="space-summary-grid">
            <article class="space-summary-item">
              <p>影响设备数</p>
              <strong v-if="props.equipmentStatsLoading" class="space-summary-loading-text">数据加载中...</strong>
              <strong v-else>{{ summaryStats.affectedDeviceCount }}</strong>
            </article>
            <article class="space-summary-item">
              <p>影响重点用户数</p>
              <strong v-if="props.equipmentStatsLoading" class="space-summary-loading-text">数据加载中...</strong>
              <strong v-else>{{ summaryStats.importantUserTotal }}</strong>
            </article>
            <article class="space-summary-item">
              <p>影响敏感用户数</p>
              <strong v-if="props.equipmentStatsLoading" class="space-summary-loading-text">数据加载中...</strong>
              <strong v-else>{{ summaryStats.sensitiveUserTotal }}</strong>
            </article>
          </div>
        </section>

        <section class="space-rank-detail-row">
          <article class="space-rank-card">
            <h4>Top5 影响排行</h4>
            <ul v-if="top5RankedRows.length > 0" class="space-rank-list">
              <li v-for="(item, index) in top5RankedRows" :key="item.id">
                <button
                  type="button"
                  class="space-rank-item"
                  :class="{ active: selectedTopDevice && selectedTopDevice.id === item.id }"
                  @click.stop="selectTopDevice(item)"
                >
                  <div class="space-rank-item-head">
                    <span class="space-rank-no">{{ index + 1 }}</span>
                    <span class="space-rank-name" :title="item.deviceName">{{ item.deviceName }}</span>
                    <span class="space-rank-count">{{ item.totalUserCount }}</span>
                  </div>
                  <span class="space-rank-bar-bg">
                    <span class="space-rank-bar-fill" :style="buildTopBarStyle(item.totalUserCount)"></span>
                  </span>
                </button>
              </li>
            </ul>
            <p v-else class="empty-tip">{{ deviceImpactEmptyText }}</p>
          </article>

          <article class="space-selected-card">
            <h4>设备详情</h4>
            <div v-if="selectedTopDevice" class="space-selected-fields">
              <p class="space-selected-field-stack">
                <span>设备编号：</span>
                <strong>{{ selectedTopDevice.deviceNo }}</strong>
              </p>
              <p class="space-selected-field-stack">
                <span>设备名称：</span>
                <strong>{{ selectedTopDevice.deviceName }}</strong>
              </p>
              <p><span>重点用户数：</span>{{ selectedTopDevice.importantUserCount }}</p>
              <p><span>敏感用户数：</span>{{ selectedTopDevice.sensitiveUserCount }}</p>
              <p><span>影响用户总数：</span>{{ selectedTopDevice.totalUserCount }}</p>
            </div>
            <p v-else class="empty-tip">{{ selectedDeviceEmptyText }}</p>
          </article>
        </section>

        <section class="space-detail-table-row key-user-table-module user-detail-table-module">
          <div class="space-detail-export-bar">
            <WorkOrderDataExportButton :rows="spaceDetailExportRows" filename="空间分布详情.xlsx" sheet-name="空间分布" />
          </div>
          <div class="space-detail-grid-wrap key-user-grid-wrap user-detail-grid-wrap">
            <ul class="key-user-grid-body user-detail-grid-body">
              <li class="key-user-grid user-detail-grid user-detail-grid-head">
                <span>设备编号</span>
                <span>设备名称</span>
                <span>重点用户数</span>
                <span>敏感用户数</span>
                <span>总户数</span>
                <span>详情</span>
              </li>
              <li
                v-for="item in props.loading ? [] : pagedDetailRows"
                :key="item.id"
                class="key-user-grid user-detail-grid user-detail-grid-row"
              >
                <span class="user-detail-cell" :title="item.deviceNo">{{ item.deviceNo }}</span>
                <span class="user-detail-cell" :title="item.deviceName">{{ item.deviceName }}</span>
                <span class="user-detail-cell">{{ item.importantUserCount }}</span>
                <span class="user-detail-cell">{{ item.sensitiveUserCount }}</span>
                <span class="user-detail-cell">{{ item.totalUserCount }}</span>
                <button type="button" class="detail-btn" @click.stop="openDetailModal(item)">详情</button>
              </li>
            </ul>

            <p v-if="props.loading || normalizedTableRows.length === 0" class="empty-tip">{{ deviceImpactEmptyText }}</p>
          </div>

          <footer class="user-detail-pagination" v-if="props.tableTotal > 0">
            <button
              v-for="page in detailPageButtons"
              :key="`space-detail-page-${page}`"
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
                placeholder="&#39029;&#30721;"
                @keyup.enter="jumpToDetailPage"
              />
              <button type="button" class="user-detail-page-jump-btn" @click="jumpToDetailPage">&#36339;&#36716;</button>
            </div>
          </footer>
        </section>
      </div>

      <div v-if="detailModalVisible && selectedDetailRow" class="user-detail-modal-mask" @click.self="closeDetailModal">
        <article class="user-detail-modal key-user-detail-modal">
          <button type="button" class="user-detail-modal-close" @click="closeDetailModal">×</button>
          <h4>设备影响用户详情</h4>
          <div class="user-detail-modal-content">
            <p><span>设备编号：</span>{{ selectedDetailRow.deviceNo }}</p>
            <p><span>设备名称：</span>{{ selectedDetailRow.deviceName }}</p>
            <p><span>重点用户数：</span>{{ selectedDetailRow.importantUserCount }}</p>
            <p><span>敏感用户数：</span>{{ selectedDetailRow.sensitiveUserCount }}</p>
            <p><span>总户数：</span>{{ selectedDetailRow.totalUserCount }}</p>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

