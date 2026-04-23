// 檔案路徑: src/router/index.ts (修改後版本)

import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import MainLayout from '@/layouts/MainLayout.vue'

// ✨ 1. 在頂部引入醫師排班相關的元件 (此處保持不變)
import PhysicianScheduleView from '@/views/PhysicianScheduleView.vue'

// 權限角色常數（方便一次性審視與維護）
const ALL_ROLES = ['admin', 'editor', 'contributor', 'viewer']
const STAFF_ROLES = ['admin', 'editor']
const CLINICAL_ROLES = ['admin', 'editor', 'contributor']
const DOCTOR_ROLES = ['admin', 'contributor']
const INVENTORY_ROLES = ['admin', 'viewer']

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Home', redirect: '/collaboration' },
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('@/views/ScheduleView.vue'),
        meta: { title: '每日排程表', roles: ALL_ROLES },
      },
      {
        path: 'weekly',
        name: 'Weekly',
        component: () => import('@/views/WeeklyView.vue'),
        meta: { title: '週排班表', roles: ALL_ROLES },
      },
      {
        path: 'base-schedule',
        name: 'BaseSchedule',
        component: () => import('@/views/BaseScheduleView.vue'),
        meta: { title: '門急住床位總表', roles: ALL_ROLES },
      },
      {
        path: 'physician-schedule',
        component: PhysicianScheduleView,
        redirect: '/physician-schedule/rounding',
        meta: { title: '醫師排班', roles: ALL_ROLES },
        children: [
          {
            path: 'rounding',
            name: 'PhysicianRoundingSchedule',
            component: PhysicianScheduleView,
            meta: { title: '查房班表', roles: ALL_ROLES },
          },
        ],
      },
      {
        path: 'exception-manager',
        name: 'ExceptionManager',
        component: () => import('@/views/ExceptionManagerView.vue'),
        meta: { title: '調班管理', requiresAuth: true, roles: STAFF_ROLES },
      },
      {
        path: 'update-scheduler',
        name: 'UpdateScheduler',
        component: () => import('@/views/UpdateSchedulerView.vue'),
        meta: { title: '預約變更總覽', requiresAuth: true, roles: STAFF_ROLES },
      },
      {
        path: 'patients',
        name: 'Patients',
        component: () => import('@/views/PatientsView.vue'),
        meta: { title: '病人管理', roles: ALL_ROLES },
      },
      {
        path: 'stats',
        name: 'Stats',
        component: () => import('@/views/StatsView.vue'),
        meta: { title: '護理分組檢視', roles: ALL_ROLES },
      },
      {
        path: 'reporting',
        name: 'Reporting',
        component: () => import('@/views/ReportingView.vue'),
        meta: { title: '統計報表', roles: ALL_ROLES },
      },
      {
        path: 'user-management',
        name: 'UserManagement',
        component: () => import('@/views/UserManagementView.vue'),
        meta: { title: '使用者管理', requiresAdmin: true, roles: ['admin'] },
      },
      {
        path: 'lab-reports',
        name: 'LabReports',
        component: () => import('@/views/LabReportView.vue'),
        meta: { title: '檢驗報告管理', requiresAuth: true, roles: CLINICAL_ROLES },
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('@/views/InventoryView.vue'),
        meta: { title: '庫存管理', requiresAuth: true, roles: INVENTORY_ROLES },
      },
      {
        path: 'account-settings',
        name: 'AccountSettings',
        component: () => import('@/views/AccountSettingsView.vue'),
        meta: { title: '帳號設定', roles: ALL_ROLES },
      },
      {
        path: '/daily-log',
        name: 'DailyLog',
        component: () => import('../views/DailyLogView.vue'),
        meta: {
          title: '工作日誌',
          requiresAuth: true,
          roles: ALL_ROLES,
        },
      },
      {
        path: 'collaboration',
        name: 'Collaboration',
        component: () => import('@/views/CollaborationView.vue'),
        meta: { title: '協作訊息中心', requiresAuth: true, roles: ALL_ROLES },
      },
      {
        path: '/orders',
        name: 'Orders',
        component: () => import('@/views/OrdersView.vue'),
        meta: { title: '藥囑管理', requiresAuth: true, roles: DOCTOR_ROLES },
      },
      {
        path: 'my-patients',
        name: 'MyPatients',
        component: () => import('@/views/MyPatientsView.vue'),
        meta: {
          title: '我的今日病人',
          requiresAuth: true,
          roles: STAFF_ROLES,
        },
      },
      {
        path: 'nursing-schedule',
        name: 'NursingSchedule',
        component: () => import('@/views/NursingScheduleView.vue'),
        meta: {
          title: '護理班表與職責',
          requiresAuth: true,
          roles: STAFF_ROLES,
        },
      },
      {
        path: 'kidit-report',
        name: 'KiDitReport',
        component: () => import('@/views/PatientMovementReportView.vue'),
        meta: {
          title: 'KiDit 申報工作站',
          requiresAuth: true,
          roles: STAFF_ROLES,
        },
      },
      {
        path: 'usage-guide',
        name: 'UsageGuide',
        component: () => import('@/views/UsageGuideView.vue'),
        meta: {
          title: '平台使用說明',
          requiresAuth: true,
          roles: ALL_ROLES,
        },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// ==========================================================
// 路由守衛：登入 + RBAC
// ==========================================================
router.beforeEach(async (to, from, next) => {
  const { isLoggedIn, isAdmin, waitForAuthInit, currentUser } = useAuth()
  await waitForAuthInit()

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin)
  const requiredRoles = to.matched.flatMap((record) => record.meta.roles || [])

  // 1. 需要登入但未登入 → 登入頁
  if (requiresAuth && !isLoggedIn.value) {
    next({ name: 'Login', query: { redirect: to.fullPath } })

    // 2. 已登入卻進入登入頁 → 依職稱導向
  } else if (to.name === 'Login' && isLoggedIn.value) {
    const userTitle = currentUser.value?.title
    if (userTitle === '護理師' || userTitle === '護理師組長') {
      next({ name: 'MyPatients' })
    } else {
      next({ name: 'Collaboration' })
    }

    // 3. 需要管理員權限但不是管理員 → 預設頁
  } else if (requiresAdmin && !isAdmin.value) {
    console.warn(`權限不足：用戶角色 (${currentUser.value?.role}) 無法訪問管理員頁面。`)
    next({ name: 'Schedule' })

    // 4. 需要特定角色但不符 → 預設頁
  } else if (requiredRoles.length > 0 && !requiredRoles.includes(currentUser.value?.role ?? '')) {
    console.warn(`權限不足：用戶角色 (${currentUser.value?.role}) 無法訪問此頁面。`)
    next({ name: 'Schedule' })

    // 5. 通過
  } else {
    next()
  }
})

export default router
