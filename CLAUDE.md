# 透析排程系統 (dialysis-app-tph)

台北醫院血液透析中心管理平台。院內使用的全功能透析排程、病人管理、護理與醫囑系統。

## 技術棧

- **Backend**: Node.js (ESM) + Express.js
- **Database**: SQLite via better-sqlite3 (同步 API，全域單例連線)
- **Auth**: JWT + bcryptjs, Token 黑名單 + 單一裝置 Session
- **Frontend**: Vue 3.5 + Vuetify + TypeScript + Pinia 3 (原始碼在 `洗腎平台原始碼/`)
- **Build**: Vite 6, 支援 standalone 模式 (proxy → localhost:3000)
- **Desktop**: Electron 28 + electron-builder (Windows .exe 打包)
- **排程任務**: node-cron
- **部署**: Windows VM, PM2 process manager / Electron 離線桌面版
- **Package**: 後端 `"type": "module"` — ES module (`import`/`export`)

## 常用指令

```bash
npm start              # 啟動伺服器
npm run dev            # 開發模式 (--watch)
npm run migrate        # 執行資料庫遷移 (獨立腳本)
npm run backup         # 手動備份資料庫
npm run init-db        # 初始化資料庫 + 建立預設管理員
```

## 專案結構

```
src/
  index.js                     # Express 入口，CORS, 路由掛載, graceful shutdown
  db/
    init.js                    # DB 全域單例 (initDatabase/getDatabase/closeDatabase)
    schema.sql                 # 25+ 張表 (CREATE IF NOT EXISTS)
    migrate.js                 # 漸進式 ALTER TABLE 遷移 (獨立腳本，自管連線)
  middleware/
    auth.js                    # JWT 驗證, RBAC (admin/editor/contributor/viewer), 稽核日誌
    rateLimit.js               # 登入 + API rate limiting (in-memory Map)
    validate.js                # 通用 input validation middleware
  routes/
    auth.js                    # 登入/登出/使用者 CRUD, HIS API 驗證
    patients.js                # 病人 CRUD, 軟刪除/復原, 狀態流轉 (opd/ipd/er)
    schedules.js               # 每日排程, 總表 (base_schedules), 調班, 護理分配
    orders.js                  # 透析醫囑歷史, Excel 匯入 (針劑/口服/檢驗/耗材)
    medications.js             # 用藥管理, 每日應打針劑計算 (QW 頻率規則)
    nursing.js                 # 護理排班/職責/交班日誌/每日工作日誌/KiDit 日誌本
    system.js                  # 任務/通知/庫存/醫師/配置/預約變更/備份
    memos.js                   # 備忘錄 CRUD
  services/
    scheduler.js               # node-cron 定時任務 (歸檔/備份/清理/排程初始化)
    scheduleSync.js            # 總表 -> 未來 60 天排程同步引擎
    exceptionHandler.js        # 調班處理器 (MOVE/SUSPEND/ADD_SESSION/SWAP)
    kiditSync.js               # 工作日誌 -> KiDit 日誌本同步
  utils/
    dateUtils.js               # 台北時區日期工具 (getTaipeiTodayString 等)
    scheduleUtils.js           # 排程常數與工具 (FREQ_MAP, SHIFTS, getScheduleKey)
    backup.js                  # 資料庫備份

ecosystem.config.cjs           # PM2 設定 (production)
migrations/migrate.js          # DB 遷移腳本入口
dist/                          # Vue 3 + Vuetify 前端預建置產出

洗腎平台原始碼/                   # ★ 前端完整原始碼 (Vue 3 + TS)
  src/
    main.ts                    # Vue 入口，掛載 Pinia / Quill / directives
    App.vue                    # 根元件，監聽登入狀態觸發病人資料載入
    router/
      index.ts                 # 54 條路由，導航守衛 (auth + RBAC + 職稱導向)
    views/                     # 25 個頁面 (見下方「前端頁面」)
    components/                # 56+ 個元件 (排程表/醫囑/床位/KiDit 等)
    stores/                    # Pinia 狀態管理
      patientStore.ts          # 全域病人快取，避免重複 API 呼叫
      medicationStore.ts       # 每日針劑快取，分批請求 (30人/批)
      archiveStore.ts          # 歷史排程懶載入快取
      taskStore.ts             # 交辦/留言/協作，30 秒輪詢，7 天保留策略
    services/                  # API 通訊層
      localApiClient.ts        # 主要 API 客戶端，JWT Token 管理
      LocalApiManager.ts       # 泛用 CRUD decorator (get/create/update/delete)
      optimizedApiService.js   # 效能層：30 秒 TTL 快取 + 50ms 批次合併
      scheduleService.js       # 排程操作 (5 分鐘快取)
      baseScheduleService.js   # 總表操作
      nursingGroupConfigService.js  # 護理分組設定
      nurseAssignmentsService.js    # 護理師分派
      kiditService.js          # KiDit 資料操作
      kiditExportService.js    # KiDit CSV 匯出
      nursingDutyService.js    # 消防值班
    composables/               # 共用邏輯 (13 個)
      useAuth.ts               # 登入/登出/Session Timeout (30 分鐘)
      useAuthStandalone.ts     # Standalone 模式認證
      useScheduleAnalysis.js   # 排程缺口分析 (未排/可加洗)
      useGroupAssigner.js      # 護理分組演算法
      useTeamAssigner.js       # 團隊分派
      useRealtimeNotifications.js  # 30 秒輪詢即時通知
      useGlobalNotifier.js     # 全系統通知 (30 天過期)
      useCache.js              # 泛用 TTL 快取
      useErrorHandler.js       # 錯誤處理與驗證
      useBreakpoints.js        # 響應式斷點
      useMyPatientList.js      # 護理師每日病人清單
      useNurseGroupSync.js     # 護理分組同步
      useUserDirectory.js      # 使用者清單
    constants/                 # 常數定義
      scheduleConstants.js     # 班別/分組代碼 (A-K + 外圍)
      medicationConstants.js   # 藥品目錄 (代碼/商品名/單位)
      labAlertConstants.js     # 檢驗警示閾值
    layouts/
      MainLayout.vue           # 主佈局：側欄導航 + 通知 + 響應式漢堡選單
    config/                    # 環境設定
    utils/                     # 工具函數 (日期/排程/KiDit/消毒)
  electron/                    # Electron 桌面版設定
  server/                      # 前端 repo 內建的 Express server 副本
  dist/                        # 前端建置產出
```

