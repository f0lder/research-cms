import { useTheme } from "@/lib/theme";

export default function DebugView() {
  const colors = useTheme();

  const primary = colors.primary;
  const secondary = colors.secondary;
  const accent = colors.accent;
  const bg = colors.bg;
  const text = colors.text;
  const subText = colors.subText;
  const metaText = colors.metaText;
  const cardBg = colors.cardBg;
  const border = colors.border;
  const borderRadius = colors.borderRadius;
  const borderWidth = colors.borderWidth;
  return (
	<div style={{ padding: 20, background: bg, color: text }}>
	  <h1>Debug View</h1>
	  <p>This view can be used for testing and debugging during development.</p>

	  <div className="debug-grid">
		<div className="debug-color" style={{ background: primary }}> Primary</div>
		<div className="debug-color" style={{ background: secondary }}> Secondary</div>
		<div className="debug-color" style={{ background: accent }}> Accent</div>
		<div className="debug-color" style={{ background: bg }}> Background</div>
		<div className="debug-color" style={{ background: text }}> Text</div>
		<div className="debug-color" style={{ background: subText }}> Sub Text</div>
		<div className="debug-color" style={{ background: metaText }}> Meta Text</div>
		<div className="debug-color" style={{ background: cardBg }}> Card Background</div>
		<div className="debug-color" style={{ background: border }}> Border</div>
		<div className="debug-color" style={{ background: border, borderRadius: borderRadius }}> Border Radius</div>
		<div className="debug-color" style={{ background: border, borderWidth: borderWidth, borderStyle: 'solid' }}> Border Width</div>
	  </div>

	  <div>
		<h2>Sample Content</h2>
		<p>This is a sample paragraph to demonstrate the text color. The quick brown fox jumps over the lazy dog.</p>
		<button style={{ background: primary, color: text, border: 'none', padding: '8px 16px', cursor: 'pointer' }}>
		  Sample Button
		</button>
	  </div>

	  <div>
		<h2>Sample Card</h2>
		<div style={{ background: cardBg, padding: 20, borderRadius: borderRadius, border: `${borderWidth}px solid ${border}` }}>
		  <h3>Card Title</h3>
		  <p>This is a sample card to demonstrate the card background color.</p>
		</div>
	  </div>

	  <div>
		<h2>Border and Radius</h2>
		<p>Border: <span style={{ color: border }}>{border}</span></p>
		<p>Border Width: <span style={{ borderWidth: borderWidth }}>{borderWidth}px</span></p>
		<p>Border Radius: <span style={{ borderRadius: borderRadius }}>{borderRadius}px</span></p>
	  </div>

	  <div>
		<h2>Typography</h2>
		<p style={{ fontFamily: 'monospace' }}>This is monospace text.</p>
		<p style={{ fontFamily: 'serif' }}>This is serif text.</p>
		<p style={{ fontFamily: 'sans-serif' }}>This is sans-serif text.</p>
	  </div>

	  <div>
		<h2>Links</h2>
		<a href="#" style={{ color: primary }}>This is a sample link</a>
	  </div>

	  <div>
		<h2>Lists</h2>
		<ul>
		  <li>Unordered List Item 1</li>
		  <li>Unordered List Item 2</li>
		  <li>Unordered List Item 3</li>
		</ul>
	  </div>
	</div>
  );
}