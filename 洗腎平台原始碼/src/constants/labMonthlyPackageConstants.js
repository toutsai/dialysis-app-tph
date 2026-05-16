// 每月抽血項目套餐設定
//
// 醫院每個月實際抽的檢驗項目會有出入：1、2、4、5、7、8、10、11 月為常規套餐；
// 3、6、9、12 月為季度套餐（多驗鐵蛋白 / TIBC / 副甲狀腺素）。每年循環相同，
// 故以「月份(1-12)」定義，不需逐年維護。
//
// 「手動查詢與補登缺漏報告」改為依「該月應有項目套餐」比對病人當月報告，
// 找出缺哪些項目，而非與同群組比報告筆數（舊邏輯不可靠，會誤判有報告者）。
//
// key 必須與 lab_reports.results（labReportsApi 映射後的 data）以及
// LabReportView.vue 的 manualEntryItems 完全一致。
// 注意：套餐圖中的 Uric acid / ALT / AST / 血糖 / 膽固醇 等項目不在本系統
// 可補登的 15 項內，故不納入比對；Iron 各月套餐皆未單列，亦不納入。

export const LAB_ITEM_KEYS = [
  'WBC',
  'Hb',
  'Platelet',
  'BUN',
  'Creatinine',
  'Albumin',
  'Na',
  'K',
  'Ca',
  'P',
  'Iron',
  'TIBC',
  'Ferritin',
  'iPTH',
  'PostBUN',
]

// 常規套餐（1、2、4、5、7、8、10、11 月）：CBC + 生化 + 洗後 BUN + 肌酐
const ROUTINE_PACKAGE = [
  'WBC',
  'Hb',
  'Platelet',
  'BUN',
  'Creatinine',
  'Albumin',
  'Na',
  'K',
  'Ca',
  'P',
  'PostBUN',
]

// 季度套餐（3、6、9、12 月）：常規 + 副甲狀腺素 + 鐵蛋白 + TIBC
const QUARTERLY_PACKAGE = [...ROUTINE_PACKAGE, 'iPTH', 'Ferritin', 'TIBC']

// 預設套餐：月份無對應設定時套用。
export const DEFAULT_LAB_PACKAGE = ROUTINE_PACKAGE

// 依月份(1-12)的套餐，每年循環套用。
export const MONTHLY_LAB_PACKAGES_BY_MONTH = {
  1: ROUTINE_PACKAGE,
  2: ROUTINE_PACKAGE,
  3: QUARTERLY_PACKAGE,
  4: ROUTINE_PACKAGE,
  5: ROUTINE_PACKAGE,
  6: QUARTERLY_PACKAGE,
  7: ROUTINE_PACKAGE,
  8: ROUTINE_PACKAGE,
  9: QUARTERLY_PACKAGE,
  10: ROUTINE_PACKAGE,
  11: ROUTINE_PACKAGE,
  12: QUARTERLY_PACKAGE,
}

// 回傳指定月份應有的項目 key 陣列。
// month 接受 'YYYY-MM' 字串或 1-12 數字。
export function getMonthlyLabPackage(month) {
  let monthNum
  if (typeof month === 'number') {
    monthNum = month
  } else {
    monthNum = Number(String(month ?? '').split('-')[1])
  }
  return MONTHLY_LAB_PACKAGES_BY_MONTH[monthNum] ?? DEFAULT_LAB_PACKAGE
}
