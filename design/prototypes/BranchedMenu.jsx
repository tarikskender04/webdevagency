const { useLayoutEffect, useRef, useState, isValidElement } = React;

const CSS = `
.branched-menu {
  --bm-w: 240px;
  --bm-ink: #0A1A25;
  --bm-accent: #0C7CC4;
  --bm-line: #D4E2EC;
  --bm-font: 14px;
  --bm-row: 36px;
  --bm-indent: 40px;
  --bm-line-w: 1.5;
  --bm-draw: 400ms;
  --bm-fold: 300ms;
  --bm-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --bm-muted: color-mix(in srgb, var(--bm-ink) 55%, transparent);
  position: relative;
  display: flex;
  flex-direction: column;
  width: fit-content;
  max-width: min(var(--bm-w), 100%);
  padding-left: 14px;
  color: var(--bm-ink);
  font-family: inherit;
  font-size: var(--bm-font);
  line-height: 1.2;
}
.branched-menu::before {
  content: '';
  position: absolute;
  top: 8px;
  bottom: 0;
  left: 0;
  width: 2px;
  border-radius: 1px;
  background: linear-gradient(to bottom, var(--bm-line) 0%, var(--bm-line) 55%, transparent 100%);
}
.branched-menu__marker {
  position: absolute;
  top: -1px;
  left: 0;
  z-index: 1;
  width: 2px;
  height: 16px;
  border-radius: 1px;
  background: var(--bm-accent);
  opacity: 0;
  transition: top 220ms var(--bm-ease-out), opacity 150ms ease;
}
.branched-menu__marker[data-on] { opacity: 1; }
.branched-menu__section { display: flex; flex-direction: column; }
.branched-menu__head {
  display: block;
  margin: 0;
  padding: 9px 0;
  border: 0;
  background: none;
  color: var(--bm-muted);
  font: inherit;
  font-size: calc(var(--bm-font) + 1px);
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  transition: color 200ms ease;
}
.branched-menu__section[data-open] .branched-menu__head,
.branched-menu__head[data-active] { color: var(--bm-ink); }
@media (hover: hover) and (pointer: fine) {
  .branched-menu__head:hover { color: var(--bm-ink); }
}
.branched-menu__body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--bm-fold) var(--bm-ease-out);
}
.branched-menu__section[data-open] .branched-menu__body { grid-template-rows: 1fr; }
.branched-menu__fold { min-height: 0; overflow: hidden; }
.branched-menu__tree { position: relative; padding: 6px 0; box-sizing: border-box; }
.branched-menu__lines {
  position: absolute;
  top: 0;
  left: 0;
  overflow: visible;
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease;
}
.branched-menu__section[data-open] .branched-menu__lines {
  opacity: 1;
  transition: opacity 250ms ease 100ms;
}
.branched-menu__base,
.branched-menu__reach {
  fill: none;
  stroke-width: var(--bm-line-w);
  stroke-linecap: round;
  stroke-linejoin: round;
}
.branched-menu__base { stroke: var(--bm-line); }
.branched-menu__reach { stroke: var(--bm-accent); transition: stroke-dashoffset var(--bm-draw) var(--bm-ease-out); }
.branched-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: var(--bm-row);
  margin: 0;
  padding: 0 0 0 var(--bm-indent);
  border: 0;
  background: none;
  color: var(--bm-muted);
  font: inherit;
  text-align: left;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  transition: color 200ms ease;
}
@media (hover: hover) and (pointer: fine) {
  .branched-menu__item:hover { color: var(--bm-ink); }
}
.branched-menu__item[data-active] { color: var(--bm-accent); font-weight: 500; }
.branched-menu__icon { display: inline-flex; flex: none; }
.branched-menu__label { white-space: nowrap; }
@media (prefers-reduced-motion: reduce) {
  .branched-menu__marker { transition: opacity 150ms ease; }
  .branched-menu__body { transition: none; }
  .branched-menu__reach { transition: none; }
}
`;

