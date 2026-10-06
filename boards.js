// Full-page frames report their content height; grow each iframe to fit.
window.addEventListener('message', e => {
  const d = e.data;
  if (!d || d.wie !== 'h' || typeof d.id !== 'string' || !Number.isFinite(d.h)) return;
  const f = document.querySelector(`iframe[data-frame="${CSS.escape(d.id)}"]`);
  if (f && e.source === f.contentWindow) f.style.height = d.h + 'px';
});
