# Domain 遷移計劃

## 背景

將部署平台從 GitHub Pages 遷移至 Vercel，並啟用自訂網域。

- 舊網址：`https://chuanmin13.github.io/volleyscore/`
- 新網址：`https://volleyscore.ctheworldx.com`

---

## 任務一：修正 Vercel 部署白頁

**根本原因**

`vite.config.js` 的 `base: '/volleyscore/'` 是針對 GitHub Pages 子路徑設定的。
Vercel 部署在根路徑 `/`，導致所有靜態資源 404，網頁全白。

**修改項目**

| 檔案 | 欄位 | 舊值 | 新值 |
|------|------|------|------|
| `vite.config.js` | `base` | `/volleyscore/` | `/` |
| `vite.config.js` | PWA `start_url` | `/volleyscore/` | `/` |

---

## 任務二：舊網址自動導向（方案 B）

**做法**：修改 `.github/workflows/deploy.yml`，讓 GitHub Pages 部署一個 redirect 頁面，取代原本的 app。

**redirect 頁面行為**
1. JavaScript 立即跳轉（0 秒）
2. Fallback：`<meta http-equiv="refresh" content="0">` 保底

**修改項目**

| 檔案 | 變更說明 |
|------|---------|
| `.github/workflows/deploy.yml` | 改為產生並部署 redirect HTML，不再 build app |

**redirect HTML 內容**（部署至 GitHub Pages 的 `index.html`）

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=https://volleyscore.ctheworldx.com">
  <title>VolleyScore — 已遷移</title>
</head>
<body>
  <script>window.location.replace("https://volleyscore.ctheworldx.com");</script>
  <p>正在跳轉至新網址… <a href="https://volleyscore.ctheworldx.com">點此前往</a></p>
</body>
</html>
```

---

## 執行順序

1. 修改 `vite.config.js`（base + start_url）
2. 修改 `.github/workflows/deploy.yml`
3. Push 到 `main`
   - Vercel 自動觸發，build 並部署到 `volleyscore.ctheworldx.com`
   - GitHub Actions 觸發，部署 redirect 頁面到 `chuanmin13.github.io/volleyscore/`

---

## 注意事項

- PWA Service Worker：舊網址的 SW 可能讓使用者停在快取版本。redirect 頁面本身不需要 SW，舊 SW 會在使用者下次開啟時被新頁面覆蓋。
- Vercel 不需要 `vercel.json`，此專案無 React Router，預設行為即可。
