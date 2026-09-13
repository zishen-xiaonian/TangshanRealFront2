<script setup>
import { computed, ref, watch } from 'vue'
import WorkOrderDataExportButton from './WorkOrderDataExportButton.vue'
import '../style.css'

const detailVisible = ref(false)
const activeUserStation = ref('')
const activeCallStation = ref('')
const selectedWorkOrderRow = ref(null)
const workOrderSearchDraft = ref('')
const workOrderSearchKeyword = ref('')
const selectedWorkOrderStation = ref('all')
const workOrderCurrentPage = ref(1)
const workOrderPageInput = ref('')
const workOrderPageSize = 5

const workOrderRows = [
  {
    id: '95598-001',
    name: '张丽',
    station: '路北供电中心光明台区',
    calls: 18,
    phone: '138****6210',
    lastCallTime: '2026-07-01 09:16',
    appeal: '咨询复电进度',
  },
  {
    id: '95598-002',
    name: '王海',
    station: '开平供电中心东城台区',
    calls: 15,
    phone: '139****3058',
    lastCallTime: '2026-07-01 10:42',
    appeal: '反映频繁停电',
  },
  {
    id: '95598-003',
    name: '刘敏',
    station: '丰南供电中心滨河台区',
    calls: 12,
    phone: '137****8841',
    lastCallTime: '2026-06-30 16:28',
    appeal: '询问抢修安排',
  },
  {
    id: '95598-004',
    name: '赵强',
    station: '古冶供电中心林西台区',
    calls: 9,
    phone: '186****7726',
    lastCallTime: '2026-06-30 11:05',
    appeal: '反馈电压波动',
  },
  {
    id: '95598-005',
    name: '陈芳',
    station: '路南供电中心新华台区',
    calls: 7,
    phone: '155****4693',
    lastCallTime: '2026-06-29 18:31',
    appeal: '咨询计划停电',
  },
]

const sortedRows = computed(() => [...workOrderRows].sort((a, b) => b.calls - a.calls))
const totalCalls = computed(() => sortedRows.value.reduce((sum, item) => sum + item.calls, 0))
const maxCalls = computed(() => Math.max(...sortedRows.value.map((item) => item.calls), 1))

const workOrderBarColors = ['#ef4f5f', '#f59b2f', '#f3cf45', '#4f9df7', '#3dbb78']
const warmDonutColors = ['#e8525f', '#f08a38', '#f3c849', '#d96b45', '#f6a85f']
const coolDonutColors = ['#28a9e8', '#35c6d0', '#4f87ee', '#45b886', '#7a8ff2']

const stationStats = computed(() => {
  const stationMap = new Map()

  sortedRows.value.forEach((item) => {
    const current = stationMap.get(item.station) ?? {
      station: item.station,
      userCount: 0,
      callCount: 0,
    }

    current.userCount += 1
    current.callCount += item.calls
    stationMap.set(item.station, current)
  })

  return Array.from(stationMap.values())
})

const getChartRows = (valueKey, colors) => {
  const total = stationStats.value.reduce((sum, item) => sum + item[valueKey], 0)
  let start = 0

  return stationStats.value.map((item, index) => {
    const percent = total ? (item[valueKey] / total) * 100 : 0
    const row = {
      ...item,
      value: item[valueKey],
      percent,
      start,
      color: colors[index % colors.length],
    }

    start += percent
    return row
  })
}

const stationUserChartRows = computed(() => getChartRows('userCount', warmDonutColors))

const stationCallChartRows = computed(() => getChartRows('callCount', coolDonutColors))

const getDonutBackground = (rows, valueKey) => {
  const total = rows.reduce((sum, item) => sum + item[valueKey], 0)

  if (!total) {
    return 'conic-gradient(rgba(124, 166, 201, 0.24) 0% 100%)'
  }

  let start = 0
  const segments = rows.map((item) => {
    const end = start + (item[valueKey] / total) * 100
    const segment = `${item.color} ${start}% ${end}%`
    start = end
    return segment
  })

  return `conic-gradient(${segments.join(', ')})`
}

