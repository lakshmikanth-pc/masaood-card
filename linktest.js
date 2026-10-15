(function () {
  'use strict';
  var ITEMS = [{"id": "A", "url": "https://lakshmikanth-pc.github.io/masaood-card/#eyJ2IjoxLCJrIjoiZGVmYXVsdCIsIm4iOiJPbWFyIEsuIEFsIEhhc2hpbWkiLCJvIjoiQWwgTWFzYW9vZCBHcm91cCIsImEiOlsiUC5PLiBCb3ggMzIyIiwiQWJ1IERoYWJpIiwiVW5pdGVkIEFyYWIgRW1pcmF0ZXMiXSwiZyI6Ik9tYXIiLCJzIjoiQWwgSGFzaGltaSIsInQiOiJJVCBFbnRlcnByaXNlIEFyY2hpdGVjdCIsIm0iOiIrOTcxNTAxMjM0NTY3IiwidyI6Iis5NzEyMjAxNzYwMCIsImUiOiJvbWFyX2FsaGFzaGltaUBtYXNhb29kLmNvbSIsInUiOiJodHRwczovL3d3dy5tYXNhb29kLmNvbSJ9"}, {"id": "B", "url": "https://lakshmikanth-pc.github.io/masaood-card/?c=eyJ2IjoxLCJrIjoiZGVmYXVsdCIsIm4iOiJPbWFyIEsuIEFsIEhhc2hpbWkiLCJvIjoiQWwgTWFzYW9vZCBHcm91cCIsImEiOlsiUC5PLiBCb3ggMzIyIiwiQWJ1IERoYWJpIiwiVW5pdGVkIEFyYWIgRW1pcmF0ZXMiXSwiZyI6Ik9tYXIiLCJzIjoiQWwgSGFzaGltaSIsInQiOiJJVCBFbnRlcnByaXNlIEFyY2hpdGVjdCIsIm0iOiIrOTcxNTAxMjM0NTY3IiwidyI6Iis5NzEyMjAxNzYwMCIsImUiOiJvbWFyX2FsaGFzaGltaUBtYXNhb29kLmNvbSIsInUiOiJodHRwczovL3d3dy5tYXNhb29kLmNvbSJ9"}, {"id": "C", "url": "https://lakshmikanth-pc.github.io/masaood-card/?c#eyJ2IjoxLCJrIjoiZGVmYXVsdCIsIm4iOiJPbWFyIEsuIEFsIEhhc2hpbWkiLCJvIjoiQWwgTWFzYW9vZCBHcm91cCIsImEiOlsiUC5PLiBCb3ggMzIyIiwiQWJ1IERoYWJpIiwiVW5pdGVkIEFyYWIgRW1pcmF0ZXMiXSwiZyI6Ik9tYXIiLCJzIjoiQWwgSGFzaGltaSIsInQiOiJJVCBFbnRlcnByaXNlIEFyY2hpdGVjdCIsIm0iOiIrOTcxNTAxMjM0NTY3IiwidyI6Iis5NzEyMjAxNzYwMCIsImUiOiJvbWFyX2FsaGFzaGltaUBtYXNhb29kLmNvbSIsInUiOiJodHRwczovL3d3dy5tYXNhb29kLmNvbSJ9"}, {"id": "D", "url": "https://lakshmikanth-pc.github.io/masaood-card/index.html#eyJ2IjoxLCJrIjoiZGVmYXVsdCIsIm4iOiJPbWFyIEsuIEFsIEhhc2hpbWkiLCJvIjoiQWwgTWFzYW9vZCBHcm91cCIsImEiOlsiUC5PLiBCb3ggMzIyIiwiQWJ1IERoYWJpIiwiVW5pdGVkIEFyYWIgRW1pcmF0ZXMiXSwiZyI6Ik9tYXIiLCJzIjoiQWwgSGFzaGltaSIsInQiOiJJVCBFbnRlcnByaXNlIEFyY2hpdGVjdCIsIm0iOiIrOTcxNTAxMjM0NTY3IiwidyI6Iis5NzEyMjAxNzYwMCIsImUiOiJvbWFyX2FsaGFzaGltaUBtYXNhb29kLmNvbSIsInUiOiJodHRwczovL3d3dy5tYXNhb29kLmNvbSJ9"}, {"id": "E", "url": "https://lakshmikanth-pc.github.io/masaood-card/#short123"}];
  var list = document.getElementById('list');
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { alert('Copied'); }, function () { window.prompt('Copy this:', text); });
    } else { window.prompt('Copy this:', text); }
  }
  ITEMS.forEach(function (it) {
    var p = document.createElement('p');
    p.className = 'hint';
    p.textContent = it.id + ': ' + it.url.substring(0, 60) + '... (' + it.url.length + ' chars)';
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'save'; b.textContent = 'Copy ' + it.id;
    b.addEventListener('click', function () { copy(it.id + ' ' + it.url); });
    list.appendChild(p); list.appendChild(b);
  });
  document.getElementById('all').addEventListener('click', function () {
    copy(ITEMS.map(function (it) { return it.id + ' ' + it.url; }).join('

'));
  });
})();
