<script setup>
import { ref } from 'vue'
import '../style.css'

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
})

const isDetailModalVisible = ref(false)

const openDetailModal = () => {
  isDetailModalVisible.value = true
}

const closeDetailModal = () => {
  isDetailModalVisible.value = false
}
</script>

<template>
  <section
    class="module-block user-personal-info-panel"
    role="button"
    tabindex="0"
    @click="openDetailModal"
    @keydown.enter="openDetailModal"
    @keydown.space.prevent="openDetailModal"
  >
    <div class="block-head user-personal-info-head">
      <h3>用户信息</h3>
    </div>

    <div class="user-personal-info-list">
      <div class="user-personal-info-row">
        <span class="user-personal-info-label">用户名</span>
        <span class="user-personal-info-value">{{ props.user?.consName || '-' }}</span>
      </div>
      <div class="user-personal-info-row">
        <span class="user-personal-info-label">用户ID</span>
        <span class="user-personal-info-value">{{ props.user?.consNo || '-' }}</span>
      </div>
      <div class="user-personal-info-row">
        <span class="user-personal-info-label">联系电话</span>
        <span class="user-personal-info-value">{{ props.user?.phone || '-' }}</span>
      </div>
      <div class="user-personal-info-row">
        <span class="user-personal-info-label">用户地址</span>
        <span class="user-personal-info-value">{{ props.user?.address || '-' }}</span>
      </div>
    </div>

    <div
      v-if="isDetailModalVisible"
      class="user-personal-info-detail-modal-mask"
      @click.self.stop="closeDetailModal"
    >
      <div class="user-personal-info-detail-modal" @click.stop>
        <div class="user-personal-info-detail-modal-head">
          <h4>用户信息</h4>
          <button
            class="user-personal-info-detail-modal-close"
            type="button"
            aria-label="关闭"
            @click.stop="closeDetailModal"
          >
            ×
          </button>
        </div>

        <div class="user-personal-info-detail-modal-content">
          <div class="user-personal-info-detail-grid">
            <p><span>用户名</span>{{ props.user?.consName || '-' }}</p>
            <p><span>用户ID</span>{{ props.user?.consNo || '-' }}</p>
            <p><span>联系电话</span>{{ props.user?.phone || '-' }}</p>
            <p><span>用户地址</span>{{ props.user?.address || '-' }}</p>
          </div>

          <div class="user-personal-info-appeals">
            <h5>诉求内容</h5>
            <div
              v-for="(appeal, index) in props.user?.appeals || []"
              :key="appeal.key || index"
              class="user-personal-info-appeal-item"
            >
              <p class="user-personal-info-appeal-time">
                <span>诉求时间</span>{{ appeal.time || '-' }}
              </p>
              <p class="user-personal-info-appeal-content">
                <span>诉求内容</span>{{ appeal.content || '-' }}
              </p>
            </div>
            <p v-if="!props.user?.appeals?.length" class="user-personal-info-appeal-empty">暂无诉求信息</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