const stationUserDonutStyle = computed(() => ({
  '--work-order-detail-donut-bg': getDonutBackground(stationUserChartRows.value, 'userCount'),
}))

const stationCallDonutStyle = computed(() => ({
  '--work-order-detail-donut-bg': getDonutBackground(stationCallChartRows.value, 'callCount'),
}))

const formatPercent = (value) => `${value.toFixed(1)}%`

const stationUserCenter = computed(() => {
  const activeRow = stationUserChartRows.value.find((item) => item.station === activeUserStation.value)

  if (activeRow) {
    return {
      value: `${activeRow.userCount}户`,
      label: formatPercent(activeRow.percent),
    }
  }

  return {
    value: sortedRows.value.length,
    label: '统计用户数',
  }
})

const stationCallCenter = computed(() => {
  const activeRow = stationCallChartRows.value.find((item) => item.station === activeCallStation.value)

  if (activeRow) {
    return {
      value: `${activeRow.callCount}次`,
      label: formatPercent(activeRow.percent),
    }
  }

  return {
    value: totalCalls.value,
    label: '拨打总次数',
  }
})

const stationFilterOptions = computed(() => stationStats.value.map((item) => item.station))

const filteredWorkOrderRows = computed(() => {
  const keyword = workOrderSearchKeyword.value.trim().toLowerCase()

  return sortedRows.value.filter((item) => {
    const matchesKeyword = !keyword || String(item.id).toLowerCase().includes(keyword)
    const matchesStation = selectedWorkOrderStation.value === 'all' || item.station === selectedWorkOrderStation.value

    return matchesKeyword && matchesStation
  })
})

const exportWorkOrderRows = computed(() =>
  filteredWorkOrderRows.value.map((item) => ({
    用户编号: item.id,
    用户姓名: item.name,
    所属台区: item.station,
    近期拨打95598次数: item.calls,
  }))
)

const workOrderTotalPages = computed(() => Math.max(Math.ceil(filteredWorkOrderRows.value.length / workOrderPageSize), 1))

const workOrderPageNumbers = computed(() => {
  const total = workOrderTotalPages.value
  const visibleCount = Math.min(total, 9)
  const current = Math.min(workOrderCurrentPage.value, total)
  const start = Math.max(1, Math.min(current - Math.floor(visibleCount / 2), total - visibleCount + 1))

  return Array.from({ length: visibleCount }, (_, index) => start + index)
})

const paginatedWorkOrderRows = computed(() => {
  const current = Math.min(workOrderCurrentPage.value, workOrderTotalPages.value)
  const start = (current - 1) * workOrderPageSize

  return filteredWorkOrderRows.value.slice(start, start + workOrderPageSize)
})

const getWorkOrderRowStyle = (item, index) => ({
  '--work-order-bar-ratio': item.calls / maxCalls.value,
  '--work-order-bar-color': workOrderBarColors[index] ?? workOrderBarColors[workOrderBarColors.length - 1],
})

const applyWorkOrderSearch = () => {
  workOrderSearchKeyword.value = workOrderSearchDraft.value
}

const goToWorkOrderPage = (page) => {
  workOrderCurrentPage.value = Math.min(Math.max(Number(page) || 1, 1), workOrderTotalPages.value)
}

const jumpToWorkOrderPage = () => {
  goToWorkOrderPage(workOrderPageInput.value)
}

watch([workOrderSearchKeyword, selectedWorkOrderStation], () => {
  workOrderCurrentPage.value = 1
  workOrderPageInput.value = ''
})

const openDetail = () => {
  detailVisible.value = true
}

const closeDetail = () => {
  selectedWorkOrderRow.value = null
  detailVisible.value = false
}

const openWorkOrderRowDetail = (item) => {
  selectedWorkOrderRow.value = item
}

const closeWorkOrderRowDetail = () => {
  selectedWorkOrderRow.value = null
}
</script>

