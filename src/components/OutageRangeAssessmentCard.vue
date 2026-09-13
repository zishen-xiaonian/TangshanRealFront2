<script setup>
import '../style.css'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  outageSummary: {
    type: Object,
    required: true,
  },
  outageSummaryLoading: {
    type: Boolean,
    default: false,
  },
  outageRangeChains: {
    type: Array,
    required: true,
  },
  outageRangeTotal: {
    type: Number,
    default: 0,
  },
  outageRangeCurrentPage: {
    type: Number,
    default: 1,
  },
  outageRangeLoading: {
    type: Boolean,
    default: false,
  },
  showOutageRangeAssessmentPage: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'open-outage-range-detail',
  'go-outage-range-page',
  'close-outage-range-detail',
  'open-outage-range-chain-detail',
])

const OUTAGE_RANGE_DEFAULT_PAGE_SIZE = 4
const OUTAGE_RANGE_MAX_PAGE_BUTTONS = 6

const outageRangeJumpPageInput = ref('')
const outageRangeDetailVisible = ref(false)
const selectedOutageRangeChain = ref(null)

const openDetailPage = () => {
  emit('open-outage-range-detail')
}

const outageRangeTotalPages = computed(() => {
  const total = Math.max(Number(props.outageRangeTotal || 0), 0)
  if (total <= 0) {
    return 1
  }
  return Math.ceil(total / OUTAGE_RANGE_DEFAULT_PAGE_SIZE)
})

const outageRangeRenderedRows = computed(() => OUTAGE_RANGE_DEFAULT_PAGE_SIZE)

const outageRangePageButtons = computed(() => {
  const total = outageRangeTotalPages.value
  if (total <= OUTAGE_RANGE_MAX_PAGE_BUTTONS) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const half = Math.floor(OUTAGE_RANGE_MAX_PAGE_BUTTONS / 2)
  let start = props.outageRangeCurrentPage - half
  let end = props.outageRangeCurrentPage + half

  if (start < 1) {
    start = 1
    end = OUTAGE_RANGE_MAX_PAGE_BUTTONS
  }

  if (end > total) {
    end = total
    start = total - OUTAGE_RANGE_MAX_PAGE_BUTTONS + 1
  }

  const pages = []
  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }
  return pages
})

const goOutageRangePage = (page) => {
  if (page < 1 || page > outageRangeTotalPages.value) {
    return
  }
  emit('go-outage-range-page', page)
}

const updateOutageRangeJumpPageInput = (event) => {
  outageRangeJumpPageInput.value = event?.target?.value || ''
}

const jumpToOutageRangePage = () => {
  const input = String(outageRangeJumpPageInput.value ?? '').trim()
  if (!input) {
    return
  }

  const parsed = Number(input)
  if (!Number.isFinite(parsed)) {
    return
  }

  const target = Math.min(outageRangeTotalPages.value, Math.max(1, Math.round(parsed)))
  goOutageRangePage(target)
  outageRangeJumpPageInput.value = String(target)
}

const openOutageRangeChainDetail = (item) => {
  selectedOutageRangeChain.value = item || null
  outageRangeDetailVisible.value = true
  emit('open-outage-range-chain-detail', item || null)
}

const closeOutageRangeChainDetail = () => {
  outageRangeDetailVisible.value = false
  selectedOutageRangeChain.value = null
}

watch(
  () => props.showOutageRangeAssessmentPage,
  (visible) => {
    if (visible) {
      outageRangeJumpPageInput.value = ''
    } else {
      closeOutageRangeChainDetail()
    }
  },
  { immediate: true },
)
</script>

