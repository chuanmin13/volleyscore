// ♂/♀ 是 Unicode 符號，字型內建行高比數字高很多，用 inline-flex + align-items:center
// 讓瀏覽器依 flex 對齊、不靠字型基線計算，才不會在極小的籤卡裡被裁成只剩上半顆字
const GenderCount = ({ male, female }) => (
  <span className="draw-gender-count">
    {male > 0 && (
      <span className="draw-gender-count-item">
        {male}<span className="draw-gender-symbol">♂</span>
      </span>
    )}
    {female > 0 && (
      <span className="draw-gender-count-item">
        {female}<span className="draw-gender-symbol">♀</span>
      </span>
    )}
  </span>
)

export default GenderCount
