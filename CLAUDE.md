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

## Angular 前端遷移計畫

醫院決定從 Vue 改用 Angular 前端。相關專案：

- `dialysis-app-angular` — Angular 19 + Firebase 原始雲端版 (67 commits)
- `dialysis-app-angular-standalone` — Angular 19 + 自帶 Express/SQLite（已從 Firebase 遷移 95%）
- `dialysis-app-tph` (本 repo) — 醫院正式後端 (PM2 部署, 107+ API endpoints)

### 遷移策略

**目標**: Angular standalone 前端 → 對接 TPH 後端（不使用 angular-standalone 自帶的 server/）

### API 對接狀態（2026-04-15 審計結果）

**已匹配 (~90%)**：分析 Angular 67 個 commits 後，大部分（~50 個）為純前端改動，TPH 後端已有 107+ 個 endpoint，覆蓋率遠高於原先預估的 60%。

**原先列為「缺少」但實際已存在的 endpoint**：
- `GET /api/patients/with-rules` → `patients.js:271`
- `GET/POST /api/patients/history` → `patients.js:312,383`
- `POST /api/orders/history/batch` → `orders.js:234`
- `GET/POST /api/orders/medications` → `orders.js:419,467`
- `GET /api/orders/medication-drafts` → `orders.js:595`
- `POST /api/orders/lab-reports/upload` → `orders.js:1079`
- `GET/PUT /api/orders/lab-alert-analyses` → `orders.js:812,856`
- `POST /api/schedules/sync/initialize` → `schedules.js:429`
- `POST /api/schedules/admin/force-resync` → `schedules.js:901`
- `GET /api/schedules/expired/:date` → `schedules.js:68`
- `GET /api/system/scheduled-updates` → `system.js:1568`
- `PATCH /api/system/notifications/:id/read` → `system.js:387`
- `GET/PUT /api/system/site-config/:id` → `system.js:1232,1265`
- `POST /api/nursing/schedules/upload` → `nursing.js:337`
- `GET/PATCH /api/system/kidit-logbook` → `nursing.js:1116,1152,1171`
- 庫存進階功能（進貨/月/週/耗材）→ `system.js:539-1148` 全部已有

### 真正需要補齊的後端改動（7 Phase）

#### Phase 1: Auth Token Refresh（高優先，0.5 天）
- **新增** `POST /api/auth/refresh-token`
- **修改檔案**: `src/routes/auth.js`, `src/middleware/auth.js`
- 接收已過期但在 grace period 內的 token，發新 JWT
- 新增 `verifyTokenForRefresh()` 函式
- **對應 Angular commit**: `3b8416d`

#### Phase 2: modeOverride 排程支援（高優先，1 天）
- **修改** 排程例外處理，支援 ADD_SESSION 帶入透析模式（如 HD→HDF）
- **修改檔案**: `src/services/exceptionHandler.js`, `src/services/scheduleSync.js`
- `handleAddSession()` (line 243): 讀 `data.to.mode` → 設 `newSlotData.modeOverride`
- `handleMove()`: 同樣傳遞 modeOverride
- 無需 schema migration（JSON text 欄位內加新 key）
- **對應 Angular commits**: `4422a89`, `7632b8c`, `2978a3d`, `1d64a68`, `2486a1e`

#### Phase 3: Auto-Assign 設定 API（中優先，0.5 天）
- **新增** `GET/PUT /api/system/auto-assign-config/current`
- **修改檔案**: `src/routes/system.js`
- 複用 `site_config` table，`id='auto_assign_config'`
- **對應 Angular commits**: `5cb116c`, `e28f29c`, `0ea5773`, `4e5509e`, `0990c93`, `b200414`

#### Phase 4: 設備設定 API（中優先，0.5 天）
- **新增** `GET/PUT /api/orders/bed-settings`
- **新增** `GET/PUT /api/orders/machine-bicarbonate-config`
- **修改檔案**: `src/routes/orders.js`
- 都是 `site_config` 的薄包裝

#### Phase 5: PATCH 路由別名（中優先，0.5 天）
- **新增** `PATCH /api/schedules/:date` → alias existing PUT
- **新增** `PATCH /api/schedules/nurse-assignments/:date` → alias existing PUT
- **新增** `PATCH /api/nursing/group-config/:id` → alias existing PUT
- **修改檔案**: `src/routes/schedules.js`, `src/routes/nursing.js`
- 把 PUT handler 抽成具名函式，同時掛載 PUT 和 PATCH

