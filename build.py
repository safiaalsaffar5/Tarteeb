#!/usr/bin/env python3
"""Assemble src/ into a single self-contained index.html (and an artifact fragment)."""
import re, sys, pathlib
R = pathlib.Path(__file__).parent
src = lambda n: (R / 'src' / n).read_text(encoding='utf-8')
css = src('style.css') + src('style2.css')
js = '\n'.join(src(n) for n in ['helpers.js', 'core.js', 'views.js', 'import.js', 'main.js'])
head = '''<title>ترتيب</title>
<meta name="claude:viewport-fit-sides" content="cover">
<script>document.documentElement.lang='ar';document.documentElement.dir='rtl';</script>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap">
<style>''' + css + '''</style>'''
body = '''<div class="app">
  <header class="top">
    <div class="brand">
      <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="4" width="28" height="7" rx="3.5" fill="var(--brand)"/><rect x="2" y="13" width="20" height="7" rx="3.5" fill="var(--brand)" opacity=".7"/><rect x="2" y="22" width="12" height="7" rx="3.5" fill="var(--gold)"/></svg>
      <span>ترتيب</span>
    </div>
    <nav class="nav" id="nav" aria-label="التنقل"></nav>
    <div class="tools">
      <span id="syncSlot"></span>
      <div class="monthsw" role="group" aria-label="الشهر">
        <button class="ibtn" data-act="month-prev" aria-label="الشهر السابق" id="mPrev"></button>
        <span id="mLabel"></span>
        <button class="ibtn" data-act="month-next" aria-label="الشهر التالي" id="mNext"></button>
      </div>
      <button class="ibtn solid" data-act="theme" aria-label="تبديل الوضع الليلي" id="themeBtn"></button>
      <button class="ibtn solid" data-act="settings" aria-label="الإعدادات" id="setBtn"></button>
    </div>
  </header>
  <div id="banner"></div>
  <main id="view"></main>
</div>
<nav class="tabbar" id="tabbar" aria-label="التنقل السفلي"></nav>
<button class="fab" data-act="add" aria-label="إضافة عملية"></button>
<div id="modal-root"></div>
<div id="toasts" role="status" aria-live="polite"></div>
<canvas id="fx" aria-hidden="true"></canvas>
<input type="file" id="fileIn" accept=".xlsx,.xls,.csv,.ods" hidden>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<script>
(function(){
'use strict';
''' + js + '''
})();
</script>'''
full = ('<!doctype html>\n<html lang="ar" dir="rtl">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        + head + '\n</head>\n<body>\n' + body + '\n</body>\n</html>\n')
(R / 'index.html').write_text(full, encoding='utf-8')
if len(sys.argv) > 1:
    pathlib.Path(sys.argv[1]).write_text(head + '\n' + body + '\n', encoding='utf-8')
print('built', len(full), 'bytes')
