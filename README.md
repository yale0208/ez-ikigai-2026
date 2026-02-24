# 創準年度職涯回顧自評 MVP

靜態前端專案（HTML/CSS/JavaScript + Vue CDN + Chart.js），可直接部署到 GitHub Pages。

## 本機開啟

直接開啟 `index.html` 即可使用。

## 發布到 GitHub Pages

1. 將專案推到 GitHub Repository（例如 `main` 分支）。
2. 到 Repository 的 **Settings** → **Pages**。
3. 在 **Build and deployment** 中選擇：
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/ (root)`
4. 儲存後等待部署完成（通常 1–3 分鐘）。
5. 開啟產生的網址：
   - `https://<你的帳號>.github.io/<repo-name>/`

## 更新內容後重新發布

每次 push 到設定的分支（例如 `main`）後，GitHub Pages 會自動重新部署。

## 注意事項

- 本專案使用相對路徑（如 `./app.js`、`./style.css`），可正常部署於 repo 子路徑。
- 若更新後未看到新畫面，請先強制重新整理（Ctrl+F5）。

## 更新日誌

### 2026-02-24

- 初版上線（GitHub Pages）
- 完成 4 步流程：任務輸入 → 任務表現自評 → 結果分析 → 原始資料總表
- 加入雷達圖與長條圖
- 回饋內容改為 `feedback.config.js` 單一來源管理
