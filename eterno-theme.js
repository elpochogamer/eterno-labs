/**
 * Eterno — tema claro/oscuro persistente.
 * Clave localStorage: 'eterno_theme' ('light' | 'dark' | 'auto').
 * Nunca toca eterno_database_v1 ni el schema de EternoStore.
 * Debe cargarse antes de eterno-nav.js.
 */
(function (global) {
  'use strict';

  const THEME_KEY = 'eterno_theme';
  const VALID = ['light', 'dark', 'auto'];
  const mq = global.matchMedia ? global.matchMedia('(prefers-color-scheme: dark)') : null;
  const listeners = [];

  function stored() {
    try {
      const v = localStorage.getItem(THEME_KEY);
      return VALID.includes(v) ? v : 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  function resolve(pref) {
    if (pref === 'light' || pref === 'dark') return pref;
    return (mq && mq.matches) ? 'dark' : 'light';
  }

  function apply() {
    const theme = resolve(stored());
    document.documentElement.dataset.theme = theme;
    listeners.forEach(cb => { try { cb(theme); } catch (e) { /* callback ajeno */ } });
    document.dispatchEvent(new CustomEvent('eterno:themechange', { detail: { theme } }));
    return theme;
  }

  function get() {
    return stored();
  }

  function set(v) {
    if (!VALID.includes(v)) return;
    try { localStorage.setItem(THEME_KEY, v); } catch (e) { /* storage bloqueado: aplica solo en memoria */ }
    apply();
  }

  function toggle() {
    set(resolve(stored()) === 'dark' ? 'light' : 'dark');
  }

  function onChange(cb) {
    if (typeof cb === 'function') listeners.push(cb);
  }

  if (mq) {
    const onMq = () => { if (stored() === 'auto') apply(); };
    if (mq.addEventListener) mq.addEventListener('change', onMq);
    else if (mq.addListener) mq.addListener(onMq);
  }

  apply();

  global.EternoTheme = { get, set, toggle, onChange };
})(typeof window !== 'undefined' ? window : globalThis);
