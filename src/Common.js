function $(i) { return document.getElementById(i); }
function $$(t, p) { var e = document.createElement(t); if (p) p.appendChild(e); return e; } 

function xhrPostJson(url, data, responder) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.responder = responder;
  xhr.onreadystatechange = (function(xhr) { return function() { if (xhr.readyState == 4) xhr.responder(JSON.parse(xhr.response)); }; })(xhr);
  xhr.send(JSON.stringify(data));
}

function clearChildren(e) { while (e.firstChild) e.removeChild(e.firstChild); } 

function frac(x) { return x - Math.floor(x); }

