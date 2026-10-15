/* DOM wiring for the save-contact page. All logic lives in save-contact.js. Values are only ever set via textContent / validated hrefs. */
(function () {
  'use strict';
  var SC = window.SaveContact;
  function el(id) { return document.getElementById(id); }

  var contact = SC.decode(window.location.hash);
  if (!contact) {
    el('invalid').hidden = false;
    return;
  }

  var logo = el('logo');
  logo.src = SC.logoFor(contact.key);
  logo.alt = contact.org || 'Company logo';
  logo.onerror = function () { logo.hidden = true; };
  el('name').textContent = contact.name;
  el('role').textContent = [contact.title, contact.org].filter(function (x) { return !!x; }).join(' · ');
  document.title = contact.name + ' · Save contact';

  function row(label, value, href) {
    if (!value) { return; }
    var li = document.createElement('li');
    var span = document.createElement('span');
    span.className = 'label';
    span.textContent = label;
    var link = document.createElement('a');
    link.href = href;
    link.textContent = value;
    li.appendChild(span);
    li.appendChild(link);
    el('details').appendChild(li);
  }
  row('Mobile', contact.mobile, 'tel:' + contact.mobile);
  row('Office', contact.work, 'tel:' + contact.work);
  // Percent-encode the address so ? & # = cannot start mailto: headers (cc/bcc/subject/body); keep the @ readable.
  row('Email', contact.email, 'mailto:' + encodeURIComponent(contact.email).replace('%40', '@'));

  var apple = SC.isApple(navigator.userAgent, navigator.maxTouchPoints || 0);
  el('hint').hidden = apple;
  el('card').hidden = false;
  el('actions').hidden = false;

  el('save').addEventListener('click', function () {
    // Device tests 2026-10-15: iOS opens Create contact for a navigated Blob; Android downloads it, then Open → Import.
    var url = URL.createObjectURL(new Blob([SC.buildVCard(contact)], { type: 'text/vcard' }));
    if (apple) {
      window.location.href = url;
      return;
    }
    var a = document.createElement('a');
    a.href = url;
    a.download = SC.fileName(contact);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  });
})();
