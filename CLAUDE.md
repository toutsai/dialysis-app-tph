# 透析排程系統 (dialysis-app-tph)

台北醫院血液透析中心管理平台。院內使用的全功能透析排程、病人管理、護理與醫囑系統。

## 技術棧

- **Backend**: Node.js (ESM) + Express.js
- **Database**: SQLite via better-sqlite3 (同步 API，全域單例連線)
- **Auth**: JWT + bcryptjs, Token 黑名單 + 單一裝置 Session
- **Frontend**: Vue 3 + Vuetify (預建置 SPA，由 Express 靜態 serve `dist/`)
- **排程任務**: node-cron
- **部署**: Windows VM, PM2 process manager
- **Package**: `"type": "module"` — 全專案使用 ES module (`import`/`export`)

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

## 注意事項

- 前端原始碼不在此 repo，`dist/` 是預建置產出
- `backup.js` 被 scheduler.js 和 system.js import，修改時保持 import 不變
- Windows 環境路徑使用反斜線 (`D:\\dialysis-app\\`)
- PM2 設定在 `ecosystem.config.cjs` (CommonJS，因為 PM2 不支援 ESM config)
- 資料庫檔案在 `data/dialysis.db`，已被 `.gitignore` 排除