#### Phase 6: 病人照片上傳（低優先，0.5 天）
- **新增** `POST /api/patients/upload-image`
- **修改檔案**: `src/routes/patients.js`, `src/index.js`, `src/db/migrate.js`
- 存檔到 `data/patient-images/`，新增 `patients.image_path` 欄位

#### Phase 7: Config Key 別名（低優先，0.25 天）
- **新增** `GET/PUT /api/system/config/:key` → alias `site-config/:key`
- **修改檔案**: `src/routes/system.js`

### 實作優先順序

| Phase | 範圍 | 工時 | 修改檔案 | 狀態 |
|-------|------|------|----------|------|
| **1** | Auth token refresh | 0.5 天 | auth.js, middleware/auth.js | 待實作 |
| **2** | modeOverride | 1 天 | exceptionHandler.js, scheduleSync.js | 待實作 |
| **3** | Auto-assign config | 0.5 天 | system.js | 待實作 |
| **4** | Bed/machine config | 0.5 天 | orders.js | 待實作 |
| **5** | PATCH aliases | 0.5 天 | schedules.js, nursing.js | 待實作 |
| **6** | Patient image upload | 0.5 天 | patients.js, index.js, migrate.js | 待實作 |
| **7** | Config key alias | 0.25 天 | system.js | 待實作 |

**關鍵路徑**: Phase 1-3 完成後（~2 天），Angular 前端即可正常運作。Phase 4-7 逐步補齊。

### 不需後端改動的 Angular Commits（~50 個）

純前端改動，TPH 不需修改：ICU 列印排版(4)、KiDIT 重構(4)、Lab/Med 修復(6)、
角色/權限 UI(3)、UI/導航調整(4)、庫存 UI(~10)、報表圖表(1)、護理 UI(2)、文件(2)

### Angular standalone 已知問題
- 自帶 server/ 後端與 TPH 完全不同步（全部檔案 DIFF），不應使用
- 兩套 API 客戶端並存（localApiClient.ts fetch + ApiService HttpClient）
- environment.ts 仍有 Firebase 憑證（未使用但應清除）
- legacy firebase.service.ts 仍存在（只是空殼）

## 已知陷阱（踩過的雷）

### 藥囑 `upload_month` 必須用「最新有效月份」而非當月精確比對

`injection_orders.upload_month` 代表「這份 Excel 是哪個月上傳的藥囑單」。醫院實際作業流程：
- 通常在每月**第三週**才更新藥囑，新設定會延續使用到下個月第三週左右
- 並非剛好月初切換 → 月初到第三週之間，當月可能根本沒有上傳檔

**錯誤寫法**（會在跨月後讓藥物全部消失）：
```sql
WHERE upload_month = ?  -- 當月
```

**正確寫法**（每位病人取 `<= 目標月份` 的最新一份）：
```sql
WITH latest_per_patient AS (
  SELECT patient_id, MAX(upload_month) AS effective_month
  FROM injection_orders
  WHERE patient_id IN (...) AND upload_month <= ?
  GROUP BY patient_id
)
SELECT io.* FROM injection_orders io
JOIN latest_per_patient lp
  ON io.patient_id = lp.patient_id AND io.upload_month = lp.effective_month
```

**適用範圍**（凡是「顯示某日/某月病人應施打的藥物」都遵守此邏輯）：
- `src/routes/medications.js` `daily-injections` — 護理分組、每日排程、我的病人列表
- `src/routes/orders.js` `/injection-orders?effectiveMonth=YYYY-MM` — 藥囑管理群組查詢

**例外**：OrdersView 個人年度檢視 (`searchIndividualOrders`) 仍用 `uploadMonth` 嚴格分月，因為它的語意是「追蹤每月實際上傳了什麼」，無上傳的月份就該空白。

### 排程例外重建必須驗證來源（避免「鬼魂病人」與「同人雙位置」）

`src/services/scheduleSync.js applySingleException()` 被排程重建路徑反覆呼叫。早期版本盲信例外當下記下的快照 (`from.bedNum/shiftCode`、`patient1.fromBedNum/fromShiftCode`)，導致兩種事故：

