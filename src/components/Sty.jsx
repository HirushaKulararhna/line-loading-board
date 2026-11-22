import { hue } from '../lib/model';
// A small coloured chip for a style code. Red dashed when the style has no machine layout.
// Pass onClick to make it a button (used to open the style details panel).
export default function Sty({ code, bad, onClick }) {
  const cls = 'sty' + (bad ? ' bad' : '') + (onClick ? ' click' : '');
  const style = { '--h': hue(code) };
  if (!onClick) return <span className={cls} style={style}>{code}</span>;
  return <button type="button" className={cls} style={style} onClick={() => onClick(code)} title="Show all machines for this style">{code}</button>;
}
