class Point { constructor(x, y) { this.x = x; this.y = y; } }

function setPair(d, p, u, names) { d[names.x] = p.x + u; d[names.y] = p.y + u; }
function getNamedPair(p, u, names) { var d = {}; setPair(d, p, u, names); return d; }

function setElementNamedStylePair(e, toS, u, fromS, names) { u = u || "%"; 
  setPair(e.style, toS, u, names);
  if (fromS) { console.log("a"); e.animate([getNamedPair(fromS, u, names), getNamedPair(toS, u, names)], { duration: 450, easing: "ease-out" }); }
}

function setElementSiz(e, toS, u, fromS) { setElementNamedStylePair(e, toS, u, fromS, new Point("width", "height")); }
function setElementPos(e, toS, u, fromS) { setElementNamedStylePair(e, toS, u, fromS, new Point("left", "top")); }

function setElementSize(e, X, Y, u) { setElementSiz(e, new Point(X, Y), u); }
function setElementPosition(e, X, Y, u) { setElementPos(e, new Point(X, Y), u); }
function setElementGeometry(e, X, Y, W, H, u) { setElementPosition(e, X, Y, u); setElementSize(e, W, H, u); }

class SubViewManager { arrangeSubViews(view, subViews) { for (let v of subViews) v.arrangeSubViews(); } }

class SubViewManagerVHBox extends SubViewManager {  
    constructor(isHorizontal, view) { super(); this.isHorizontal = isHorizontal; }

    arrangeSubViews(view, subViews) { super.arrangeSubViews(view, subViews);
        var cumulWeight = 0, offset = 0;
        for (let v of subViews) cumulWeight += v.getWeight(); cumulWeight /= 100.0;
        for (let v of subViews) { 
            var aL = v.getWeight() / cumulWeight;
            v.setStylePosition("absolute").setPosition(this.isHorizontal ? offset : 0, !this.isHorizontal ? offset : 0).setSize(this.isHorizontal ? aL : 100, !this.isHorizontal ? aL : 100);
            offset += aL;
        } 
    }
}

class SubViewManagerFit extends SubViewManager {
  arrangeSubViews(view, subViews) { super.arrangeSubViews(view, subViews);
    for (let v of subViews) v.setPosition(0, 0).setSize(100, 100); 
  }
}

var viewCount = 0;
class View {
    constructor(id) {  
      this.element = $$("div");
      this.subViews = [];
      this.setID(xid(id, (viewCount++))).applyStyle({overflow: "hidden"}).setLayout(new SubViewManager());
    }

    setID(id) { this.element.id = id; return this; }
    getID() { return this.element.id; }
    getXID(suffix) { return this.getID() + ":" + suffix; }

    setParent(newParent) { this.parent = newParent; if (this.element.parentElement != newParent.element) newParent.element.appendChild(this.element); return this; }

    addSubViews(v) { for (let x of v) x.setParent(this); this.subViews = this.subViews.concat(v); return this.arrangeSubViews(); }
    remove() { if (this.parent) this.parent.element.removeChild(this.element); return this; }
    removeChildren() { for (let v of this.subViews) delete v.remove(); this.subViews = []; return this; }

    arrangeSubViews() { this.layout.arrangeSubViews(this, this.subViews); return this; }

    setLayout(layout) { this.layout = layout; return this.arrangeSubViews(); }
    setBoxLayout(v) { return this.setLayout(new SubViewManagerVHBox(!v, this)); }
    setFitLayout() { return this.setLayout(new SubViewManagerFit()); }

    setWeight(w) { this.weight = w; return this; }

    setSiz(toS, u, fromS) { setElementSiz(this.element, toS, u, fromS); return this; }
    setPos(toP, u, fromP) { setElementPos(this.element, toP, u, fromP); return this; }
    setSize(w, h, u) { return this.setSiz(new Point(w, h), u); }
    setPosition(x, y, u) { return this.setPos(new Point(x, y), u); }
    setStyleClass(className) { this.element.className = className; return this; }

    setStylePosition(p) { return this.applyStyle({position: p}); }
    setVisible(visible) { return this.applyStyle({display: visible ? "block" : "none"}); }

    applyStyle(s) { for (let k in s) this.element.style[k] = s[k]; return this; }

    setOnClick(action) { this.element.addEventListener("click", action); return this; }
    setOnKeyDown (action) { this.element.addEventListener("keydown", action); return this; }

    getViewStack() { return (this._viewStack ? this._viewStack : (parent ? parent.getViewStack() : null)); } 

