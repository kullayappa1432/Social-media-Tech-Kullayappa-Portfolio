(() => {
  'use strict';
  const c = window.SITE_CONFIG;
  const { escape: e, icon, safeUrl, external } = window.Studio;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const currency = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  const formatDate = value => new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const whatsapp = /^\d{7,15}$/.test(c.whatsappNumber) ? c.whatsappNumber : '';
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.contactEmail) ? c.contactEmail : '';
  const enquiryUrl = (message, subject = 'Creative collaboration enquiry') => whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}` : email ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}` : '#contact';

  function populateIdentity() {
    $$('[data-brand]').forEach(el => { el.textContent = c.brandName; });
    $$('[data-tagline]').forEach(el => { el.textContent = c.tagline; });
    $$('[data-instagram-count]').forEach(el => { el.textContent = c.instagramFollowerDisplay; });
    $$('[data-youtube-count]').forEach(el => { el.textContent = c.youtubeSubscriberDisplay || 'YouTube'; });
    $$('[data-instagram-handle]').forEach(el => { el.textContent = `@${c.instagramUsername}`; });
    $$('[data-social]').forEach(el => { el.href = safeUrl(el.dataset.social === 'instagram' ? c.instagramProfileUrl : c.youtubeChannelUrl); });
    $$('[data-video-count]').forEach(el => { el.textContent = c.youtubeVideoCount ?? ''; });
    $$('[data-instagram-date]').forEach(el => { el.textContent = formatDate(c.instagramFollowerVerifiedAt); });
    $('[data-youtube-description]').textContent = c.youtubeDescription;
    $('#metric-note').textContent = `Public rounded counts, checked ${formatDate(c.youtubeSubscriberVerifiedAt)}. Not live metrics.`;
    $('#copyright-year').textContent = new Date().getFullYear();
    const heroImage = $('.identity-art');
    $('.hero-art').classList.toggle('has-portrait', Boolean(c.profileImage));
    heroImage.src = safeUrl(c.profileImage || 'assets/images/studio-art.svg');
    heroImage.alt = c.profileImage ? c.profileImageAlt : 'Original TK monogram artwork in a terracotta arch';
    heroImage.width = c.profileImage ? 768 : 800;
    heroImage.height = c.profileImage ? 1376 : 1000;
    // Only a known final deployment URL is used in canonical/preview metadata.
    if (c.deploymentUrl && /^https:\/\//.test(c.deploymentUrl)) {
      const canonical = document.head.querySelector('link[rel="canonical"]') || document.createElement('link'); canonical.rel = 'canonical'; canonical.href = c.deploymentUrl; document.head.append(canonical);
      for (const [property, content] of [['og:url', c.deploymentUrl], ['og:image', new URL('assets/images/social-preview.png', c.deploymentUrl).href]]) {
        const meta = document.head.querySelector(`meta[property="${property}"]`) || document.createElement('meta'); meta.setAttribute('property', property); meta.content = content; document.head.append(meta);
      }
      document.head.querySelector('meta[name="twitter:image"]').content = new URL('assets/images/social-preview.png', c.deploymentUrl).href;
    }
    const schema = document.createElement('script'); schema.type = 'application/ld+json';
    schema.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Person', name: 'Tech Kullayappa', jobTitle: 'Content Creator & Social Media Creative', sameAs: [c.instagramProfileUrl, c.youtubeChannelUrl], ...(c.deploymentUrl ? { url: c.deploymentUrl } : {}) });
    document.head.append(schema);
    if (whatsapp) {
      const floating = $('#floating-whatsapp'); floating.hidden = false; floating.href = enquiryUrl('Hi Tech Kullayappa! I’d like to discuss a creative project.');
      $('#enquiry-method').textContent = 'Review your message, then send it in WhatsApp. Nothing is sent automatically.';
    } else {
      $('#enquiry-method').textContent = email ? 'Review your message, then send it in your email app. Nothing is sent automatically.' : 'Prepare and copy your enquiry, then contact me through a social profile.';
    }
    if (email) $('#contact-links').insertAdjacentHTML('beforeend', `<a href="mailto:${e(email)}">${icon('mail')}<span>Business enquiries<small>${e(email)}</small></span>${icon('up-right')}</a>`);
    if (whatsapp) $('#contact-links').insertAdjacentHTML('beforeend', `<a href="https://wa.me/${whatsapp}" ${external}>${icon('whatsapp')}<span>WhatsApp<small>Let’s talk about your next story</small></span>${icon('up-right')}</a>`);
  }

  function navigation() {
    const toggle = $('.menu-toggle'), nav = $('#primary-nav');
    function closeMenu(returnFocus = false) {
      nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open navigation');
      if (returnFocus) toggle.focus();
    }
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); nav.classList.toggle('open', open);
    });
    nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) closeMenu(true); });
    document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
    window.addEventListener('resize', () => { if (innerWidth > 800) closeMenu(); }, { passive: true });
    const links = $$('#primary-nav a');
    const sections = links.map(a => document.querySelector(a.getAttribute('href')));
    let queued = false;
    function update() {
      const y = window.scrollY;
      $('.site-header').classList.toggle('compact', y > 30);
      $('.back-to-top').classList.toggle('visible', y > 700);
      const available = document.documentElement.scrollHeight - innerHeight;
      $('.scroll-progress').style.width = `${available > 0 ? Math.min(100, y / available * 100) : 0}%`;
      let active = 0;
      sections.forEach((section, index) => { if (section && section.getBoundingClientRect().top <= 170) active = index; });
      links.forEach((link, index) => {
        link.classList.toggle('active', index === active);
        if (index === active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      }); queued = false;
    }
    window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update, { passive: true }); update();
  }

  function servicesAndPricing() {
    $('#services-grid').innerHTML = c.services.slice(0, 6).map((service, index) => `<article class="service-card"><div class="service-top">${icon(service.icon || 'spark')}<span>0${index + 1}</span></div><h3>${e(service.title)}</h3><p>${e(service.description)}</p><a class="text-link service-enquiry" href="#contact" data-service-name="${e(service.title)}">Let’s talk about it ↗</a></article>`).join('');
    $('#extra-services').innerHTML = c.services.slice(6).map((service, index) => `<div class="extra-service"><span>${String(index + 7).padStart(2, '0')}</span><strong>${e(service.title)}</strong><p>${e(service.description)}</p></div>`).join('');
    $('#pricing-grid').innerHTML = c.pricingPackages.map(p => {
      const price = `${currency(p.price)}${p.maxPrice ? `–${currency(p.maxPrice)}` : ''}`;
      const message = `Hi Tech Kullayappa! I’m interested in the ${p.name} (${price} ${p.unit}). I’d like to discuss my brand, deliverables and the agreed scope. Please share the next steps.`;
      return `<article class="price-card ${e(p.id)}"><p class="eyebrow">${e(p.label)}</p><h3>${e(p.name)}</h3><div class="price-amount">${e(price)}<small>${e(p.unit)}</small></div><ul>${p.features.map(f => `<li>${icon('check')}<span>${e(f)}</span></li>`).join('')}</ul><a class="button" href="${e(enquiryUrl(message, p.name + ' enquiry'))}" ${whatsapp ? external : ''}>${e(p.cta)} ${icon('up-right')}</a><p class="fine-print">${e(p.note)}</p></article>`;
    }).join('');
    $$('.service-enquiry').forEach(link => link.addEventListener('click', () => {
      const name = link.dataset.serviceName;
      const options = [...$('#service').options];
      $('#service').value = options.find(option => option.value === name)?.value || (name.includes('Editing') ? 'Reel Editing' : name.includes('Promotional') ? 'Promotional Content' : name === 'Creator Collaborations' ? 'Brand Collaboration' : 'Other');
      if (!$('#details').value) $('#details').value = `I’d like to discuss ${name.toLowerCase()} for my brand.`;
    }));
  }

  function setupTabs(items, tabSelector, panelSelector, vertical = false) {
    const list = $(tabSelector), panel = $(panelSelector), prefix = list.id;
    list.innerHTML = items.map((item, i) => `<button class="${vertical ? 'editorial-tab' : ''}" type="button" role="tab" id="${prefix}-${i}" aria-controls="${panel.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? '0' : '-1'}">${vertical ? `<span>${String(i + 1).padStart(2, '0')}</span>` : ''}${e(item.name)}</button>`).join('');
    const tabs = [...list.querySelectorAll('[role=tab]')];
    function select(index, focus = false) {
      tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
      const item = items[index]; panel.setAttribute('aria-labelledby', tabs[index].id);
      panel.innerHTML = vertical ? `<div class="toolkit-art" data-visual="${e(item.visual)}" aria-hidden="true"><span>${e(item.word)}</span></div><div><h3>${e(item.title)}</h3><p>${e(item.text)}</p><div class="sample-label">Illustrative studio artwork</div></div>` : `<div class="quality-visual" data-quality="${index}" aria-hidden="true"><span class="script">${e(item.word)}</span><span class="sample-label">ILLUSTRATIVE CREATIVE DIRECTION / NOT CLIENT WORK</span></div><div class="quality-copy"><h3>${e(item.title)}</h3><p>${e(item.text)}</p></div>`;
      panel.classList.remove('panel-enter'); void panel.offsetWidth; panel.classList.add('panel-enter');
      if (focus) tabs[index].focus();
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(index));
      tab.addEventListener('keydown', event => {
        const next = vertical ? 'ArrowDown' : 'ArrowRight', previous = vertical ? 'ArrowUp' : 'ArrowLeft';
        let selected;
        if (event.key === next) selected = (index + 1) % tabs.length;
        if (event.key === previous) selected = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') selected = 0;
        if (event.key === 'End') selected = tabs.length - 1;
        if (selected !== undefined) { event.preventDefault(); select(selected, true); }
      });
    }); select(0);
  }

  function faq() {
    $('#faq-list').innerHTML = c.faqs.map(([question, answer], i) => `<article class="faq-item"><h3><button class="faq-question" id="faq-question-${i}" type="button" aria-expanded="false" aria-controls="faq-answer-${i}">${e(question)}</button></h3><div class="faq-answer" id="faq-answer-${i}" role="region" aria-labelledby="faq-question-${i}" aria-hidden="true" inert><div><p>${e(answer)}</p></div></div></article>`).join('');
    $$('.faq-question').forEach(button => button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      const answer = document.getElementById(button.getAttribute('aria-controls'));
      answer.classList.toggle('open', open); answer.setAttribute('aria-hidden', String(!open)); answer.inert = !open;
    }));
  }

  function estimator() {
    const service = $('#estimate-service'), quantity = $('#reel-quantity');
    service.innerHTML = c.pricingPackages.map(p => `<option value="${e(p.id)}">${e(p.name)}</option>`).join('');
    let currentMessage = '', currentPackage, currentEstimate = '';
    function update() {
      const p = c.pricingPackages.find(item => item.id === service.value); currentPackage = p;
      const individual = p.id === 'individual'; $('#reel-quantity-field').hidden = !individual;
      const n = Number(quantity.value), valid = !individual || (Number.isInteger(n) && n >= 1 && n <= 1000 && quantity.value.trim() !== '');
      quantity.setAttribute('aria-invalid', String(!valid));
      $('#quantity-error').textContent = valid ? '' : 'Enter a whole number from 1 to 1,000.';
      $('#request-quote').disabled = !valid;
      $('#quantity-minus').disabled = n <= 1; $('#quantity-plus').disabled = n >= 1000;
      if (!valid) { $('#estimate-output').textContent = 'Choose a reel quantity'; $('#estimate-detail').textContent = 'A quantity is needed to calculate your estimate.'; $('#estimate-discuss').removeAttribute('href'); $('#estimate-discuss').setAttribute('aria-disabled', 'true'); return; }
      currentEstimate = individual ? `${currency(p.price * n)} – ${currency(p.maxPrice * n)}` : currency(p.price);
      $('#estimate-output').textContent = currentEstimate + (individual ? '' : ' / month');
      $('#estimate-detail').textContent = individual ? `${n} ${n === 1 ? 'reel' : 'reels'} · ${currency(p.price)}–${currency(p.maxPrice)} per reel` : `${p.name} · monthly package rate`;
      currentMessage = `Hi Tech Kullayappa! I’d like a quotation for ${p.name}${individual ? ` (${n} ${n === 1 ? 'reel' : 'reels'})` : ''}. The website estimate is ${currentEstimate}${individual ? '' : ' per month'}. I understand that the final quotation depends on my requirements. Can we discuss the scope?`;
      $('#estimate-discuss').href = enquiryUrl(currentMessage); $('#estimate-discuss').removeAttribute('aria-disabled');
      $('#estimate-discuss').textContent = whatsapp ? 'Discuss on WhatsApp ↗' : email ? 'Discuss by email ↗' : 'Discuss your project ↗';
      if (whatsapp) { $('#estimate-discuss').target = '_blank'; $('#estimate-discuss').rel = 'noopener noreferrer'; }
    }
    service.addEventListener('change', update); quantity.addEventListener('input', update);
    $('#quantity-minus').addEventListener('click', () => { quantity.value = Math.max(1, Math.min(1000, (Number(quantity.value) || 1) - 1)); update(); });
    $('#quantity-plus').addEventListener('click', () => { quantity.value = Math.max(1, Math.min(1000, (Number(quantity.value) || 0) + 1)); update(); });
    $('#request-quote').addEventListener('click', () => {
      $('#service').value = currentPackage.id === 'individual' ? 'Reel Editing' : currentPackage.name;
      $('#budget').value = currentEstimate + (currentPackage.id === 'individual' ? ' estimated total' : ' / month');
      $('#details').value = currentMessage;
      $('#contact').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      $('#form-status').textContent = 'Your estimate has been added. Tell me a little about yourself to continue.';
      $('#full-name').focus({ preventScroll: true });
    }); update();
  }

  function testimonials() {
    if (!c.testimonials.length) return;
    let index = 0;
    const host = $('#testimonials-content');
    host.innerHTML = '<h2 id="stories-title">In their <em>own words.</em></h2><div id="testimonial-body" aria-live="polite"></div><div class="testimonial-controls"><button type="button" id="testimonial-prev" aria-label="Previous client story">←</button><span id="testimonial-position" class="fine-print"></span><button type="button" id="testimonial-next" aria-label="Next client story">→</button></div>';
    function show() {
      const t = c.testimonials[index];
      $('#testimonial-body').innerHTML = `<blockquote class="testimonial-quote">“${e(t.quote)}”</blockquote>${t.photo ? `<img class="testimonial-photo" src="${e(safeUrl(t.photo))}" alt="${e(t.clientName)}" width="54" height="54" loading="lazy">` : ''}<div class="testimonial-person"><strong>${e(t.clientName)}</strong>${t.businessName ? ` · ${e(t.businessName)}` : ''}</div>`;
      $('#testimonial-position').textContent = `${index + 1} / ${c.testimonials.length}`;
    }
    $('#testimonial-prev').addEventListener('click', () => { index = (index - 1 + c.testimonials.length) % c.testimonials.length; show(); });
    $('#testimonial-next').addEventListener('click', () => { index = (index + 1) % c.testimonials.length; show(); });
    if (c.testimonials.length === 1) $('.testimonial-controls').hidden = true; show();
  }

  function enquiryForm() {
    const form = $('#enquiry-form'), dialog = $('#message-dialog');
    const required = ['full-name', 'email', 'phone', 'service', 'details'];
    const validations = {
      'full-name': value => value.trim().length >= 2 ? '' : 'Please enter your full name.',
      email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Please enter a valid email address.',
      phone: value => /^[+()\d\s.-]+$/.test(value) && value.replace(/\D/g, '').length >= 7 && value.replace(/\D/g, '').length <= 15 ? '' : 'Enter a phone number with 7–15 digits, including country code.',
      service: value => value ? '' : 'Please choose a service.',
      details: value => value.trim().length >= 10 ? '' : 'Please share at least 10 characters about your project.'
    };
    function validate(id) {
      const field = document.getElementById(id), message = validations[id](field.value);
      field.setAttribute('aria-invalid', String(Boolean(message))); document.getElementById(`${id}-error`).textContent = message;
      return !message;
    }
    required.forEach(id => {
      const field = document.getElementById(id);
      field.addEventListener('blur', () => { if (field.value || field.getAttribute('aria-invalid') === 'true') validate(id); });
      field.addEventListener('input', () => { if (field.getAttribute('aria-invalid') === 'true') validate(id); });
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const invalid = required.filter(id => !validate(id));
      if (invalid.length) { $('#form-status').textContent = 'Please check the highlighted fields.'; document.getElementById(invalid[0]).focus(); return; }
      const data = new FormData(form);
      const message = [`Hi Tech Kullayappa! I’d like to discuss a creative project.`, '', `Name: ${data.get('fullName').trim()}`, `Business / brand: ${data.get('businessName').trim() || 'Not specified'}`, `Email: ${data.get('email').trim()}`, `Phone / WhatsApp: ${data.get('phone').trim()}`, `Service: ${data.get('service')}`, `Expected budget: ${data.get('budget').trim() || 'To discuss'}`, `Preferred platform: ${data.get('platform') || 'Let’s decide together'}`, '', 'Project details:', data.get('details').trim(), '', 'I understand that the final scope and quotation will be agreed, with a 30% advance to begin.'].join('\n');
      $('#message-preview').value = message;
      $('#send-message').href = enquiryUrl(message);
      $('#send-message').textContent = whatsapp ? 'Open WhatsApp ↗' : email ? 'Open Email App ↗' : 'Explore Instagram ↗';
      $('#message-explainer').textContent = whatsapp ? 'Review your enquiry below, then open WhatsApp to send it.' : email ? 'Review your enquiry below, then open your email app to send it.' : 'Copy your enquiry below, then get in touch on Instagram.';
      if (whatsapp) { $('#send-message').target = '_blank'; $('#send-message').rel = 'noopener noreferrer'; }
      if (!whatsapp && !email) { $('#send-message').href = c.instagramProfileUrl; $('#send-message').target = '_blank'; $('#send-message').rel = 'noopener noreferrer'; }
      $('#message-status').textContent = 'Your message has not been sent.';
      $('#form-status').textContent = 'Your enquiry is ready to review. Send it in the next step.';
      dialog.showModal();
    });
    $('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    $('#send-message').addEventListener('click', () => { $('#message-status').textContent = 'Continue in your messaging app to send. Delivery has not been confirmed by this website.'; });
    $('#copy-message').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText($('#message-preview').value); $('#message-status').textContent = 'Message copied. Paste it into your conversation to send.'; }
      catch { $('#message-preview').focus(); $('#message-preview').select(); $('#message-status').textContent = 'Select and copy the message above using your device’s copy command.'; }
    });
  }
  populateIdentity(); servicesAndPricing(); window.Studio.renderPortfolio();
  setupTabs(c.expertise, '#expertise-tabs', '#expertise-panel', true);
  setupTabs(c.quality, '#quality-tabs', '#quality-panel');
  faq(); estimator(); testimonials(); enquiryForm(); navigation();
})();
