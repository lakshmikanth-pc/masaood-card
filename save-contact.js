/* Save-contact page logic. ES5, no dependencies. Loaded by index.html (global SaveContact)
   and by Jest (module.exports), so the tested file is the published file.
   Links are produced by src/webparts/eBusinessCard/services/contactLink.ts.
   v2 (current): ?c=<base64url(compact fields joined by U+001F)> in the query string, because WhatsApp
   never links a #fragment. v1 (JSON after #) is still decoded so links sent during testing keep working. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.SaveContact = api;
  }
}(this, function () {
  'use strict';

  var MAX_HASH = 4000;
  var SEP = '\u001F';
  // Must equal DEFAULT_BRANDING.websiteUrl / .vcard in the web part (a unit test enforces it).
  var DEFAULT_WEBSITE = 'https://www.masaood.com';
  var DEFAULT_ADDRESS = ['P.O. Box 322', 'Abu Dhabi', 'United Arab Emirates'];
  var MAX_FIELD = 200;
  var LOGOS = { 'default': 'amllc', amllc: 'amllc', ama: 'ama', atc: 'atc', ammts: 'ammts', amb: 'amb', arb: 'arb', tba: 'tba' };

  function fromBase64Url(data) {
    var b64 = data.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) {
      b64 += '=';
    }
    return decodeURIComponent(escape(atob(b64)));
  }

  /** Keeps only well-formed UTF-16: a surrogate is kept only as part of a high+low pair. */
  function dropLoneSurrogates(value) {
    var out = '';
    for (var i = 0; i < value.length; i++) {
      var c = value.charCodeAt(i);
      if (c >= 0xD800 && c <= 0xDBFF) {
        var next = i + 1 < value.length ? value.charCodeAt(i + 1) : 0;
        if (next >= 0xDC00 && next <= 0xDFFF) {
          out += value.charAt(i) + value.charAt(i + 1);
          i++;
        }
      } else if (c < 0xDC00 || c > 0xDFFF) {
        out += value.charAt(i);
      }
    }
    return out;
  }

  /** Strips ASCII + C1 controls, line/paragraph separators and bidi controls; drops lone surrogates; caps at MAX_FIELD. */
  function clean(value) {
    if (typeof value !== 'string') {
      return '';
    }
    var s = dropLoneSurrogates(value.replace(/[\u0000-\u001F\u007F-\u009F\u2028\u2029\u202A-\u202E\u2066-\u2069]/g, ''));
    s = s.substring(0, MAX_FIELD);
    if (/[\uD800-\uDBFF]$/.test(s)) {
      s = s.substring(0, s.length - 1);
    }
    return s.trim();
  }

  function phone(value) {
    var p = clean(value).replace(/\s+/g, '');
    return /^\+?[0-9]{5,20}$/.test(p) ? p : '';
  }

  function email(value) {
    var e = clean(value);
    return /^[^@\s]+@[^@\s]+$/.test(e) ? e : '';
  }

  function httpsUrl(value) {
    var u = clean(value);
    return /^https:\/\/[^\s]+$/i.test(u) ? u : '';
  }

  /** v1: clean contact from location.hash, or null when the link is unusable. */
  function decode(hash) {
    var raw = String(hash || '').replace(/^#/, '');
    if (!raw || raw.length > MAX_HASH || !/^[A-Za-z0-9_-]+$/.test(raw)) {
      return null;
    }
    var data;
    try {
      data = JSON.parse(fromBase64Url(raw));
    } catch (e) {
      return null;
    }
    if (!data || typeof data !== 'object' || data.v !== 1) {
      return null;
    }
    var name = clean(data.n);
    if (!name) {
      return null;
    }
    var address = Object.prototype.toString.call(data.a) === '[object Array]' ? data.a : [];
    return {
      key: companyKey(data.k),
      name: name,
      given: clean(data.g),
      surname: clean(data.s),
      title: clean(data.t),
      org: clean(data.o),
      mobile: phone(data.m),
      work: phone(data.w),
      email: email(data.e),
      address: [clean(address[0]), clean(address[1]), clean(address[2])],
      url: httpsUrl(data.u)
    };
  }

  /** Company key: lower-case, allowlisted, else the group logo. */
  function companyKey(value) {
    var key = clean(value).toLowerCase();
    return /^[a-z0-9_-]{1,40}$/.test(key) && LOGOS.hasOwnProperty(key) ? key : 'default';
  }

  /** v2 phone: empty, "+..." as is, "=digits" (no prefix), otherwise a UAE number without +971. */
  function expandPhone(value) {
    var p = clean(value);
    if (!p) {
      return '';
    }
    if (p.charAt(0) === '+') {
      return phone(p);
    }
    if (p.charAt(0) === '=') {
      return phone(p.substring(1));
    }
    return phone('+971' + p);
  }

  function expandEmail(value) {
    var e = clean(value);
    if (e.charAt(e.length - 1) === '@') {
      e += 'masaood.com';
    }
    return email(e);
  }

  function expandWebsite(value) {
    var u = clean(value);
    if (!u) {
      return DEFAULT_WEBSITE;
    }
    // The web part strips a leading https://. A value that still starts with a scheme (scheme://, or a
    // script-like one) is kept so httpsUrl() rejects it; anything else, including host:port and a query
    // that holds "://", gets https:// back.
    var hasScheme = /^[A-Za-z][A-Za-z0-9+.\-]*:\/\//.test(u) || /^(javascript|data|vbscript|http):/i.test(u);
    return httpsUrl(hasScheme ? u : 'https://' + u);
  }

  /** UAE national significant number (8 or 9 digits), or null. Same rules as uaeLocal() in services/phone.ts. */
  function uaeLocal(raw) {
    var trimmed = String(raw || '').trim();
    var d = trimmed.replace(/[^\d]/g, '');
    if (d.indexOf('00971') === 0) {
      d = d.substring(5);
    } else if (d.indexOf('971') === 0 && (trimmed.charAt(0) === '+' || d.length >= 11)) {
      d = d.substring(3);
    } else if (!(d.charAt(0) === '0' && (d.length === 10 || d.length === 9))) {
      return null;
    }
    if (d.charAt(0) === '0') {
      d = d.substring(1);
    }
    return d.length === 8 || d.length === 9 ? d : null;
  }

  /** Display form, same as formatPhone() in services/phone.ts: "+971501234567" -> "+971 50 123 4567". */
  function formatPhone(raw) {
    if (!raw) {
      return '';
    }
    var local = uaeLocal(raw);
    if (local === null) {
      return String(raw).trim();
    }
    if (local.length === 9) {
      return '+971 ' + local.substring(0, 2) + ' ' + local.substring(2, 5) + ' ' + local.substring(5);
    }
    return '+971 ' + local.charAt(0) + ' ' + local.substring(1, 4) + ' ' + local.substring(4);
  }

  /** Clean contact from the ?c= value (v2 compact fields), or null when the link is unusable. */
  function decodeCompact(raw) {
    raw = String(raw || '');
    if (!raw || raw.length > MAX_HASH || !/^[A-Za-z0-9_-]+$/.test(raw)) {
      return null;
    }
    var text;
    try {
      text = fromBase64Url(raw);
    } catch (e) {
      return null;
    }
    // Split before clean(): clean() strips control characters, including the separator.
    var f = text.split(SEP);
    // The last field must be the "." end marker; a link cut by a messenger lacks it.
    if (f.length < 4 || f[f.length - 1] !== '.') {
      return null;
    }
    f.pop();
    if (f[0] !== '2') {
      return null;
    }
    var name = clean(f[2]);
    if (!name) {
      return null;
    }
    var street = clean(f[11]);
    var locality = clean(f[12]);
    var country = clean(f[13]);
    var noAddress = !street && !locality && !country;
    return {
      key: companyKey(f[1]),
      name: name,
      given: clean(f[3]),
      surname: clean(f[4]),
      title: clean(f[5]),
      org: clean(f[9]),
      mobile: expandPhone(f[6]),
      work: expandPhone(f[7]),
      email: expandEmail(f[8]),
      address: noAddress ? DEFAULT_ADDRESS.slice() : [street, locality, country],
      url: expandWebsite(f[10])
    };
  }

  /** v2 from ?c= in location.search; with no c parameter, v1 from location.hash. */
  function decodeLink(search, hash) {
    var m = /[?&]c=([A-Za-z0-9_-]{1,4000})(?:&|$)/.exec(String(search || ''));
    return m ? decodeCompact(m[1]) : decode(hash);
  }

  /** RFC 6350 escaping — same as escapeVCard() in the web part. */
  function esc(value) {
    return String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/\r?\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .trim();
  }

  /** Mirrors buildVCard() in src/webparts/eBusinessCard/services/vcard.ts line for line. */
  function buildVCard(c) {
    var lines = ['BEGIN:VCARD', 'VERSION:3.0'];
    if (c.surname || c.given) {
      lines.push('N:' + esc(c.surname) + ';' + esc(c.given) + ';;;');
    } else {
      lines.push('N:;' + esc(c.name) + ';;;');
    }
    lines.push('FN:' + esc(c.name));
    lines.push('ORG:' + esc(c.org));
    if (c.title) {
      lines.push('TITLE:' + esc(c.title));
    }
    if (c.mobile) {
      lines.push('TEL;TYPE=CELL:' + c.mobile);
    }
    if (c.work) {
      lines.push('TEL;TYPE=WORK:' + c.work);
    }
    if (c.email) {
      lines.push('EMAIL;TYPE=WORK:' + esc(c.email));
    }
    lines.push('ADR;TYPE=WORK:;;' + esc(c.address[0]) + ';' + esc(c.address[1]) + ';;;' + esc(c.address[2]));
    if (c.url) {
      lines.push('URL:' + c.url);
    }
    lines.push('END:VCARD');
    return lines.join('\r\n');
  }

  /** iPhone/iPod/iPad, including iPadOS which reports itself as a Mac with touch. */
  function isApple(userAgent, maxTouchPoints) {
    var ua = String(userAgent || '');
    return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (maxTouchPoints || 0) > 1);
  }

  /** Same rule as vCardFileName() in the web part. */
  function fileName(c) {
    var base = String(c.name || 'contact').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_');
    return (base || 'contact') + '.vcf';
  }

  function logoFor(key) {
    return 'logos/' + (LOGOS.hasOwnProperty(key) ? LOGOS[key] : LOGOS['default']) + '.png';
  }

  return {
    decode: decode, decodeCompact: decodeCompact, decodeLink: decodeLink,
    DEFAULT_WEBSITE: DEFAULT_WEBSITE, DEFAULT_ADDRESS: DEFAULT_ADDRESS,
    buildVCard: buildVCard, isApple: isApple, fileName: fileName, logoFor: logoFor, formatPhone: formatPhone
  };
}));
