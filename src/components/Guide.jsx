import { useState } from 'react'
import Icon from './Icon'

const TABS = ['遠端模式', '單機模式', '其他操作', '常見問題']

const Section = ({ title, children }) => (
  <div className="guide-section">
    <h2 className="guide-section-title">{title}</h2>
    {children}
  </div>
)

const Note = ({ children }) => (
  <p className="guide-note">{children}</p>
)

const SubTitle = ({ children }) => (
  <p className="guide-p" style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 6 }}>{children}</p>
)

const LandingBtnPreview = ({ variant, children }) => (
  <span className={`btn landing-btn landing-btn--${variant} guide-hint-btn`}>{children}</span>
)

const BtnHint = ({ children }) => (
  <div className="guide-hint">{children}</div>
)

const FaqItem = ({ q, children }) => (
  <div className="guide-faq-item">
    <p className="guide-faq-q">{q}</p>
    <div className="guide-faq-a">{children}</div>
  </div>
)

const TabRemote = () => (
  <>
    <p className="guide-p">多支裝置加入同一個房間，即時同步分數。適合一台顯示、一或多台控制的場景。</p>
    <BtnHint>
      <LandingBtnPreview variant="display">建立房間</LandingBtnPreview>
      <LandingBtnPreview variant="controller">加入房間</LandingBtnPreview>
    </BtnHint>

    <SubTitle>建立房間</SubTitle>
    <ol className="guide-steps">
      <li className="guide-step"><span className="guide-step-num">1.</span><span>點選「建立房間」，系統自動產生 4 位數代碼與網頁 QR code</span></li>
      <li className="guide-step"><span className="guide-step-num">2.</span><span>將代碼分享給其他裝置加入</span></li>
    </ol>

    <SubTitle style={{ marginTop: '8px' }}>加入房間</SubTitle>
    <ol className="guide-steps">
      <li className="guide-step"><span className="guide-step-num">1.</span><span>點選「加入房間」</span></li>
      <li className="guide-step"><span className="guide-step-num">2.</span><span>輸入 4 位數代碼</span></li>
    </ol>

    <Note>各裝置不需在同一個 Wi-Fi，只要各自有網路連線即可。</Note>
  </>
)

const TabOffline = () => (
  <>
    <BtnHint>
      <LandingBtnPreview variant="offline">快速開始</LandingBtnPreview>
    </BtnHint>
    <p className="guide-p">點選「快速開始」，不需要網路或房間代碼，直接進入計分。</p>
    <Note>單機模式的資料僅存在當前瀏覽器，返回首頁或關閉分頁後會清除。</Note>
  </>
)

