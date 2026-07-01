import Icon from './Icon'

const Section = ({ title, children }) => (
  <div className="guide-section">
    <h2 className="guide-section-title">{title}</h2>
    {children}
  </div>
)

const Note = ({ children }) => (
  <p className="guide-note">{children}</p>
)

const Guide = ({ onClose }) => (
  <div className="guide-overlay">
    <div className="guide-header">
      <span className="guide-title">使用說明</span>
      <button className="btn guide-close" onClick={onClose} aria-label="關閉">
        <Icon name="close" size={20} />
      </button>
    </div>

    <div className="guide-body">

      <Section title="關於 VolleyScore">
        <p className="guide-p">
          排球計分工具，可在手機或平板的瀏覽器直接開啟使用，也支援安裝到主畫面以全螢幕模式執行。
          提供兩種使用情境：<strong>遠端模式</strong>（多裝置同步）和<strong>單機模式</strong>（單一裝置離線）。
        </p>
      </Section>

      <Section title="遠端模式">
        <p className="guide-p">多支裝置加入同一個房間，即時同步分數。適合一台顯示、一台控制的場景。</p>

        <p className="guide-p" style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 6 }}>建立房間</p>
        <ol className="guide-steps">
          <li className="guide-step"><span className="guide-step-num">1</span><span>點選「建立房間」，系統自動產生 4 位數代碼與 QR code</span></li>
          <li className="guide-step"><span className="guide-step-num">2</span><span>將代碼或 QR code 分享給其他裝置掃描加入</span></li>
        </ol>

        <p className="guide-p" style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 6, marginTop: 14 }}>加入房間</p>
        <ol className="guide-steps">
          <li className="guide-step"><span className="guide-step-num">1</span><span>點選「加入房間」</span></li>
          <li className="guide-step"><span className="guide-step-num">2</span><span>輸入 4 位數代碼，或直接掃描 QR code</span></li>
        </ol>

        <Note>各裝置不需在同一個 Wi-Fi，只要各自有網路連線即可。</Note>
      </Section>

      <Section title="單機模式">
        <p className="guide-p">點選「快速開始」，不需要網路或房間代碼，直接進入計分。</p>
        <Note>單機模式的資料僅存在當前瀏覽器，返回首頁或關閉分頁後會清除。</Note>
      </Section>

      <Section title="計分操作">
        <div style={{ overflowX: 'auto' }}>
          <table className="guide-table">
            <thead>
              <tr>
                <th>操作</th>
                <th>方法</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>切換計分模式</td>
                <td>頁面頂端切換開關，開啟後才能加分</td>
              </tr>
              <tr>
                <td>加分 +1</td>
                <td>點擊分數卡右半部（＋按鈕）</td>
              </tr>
              <tr>
                <td>減分 −1</td>
                <td>點擊分數卡左半部（－按鈕）</td>
              </tr>
              <tr>
                <td>重置比分</td>
                <td>開啟設定面板 → 重置</td>
              </tr>
              <tr>
                <td>左右互換隊伍</td>
                <td>長按任一分數卡，拖曳至另一側放開</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="隊伍設定">
        <p className="guide-p">開啟設定面板可自訂隊伍名稱與顏色。</p>
        <ul className="guide-steps">
          <li className="guide-step"><span className="guide-step-num">·</span><span>隊伍名稱：自由輸入，留空則不顯示</span></li>
          <li className="guide-step"><span className="guide-step-num">·</span><span>顏色：6 個預設色，或點擊色塊自訂任意顏色</span></li>
        </ul>
      </Section>

      <Section title="局數記錄">
        <p className="guide-p">每局結束後可在設定面板儲存當局比分，最多保留 5 筆。紀錄可個別刪除，也會在重置時一併清除。</p>
      </Section>

      <Section title="安裝為 App">
        <p className="guide-p" style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 6 }}>iOS（Safari）</p>
        <ol className="guide-steps">
          <li className="guide-step"><span className="guide-step-num">1</span><span>點選底部工具列的「分享」按鈕</span></li>
          <li className="guide-step"><span className="guide-step-num">2</span><span>選擇「加入主畫面」</span></li>
        </ol>

        <p className="guide-p" style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 6, marginTop: 14 }}>Android（Chrome）</p>
        <ol className="guide-steps">
          <li className="guide-step"><span className="guide-step-num">1</span><span>點選右上角選單（⋮）</span></li>
          <li className="guide-step"><span className="guide-step-num">2</span><span>選擇「安裝應用程式」或「新增至主畫面」</span></li>
        </ol>

        <Note>安裝後以全螢幕執行，體驗更接近原生 App。</Note>
      </Section>

      <Section title="常見問題">
        <div className="guide-faq-item">
          <p className="guide-faq-q">Q：離開頁面後找不回房間代碼？</p>
          <p className="guide-faq-a">返回首頁後房間代碼不會保留。若需重新加入，請對方重新建立房間，或事先截圖保存 QR code。</p>
        </div>
        <div className="guide-faq-item">
          <p className="guide-faq-q">Q：不小心多加了一分怎麼辦？</p>
          <p className="guide-faq-a">點擊分數卡左半部（－按鈕）可減分，即時修正。</p>
        </div>
        <div className="guide-faq-item">
          <p className="guide-faq-q">Q：沒有網路可以使用嗎？</p>
          <p className="guide-faq-a">可以。選擇「快速開始」進入單機模式，完全離線運作。安裝為 App 後也可在無網路環境下開啟。</p>
        </div>
      </Section>

    </div>
  </div>
)

export default Guide