## 架構重點

### 資料庫

- **連線模式**: 全域單例。`getDatabase()` 回傳共用的 better-sqlite3 實例，不需要也不應該呼叫 `db.close()`
- **better-sqlite3 是同步的**: `db.prepare().run/get/all()` 不需要 await
- **WAL mode**: 已啟用，支援並行讀取
- **JSON 欄位**: 大量 TEXT 欄位存 JSON (`dialysis_orders`, `schedule`, `patient_status` 等)，需 `JSON.parse()` / `JSON.stringify()`
- **migrate.js 例外**: 此檔案是獨立執行的腳本 (`npm run migrate`)，保留自己的 `new Database()` + `db.close()` 模式

### API 慣例

- **命名轉換**: DB 欄位用 `snake_case`，API 回應用 `camelCase`，轉換在 route handler 手動進行
- **ID 格式**: UUID v4 (`uuid` 套件)
- **錯誤回應**: `{ error: true, message: "..." }`
- **日期格式**: `YYYY-MM-DD` 字串，時區為台北 (Asia/Taipei)
- **RBAC 角色**: admin > editor > contributor > viewer

### 排程系統

- **總表** (`base_schedules`): 定義病人的固定排程規則 (頻率 + 床位 + 班別)
- **每日排程** (`schedules`): 由總表同步產生，可手動覆寫
- **調班** (`schedule_exceptions`): 類型有 MOVE / SUSPEND / ADD_SESSION / SWAP
- **同步引擎** (`scheduleSync.js`): 從總表產生未來 60 天排程，整合調班例外
- **班別**: `early` / `noon` / `late`
- **透析頻率**: 一三五 / 二四六 / 一四 / 二五 / 三六 等 (見 `FREQ_MAP_TO_DAY_INDEX`)

### 安全性

- **CORS**: 白名單模式，透過 `ALLOWED_ORIGINS` 環境變數設定
- **Rate Limiting**: 登入 20 次/15 分鐘，API 100 次/分鐘 (in-memory)
- **JWT_SECRET**: 從 `.env` 載入，生產環境未設定會 `process.exit(1)`
- **登入鎖定**: 失敗次數追蹤 (`failed_login_count`, `locked_until`)

