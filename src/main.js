window.onload = function() {
  var viewExplorer = new ViewExplorer(); 
  document.body.appendChild(viewExplorer.setSize(100, 100).element);
  setInterval(function() { viewExplorer.tick(); }, 2000);
}