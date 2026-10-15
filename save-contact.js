/* Save-contact page logic. ES5, no dependencies. Loaded by index.html (global SaveContact)
   and by Jest (module.exports), so the tested file is the published file.
   Link format v1 is produced by src/webparts/eBusinessCard/services/contactLink.ts. */
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

  /** Clean contact from location.hash, or null when the link is unusable. */
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
    var key = clean(data.k).toLowerCase();
    return {
      key: /^[a-z0-9_-]{1,40}$/.test(key) && LOGOS.hasOwnProperty(key) ? key : 'default',
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

  return { decode: decode, buildVCard: buildVCard, isApple: isApple, fileName: fileName, logoFor: logoFor };
}));
