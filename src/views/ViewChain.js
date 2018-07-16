class Node { constructor(name, url) { this.name = name; this.url = url; } }
var nodes = ["https://mainnet.infura.io/y0J521CNM3wUL557eqZc"].map(x => new Node(x, x));
var rpc = new RPCConnector(nodes[0].url);

class ViewBlockDetails extends ViewList {
  constructor(parent) {
    super(parent, new ListDataProvider());
  }
   
  setBlock(block) {
    this.dataProvider = new ListDataProviderForObject(block);
    this.arrangeSubViews();
  }
}

class ViewTimeStamp extends View {
  constructor(id) { super(xid(id, "ViewTimeStamp")); }

  setTimeStamp(timestamp) { this.timestamp = timestamp; this.tick(); }

  tick() {
    var d = Math.round((Date.now().valueOf() - this.timestamp)/1000.0);
    var t;
    if (d < 60) { t = d + "s ago"; } 
    else { d = Math.round(d/60); if (d < 60) { t = d + "m ago"; } 
    else { d = Math.round(d/60); if (d < 24) { t = d + "h ago"; } 
    else { d = Math.round(d/24); if (d < 7) { t = d + "d ago"; } 
    else { t = Date(this.timestamp*1000); } } } }
    this.element.textContent = t;
  }
}

function blockToElement(b, p) { return (new ViewBlockSummary(b, p)).element; }

function hexToInt(h) { return parseInt(h.slice(2), 16); }

class ViewHash extends View {
  constructor(id) { super(xid(id, "ViewHash")); this.setBoxLayout(); }
  setHash(h) {
    if (h.indexOf("0x") == 0) h = h.substring(2);
    this.hash = h;
    this.removeChildren().addSubViews(h.toUpperCase().split("").map(c => (new ViewLabel(c)).applyStyle({
      fontWeight: "bold", textAlign: "center", color: (i => ((i >= 0) ? ("hsl(" + ((360*i)/16) + ", 35%, 90%)") : "red"))("0123456789ABCDEF".indexOf(c)) 
    })));
  }
}

class ViewHashCentering extends View {
  constructor(id) { super(xid(id, "ViewHashCentering")); this.setBoxLayout(); }
}

class ViewBlockLink extends View {
  constructor(id) { super(xid(id, "ViewBlockLink"));
    this.setBoxLayout().addSubViews([(this.viewHash = new ViewHash()), this.viewNumber = new ViewLabel()]).setOnClick(this.onClick);
  }

  setHash(hash) { this.viewHash.setHash(hash); return this; }
  setNumber(number) { this.viewNumber.setLabel(number); return this; }
}

class ListDataProviderForViewAccount extends ListDataProvider {
  getElementCount() { return this.commands.length; }
  instantiateItem(index) { 
    var viewResponse = (new View()).setFitLayout();
    rpc.rpcCall(this.commands[index], {}, (command => function(result) { viewResponse.addSubViews([new ViewLabeledValue(command, result.result)]); })(this.commands[index]));
    return viewResponse;
  }
}

class ViewAccount extends ViewList {
  constructor(id) { super(new ListDataProviderForViewRPC(), xid(id, "ViewAccount")); 
    this.commands = ["eth_getBalance", "eth_getTransactionCount"];
  }
}

class ViewAccountLink extends View {
  constructor(id) { super(xid(id, "ViewAccountLink")); 
    this.addSubViews([(this.viewHash = new ViewHash()).setOnClick(this.onClick)]);
  }

  onClick() {

  }

  setAccount(a) { this.viewHash.setHash(a); }
}

class ViewBlockSummary extends View {
  constructor() {
    super(parent);
    var i = this;
    this.setBoxLayout().addSubViews([this.cellNumber = new View(this),
                      this.cellTimestamp = new ViewTimeStamp(this),
                      (this.cellAuthor = new ViewAccountLink()).setSize(null, null, " ").setStylePosition("relative"), this.cellTransactionCount = new View(this)]);
    
    this.cellNumber.element.addEventListener("click", function() { if (i.onClick) { console.log("xx"); i.onClick(); } });
  }
  
  setNumber(number) { this.cellNumber.element.textContent = "@" + number; }
  setTimestamp(timestamp) { this.cellTimestamp.setTimeStamp(timestamp); }
  setAuthor(author) { this.cellAuthor.setAccount(author); }
  setTransactionCount(transactionCount) { this.cellTransactionCount.element.textContent = transactionCount + "~"; }
        
  setBlock(block) {
    this.setNumber(hexToInt(block.number));
    this.setTimestamp((new Date(1000*block.timestamp)));
    this.setAuthor(block.author);
    this.setTransactionCount(block.transactions.length);
    return this;
  }
}

