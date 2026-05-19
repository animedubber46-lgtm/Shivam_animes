export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "unknown";
  
  const nav = window.navigator;
  const screen = window.screen;
  
  const components = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    !!window.indexedDB,
    typeof (window as any).openDatabase !== "undefined",
    nav.platform,
    nav.doNotTrack,
  ];

  const str = components.join("|||");
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return "dev_" + Math.abs(hash).toString(16);
}
