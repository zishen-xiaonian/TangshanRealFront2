<script setup>
import '../style.css'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '请输入用户名/用户ID',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'search', 'clear'])

const updateValue = (event) => {
  emit('update:modelValue', event?.target?.value || '')
}

const clearValue = () => {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<template>
  <form class="intelligent-search-box" @submit.prevent="emit('search')">
    <div class="intelligent-search-input-wrap">
      <input
        :value="props.modelValue"
        type="search"
        class="intelligent-search-input"
        :placeholder="props.placeholder"
        :disabled="props.disabled || props.loading"
        @input="updateValue"
      />
      <button
        v-if="props.modelValue"
        type="button"
        class="intelligent-search-clear"
        :disabled="props.disabled || props.loading"
        aria-label="清空搜索"
        @click="clearValue"
      >
        ×
      </button>
    </div>
    <button type="submit" class="intelligent-search-btn" :disabled="props.disabled || props.loading">
      {{ props.loading ? '查询中...' : '查询' }}
    </button>
  </form>
</template>
