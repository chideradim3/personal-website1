(function () {
  document.documentElement.classList.add('js');

  // Global nav (mobile)
  var toggle = document.querySelector('.gn-toggle');
  var links = document.getElementById('gn-links');

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    links.classList.toggle('is-open', open);
  }
  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });
  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
  window.matchMedia('(min-width: 834px)').addEventListener('change', function (mq) {
    if (mq.matches) setOpen(false);
  });

  // Reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // Project form (Formspree) + sticky bar
  var form = document.getElementById('start-form');
  var summary = document.getElementById('summary');
  var stickyBar = document.getElementById('sticky-bar');
  var stickyCta = document.getElementById('sticky-cta');
  var submitBtn = document.getElementById('form-submit');
  var formError = document.getElementById('form-error');
  var formSuccess = document.getElementById('form-success');
  var submitted = false;

  function checkedValue(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function updateSummary() {
    summary.textContent = checkedValue('project_type') + ' · ' +
      checkedValue('timeline').replace(/\s*\(.*\)$/, '');
  }

  form.addEventListener('change', function (e) {
    if (e.target.type === 'radio') updateSummary();
  });
  updateSummary();

  function setStickyVisible(visible) {
    visible = visible && !submitted;
    stickyBar.classList.toggle('is-visible', visible);
    stickyBar.setAttribute('aria-hidden', String(!visible));
    stickyCta.tabIndex = visible ? 0 : -1;
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      setStickyVisible(entries[0].isIntersecting);
    }, { threshold: 0.25 }).observe(document.getElementById('start'));
  }

  // Inline validation for required fields
  function validateField(input) {
    var field = input.closest('.field');
    var ok = input.checkValidity();
    field.classList.toggle('is-invalid', !ok);
    input.setAttribute('aria-invalid', String(!ok));
    return ok;
  }

  var required = form.querySelectorAll('.input[required]');
  required.forEach(function (input) {
    input.addEventListener('blur', function () {
      if (input.value) validateField(input);
    });
    input.addEventListener('input', function () {
      if (input.closest('.field').classList.contains('is-invalid')) validateField(input);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formError.hidden = true;

    var firstInvalid = null;
    required.forEach(function (input) {
      if (!validateField(input) && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    var label = submitBtn.textContent;
    submitBtn.disabled = true;
    stickyCta.disabled = true;
    submitBtn.textContent = 'Sending…';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('Request failed');
      submitted = true;
      setStickyVisible(false);
      form.hidden = true;
      formSuccess.hidden = false;
      formSuccess.focus();
    }).catch(function () {
      formError.hidden = false;
      submitBtn.disabled = false;
      stickyCta.disabled = false;
      submitBtn.textContent = label;
    });
  });

  // Email links: still open the mail app, but also copy the address so it
  // works on computers with no email app set up.
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  var toastTimer;

  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 3500);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject();
    });
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="mailto:"]');
    if (!link) return;
    var address = decodeURIComponent(link.getAttribute('href').slice(7).split('?')[0]);
    copyText(address).then(function () {
      showToast('Email copied: ' + address);
    }).catch(function () {
      showToast('Email us at ' + address);
    });
  });

  // Footer year
  document.getElementById('year').textContent = new Date().getFullYear();
})();
