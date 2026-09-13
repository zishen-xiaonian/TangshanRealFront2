<script setup>
import { computed, ref } from 'vue'
import '../style.css'

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  warningValue: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const splitIntelligentWarning = (value) => {
  const text = String(value || '').trim()
  if (!text) {
    return {
      level: '',
      basis: '',
    }
  }

  const basisMatch = text.match(/(?:^|\n)\s*(?:预警依据|依据|风险依据|判断依据)\s*[:：]\s*/)
  if (!basisMatch) {
    return {
      level: text,
      basis: '',
    }
  }

  return {
    level: text.slice(0, basisMatch.index).trim(),
    basis: text.slice(basisMatch.index + basisMatch[0].length).trim(),
  }
}

const stripSectionLabel = (value, labels) => {
  const labelPattern = labels.join('|')
  return String(value || '').replace(new RegExp(`^\\s*(?:${labelPattern})\\s*[:：]\\s*`), '').trim()
}

const intelligentWarning = computed(() => splitIntelligentWarning(props.warningValue))

const warningLevelText = computed(() => {
  const aiText = stripSectionLabel(intelligentWarning.value.level, [
    '预警等级信息',
    '预警等级',
    '智能预警',
    '预警内容',
    '分析结果',
  ])

  return aiText || String(props.user?.warningLevel || '').trim()
})

const warningBasisRows = computed(() => {
  const aiBasis = stripSectionLabel(intelligentWarning.value.basis, [
    '预警依据',
    '依据',
    '风险依据',
    '判断依据',
  ])

  if (aiBasis) {
    return aiBasis.split(/\n+/).map((item) => item.trim()).filter(Boolean)
  }

  if (Array.isArray(props.user?.warningBasis)) {
    return props.user.warningBasis
  }

  const fallback = String(props.user?.warningBasis || '').trim()
  return fallback ? [fallback] : []
})

const isDetailModalVisible = ref(false)

const warningLevelDisplayText = computed(() => {
  if (props.loading) {
    return '分析中...'
  }

  if (props.error) {
    return props.error
  }

  return warningLevelText.value || '-'
})

const warningBasisDisplayText = computed(() => {
  if (props.loading) {
    return '-'
  }

  return warningBasisRows.value.length ? warningBasisRows.value.join('\n') : '-'
})

const openDetailModal = () => {
  isDetailModalVisible.value = true
}

const closeDetailModal = () => {
  isDetailModalVisible.value = false
}

const getWarningLevelClass = (level) => {
  const text = String(level || '')

  if (text.includes('中高风险')) {
    return 'orange'
  }

  if (text.includes('高风险')) {
    return 'danger'
  }

  if (text.includes('中风险')) {
    return 'warning'
  }

  if (text.includes('一般关注')) {
    return 'safe'
  }

  return ''
}
</script>

<template>
  <section
    class="module-block intelligent-warning-panel"
    role="button"
    tabindex="0"
    @click="openDetailModal"
    @keydown.enter="openDetailModal"
    @keydown.space.prevent="openDetailModal"
  >
    <div class="block-head intelligent-warning-head">
      <h3>智能预警</h3>
    </div>

    <div class="intelligent-warning-content">
      <div class="intelligent-warning-section">
        <p class="intelligent-warning-label">预警等级信息</p>
        <p class="intelligent-warning-value" :class="getWarningLevelClass(warningLevelText)">
          <span v-if="props.loading" class="is-muted">分析中...</span>
          <span v-else-if="props.error" class="is-error">{{ props.error }}</span>
          <span v-else>{{ warningLevelText || '-' }}</span>
        </p>
      </div>

      <div class="intelligent-warning-section">
        <p class="intelligent-warning-label">预警依据</p>
        <div class="intelligent-warning-basis-list">
          <p :class="{ 'is-muted': props.loading }">{{ warningBasisDisplayText }}</p>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="isDetailModalVisible"
        class="intelligent-warning-detail-modal-mask"
        @click.stop
      >
        <div class="intelligent-warning-detail-modal" @click.stop>
          <div class="intelligent-warning-detail-modal-head">
            <h4>智能预警</h4>
            <button
              class="intelligent-warning-detail-modal-close"
              type="button"
              aria-label="关闭"
              @click.stop="closeDetailModal"
            >
              ×
            </button>
          </div>

          <div class="intelligent-warning-detail-modal-content">
            <div class="intelligent-warning-detail-modal-item">
              <p class="intelligent-warning-detail-modal-label">预警等级信息</p>
              <p
                class="intelligent-warning-detail-modal-value"
                :class="getWarningLevelClass(warningLevelText)"
              >
                {{ warningLevelDisplayText }}
              </p>
            </div>
            <div class="intelligent-warning-detail-modal-item">
              <p class="intelligent-warning-detail-modal-label">预警依据</p>
              <p class="intelligent-warning-detail-modal-value">{{ warningBasisDisplayText }}</p>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