<template>
  <article
    class="module-block module-clickable outage-range-summary-block"
    role="button"
    tabindex="0"
    @click="openDetailPage"
    @keydown.enter.prevent="openDetailPage"
    @keydown.space.prevent="openDetailPage"
  >
    <h3>停电范围评估</h3>
    <div class="summary-grid">
      <div class="summary-card">
        <p>受影响线路数</p>
        <strong v-if="props.outageSummaryLoading" class="outage-summary-loading">
          <span class="outage-summary-spinner" aria-hidden="true"></span>
          <span>数据加载中...</span>
        </strong>
        <strong v-else>{{ props.outageSummary.affectedLines }}</strong>
      </div>
      <div class="summary-card">
        <p>受影响变电站数</p>
        <strong v-if="props.outageSummaryLoading" class="outage-summary-loading">
          <span class="outage-summary-spinner" aria-hidden="true"></span>
          <span>数据加载中...</span>
        </strong>
        <strong v-else>{{ props.outageSummary.affectedSubstations }}</strong>
      </div>
    </div>
  </article>

  <section v-if="props.showOutageRangeAssessmentPage" class="card outage-range-assessment-layer">
    <header class="outage-range-assessment-layer-head">
      <h3>停电范围评估</h3>
      <button type="button" class="outage-range-assessment-close" @click="emit('close-outage-range-detail')">×</button>
    </header>

    <p v-if="props.outageRangeLoading" class="empty-tip">数据加载中...</p>

    <section v-else-if="props.outageRangeChains.length > 0" class="outage-range-chain-content">
      <section
        class="outage-range-chain-list"
        :style="{ '--outage-range-rows': String(outageRangeRenderedRows) }"
      >
        <article
          v-for="(item, index) in props.outageRangeChains"
          :key="item.key"
          class="outage-range-chain-card"
          role="button"
          tabindex="0"
          @click="openOutageRangeChainDetail(item)"
          @keydown.enter.prevent="openOutageRangeChainDetail(item)"
          @keydown.space.prevent="openOutageRangeChainDetail(item)"
        >
          <h4 class="outage-range-chain-title">
            线路编号：{{ item.outageNumber }}
          </h4>
          <p class="outage-range-chain-meta">
            <span class="outage-range-meta-label">线路名称：</span>{{ item.lineName || '-' }}
          </p>
          <p class="outage-range-chain-meta outage-range-scope-text">
            <span class="outage-range-meta-label">停电范围：</span>
            <span class="outage-range-scope-value">{{ item.importantUserText }}</span>
          </p>
          <div class="outage-range-chain-actions">
            <button type="button" class="detail-btn" @click.stop="openOutageRangeChainDetail(item)">详情</button>
          </div>
        </article>
      </section>

      <footer class="user-detail-pagination outage-range-pagination">
        <span class="outage-range-page-state">第 {{ props.outageRangeCurrentPage }} / {{ outageRangeTotalPages }} 页</span>
        <button
          v-for="page in outageRangePageButtons"
          :key="`outage-range-page-${page}`"
          type="button"
          class="page-btn"
          :class="{ active: page === props.outageRangeCurrentPage }"
          @click="goOutageRangePage(page)"
        >
          {{ page }}
        </button>

        <div class="outage-detail-page-jump">
          <input
            :value="outageRangeJumpPageInput"
            type="number"
            min="1"
            :max="outageRangeTotalPages"
            class="outage-detail-page-input"
            placeholder="页码"
            @input="updateOutageRangeJumpPageInput"
            @keyup.enter="jumpToOutageRangePage"
          />
          <button type="button" class="outage-detail-page-jump-btn" @click="jumpToOutageRangePage">跳转</button>
        </div>
      </footer>
    </section>

    <p v-else class="empty-tip">当前暂无链路影响用户数据。</p>

    <section
      v-if="outageRangeDetailVisible && selectedOutageRangeChain"
      class="user-detail-modal-mask"
      @click.self="closeOutageRangeChainDetail"
    >
      <article class="user-detail-modal outage-range-detail-modal">
        <button type="button" class="user-detail-modal-close" @click="closeOutageRangeChainDetail">×</button>
        <h4>链路详情</h4>
        <div class="user-detail-modal-content">
          <p><span>线路编号：</span>{{ selectedOutageRangeChain.outageNumber || '-' }}</p>
          <p><span>线路名称：</span>{{ selectedOutageRangeChain.lineName || '-' }}</p>
          <p><span>停电范围：</span>{{ selectedOutageRangeChain.importantUserText || '无' }}</p>
        </div>
      </article>
    </section>
  </section>
</template>

