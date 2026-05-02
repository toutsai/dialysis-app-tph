import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 跨頁共用的「正在檢視日期」。
 * 每日排程 (ScheduleView) 與護理分組 (StatsView) 共用同一個日期，
 * 切換頁面時不會被重置成今天，方便組長盯著未來某一天的同一份資料看。
 */
export const useViewingDateStore = defineStore('viewingDate', () => {
  const date = ref<Date>(new Date())

  function setDate(next: Date) {
    date.value = next
  }

  function resetToToday() {
    date.value = new Date()
  }

  return { date, setDate, resetToToday }
})
