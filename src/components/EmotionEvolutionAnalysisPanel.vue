<script setup>
import { computed, ref } from 'vue'
import '../style.css'

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  analysisValue: {
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

const splitAiEmotionAnalysis = (value) => {
  const text = String(value || '').trim()
  if (!text) {
    return {
      evolution: '',
      basis: '',
    }
  }

  const basisMatch = text.match(
    /(?:^|\n)\s*(?:[-*•]\s*|\d+[.、]\s*)?(?:\*\*)?\s*(?:情绪变化的依据|依据|分析依据|判断依据)\s*[:：]\s*(?:\*\*)?\s*/
  )
  if (!basisMatch) {
    return {
      evolution: text,
      basis: '',
    }
  }

  return {
    evolution: text.slice(0, basisMatch.index).trim(),
    basis: text.slice(basisMatch.index + basisMatch[0].length).trim(),
  }
}

const stripSectionLabel = (value, labels) => {
  const labelPattern = labels.join('|')
  return String(value || '')
    .replace(new RegExp(`^\\s*(?:[-*•]\\s*|\\d+[.、]\\s*)?(?:\\*\\*)?\\s*(?:${labelPattern})\\s*[:：]\\s*(?:\\*\\*)?\\s*`), '')
    .trim()
}

const aiEmotionAnalysis = computed(() => splitAiEmotionAnalysis(props.analysisValue))

const emotionEvolutionText = computed(() => {
  const aiText = stripSectionLabel(aiEmotionAnalysis.value.evolution, [
    '情绪变化',
    '用户情绪演变过程',
    '情绪演变过程',
    '情绪演变分析',
    '分析结果',
  ])

  return aiText || String(props.user?.emotionEvolution || '').trim()
})

const emotionBasisText = computed(() => {
  const aiBasis = stripSectionLabel(aiEmotionAnalysis.value.basis, [
    '情绪变化的依据',
    '依据',
    '分析依据',
    '判断依据',
  ])

  return aiBasis || String(props.user?.emotionBasis || '').trim()
})

const isDetailModalVisible = ref(false)

const emotionEvolutionDisplayText = computed(() => {
  if (props.loading) {
    return '分析中...'
  }

  if (props.error) {
    return props.error
  }

  return emotionEvolutionText.value || '-'
})

const emotionBasisDisplayText = computed(() => {
  if (props.loading) {
    return '-'
  }

  return emotionBasisText.value || '-'
})

const openDetailModal = () => {
  isDetailModalVisible.value = true
}

const closeDetailModal = () => {
  isDetailModalVisible.value = false
}

const shouldRenderFlow = computed(() => emotionEvolutionParts.value.length > 1)

const emotionEvolutionParts = computed(() => {
  const value = emotionEvolutionText.value

  if (!value) {
    return []
  }

  return value.split(/\s*(?:->|→|－|—|–|-(?!\d))\s*/).filter(Boolean)
})
</script>

<template>
  <section
    class="module-block emotion-evolution-analysis-panel"
    role="button"
    tabindex="0"
    @click="openDetailModal"
    @keydown.enter="openDetailModal"
    @keydown.space.prevent="openDetailModal"
  >
    <div class="block-head emotion-evolution-head">
      <h3>情绪演变分析</h3>
    </div>

    <div class="emotion-evolution-content">
      <div class="emotion-evolution-section">
        <p class="emotion-evolution-label">用户情绪演变过程</p>
        <p class="emotion-evolution-value emotion-evolution-flow">
          <span v-if="props.loading" class="emotion-evolution-text is-muted">分析中...</span>
          <span v-else-if="props.error" class="emotion-evolution-text is-error">{{ props.error }}</span>
          <template v-else-if="shouldRenderFlow">
            <template v-for="(item, index) in emotionEvolutionParts" :key="`${item}-${index}`">
              <span class="emotion-evolution-step">{{ item }}</span>
              <span
                v-if="index < emotionEvolutionParts.length - 1"
                class="emotion-evolution-arrow"
                aria-hidden="true"
              ></span>
            </template>
          </template>
          <span v-else-if="emotionEvolutionText" class="emotion-evolution-text">{{ emotionEvolutionText }}</span>
          <span v-else>-</span>
        </p>
      </div>

      <div class="emotion-evolution-section">
        <p class="emotion-evolution-label">情绪变化的依据</p>
        <p class="emotion-evolution-value emotion-evolution-basis">
          <span v-if="props.loading" class="is-muted">-</span>
          <span v-else>{{ emotionBasisText || '-' }}</span>
        </p>
      </div>
    </div>

    <div
      v-if="isDetailModalVisible"
      class="emotion-evolution-detail-modal-mask"
      @click.stop
    >
      <div class="emotion-evolution-detail-modal" @click.stop>
        <div class="emotion-evolution-detail-modal-head">
          <h4>情绪演变分析</h4>
          <button
            class="emotion-evolution-detail-modal-close"
            type="button"
            aria-label="关闭"
            @click.stop="closeDetailModal"
          >
            ×
          </button>
        </div>

        <div class="emotion-evolution-detail-modal-content">
          <div class="emotion-evolution-detail-modal-item">
            <p class="emotion-evolution-detail-modal-label">用户情绪演变过程</p>
            <p class="emotion-evolution-detail-modal-value emotion-evolution-flow">
              <span v-if="props.loading || props.error" class="emotion-evolution-text">
                {{ emotionEvolutionDisplayText }}
              </span>
              <template v-else-if="shouldRenderFlow">
                <template v-for="(item, index) in emotionEvolutionParts" :key="`modal-${item}-${index}`">
                  <span class="emotion-evolution-step">{{ item }}</span>
                  <span
                    v-if="index < emotionEvolutionParts.length - 1"
                    class="emotion-evolution-arrow"
                    aria-hidden="true"
                  ></span>
                </template>
              </template>
              <span v-else class="emotion-evolution-text">{{ emotionEvolutionDisplayText }}</span>
            </p>
          </div>
          <div class="emotion-evolution-detail-modal-item">
            <p class="emotion-evolution-detail-modal-label">情绪变化的依据</p>
            <p class="emotion-evolution-detail-modal-value">{{ emotionBasisDisplayText }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
