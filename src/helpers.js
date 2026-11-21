/* ---------- helpers ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.round(n).toLocaleString('en-US');
const pad=n=>String(n).padStart(2,'0');
const uid=()=>Math.random().toString(36).slice(2,9);
const MONTHS=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const CURR={sar:'ر.س',aed:'د.إ',kwd:'د.ك',qar:'ر.ق',bhd:'د.ب',omr:'ر.ع',egp:'ج.م',usd:'$'};
const PALETTE=['#2A9D7C','#4C78C8','#C98A2E','#C45A6C','#7A66C2','#3A93AE','#7A9E45','#B9683F'];
const ICONS={
 home:'<path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6"/>',
 basket:'<path d="M3 9h18l-2 11H5L3 9zM8 9l3-6M16 9l-3-6"/>',
 game:'<path d="M6 8h12a4 4 0 014 4v2a3 3 0 01-5 2l-1-2H8l-1 2a3 3 0 01-5-2v-2a4 4 0 014-4zM8 10v4M6 12h4M16 11h.01M18 13h.01"/>',
 coins:'<path d="M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
 shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
 car:'<path d="M5 16l1.5-5a2 2 0 012-1.5h7a2 2 0 012 1.5L19 16M4 16h16v3H4zM7 19v2M17 19v2"/>',
 heart:'<path d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 9c0 6-8 11-8 11z"/>',
 book:'<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 19a2 2 0 012-2h13"/>',
 plane:'<path d="M3 13l18-9-5 17-4-7zM12 14l9-10"/>',
 bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
 star:'<path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.5l6.3-.7z"/>',
 flame:'<path d="M12 22c4 0 7-2.7 7-6.5 0-3-2-5-3-7-1 2-2 2.5-3 2.5 0-3-1-6-4-8 0 4-4 6-4 11 0 4.3 3 8 7 8z"/>',
 trophy:'<path d="M7 4h10v5a5 5 0 01-10 0zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M12 14v4M8 21h8M10 18h4"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 chart:'<path d="M3 20h18M6 16l4-5 3 3 5-7"/>',
 wallet:'<path d="M3 7a2 2 0 012-2h13v4M3 7v11a2 2 0 002 2h15V9H5a2 2 0 01-2-2z"/><path d="M16 14h.01"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
 upload:'<path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 left:'<path d="M15 6l-6 6 6 6"/>',
 right:'<path d="M9 6l6 6-6 6"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
 moon:'<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 file:'<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h6"/>',
 check:'<path d="M5 12l5 5 9-10"/>',
 x:'<path d="M6 6l12 12M18 6L6 18"/>',
 cloud:'<path d="M7 18a5 5 0 01-.9-9.9A6 6 0 0117.6 9 4.5 4.5 0 0117 18z"/>',
 cloudoff:'<path d="M7 18a5 5 0 01-.9-9.9M10 6.3A6 6 0 0117.6 9 4.5 4.5 0 0119.8 16M3 3l18 18"/>',
 device:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
 repeat:'<path d="M17 2l3 3-3 3M4 11V9a4 4 0 014-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 01-4 4H4"/>',
 bank:'<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18"/>',
 edit:'<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>',
 download:'<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 bars:'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
 arrowup:'<path d="M12 19V5M6 11l6-6 6 6"/>',
 arrowdown:'<path d="M12 5v14M6 13l6 6 6-6"/>',
 spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
 plusc:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
 flow:'<path d="M3 6h4c6 0 6 12 12 12h2M3 18h4c2 0 3-1.5 4-3M21 6h-2c-2 0-3 1.5-4 3"/>',
 down:'<path d="M6 9l6 6 6-6"/>',
 up:'<path d="M6 15l6-6 6 6"/>'
};
const ic=(n,cls='')=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${cls?`class="${cls}"`:''}>${ICONS[n]||ICONS.bolt}</svg>`;
const ICON_CHOICES=['home','basket','game','coins','shield','car','heart','book','plane','bolt','star','bank','target'];

