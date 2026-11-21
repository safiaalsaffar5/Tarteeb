# ترتيب

تطبيق عربي لتقسيم الراتب وتتبع المصروفات والمدخرات.

- `index.html` — التطبيق كامل في ملف واحد (يُبنى تلقائياً، لا تعدّله يدوياً).
- `src/` — الكود المصدري: `helpers.js`، `core.js` (الحسابات والحفظ السحابي)، `views.js` (الواجهات)، `import.js` (قراءة Excel)، `main.js` (الأحداث والتشغيل)، و`style.css` + `style2.css`.
- `build.py` — يجمع `src/` في `index.html`:

```
python3 build.py
```

- `samples/sample-bank-statement.xlsx` — كشف حساب تجريبي لتجربة الاستيراد.
