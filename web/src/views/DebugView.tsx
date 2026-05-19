import { useTheme } from "@/lib/theme";

export default function DebugView({ settings }: { settings: Record<string, unknown> }) {
  const colors = useTheme();
  const { primary, secondary, accent, bg, text, subText, metaText, cardBg, border, borderRadius, borderWidth } = colors;

  return (
    <div style={{ padding: 20, background: bg, color: text }}>
      <h1>Debug View</h1>

      <h2>Settings</h2>
      <pre style={{ background: cardBg, padding: 16, borderRadius, border: `${borderWidth}px solid ${border}`, fontSize: 13, overflow: 'auto', maxHeight: 400 }}>
        {JSON.stringify(settings, null, 2)}
      </pre>

      <h2>Theme Colors</h2>
      <div className="debug-grid">
        {Object.entries(colors).filter(([,v]) => typeof v === 'string').map(([name, value]) => (
          <div key={name} className="debug-color" style={{ background: value as string, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {name}
          </div>
        ))}
      </div>

      <div>
        <h2>Sample Content</h2>
        <p>This is a sample paragraph to demonstrate the text color. The quick brown fox jumps over the lazy dog.</p>
        <button style={{ background: primary, color: '#fff', border: 'none', padding: '8px 16px', cursor: 'pointer' }}>
          Sample Button
        </button>
      </div>

      <div>
        <h2>Sample Card</h2>
        <div style={{ background: cardBg, padding: 20, borderRadius, border: `${borderWidth}px solid ${border}` }}>
          <h3>Card Title</h3>
          <p>This is a sample card to demonstrate the card background color.</p>
        </div>
      </div>
    </div>
  );
}