export function AnimatedLogoSplash() {
  return (
    <main className="ioi-splash" aria-label="Loading IOI Education Network">
      <div className="ioi-splash__ambient ioi-splash__ambient--left" aria-hidden="true" />
      <div className="ioi-splash__ambient ioi-splash__ambient--right" aria-hidden="true" />
      <div className="ioi-splash__rings" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="ioi-splash__content">
        <div className="ioi-splash__logo-wrap">
          <div className="ioi-splash__halo" aria-hidden="true" />
          <img className="ioi-splash__logo" src="/ioi-app-logo.png" alt="IOI English Speaking" />
        </div>
        <div className="ioi-splash__copy">
          <p className="ioi-splash__eyebrow">I O I</p>
          <h1>Education Network</h1>
          <p>AI-Powered English Learning</p>
        </div>
        <div className="ioi-splash__loader" role="status" aria-label="Loading">
          <span className="ioi-splash__bar" />
        </div>
      </div>
    </main>
  );
}