1. **SWAP 偽造病人**：來源位置已空，仍從例外資料偽造一個 slot 來交換 → 不應該出現在當天的病人被塞回排程
2. **MOVE 來源失效仍套用**：總表後來把該病人的床位改了，原 from 已不是他，但 target 端仍照樣放他 → 同一天兩個位置

**正確做法**：每次套用前驗證當前 schedule 的對應位置真的是預期病人；不是就回傳 `{ reason }` 並由外層標 `conflict_requires_resolution`，附具體訊息（如「原床位 5 床 早班 已不再是 王小明（目前為李大華），無法執行此調班作業故取消」）。**永遠不要從例外資料偽造 slot**。

### 刪除病人時要連帶清理排程相依

軟刪除病人 (`is_deleted=1`) 不會自動清掉這些東西：
- `base_schedules.MASTER_SCHEDULE` 中的規則 → 由前端 `removeRuleFromMasterSchedule()` 觸發 `syncMasterScheduleToFuture` 清掉未來 60 天
- `schedule_exceptions` 中的 pending/applied 例外 → 由後端 `cancelPendingExceptionsForPatient()` 同時取消（patient_id 欄位 + SWAP 的 patient1/patient2 JSON 兩條路徑）

兩條刪除路徑（`DELETE /api/patients/:id` 與 `PUT` 帶 `isDeleted: true`）都要呼叫這個 helper。否則被刪除的病人會透過調班例外重新出現在未來排程上。

### 病人 `dialysis_orders.freq` 不可被透析醫囑流程覆蓋

頻率只能在病人清單（`PatientFormModal`）或床位總表（`BaseScheduleView`）修改。原本的透析醫囑 dialog 有「頻次」free text input，加上 `createDialysisOrderAndUpdatePatient` 用 `freq: orderData.freq || ''` 預設值，會把空字串送進後端 `toDbFormat` 的 spread merge，把既有 freq 蓋成 `''` 或被使用者亂打成 `"3"` 等非法值。

修正後：
- `DialysisOrderModal.vue` 不再有 freq 輸入欄
- `dataToSave` 不包含 freq
- `optimizedApiService.js createDialysisOrderAndUpdatePatient` 的 `historyRecord.orders` 不寫 freq

未來新增任何「順便存醫囑」流程都要遵守這個規則。

## 前端跨頁狀態 (Pinia)

- `viewingDateStore` (`src/stores/viewingDateStore.ts`)：每日排程 (ScheduleView) 與護理分組 (StatsView) 共用同一個檢視日期。從一個跳到另一個會保留同一天，方便組長盯著未來某天的同一份資料。
- `patientStore`：全域病人快取（已存在）
- `medicationStore`：每日針劑快取（已存在）
- `taskStore`：交辦/留言/協作（已存在）
- `archiveStore`：歷史排程懶載入（已存在）

## 開發環境（本機跑）

- 後端：`npm run dev` (port 3000)
- 前端：在 `洗腎平台原始碼/` 跑 `npm run dev`（純 vite，proxy → 127.0.0.1:3000）
  - **不要**用 `npm run standalone`，會同時起本目錄內 `server/`（已知壞掉，CLAUDE.md 開頭也提過）
- vite proxy target 用 `127.0.0.1` 而非 `localhost`，否則 Node 20+ 解析 IPv6 撞 IPv4-only 後端
- CORS 在 `src/index.js` 的 `DEFAULT_DEV_ORIGINS` 把 5173/5174/5175 加入白名單；生產環境由 PM2 `ALLOWED_ORIGINS` env 接管

## 注意事項

- 前端原始碼在 `洗腎平台原始碼/` 目錄（Vue），`dist/` 是預建置產出
- Angular 前端原始碼在 `../dialysis-app-angular-standalone/client/`
- `backup.js` 被 scheduler.js 和 system.js import，修改時保持 import 不變
- Windows 環境路徑使用反斜線 (`D:\\dialysis-app\\`)
- PM2 設定在 `ecosystem.config.cjs` (CommonJS，因為 PM2 不支援 ESM config)
- 資料庫檔案在 `data/dialysis.db`，已被 `.gitignore` 排除
- 前端使用 `@/` 路徑別名指向 `洗腎平台原始碼/src/`
- Standalone 模式下 Firebase Firestore 被 mock 取代 (`mockFirestore.ts`)
