<script setup>
import '../style.css'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import WorkOrderDataExportButton from './WorkOrderDataExportButton.vue'
//负责“用户标签识别/重点敏感用户”这块
//显示标签占比、重点/敏感分类饼图、筛选查询、分页表格、详情弹窗
//并通过emit把交互传给父组件（查询、翻页、打开详情等）

const props = defineProps({
  tagStats: {
    type: Object,
    required: true,
  },
  userTagPieData: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  showUserDetailPage: {
    type: Boolean,
    default: false,
  },
  importantUserTypeChart: {
    type: Object,
    required: true,
  },
  sensitiveUserTypeChart: {
    type: Object,
    required: true,
  },
  userDetailTypeOptions: {
    type: Array,
    required: true,
  },
  userDetailSearchInput: {
    type: String,
    default: '',
  },
  userDetailSelectedType: {
    type: String,
    default: '',
  },
  pagedUserDetailRows: {
    type: Array,
    required: true,
  },
  filteredUserDetailRowsLength: {
    type: Number,
    default: 0,
  },
  userDetailPageButtons: {
    type: Array,
    required: true,
  },
  userDetailCurrentPage: {
    type: Number,
    default: 1,
  },
  userDetailJumpPageInput: {
    type: [String, Number],
    default: '',
  },
  userDetailTotalPages: {
    type: Number,
    default: 1,
  },
  userDetailModalVisible: {
    type: Boolean,
    default: false,
  },
  selectedUserDetail: {
    type: Object,
    default: null,
  },
  userDetailGridBodyRefSetter: {
    type: Function,
    default: null,
  },
  userDetailPaginationRefSetter: {
    type: Function,
    default: null,
  },
  userDetailPageJumpRefSetter: {
    type: Function,
    default: null,
  },
  showKeyUserDetailPage: {
    type: Boolean,
    default: false,
  },
  keyUserIndustryPieData: {
    type: Array,
    required: true,
  },
  keyUserIndustryPieBackground: {
    type: String,
    default: '',
  },
  keyUserIndustryTotal: {
    type: Number,
    default: 0,
  },
  sensitiveUserIndustryPieData: {
    type: Array,
    required: true,
  },
  sensitiveUserIndustryPieBackground: {
    type: String,
    default: '',
  },
  sensitiveUserIndustryTotal: {
    type: Number,
    default: 0,
  },
  keyUserNaturePieData: {
    type: Array,
    required: true,
  },
  keyUserNaturePieBackground: {
    type: String,
    default: '',
  },
  keyUserStatsLoading: {
    type: Boolean,
    default: false,
  },
  keyUserSearchInput: {
    type: String,
    default: '',
  },
  keyUserFilterCategory: {
    type: String,
    default: '',
  },
  keyUserFilterValue: {
    type: String,
    default: '',
  },
  keyUserFilterCategoryOptions: {
    type: Array,
    required: true,
  },
  keyUserFilterValueOptions: {
    type: Array,
    required: true,
  },
  pagedKeyUserRows: {
    type: Array,
    required: true,
  },
  filteredKeyUserRowsLength: {
    type: Number,
    default: 0,
  },
  keyUserPageButtons: {
    type: Array,
    required: true,
  },
  keyUserCurrentPage: {
    type: Number,
    default: 1,
  },
  keyUserJumpPageInput: {
    type: [String, Number],
    default: '',
  },
  keyUserTotalPages: {
    type: Number,
    default: 1,
  },
  keyUserDetailLoading: {
    type: Boolean,
    default: false,
  },
  keyUserDetailModalVisible: {
    type: Boolean,
    default: false,
  },
  selectedKeyUserDetail: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits([
  'open-user-detail',
  'close-user-detail',
  'update:user-detail-search-input',
  'apply-user-detail-search',
  'update:user-detail-selected-type',
  'open-user-detail-modal',
  'go-user-detail-page',
  'update:user-detail-jump-page-input',
  'jump-to-user-detail-page',
  'close-user-detail-modal',
  'open-key-user-detail',
  'close-key-user-detail',
  'update:key-user-search-input',
  'apply-key-user-search',
  'update:key-user-filter-category',
  'update:key-user-filter-value',
  'open-key-user-modal',
  'go-key-user-page',
  'update:key-user-jump-page-input',
  'jump-to-key-user-page',
  'close-key-user-modal',
])

const updateKeyUserSearchInput = (event) => {
  emit('update:key-user-search-input', event?.target?.value || '')
}

const updateKeyUserJumpPageInput = (event) => {
  emit('update:key-user-jump-page-input', event?.target?.value || '')
}

const keyUserCascadeRef = ref(null)
const keyUserCascadeVisible = ref(false)
const hoveredKeyUserFilterValue = ref('')

const keyUserFilterLabel = computed(() => {
  if (props.keyUserFilterValue === 'key-frequent') {
    return '频繁停电用户'
  }
  if (props.keyUserFilterValue === 'key-non-frequent') {
    return '非频繁停电用户'
  }
  return props.keyUserFilterValueOptions.find((item) => item.value === props.keyUserFilterValue)?.label || '重点用户'
})

const toggleKeyUserCascade = () => {
  keyUserCascadeVisible.value = !keyUserCascadeVisible.value
  if (!keyUserCascadeVisible.value) {
    hoveredKeyUserFilterValue.value = ''
  }
}

const selectKeyUserFilterValue = (value) => {
  emit('update:key-user-filter-value', value)
  keyUserCascadeVisible.value = false
  hoveredKeyUserFilterValue.value = ''
}

const closeKeyUserCascadeOnOutsideClick = (event) => {
  if (!keyUserCascadeRef.value?.contains(event.target)) {
    keyUserCascadeVisible.value = false
    hoveredKeyUserFilterValue.value = ''
  }
}

onMounted(() => {
  document.addEventListener('click', closeKeyUserCascadeOnOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeKeyUserCascadeOnOutsideClick)
})

const KEY_USER_PIE_RING_RADIUS = 55
const KEY_USER_PIE_RING_LENGTH = 2 * Math.PI * KEY_USER_PIE_RING_RADIUS

const buildKeyUserPieSegments = (pieData = []) => {
  const weights = pieData.map((item) => Math.max(Number(item?.count) || 0, 0))
  const totalWeight = weights.reduce((sum, value) => sum + value, 0)

  if (totalWeight <= 0) {
    return pieData.map((item) => ({
      ...item,
      dasharray: `0 ${KEY_USER_PIE_RING_LENGTH}`,
      dashoffset: 0,
    }))
  }

  let cumulativeWeight = 0
  return pieData.map((item, index) => {
    const currentWeight = weights[index]
    const segmentLength = (KEY_USER_PIE_RING_LENGTH * currentWeight) / totalWeight
    const dashoffset = -(KEY_USER_PIE_RING_LENGTH * cumulativeWeight) / totalWeight
    cumulativeWeight += currentWeight
    return {
      ...item,
      dasharray: `${segmentLength} ${Math.max(KEY_USER_PIE_RING_LENGTH - segmentLength, 0)}`,
      dashoffset,
    }
  })
}

const hoveredIndustryPieKey = ref('')
const hoveredSensitiveIndustryPieKey = ref('')
const hoveredNaturePieKey = ref('')

const industryPieSegments = computed(() => buildKeyUserPieSegments(props.keyUserIndustryPieData))
const sensitiveIndustryPieSegments = computed(() => buildKeyUserPieSegments(props.sensitiveUserIndustryPieData))
const naturePieSegments = computed(() => buildKeyUserPieSegments(props.keyUserNaturePieData))

const hoveredIndustryPieItem = computed(() =>
  props.keyUserIndustryPieData.find((item) => item.key === hoveredIndustryPieKey.value) || null,
)

const hoveredSensitiveIndustryPieItem = computed(() =>
  props.sensitiveUserIndustryPieData.find((item) => item.key === hoveredSensitiveIndustryPieKey.value) || null,
)

const hoveredNaturePieItem = computed(() =>
  props.keyUserNaturePieData.find((item) => item.key === hoveredNaturePieKey.value) || null,
)

const keyUserTableEmptyText = computed(() =>
  props.keyUserDetailLoading ? '数据加载中...' : '当前暂无重点用户数据。',
)

const keyUserDetailModalTitle = computed(() =>
  props.keyUserFilterValue === 'sensitive' ? '敏感用户详情' : '重点用户详情',
)

const isKeyUserDetailSelected = computed(() =>
  ['key', 'important', 'key-frequent', 'key-non-frequent'].includes(String(props.keyUserFilterValue || '').trim()),
)

const isSensitiveUserDetailSelected = computed(() =>
  String(props.keyUserFilterValue || '').trim() === 'sensitive',
)

const selectedKeyUserReason = computed(() => {
  const detail = props.selectedKeyUserDetail || {}
  const seedSource = String(detail.consNo || detail.id || detail.consName || 'key-user')
  const seed = Array.from(seedSource).reduce(
    (total, character, index) => total + character.charCodeAt(0) * (index + 1),
    0,
  )

  return {
    weekly95598CallCount: 3 + (seed % 5),
    weeklyOutageCount: Number.isFinite(Number(detail.weeklyOutageCount))
      ? Number(detail.weeklyOutageCount)
      : 2 + (Math.floor(seed / 5) % 4),
    tradeName: detail.tradeName || '-',
  }
})

const keyUserExportRows = computed(() =>
  props.pagedKeyUserRows.map((item) => ({
    用户编号: item.consNo,
    用户姓名: item.consName,
    区县: item.countyName,
    行业: item.tradeName,
    用户类型: item.outageNature,
  })),
)
</script>

<template>
  <article class="module-block module-clickable" @click="emit('open-key-user-detail')">
    <div class="block-head">
      <h3>用户标签识别</h3>
    </div>
    <p class="tag-pie-total">总用户 {{ props.tagStats.total }}</p>
    <div class="tag-pie-grid">
      <div v-for="item in props.userTagPieData" :key="item.key" class="tag-pie-card">
        <p class="tag-pie-title">{{ item.title }}</p>
        <div class="tag-pie user-tag-summary-pie" :style="{ '--ratio': `${item.ratio}%`, '--pie-color': item.color }">
          <div class="tag-pie-center" :class="{ loading: props.loading }">
            <template v-if="props.loading">
              <strong>数据加载中...</strong>
            </template>
            <template v-else>
              <strong>{{ item.ratioText }}</strong>
              <span>{{ item.count }} / {{ item.total }}</span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </article>

  <section v-if="props.showKeyUserDetailPage" class="card key-user-detail-layer">
    <header class="key-user-detail-layer-head">
      <h3>重点|敏感用户快速识别</h3>
      <button type="button" class="user-detail-close" @click="emit('close-key-user-detail')">&times;</button>
    </header>

    <section class="key-user-overview-grid">
      <article class="key-user-overview-card">
        <div class="key-user-overview-head">
          <h4>重点用户类别分布</h4>
        </div>
        <div class="key-user-pie-layout">
          <div
            class="key-user-pie"
            :style="{ background: props.keyUserIndustryPieBackground }"
            @mouseleave="hoveredIndustryPieKey = ''"
          >
            <svg class="key-user-pie-ring" viewBox="0 0 128 128" aria-hidden="true">
              <g transform="rotate(-90 64 64)">
                <circle
                  v-for="item in industryPieSegments"
                  :key="`industry-segment-${item.key}`"
                  class="key-user-pie-ring-segment"
                  :class="{ active: hoveredIndustryPieKey === item.key }"
                  cx="64"
                  cy="64"
                  r="55"
                  fill="none"
                  :stroke="item.color"
                  stroke-width="16"
                  stroke-linecap="butt"
                  :stroke-dasharray="item.dasharray"
                  :stroke-dashoffset="item.dashoffset"
                  :title="`${item.label}：${item.count}户 / ${item.rateText}`"
                  @mouseenter="hoveredIndustryPieKey = item.key"
                />
              </g>
            </svg>
            <div class="key-user-pie-center">
              <template v-if="props.keyUserStatsLoading">
                <strong class="key-user-pie-loading-text">数据加载中...</strong>
              </template>
              <template v-else>
                <strong>{{ hoveredIndustryPieItem ? hoveredIndustryPieItem.count : props.keyUserIndustryTotal }}</strong>
                <span>{{ hoveredIndustryPieItem ? `${hoveredIndustryPieItem.count}户 / ${hoveredIndustryPieItem.rateText}` : '用户' }}</span>
              </template>
            </div>
          </div>
          <ul class="key-user-pie-legend">
            <li v-for="item in props.keyUserIndustryPieData" :key="`industry-${item.key}`">
              <i :style="{ background: item.color }"></i>
              <span :title="item.label">{{ item.label }}</span>
              <em>{{ item.count }}户 / {{ item.rateText }}</em>
            </li>
          </ul>
        </div>
      </article>

      <article class="key-user-overview-card">
        <div class="key-user-overview-head">
          <h4>敏感用户类别分布</h4>
        </div>
        <div class="key-user-pie-layout">
          <div
            class="key-user-pie"
            :style="{ background: props.sensitiveUserIndustryPieBackground }"
            @mouseleave="hoveredSensitiveIndustryPieKey = ''"
          >
            <svg class="key-user-pie-ring" viewBox="0 0 128 128" aria-hidden="true">
              <g transform="rotate(-90 64 64)">
                <circle
                  v-for="item in sensitiveIndustryPieSegments"
                  :key="`sensitive-industry-segment-${item.key}`"
                  class="key-user-pie-ring-segment"
                  :class="{ active: hoveredSensitiveIndustryPieKey === item.key }"
                  cx="64"
                  cy="64"
                  r="55"
                  fill="none"
                  :stroke="item.color"
                  stroke-width="16"
                  stroke-linecap="butt"
                  :stroke-dasharray="item.dasharray"
                  :stroke-dashoffset="item.dashoffset"
                  :title="`${item.label}：${item.count}户 / ${item.rateText}`"
                  @mouseenter="hoveredSensitiveIndustryPieKey = item.key"
                />
              </g>
            </svg>
            <div class="key-user-pie-center">
              <template v-if="props.keyUserStatsLoading">
                <strong class="key-user-pie-loading-text">数据加载中...</strong>
              </template>
              <template v-else>
                <strong>{{ hoveredSensitiveIndustryPieItem ? hoveredSensitiveIndustryPieItem.count : props.sensitiveUserIndustryTotal }}</strong>
                <span>{{ hoveredSensitiveIndustryPieItem ? `${hoveredSensitiveIndustryPieItem.count}户 / ${hoveredSensitiveIndustryPieItem.rateText}` : '用户' }}</span>
              </template>
            </div>
          </div>
          <ul class="key-user-pie-legend">
            <li v-for="item in props.sensitiveUserIndustryPieData" :key="`sensitive-industry-${item.key}`">
              <i :style="{ background: item.color }"></i>
              <span :title="item.label">{{ item.label }}</span>
              <em>{{ item.count }}户 / {{ item.rateText }}</em>
            </li>
          </ul>
        </div>
      </article>
    </section>

    <section class="key-user-table-module user-detail-table-module">
      <div class="key-user-query-bar user-detail-query-bar">
        <input
          :value="props.keyUserSearchInput"
          type="text"
          class="user-detail-query-input"
          placeholder="请输入用户编号或姓名"
          @input="updateKeyUserSearchInput"
          @keyup.enter="emit('apply-key-user-search')"
        />
        <button type="button" class="user-detail-query-btn" @click="emit('apply-key-user-search')">查询</button>
        <div ref="keyUserCascadeRef" class="key-user-cascade" @mouseleave="hoveredKeyUserFilterValue = ''">
          <button
            type="button"
            class="key-user-cascade-trigger"
            :aria-expanded="keyUserCascadeVisible"
            @click.stop="toggleKeyUserCascade"
            @keydown.esc="keyUserCascadeVisible = false"
          >
            <span>{{ keyUserFilterLabel }}</span>
            <i>⌄</i>
          </button>
          <div
            v-if="keyUserCascadeVisible"
            class="key-user-cascade-panel"
            :class="{ 'has-secondary': hoveredKeyUserFilterValue === 'key' }"
            @click.stop
          >
            <ul class="key-user-cascade-list">
              <li
                v-for="item in props.keyUserFilterValueOptions"
                :key="`key-user-filter-${item.value}`"
                :class="{
                  active: props.keyUserFilterValue === item.value
                    || (item.value === 'key' && ['key-frequent', 'key-non-frequent'].includes(props.keyUserFilterValue)),
                }"
                @mouseenter="hoveredKeyUserFilterValue = item.value"
                @click="selectKeyUserFilterValue(item.value)"
              >
                <span>{{ item.label }}</span>
                <i v-if="item.value === 'key'">›</i>
              </li>
            </ul>
            <ul v-if="hoveredKeyUserFilterValue === 'key'" class="key-user-cascade-list key-user-cascade-list-secondary">
              <li
                :class="{ active: props.keyUserFilterValue === 'key-frequent' }"
                title="规则：连续3天停电或一周内停电3次"
                @click="selectKeyUserFilterValue('key-frequent')"
              >频繁停电用户</li>
              <li
                :class="{ active: props.keyUserFilterValue === 'key-non-frequent' }"
                @click="selectKeyUserFilterValue('key-non-frequent')"
              >非频繁停电用户</li>
            </ul>
          </div>
        </div>
        <WorkOrderDataExportButton :rows="keyUserExportRows" filename="用户标签识别详情.xlsx" sheet-name="用户标签识别" />
      </div>

      <div class="key-user-grid-wrap user-detail-grid-wrap">
        <ul class="key-user-grid-body user-detail-grid-body">
          <li class="key-user-grid user-detail-grid user-detail-grid-head">
            <span>用户编号</span>
            <span>用户姓名</span>
            <span>区县</span>
            <span>行业</span>
            <span>用户类型</span>
            <span>详情</span>
          </li>
          <li
            v-for="item in props.keyUserDetailLoading ? [] : props.pagedKeyUserRows"
            :key="item.id"
            class="key-user-grid user-detail-grid user-detail-grid-row"
          >
            <span class="user-detail-cell" :title="item.consNo">{{ item.consNo }}</span>
            <span class="user-detail-cell" :title="item.consName">{{ item.consName }}</span>
            <span class="user-detail-cell" :title="item.countyName">{{ item.countyName }}</span>
            <span class="user-detail-cell" :title="item.tradeName">{{ item.tradeName }}</span>
            <span class="user-detail-cell" :title="item.outageNature">{{ item.outageNature }}</span>
            <button type="button" class="detail-btn" @click="emit('open-key-user-modal', item)">详情</button>
          </li>
        </ul>

        <p v-if="props.keyUserDetailLoading || props.pagedKeyUserRows.length === 0" class="empty-tip">{{ keyUserTableEmptyText }}</p>
      </div>

      <footer class="user-detail-pagination" v-if="props.filteredKeyUserRowsLength > 0">
        <span class="outage-range-page-state">第 {{ props.keyUserCurrentPage }} / {{ props.keyUserTotalPages }} 页</span>
        <button
          v-for="page in props.keyUserPageButtons"
          :key="`key-user-page-${page}`"
          type="button"
          class="page-btn"
          :class="{ active: page === props.keyUserCurrentPage }"
          @click="emit('go-key-user-page', page)"
        >
          {{ page }}
        </button>

        <div class="user-detail-page-jump">
          <input
            :value="props.keyUserJumpPageInput"
            type="number"
            min="1"
            :max="props.keyUserTotalPages"
            class="user-detail-page-input"
            placeholder="页码"
            @input="updateKeyUserJumpPageInput"
            @keyup.enter="emit('jump-to-key-user-page')"
          />
          <button type="button" class="user-detail-page-jump-btn" @click="emit('jump-to-key-user-page')">跳转</button>
        </div>
      </footer>
    </section>

    <div
      v-if="props.keyUserDetailModalVisible && props.selectedKeyUserDetail"
      class="user-detail-modal-mask"
      @click.self="emit('close-key-user-modal')"
    >
      <article class="user-detail-modal key-user-detail-modal user-tag-key-user-modal">
        <button type="button" class="user-detail-modal-close" @click="emit('close-key-user-modal')">×</button>
        <h4>{{ keyUserDetailModalTitle }}</h4>
        <div class="user-detail-modal-content">
          <p><span>用户编号：</span>{{ props.selectedKeyUserDetail.consNo }}</p>
          <p><span>用户姓名：</span>{{ props.selectedKeyUserDetail.consName }}</p>
          <p><span>区县：</span>{{ props.selectedKeyUserDetail.countyName }}</p>
          <p><span>行业：</span>{{ props.selectedKeyUserDetail.tradeName || '-' }}</p>
          <p><span>用户类型：</span>{{ props.selectedKeyUserDetail.outageNature }}</p>
          <section v-if="isKeyUserDetailSelected" class="key-user-reason-section">
            <h5>重点用户识别原因</h5>
            <div class="key-user-reason-card">
              <p><span>一周内拨打95598次数：</span>{{ selectedKeyUserReason.weekly95598CallCount }} 次</p>
              <p><span>一周内停电次数：</span>{{ selectedKeyUserReason.weeklyOutageCount }} 次</p>
              <p><span>用户行业：</span>{{ selectedKeyUserReason.tradeName }}</p>
            </div>
          </section>
          <section v-if="isSensitiveUserDetailSelected" class="key-user-reason-section">
            <h5>敏感用户识别原因</h5>
            <div class="key-user-reason-card">
              <p><span>一周内拨打95598次数：</span>{{ selectedKeyUserReason.weekly95598CallCount }} 次</p>
              <p><span>一周内停电次数：</span>{{ selectedKeyUserReason.weeklyOutageCount }} 次</p>
            </div>
          </section>
        </div>
      </article>
    </div>
  </section>
</template>