## 前端架構重點

### 頁面總覽

| 類別 | 頁面 | 功能 |
|------|------|------|
| **排程核心** | ScheduleView | 每日排程 — 44 床 × 3 班，拖放排床 |
| | WeeklyView | 週排班表 — 7 天 × 3 班，側欄未排病人 |
| | BaseScheduleView | 門急住床位總表（長期固定規則） |
| | ExceptionManagerView | 調班管理 (MOVE/SUSPEND/ADD_SESSION/SWAP) |
| | UpdateSchedulerView | 預約變更（狀態/頻率/床位長期異動） |
| **護理作業** | MyPatientsView | 護理師每日病人清單，含備藥/通路/醫囑 |
| | StatsView | 護理分組檢視 (A-K 組) |
| | NursingScheduleView | 護理班表（Excel 匯入） |
| | CollaborationView | 訊息中心 — 交辦/留言/每日公告 |
| | DailyLogView | 工作日誌 — 各班統計/交班/跑馬燈 |
| **病人/臨床** | PatientsView | 病人管理 — CRUD/統計/匯出 |
| | OrdersView | 藥囑查詢與上傳 |
| | LabReportView | 檢驗報告查詢/警示/上傳 |
| | PatientMovementReportView | KiDit 申報工作站 |
| **管理** | PhysicianScheduleView | 醫師查房/會診/緊急班表 |
| | InventoryView | 庫存管理（人工腎臟/透析液等） |
| | UserManagementView | 使用者管理 (admin only) |
| | ReportingView | 統計報表（日/月/年） |

### 路由導航守衛

- **Auth 檢查**: 未登入 → `/login`
- **RBAC 路由**: `requiresAdmin: true` 頁面限 admin 存取
- **職稱導向**: 護理師/組長 → `/my-patients`；其他 → `/collaboration`
- **Viewer 限制**: 唯讀，僅能看排程/病人/日誌/協作

### 前端效能策略

- **Code Splitting**: 路由懶載入 `import()`，vendor/excel/schedule/patient/admin 分離 chunk
- **API 快取**: optimizedApiService 30 秒 TTL + pattern-based 失效
- **批次合併**: 50ms 佇列合併多個 API 請求
- **Pinia Store 快取**: 病人資料全域快取，避免重複載入
- **防抖**: 儲存 10 秒、搜尋 300ms

### 前端關鍵元件

- **ScheduleTable**: 核心排程表格，拖放/色碼（門=綠/住=紅/急=紫）
- **BedAssignmentDialog**: 智慧排床演算法（自動推薦/手動/頻率篩選）
- **DialysisOrderModal**: 透析醫囑編輯（AK/透析液/抗凝/針劑/模式/頻率）
- **ExceptionCreateDialog**: 調班申請（MOVE/SUSPEND/ADD_SESSION/SWAP）
- **PatientFormModal / PatientDetailModal**: 病人新增/詳情
- **DailyStaffDisplay**: 每日醫師/專師顯示（依時段自動切換會診醫師）
- **NursingGroupConfigDialog**: 護理分組設定 (A-K 組 ↔ 床位映射)
- **KiDit 系列**: KiDitPatientForm / VascularAccessForm / MovementDetailModal

### 前端部署模式

- **開發**: `npm run standalone` — Vite dev server + proxy → Express:3000
- **Electron**: `npm run electron:dev` / `npm run dist` — Windows .exe 離線桌面版
- **生產**: 建置 `dist/` 複製到後端，由 Express 靜態 serve

## 注意事項

- 前端原始碼在 `洗腎平台原始碼/` 目錄，`dist/` 是預建置產出
- `backup.js` 被 scheduler.js 和 system.js import，修改時保持 import 不變
- Windows 環境路徑使用反斜線 (`D:\\dialysis-app\\`)
- PM2 設定在 `ecosystem.config.cjs` (CommonJS，因為 PM2 不支援 ESM config)
- 資料庫檔案在 `data/dialysis.db`，已被 `.gitignore` 排除
- 前端使用 `@/` 路徑別名指向 `洗腎平台原始碼/src/`
- Standalone 模式下 Firebase Firestore 被 mock 取代 (`mockFirestore.ts`)
