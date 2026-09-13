<script setup>
import { ref } from 'vue'

const exporting = ref(false)

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  filename: {
    type: String,
    default: '95598工单统计.xlsx',
  },
  sheetName: {
    type: String,
    default: '95598工单统计',
  },
})

const normalizeFilename = (name) => (name.endsWith('.xlsx') ? name : `${name}.xlsx`)

const exportData = async () => {
  if (!props.rows.length || exporting.value) {
    return
  }

  exporting.value = true

  try {
    const XLSX = await import('xlsx')
    const worksheet = XLSX.utils.json_to_sheet(props.rows)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, props.sheetName)
    XLSX.writeFile(workbook, normalizeFilename(props.filename))
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <button type="button" class="work-order-export-btn" :disabled="rows.length === 0 || exporting" @click="exportData">
    {{ exporting ? '导出中' : '数据导出' }}
  </button>
</template>
