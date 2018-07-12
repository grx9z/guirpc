class RPCConnector {
  constructor(rpcUrl) {
    this.rpcUrl = rpcUrl;
  }
  
  rpcCall(command, params, responder) { 
    xhrPostJson(this.rpcUrl, {jsonrpc:"2.0",method:command,params:params,id:83}, responder);
  }
    
  eth_blockNumber(responder) { this.rpcCall("eth_blockNumber", [], responder); }
  eth_getBlockByNumber(number, fullTransactions, responder) { this.rpcCall("eth_getBlockByNumber", ['0x' + number.toString(16), fullTransactions], responder); }
  
}
