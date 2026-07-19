'use strict';

/* =========================================================
   ADMIN — KELOLA TAMU UNDANGAN
   ========================================================= */

(function () {

  /* ---------- CONFIG ---------- */
  const STORAGE_KEY = 'wedding_guests';

  /* ---------- UTILS ---------- */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function showToast(msg, duration) {
    const t = qs('#toast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.hidden = true; }, duration || 2500);
  }

  function getGuests() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveGuests(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function baseUrl() {
    return window.location.origin + window.location.pathname.replace(/admin\.html$/, 'index.html');
  }

  function generateLink(name) {
    return baseUrl() + '?to=' + encodeURIComponent(name);
  }

  function generateWaLink(phone, message) {
    const num = phone.replace(/[^0-9]/g, '');
    if (num) {
      return 'https://wa.me/' + num + '?text=' + encodeURIComponent(message);
    }
    return 'https://wa.me/?text=' + encodeURIComponent(message);
  }

  /* ---------- ADD GUEST ---------- */
  function initAddGuest() {
    const form = qs('#add-guest-form');
    const nameInput = qs('#guest-name-input');
    const phoneInput = qs('#guest-phone-input');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = nameInput.value.trim();
      if (!name) return;

      const guests = getGuests();
      if (guests.some(g => g.name.toLowerCase() === name.toLowerCase())) {
        showToast('Nama sudah ada di daftar.');
        return;
      }

      guests.push({ name: name, phone: phoneInput.value.trim(), created: Date.now() });
      saveGuests(guests);
      nameInput.value = '';
      phoneInput.value = '';
      renderGuestList();
      showToast('Tamu berhasil ditambahkan!');
    });
  }

  /* ---------- BULK ADD ---------- */
  function initBulkAdd() {
    const form = qs('#bulk-form');
    const textarea = qs('#bulk-names');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const lines = textarea.value.split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) return;

      const guests = getGuests();
      let added = 0;
      lines.forEach(name => {
        if (!guests.some(g => g.name.toLowerCase() === name.toLowerCase())) {
          guests.push({ name: name, phone: '', created: Date.now() });
          added++;
        }
      });

      saveGuests(guests);
      textarea.value = '';
      renderGuestList();
      showToast(added + ' tamu berhasil ditambahkan!');
    });
  }

  /* ---------- RENDER GUEST LIST ---------- */
  function renderGuestList(filter) {
    const listEl = qs('#guest-list');
    const emptyEl = qs('#guest-empty');
    const totalEl = qs('#guest-total');
    const guests = getGuests();
    const template = qs('#wa-template').value;

    const filtered = filter
      ? guests.filter(g => g.name.toLowerCase().includes(filter.toLowerCase()))
      : guests;

    totalEl.textContent = guests.length + ' tamu';

    if (!filtered.length) {
      listEl.innerHTML = '';
      emptyEl.hidden = false;
      return;
    }

    emptyEl.hidden = true;
    listEl.innerHTML = filtered.map(function (g, i) {
      const realIndex = guests.indexOf(g);
      const link = generateLink(g.name);
      const waMsg = template.replace(/\{nama\}/g, g.name).replace(/\{link\}/g, link);
      const waLink = generateWaLink(g.phone, waMsg);

      return '<div class="guest-card glass" data-index="' + realIndex + '">' +
        '<div class="guest-card__info">' +
          '<p class="guest-card__name">' + escapeHtml(g.name) + '</p>' +
          (g.phone ? '<p class="guest-card__phone"><i class="fa-brands fa-whatsapp"></i> ' + escapeHtml(g.phone) + '</p>' : '') +
          '<p class="guest-card__link">' + link + '</p>' +
        '</div>' +
        '<div class="guest-card__actions">' +
          '<button class="btn btn--sm btn--copy" data-link="' + escapeAttr(link) + '" title="Salin link undangan">' +
            '<i class="fa-solid fa-link"></i>' +
          '</button>' +
          '<a href="' + escapeAttr(waLink) + '" target="_blank" rel="noopener" class="btn btn--sm btn--wa" title="Bagikan via WhatsApp">' +
            '<i class="fa-brands fa-whatsapp"></i>' +
          '</a>' +
          '<button class="btn btn--sm btn--danger" data-delete="' + realIndex + '" title="Hapus tamu">' +
            '<i class="fa-solid fa-trash"></i>' +
          '</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------- EVENT DELEGATION ---------- */
  function initGuestActions() {
    const listEl = qs('#guest-list');
    if (!listEl) return;

    listEl.addEventListener('click', function (e) {
      const copyBtn = e.target.closest('.btn--copy');
      const deleteBtn = e.target.closest('[data-delete]');

      if (copyBtn) {
        e.preventDefault();
        navigator.clipboard.writeText(copyBtn.dataset.link).then(() => {
          showToast('Link undangan disalin!');
        });
      }

      if (deleteBtn) {
        const idx = parseInt(deleteBtn.dataset.delete, 10);
        const guests = getGuests();
        const name = guests[idx] ? guests[idx].name : '';
        if (confirm('Hapus "' + name + '" dari daftar tamu?')) {
          guests.splice(idx, 1);
          saveGuests(guests);
          renderGuestList(qs('#search-guest').value.trim());
          showToast('Tamu dihapus.');
        }
      }
    });
  }

  /* ---------- SEARCH ---------- */
  function initSearch() {
    const input = qs('#search-guest');
    if (!input) return;
    let timeout;
    input.addEventListener('input', function () {
      clearTimeout(timeout);
      timeout = setTimeout(() => renderGuestList(input.value.trim()), 200);
    });
  }

  /* ---------- EXPORT / IMPORT ---------- */
  function initExportImport() {
    const exportBtn = qs('#btn-export');
    const importInput = qs('#import-file');

    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        const guests = getGuests();
        if (!guests.length) { showToast('Tidak ada data untuk di-export.'); return; }
        const blob = new Blob([JSON.stringify(guests, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'tamu-undangan-' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        URL.revokeObjectURL(a.href);
        showToast('Data tamu berhasil di-export!');
      });
    }

    if (importInput) {
      importInput.addEventListener('change', function () {
        const file = importInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function () {
          try {
            const data = JSON.parse(reader.result);
            if (!Array.isArray(data)) throw new Error();
            const guests = getGuests();
            let added = 0;
            data.forEach(g => {
              if (g.name && !guests.some(x => x.name.toLowerCase() === g.name.toLowerCase())) {
                guests.push({ name: g.name, phone: g.phone || '', created: g.created || Date.now() });
                added++;
              }
            });
            saveGuests(guests);
            renderGuestList();
            showToast(added + ' tamu berhasil di-import!');
          } catch {
            showToast('Gagal membaca file. Pastikan format JSON benar.');
          }
        };
        reader.readAsText(file);
        importInput.value = '';
      });
    }
  }

  /* ---------- INIT ---------- */
  function init() {
    initAddGuest();
    initBulkAdd();
    initGuestActions();
    initSearch();
    initExportImport();
    renderGuestList();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