if (typeof document !== 'undefined' && !document.getElementById('branched-menu-css')) {
  const el = document.createElement('style');
  el.id = 'branched-menu-css';
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* Kit icon set: 1.5px stroke, round caps, 16px box. */
const PATHS = {
  arrow: 'M4 12L12 4M12 4H6M12 4v6',
  plus: 'M8 3v10M3 8h10',
  check: 'M3.5 8.5l3 3L13 5',
  chevron: 'M6 3l5 5-5 5',
  swatch: 'M3 4.5h10M3 8h10M3 11.5h7',
  type: 'M3 4h10M8 4v8M5.5 12h5',
  grid: 'M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z',
  chart: 'M3 13V8M6.5 13V4M10 13v-3M13.5 13V6',
  spark: 'M8 2.5l1.6 3.5L13 8l-3.4 1.6L8 13.5 6.4 9.6 3 8l3.4-1.6L8 2.5z',
  image: 'M2.5 4.5h11v8h-11zM2.5 10l3-3 2.5 2.5 2-2 3.5 3.5',
  target: 'M8 2.5v11M2.5 8h11',
  layers: 'M8 2.5L14 6l-6 3.5L2 6l6-3.5zM2.5 9.5L8 12.7l5.5-3.2'
};

const renderIcon = icon => {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  const d = PATHS[icon];
  if (!d) return null;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const toSet = open => new Set(Array.isArray(open) ? open : open >= 0 ? [open] : []);
const num = (v, d) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : d;
};

const PAD = 6;
const MARK = 16;

const DEFAULT_ITEMS = [
  {
    label: 'Foundations',
    children: [
      { value: 'color', label: 'Color', icon: 'swatch' },
      { value: 'type', label: 'Typography', icon: 'type' },
      { value: 'grid', label: 'Grid & spacing', icon: 'grid' }
    ]
  },
  {
    label: 'Components',
    children: [
      { value: 'buttons', label: 'Buttons', icon: 'arrow' },
      { value: 'cards', label: 'Cards', icon: 'layers' },
      { value: 'glass', label: 'Glass surfaces', icon: 'image' }
    ]
  }
];

function BranchedMenu(props) {
  const items = Array.isArray(props.items) && props.items.length ? props.items : DEFAULT_ITEMS;
  const { onSelect, onToggle, className = '' } = props;
  const color = props.color || '#0A1A25';
  const accentColor = props.accentColor || '#0C7CC4';
  const lineColor = props.lineColor || '#D4E2EC';
  const width = num(props.width, 260);
  const rowHeight = num(props.rowHeight, 38);
  const indent = num(props.indent, 40);
  const trunk = num(props.trunk, 14);
  const radius = num(props.radius, 10);
  const lineWidth = num(props.lineWidth, 1.5);
  const fontSize = num(props.fontSize, 15);
  const drawDuration = num(props.drawDuration, 400);
  const foldDuration = num(props.foldDuration, 300);
  const defaultOpen = props.defaultOpen === undefined ? 0 : props.defaultOpen;

  const [open, setOpen] = useState(() => toSet(defaultOpen));
  const [active, setActive] = useState(() => {
    if (props.defaultActive) return props.defaultActive;
    const first = items.find((it, i) => it.children && toSet(defaultOpen).has(i));
    return (first && first.children && first.children[0] && first.children[0].value) || '';
  });

  const navRef = useRef(null);
  const heads = useRef([]);
  const markerRef = useRef(null);
  const latest = useRef({});
  latest.current = { onSelect, onToggle };

  const activeSection = items.findIndex(it => it.children && it.children.some(kid => kid.value === active));
  const markerShown = activeSection >= 0 && open.has(activeSection);

  useLayoutEffect(() => {
    const place = glide => {
      const m = markerRef.current;
      const el = heads.current[activeSection];
      if (!m) return;
      const on = markerShown && el;
      if (!glide) m.style.transition = 'none';
      if (on) m.style.top = `${el.offsetTop + (el.offsetHeight - MARK) / 2}px`;
      m.toggleAttribute('data-on', Boolean(on));
      if (!glide) {
        void m.offsetHeight;
        m.style.transition = '';
      }
    };
    place(true);
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) { first = false; return; }
      place(false);
    });
    if (navRef.current) ro.observe(navRef.current);
    return () => ro.disconnect();
  }, [activeSection, markerShown, items, fontSize, rowHeight]);

  const select = (value, item) => {
    setActive(value);
    if (latest.current.onSelect) latest.current.onSelect(value, item);
  };
  const toggle = i => {
    setOpen(prev => {
      const next = new Set(prev);
      const isOpen = !next.has(i);
      if (isOpen) next.add(i); else next.delete(i);
      if (latest.current.onToggle) latest.current.onToggle(i, isOpen);
      return next;
    });
  };

  const r = Math.min(radius, rowHeight / 2 - 2);
  const endX = indent - 8;
  const rowY = k => PAD + k * rowHeight + rowHeight / 2;
  const branch = k => `M ${trunk} ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`;
  const reach = k => `M ${trunk} 0 V ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`;
  const length = k => rowY(k) - r + (Math.PI * r) / 2 + (endX - trunk - r);

  return (
    <nav
      ref={navRef}
      className={`branched-menu${className ? ` ${className}` : ''}`}
      style={{
        '--bm-w': `${width}px`,
        '--bm-ink': color,
        '--bm-accent': accentColor,
        '--bm-line': lineColor,
        '--bm-font': `${fontSize}px`,
        '--bm-row': `${rowHeight}px`,
        '--bm-indent': `${indent}px`,
        '--bm-line-w': lineWidth,
        '--bm-draw': `${drawDuration}ms`,
        '--bm-fold': `${foldDuration}ms`
      }}
    >
      <span ref={markerRef} className="branched-menu__marker" aria-hidden="true" />
      {items.map((item, i) => {
        const kids = item.children;
        const isOpen = kids ? open.has(i) : false;
        const leafValue = item.value || item.label;
        const leafActive = !kids && leafValue === active;
        const bodyH = kids ? PAD * 2 + kids.length * rowHeight : 0;
        return (
          <div key={item.value || item.label} className="branched-menu__section" data-open={isOpen ? '' : undefined}>
            <button
              ref={el => { heads.current[i] = el; }}
              type="button"
              className="branched-menu__head"
              aria-expanded={kids ? isOpen : undefined}
              data-active={leafActive ? '' : undefined}
              onClick={() => (kids ? toggle(i) : select(leafValue, item))}
            >
              {item.label}
            </button>
            {kids ? (
              <div className="branched-menu__body">
                <div className="branched-menu__fold">
                  <div className="branched-menu__tree" style={{ height: bodyH }}>
                    <svg className="branched-menu__lines" width={indent} height={bodyH} aria-hidden="true">
                      <path className="branched-menu__base" d={`M ${trunk} 0 V ${rowY(kids.length - 1) - r}`} />
                      {kids.map((kid, k) => (
                        <path key={`b-${kid.value}`} className="branched-menu__base" d={branch(k)} />
                      ))}
                      {kids.map((kid, k) => (
                        <path
                          key={`r-${kid.value}`}
                          className="branched-menu__reach"
                          d={reach(k)}
                          style={{
                            strokeDasharray: length(k),
                            strokeDashoffset: kid.value === active ? 0 : length(k)
                          }}
                        />
                      ))}
                    </svg>
                    {kids.map(kid => (
                      <button
                        key={kid.value}
                        type="button"
                        className="branched-menu__item"
                        aria-current={kid.value === active ? 'true' : undefined}
                        data-active={kid.value === active ? '' : undefined}
                        tabIndex={isOpen ? 0 : -1}
                        onClick={() => select(kid.value, kid)}
                      >
                        {kid.icon ? <span className="branched-menu__icon">{renderIcon(kid.icon)}</span> : null}
                        <span className="branched-menu__label">{kid.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

module.exports = { BranchedMenu };