const TabOther = () => (
  <>
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
              <td>頁面頂端切換開關，開啟後始能控制分數</td>
            </tr>
            <tr>
              <td>加分 +1</td>
              <td>點擊分數卡 或 下方＋按鈕</td>
            </tr>
            <tr>
              <td>減分 −1</td>
              <td>點擊分數卡下方－按鈕</td>
            </tr>
            <tr>
              <td>重置比分</td>
              <td>長按－按鈕 或 開啟設定面板 → 重置</td>
            </tr>
            <tr>
              <td>隊伍顯示位置互換</td>
              <td>拖曳任一分數卡，至另一側放開</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Section>

    <Section title="隊伍設定">
      <p className="guide-p">開啟設定面板可自訂隊伍名稱與顏色。</p>
      <ul className="guide-steps">
        <li className="guide-step"><span className="guide-step-num">．</span><span>隊伍名稱：自由輸入，留空則不顯示</span></li>
        <li className="guide-step"><span className="guide-step-num">．</span><span>顏色：6 個預設色，或點擊色塊自訂任意顏色</span></li>
      </ul>
    </Section>

    <Section title="抽籤分隊">
      <p className="guide-p">在設定面板開啟「抽籤分隊」，分別輸入 ♂／♀ 人數後會自動平均分成三隊，且各隊會依比例分配到男女生，不會集中在同一隊。若各隊人數需要不均分配，可切換「自訂各隊人數」自行指定 A/B/C 隊各要抽幾人。</p>

      <SubTitle>綁定群組</SubTitle>
      <p className="guide-p">新增群組時可分別指定男、女人數（例如 4 男 1 女），群組整組一定會一起分到同一隊。</p>
      <ul className="guide-steps">
        <li className="guide-step"><span className="guide-step-num">．</span><span>派代表抽籤：整組人一起隨機分到某一隊，抽籤時以一張籤卡代表整組</span></li>
        <li className="guide-step"><span className="guide-step-num">．</span><span>固定隊伍：直接指定這組人進某一隊，不參與抽籤</span></li>
      </ul>

      <SubTitle style={{ marginTop: '8px' }}>指定計分</SubTitle>
      <p className="guide-p">已加入的「固定隊伍」群組，可點擊列表中的 <Icon name="pencil" size={12} /> 圖示，指定由這組人負責該隊計分（同一隊最多指定一組）。沒有指定的隊伍，抽籤結束後會從該隊籤卡中隨機挑一張標示 <Icon name="pencil" size={12} /> 記號，作為建議的計分人選。</p>

      <SubTitle style={{ marginTop: '8px' }}>開始抽籤</SubTitle>
      <ol className="guide-steps">
        <li className="guide-step"><span className="guide-step-num">1.</span><span>設定男女人數與綁定群組後，點選「開始抽籤」</span></li>
        <li className="guide-step"><span className="guide-step-num">2.</span><span>抽籤結果分「群組卡」「♂ 個人卡」「♀ 個人卡」三區，逐張點擊翻牌，各隊已分配人數會即時顯示於上方；沒有內容的區塊不會顯示</span></li>
        <li className="guide-step"><span className="guide-step-num">3.</span><span>不滿意結果可點「回設定」調整，或「重新抽籤」重來</span></li>
      </ol>
      <Note>房間模式下，人數與群組設定會存在房間裡，下次重新開啟抽籤分隊會沿用上次的設定；快速開始（單機模式）則每次重新填寫。</Note>
    </Section>

    <Section title="局數記錄">
      <p className="guide-p">每局結束後可在設定面板儲存當局比分，最多保留 5 筆。紀錄可個別刪除，也會在重置時一併清除。</p>
    </Section>
  </>
)

const TabFaq = () => (
  <>
    <FaqItem q="Q：離開頁面後找不回房間代碼？">
      返回首頁後房間代碼不會保留。若需重新加入，請對方重新建立房間，或事先截圖保存房間碼。
    </FaqItem>
    <FaqItem q="Q：沒有網路可以使用嗎？">
      可以。選擇「快速開始」進入單機模式，完全離線運作。安裝為 App 後也可在無網路環境下開啟。
    </FaqItem>
    <FaqItem q="Q：如何全螢幕顯示？">
      <p className="guide-faq-a" style={{ margin: '0 0 10px' }}>將 VolleyScore 安裝到主畫面，之後從主畫面圖示開啟即以全螢幕模式執行。</p>
      <SubTitle>iOS（Safari）</SubTitle>
      <ol className="guide-steps" style={{ marginBottom: 12 }}>
        <li className="guide-step"><span className="guide-step-num">1.</span><span>點選底部工具列的「分享」按鈕</span></li>
        <li className="guide-step"><span className="guide-step-num">2.</span><span>選擇「加入主畫面」</span></li>
      </ol>
      <SubTitle>Android（Chrome）</SubTitle>
      <ol className="guide-steps">
        <li className="guide-step"><span className="guide-step-num">1.</span><span>點選右上角選單（⋮）</span></li>
        <li className="guide-step"><span className="guide-step-num">2.</span><span>選擇「安裝應用程式」或「新增至主畫面」</span></li>
      </ol>
    </FaqItem>
  </>
)

const TAB_CONTENT = [<TabRemote />, <TabOffline />, <TabOther />, <TabFaq />]

const Guide = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="guide-overlay">
      <div className="guide-header">
        <span className="guide-title">使用說明</span>
        <button className="btn guide-close" onClick={onClose} aria-label="關閉">
          <Icon name="close" size={20} />
        </button>
      </div>

      <div className="guide-intro">
        排球計分工具，支援<strong>遠端模式</strong>（多裝置同步）和<strong>單機模式</strong>（單裝置離線）。
      </div>

      <div className="guide-tabs">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`guide-tab${activeTab === i ? ' active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="guide-body">
        {TAB_CONTENT[activeTab]}
      </div>
    </div>
  )
}

export default Guide