<template>
  <section
    class="sensitive-demand-module work-order-stat-module"
    role="button"
    tabindex="0"
    @click="openDetail"
    @keydown.enter.prevent="openDetail"
    @keydown.space.prevent="openDetail"
  >
    <div class="module-title-row work-order-stat-head">
      <h2>95598工单统计</h2>
      <span>近期TOP5</span>
    </div>

    <div class="work-order-stat-list">
      <article
        v-for="(item, index) in sortedRows"
        :key="item.id"
        class="work-order-stat-row"
        :style="getWorkOrderRowStyle(item, index)"
      >
        <span class="work-order-bar" aria-hidden="true"></span>
        <span class="work-order-rank">{{ index + 1 }}</span>
        <div class="work-order-user">
          <strong :title="item.name">{{ item.name }}</strong>
          <span :title="item.station">{{ item.station }}</span>
        </div>
        <div class="work-order-count">
          <strong>{{ item.calls }}</strong>
          <span>次</span>
        </div>
      </article>
    </div>
  </section>

  <section v-if="detailVisible" class="sensitive-demand-work-order-detail-page" @click.stop>
    <header class="sensitive-demand-work-order-detail-head">
      <h2>95598工单统计</h2>
      <button type="button" class="user-detail-close" @click="closeDetail">&times;</button>
    </header>

    <div class="work-order-detail-summary">
      <article>
        <span>统计用户数</span>
        <strong>{{ sortedRows.length }}</strong>
      </article>
      <article>
        <span>近期拨打总次数</span>
        <strong>{{ totalCalls }}</strong>
      </article>
    </div>

    <div class="work-order-detail-chart-grid">
      <article class="work-order-detail-chart-card" @mouseleave="activeUserStation = ''">
        <h3>统计用户数台区分布</h3>
        <div class="work-order-detail-donut warm" :style="stationUserDonutStyle">
          <svg class="work-order-detail-donut-hit-area" viewBox="0 0 100 100" aria-hidden="true">
            <circle
              v-for="item in stationUserChartRows"
              :key="`user-segment-${item.station}`"
              class="work-order-detail-donut-hit-segment"
              cx="50"
              cy="50"
              r="39.5"
              pathLength="100"
              :stroke-dasharray="`${item.percent} ${100 - item.percent}`"
              :stroke-dashoffset="-item.start"
              @mouseenter="activeUserStation = item.station"
            />
          </svg>
          <strong>{{ stationUserCenter.value }}</strong>
          <span>{{ stationUserCenter.label }}</span>
        </div>
        <div class="work-order-detail-legend">
          <div
            v-for="item in stationUserChartRows"
            :key="`user-${item.station}`"
            class="work-order-detail-legend-item"
            :class="{ active: item.station === activeUserStation }"
            @mouseenter="activeUserStation = item.station"
          >
            <i :style="{ background: item.color }"></i>
            <span :title="item.station">{{ item.station }}</span>
            <strong>{{ item.userCount }}户 / {{ formatPercent(item.percent) }}</strong>
          </div>
        </div>
      </article>

      <article class="work-order-detail-chart-card" @mouseleave="activeCallStation = ''">
        <h3>近期拨打总次数台区分布</h3>
        <div class="work-order-detail-donut cool" :style="stationCallDonutStyle">
          <svg class="work-order-detail-donut-hit-area" viewBox="0 0 100 100" aria-hidden="true">
            <circle
              v-for="item in stationCallChartRows"
              :key="`call-segment-${item.station}`"
              class="work-order-detail-donut-hit-segment"
              cx="50"
              cy="50"
              r="39.5"
              pathLength="100"
              :stroke-dasharray="`${item.percent} ${100 - item.percent}`"
              :stroke-dashoffset="-item.start"
              @mouseenter="activeCallStation = item.station"
            />
          </svg>
          <strong>{{ stationCallCenter.value }}</strong>
          <span>{{ stationCallCenter.label }}</span>
        </div>
        <div class="work-order-detail-legend">
          <div
            v-for="item in stationCallChartRows"
            :key="`call-${item.station}`"
            class="work-order-detail-legend-item"
            :class="{ active: item.station === activeCallStation }"
            @mouseenter="activeCallStation = item.station"
          >
            <i :style="{ background: item.color }"></i>
            <span :title="item.station">{{ item.station }}</span>
            <strong>{{ item.callCount }}次 / {{ formatPercent(item.percent) }}</strong>
          </div>
        </div>
      </article>
    </div>

    <form class="work-order-detail-query-bar" @submit.prevent="applyWorkOrderSearch">
      <input
        v-model="workOrderSearchDraft"
        class="work-order-detail-query-input"
        type="text"
        placeholder="输入用户编号"
      />
      <button type="submit" class="work-order-detail-query-btn">查询</button>
      <select v-model="selectedWorkOrderStation" class="work-order-detail-station-select">
        <option value="all">全部</option>
        <option v-for="station in stationFilterOptions" :key="station" :value="station">{{ station }}</option>
      </select>
      <WorkOrderDataExportButton :rows="exportWorkOrderRows" filename="95598工单统计.xlsx" />
    </form>

    <div class="work-order-detail-table-wrap">
      <div class="work-order-detail-table work-order-detail-table-head">
        <span>用户编号</span>
        <span>用户姓名</span>
        <span>所属台区</span>
        <span>近期拨打95598次数</span>
        <span>详情</span>
      </div>
      <div class="work-order-detail-table-body">
        <div v-for="item in paginatedWorkOrderRows" :key="`${item.id}-detail`" class="work-order-detail-table work-order-detail-table-row">
          <span :title="item.id">{{ item.id }}</span>
          <span :title="item.name">{{ item.name }}</span>
          <span :title="item.station">{{ item.station }}</span>
          <span>{{ item.calls }}次</span>
          <span>
            <button type="button" class="work-order-detail-btn" @click.stop="openWorkOrderRowDetail(item)">详情</button>
          </span>
        </div>
        <p v-if="filteredWorkOrderRows.length === 0" class="work-order-detail-empty">暂无匹配数据</p>
      </div>
      <footer v-if="filteredWorkOrderRows.length > 0" class="work-order-detail-pagination">
        <button
          v-for="page in workOrderPageNumbers"
          :key="`work-order-page-${page}`"
          type="button"
          class="work-order-page-btn"
          :class="{ active: page === workOrderCurrentPage }"
          @click="goToWorkOrderPage(page)"
        >
          {{ page }}
        </button>
        <input
          v-model="workOrderPageInput"
          class="work-order-page-input"
          type="number"
          min="1"
          :max="workOrderTotalPages"
          placeholder="页码"
          @keyup.enter="jumpToWorkOrderPage"
        />
        <button type="button" class="work-order-page-jump-btn" @click="jumpToWorkOrderPage">跳转</button>
      </footer>
    </div>

    <div
      v-if="selectedWorkOrderRow"
      class="work-order-row-detail-modal-mask"
      @click.self="closeWorkOrderRowDetail"
    >
      <section class="work-order-row-detail-modal">
        <header class="work-order-row-detail-modal-head">
          <h3>工单详情</h3>
          <button type="button" class="user-detail-close" @click="closeWorkOrderRowDetail">&times;</button>
        </header>
        <div class="work-order-row-detail-fields">
          <p>
            <span>用户编号：</span>
            <strong>{{ selectedWorkOrderRow.id }}</strong>
          </p>
          <p>
            <span>用户姓名：</span>
            <strong>{{ selectedWorkOrderRow.name }}</strong>
          </p>
          <p>
            <span>所属台区：</span>
            <strong>{{ selectedWorkOrderRow.station }}</strong>
          </p>
          <p>
            <span>近期拨打95598次数：</span>
            <strong>{{ selectedWorkOrderRow.calls }}次</strong>
          </p>
        </div>
      </section>
    </div>
  </section>
</template>
