import volleyballUrl from '../assets/volleyball.svg'

const LoadingOverlay = () => (
  <div className="loading-overlay">
    <img
      className="loading-ball"
      src={volleyballUrl}
      alt="loading"
      width={80}
      height={80}
    />
  </div>
)

export default LoadingOverlay
