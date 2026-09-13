<script setup>
import { computed, ref } from 'vue'
import '../style.css'

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  receiptValue: {
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

const isDetailModalVisible = ref(false)

const receiptDisplayText = computed(() => {
  if (props.loading) {
    return '生成中...'
  }

  if (props.error) {
    return props.error
  }

  return props.receiptValue || props.user?.replyTemplate || '-'
})

const openDetailModal = () => {
  isDetailModalVisible.value = true
}

const closeDetailModal = () => {
  isDetailModalVisible.value = false
}
</script>

<template>
  <section
    class="module-block reply-assistant-panel"
    role="button"
    tabindex="0"
    @click="openDetailModal"
    @keydown.enter="openDetailModal"
    @keydown.space.prevent="openDetailModal"
  >
    <div class="block-head reply-assistant-head">
      <h3>智能回单助手</h3>
    </div>

    <div class="reply-assistant-template">
      <div class="reply-assistant-template-body">
        <span
          :class="{
            'is-muted': props.loading,
            'is-error': props.error,
          }"
        >
          {{ receiptDisplayText }}
        </span>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="isDetailModalVisible"
        class="reply-assistant-detail-modal-mask"
        @click.stop
      >
        <div class="reply-assistant-detail-modal" @click.stop>
          <div class="reply-assistant-detail-modal-head">
            <h4>智能回单助手</h4>
            <button
              class="reply-assistant-detail-modal-close"
              type="button"
              aria-label="关闭"
              @click.stop="closeDetailModal"
            >
              ×
            </button>
          </div>

          <div class="reply-assistant-detail-modal-content">
            <p
              class="reply-assistant-detail-modal-value"
              :class="{ 'is-muted': props.loading, 'is-error': props.error }"
            >
              {{ receiptDisplayText }}
            </p>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