    getWeight() { return this.weight ? this.weight : 1; }
    getEmHeight() { var parent = this.element || document.body;
      var div = $$('div', parent);
      div.style.height = "1000em";
      var result = div.offsetHeight / 1000;
      parent.removeChild(div);
      return result;
    }
  
    tick() { for (let v of this.subViews) v.tick(); return this; } 
}

function xid(name, ext) { return (name ? (name + ".") : "") + ext; }

function viewById(id) { var v = new View(); v.element = $(id); return v; }  

class ViewLabel extends View { constructor(label, id) { super(xid(id, "ViewLabel")); this.setLabel(label); } setLabel(label) { this.element.textContent = label; } }
class ViewLabeledValue extends View { constructor(label, value, vertical, id) { super(xid(id, "ViewLabeledValue|" + label)); 
  this.setBoxLayout(vertical).addSubViews([new ViewLabel(label), new ViewLabel(JSON.stringify(value))]);
} }

class ViewCentering extends View {
  constructor(subView, parentView) { super();
    (this.setParent(parentView).td = $$("center", $$("td", $$("tr", this.table = $$("table", this.element))))).appendChild(subView.setStylePosition("relative").setSize(null, null, " ").element);
    setElementSize(this.table, 100, 100);
    this.td.style.verticalAlign = "middle";
  }
}

class ViewScrollArea extends View {
  constructor(name) { super(xid(name, "ViewScrollArea"));
    this.addSubViews([(this.wrappingView = new View(this.getXID("WrappingView"))).setStylePosition("absolute")]).setOffset(new Point(0, 0), "%");
  }

  setScrollAreaSize(p) {console.log("VSA(" + super.getID() + ")::setScrollAreaSize:" + JSON.stringify(p)); this.wrappingView.setSiz(p); return this; }
  setOffset(toP, u, fromP) { this.wrappingView.setPos(toP, u, fromP ? fromP : this.lastOffset); this.lastOffset = toP; return this; }
}

class ViewStack extends View {
  constructor(name) { super(xid(name, "ViewStack")); 
    this.setBoxLayout(true).addSubViews([(this.headerView = new View(this.getXID(":Header"))).setWeight(1).setBoxLayout(), 
                                         (this.contentView = new ViewScrollArea(this.getXID(":Contents"))).setWeight(9)]);
    this.contentView.wrappingView.setBoxLayout();
    this.stack = [];
  }

  push(caption, view) {
    view._viewStackIndex = this.stack.length;
    view._viewStack = this;
    this.stack.push(view);
    this.headerView.addSubViews([(new ViewLabel(caption)).setStyleClass("stackTitle")]);
    var p = this.stack.length - 1;
    this.contentView.setScrollAreaSize(new Point(100*this.stack.length, 100)).setOffset(new Point(-100*p, 0), "%", new Point(-100*(p - 1), 0)).wrappingView.addSubViews([view]);
    return this;
  }
}

class ViewTabControl extends View {
  constructor(name) { super(xid(name, "ViewTabControl")); 
    this.activeTabIndex = 0;
    this.setBoxLayout(true).addSubViews([(this.indexView = new View(this.getXID(":Header"))).setBoxLayout().setWeight(1).setStyleClass("sub"),
                                         (this.contentView = new ViewScrollArea(this.getXID(":ScrollArea"))).setWeight(9)]).setStyleClass("subd");
    this.contentView.wrappingView.setBoxLayout();                                         
    this.tabs = [];
  }

  setOrientation(horizontal) { console.log("VTC::setOr");
    this.indexView.setBoxLayout(horizontal);
    this.contentView.wrappingView.setBoxLayout(horizontal);
    return this.setBoxLayout(!horizontal);
  }

  addTab(label, view) { console.log("VTC::addTab");
    var viewLabel;
    var tabIndex = (new ViewCentering(viewLabel = new ViewLabel(label), this.indexView))
    .setOnClick(((viewTabControl, ix) => function() { viewTabControl.activateTab(ix); })(this, this.indexView.subViews.length));
    this.indexView.addSubViews([tabIndex]);
    this.contentView.wrappingView.addSubViews([view]);//.element.appendChild(view.element);
    this.tabs.push(view);
    this.contentView.setScrollAreaSize(new Point(100*this.tabs.length, 100));
    return this.activateTab(this.activeTabIndex);
  }