class ListDataProviderForViewChain extends ListDataProvider {
  constructor(viewChain) { super(); this.viewChain = viewChain; }
  getElementCount() { return this.viewChain.lastKnownBlockNumber; } 
  instantiateItem(index) { 
    var viewBlockSummary = new ViewBlockSummary(); 
    rpc.eth_getBlockByNumber(this.viewChain.lastKnownBlockNumber - index, true, ((b, i) => function(result) {  if (result.result) {
      viewBlockSummary.setBlock(result.result).onClick = ((block, i) => function() { i.viewChain.viewCenter.push("Block " + b, new ViewObject(block)) })(result.result, i);
    } })(index, this));
    return viewBlockSummary;
  } 
}

class ViewChain extends View {
  constructor(name) { super(xid(name, "ViewChain"));
    this.setBoxLayout(true).addSubViews([(this.viewHeader = new View(xid(this.getID(), "Header"))).setBoxLayout().addSubViews([this.viewLastBlockNumber = new ViewBlockLink()]), 
                                         (this.viewCenter = new ViewStack(xid(this.getID(), "Content"))).setWeight(15).push("Chain tip", this.blockList = new ViewList(new ListDataProviderForViewChain(this)))]);
  }

  setBlockNumber(number) { this.viewLastBlockNumber.setNumber(number); return this; }

  reset() {
    this.lastKnownBlockNumber = false;
    clearChildren(this.blockList.element); 
  }

  tick() {  rpc.eth_blockNumber(((i) => function(response) { i.setBlockNumber(i.lastKnownBlockNumber = hexToInt(response.result)).blockList.arrangeSubViews(); })(this)); }
}

class ListDataProviderForViewRPC extends ListDataProvider {
  constructor() { super();
    this.commands = ["net_version", "net_peerCount", "net_listening", "eth_protocolVersion", "eth_syncing", "eth_coinbase", "eth_mining", "eth_hashrate", "eth_gasPrice", "eth_blockNumber", "eth_getBalance", 
    "eth_getCompilers", "eth_accounts", "admin_peers", "admin_nodeInfo"];
  }
  getElementCount() { return this.commands.length; }
  instantiateItem(index) { 
    var viewResponse = (new View()).setFitLayout();
    rpc.rpcCall(this.commands[index], {}, (command => function(result) { viewResponse.addSubViews([new ViewLabeledValue(command, result.result)]); })(this.commands[index]));
    return viewResponse;
  }
}
 
class ViewRPC extends ViewList {
  constructor(id) { super(new ListDataProviderForViewRPC(), xid(id, "ViewRPC")); }

  tick() { this.arrangeSubViews(); }
}

class ListDataProviderForViewRPCAdmin extends ListDataProvider {
  constructor() { super();
    this.commands = ["admin_eth_blockQueueStatus", "admin_eth_blockQueueFirstUnknown", "admin_eth_blockQueueRetryUnknown", "admin_eth_allAccounts",
     "admin_net_start", "admin_net_stop", "admin_net_peers", "admin_net_nodeInfo" ];
  }
  getElementCount() { return this.commands.length; }
  instantiateItem(index) { 
    var viewResponse = (new View()).setFitLayout();
    rpc.rpcCall(this.commands[index], ["X"], (command => function(result) { viewResponse.addSubViews([new ViewLabeledValue(command, result.result)]); })(this.commands[index]));
    return viewResponse;
  }
}
 
class ViewRPCAdmin extends ViewList {
  constructor(id) { super(new ListDataProviderForViewRPCAdmin(), xid(id, "ViewRPCAdmin")); }

  tick() { this.arrangeSubViews(); }
}

class ViewExplorer extends ViewTabControl {
  constructor(name) { super(xid(name, "ViewExplorer"));
    (this.viewNodeSelector = new View()).element = $$("select");

    this.setOrientation(false)//
    .addTab("Tip", this.viewChain = new ViewChain())
    .addTab("RPC", this.viewRPC = new ViewRPC())
    .addTab("RPCAdmin", this.viewRPCAdmin = new ViewRPCAdmin())
    .addTab("Find address", new View()).addTab("Find transaction", new View())
    .addTab("Settings", (this.viewSettings = new View()).addSubViews([this.viewNodeSelector])); 
    nodes.forEach(n => { 
      var a = $$("option", this.viewNodeSelector.element); 
      a.node = n;
      a.value = n.url; 
      a.textContent = n.url;
      a.addEventListener("click", e => { console.log(e); rpc = new RPCConnector(e.target.node.url); this.viewChain.reset(); }); 
    });
    ((this.viewEditSessionKey = new View()).element = $$("input", this.viewSettings.element)).type = "text";
    (this.viewEditSessionKey = new View()).element.value = "X";

    this.viewNodeSelector.element.firstChild.selected = true;
  }
}