  activateTab(index) { console.log("VTC::activateTab");
    var last = this.activeTabIndex;
    this.activeTabIndex = index;
    this.contentView.setOffset(new Point(-100*this.activeTabIndex, 0), "%");
    for (var x = 0; x < this.contentView.subViews.length; ++x) {
      this.contentView.subViews[x].setVisible(Math.abs(x - index) <= 1);
      this.indexView.subViews[x].setStyleClass(x == index ? "activeTab" : "inactiveTab");
    }
    return this;
  }
}

class ListDataProvider {
  getElementCount() { return 0; }
  instantiateItem(index) { }
}

class ListDataProviderForArray extends ListDataProvider {
  constructor(data) { super(); this.data = data; }
  getElementCount() { return this.data.length; }
  instantiateItem(ix) { console.log(JSON.stringify(this.data[ix])); 
    return (new ViewLabel(JSON.stringify(this.data[ix]))).setOnClick(((ix, data, view) => function() { view.parent._viewStack.push(ix, new ViewList(new ListDataProviderForObject(data))) })(ix, this.data[ix], v));
  }
}

class ListDataProviderForObject extends ListDataProvider { 
  constructor(data) { super(); this.data = data; }
  getElementCount() { return Object.keys(this.data).length; }
  instantiateItem(ix) { var key = Object.keys(this.data)[ix];
    var d = this.data[key];
    var v = (new View()).setBoxLayout().addSubViews([new ViewLabel(key), new ViewLabel(JSON.stringify(d))]);
    if (Array.isArray(d)) v.setOnClick(((key, data, view) => function() { view.parent._viewStack.push(key, new ViewList(new ListDataProviderForArray(data))) })(key, d, v));
    return v;
  }
}

class SubViewManagerVirtual { 
  constructor(dataProvider) { 
    this.dataProvider = dataProvider;
    this.lastViews = {}; 
  }
  arrangeSubViews(view, subViews) {
    var displayCount = Math.min(view.getVisibleCount(), this.dataProvider.getElementCount());
    var first = Math.floor(view.offset);
   // console.log("Visible count = " +  view.getVisibleCount() + " Data element count = " +  this.dataProvider.getElementCount() + " first = " + first + " displayCount = " + displayCount)
    var prevLastViews = this.lastViews;
    this.lastViews = {};
    for (var x = 0; x < displayCount; ++x) { 
      var ix = first + x;
      var cachedV = prevLastViews[ix], newV = (cachedV ? cachedV : this.dataProvider.instantiateItem(ix).setParent(view));
      prevLastViews[ix] = null;
      this.lastViews[ix] = newV.setSize(100 + "%", view.itemHeight + "em", " ").setPosition(0, (ix - view.offset)*view.itemHeight, "em");
      if (!cachedV) view.subViews.push(newV.applyStyle({backgroundColor: "hsl(0, 0%, " + (0 + 12.5*(ix % 2)) + "%)"}).setStylePosition("absolute").setStyleClass("subd"));
    }
    for (let v in prevLastViews) if (prevLastViews[v]) prevLastViews[v].remove();
  } 
}

class ViewList extends View {
  constructor(dataProvider, id) { super(xid(id, "ViewList"));
    this.dataProvider = dataProvider;
    this.offset = 0;
    this.itemHeight = 1.5;
    this.setOnKeyDown(((i) => function(event) {
      var delta = 0;
      console.log("keydown: " + event.key);
      switch (event.key) {
        case 38: { delta = -1; break; }
        case 40: { delta = 1; break; }
      }
      console.log("keydown delta: " + delta);
      delta = Math.max(0, Math.min(i.offset + delta, i.getMaxOffset() )) - (i.offset + delta);
      i.offset += delta;
      i.arrangeSubViews();
    })(this))
    .layout = new SubViewManagerVirtual(dataProvider);
  }

  getMaxOffset() { return Math.max(0, this.dataProvider.getElementCount() - getEmHeight()); }
  getVisibleCount() { return Math.ceil(((this.element.offsetHeight / this.getEmHeight()) / this.itemHeight) + frac(this.offset)); }
}

class ViewObject extends ViewList { constructor(o) { super(new ListDataProviderForObject(o)); } }
class ViewArray extends ViewList { constructor(o) { super(new ListDataProviderForArray(o)); } }

class ViewObjectSummary extends ViewLabel {
  constructor(caption, object, id) { super(JSON.stringify(this.object = object), xid(id, "ViewObjectSummary")); this.caption = caption; this.setOnClick(((i) => i.onClick)(this)); }
  onClick() {
    var viewStack = this.getViewStack();
    if (viewStack) viewStack.push(new ViewObject(this.caption, this.object));
  }
}