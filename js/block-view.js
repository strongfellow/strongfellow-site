requirejs.config({
  shim : {
    'bootstrap' : { deps :['jquery'] }
  },
  paths: {
    jquery: 'jquery-2.1.3',
    bootstrap: '//netdna.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min'
  }
});

require(['jquery', 'moment.min', 'bootstrap', 'block', 'Long'], function($, moment, bootstrap, block, Long) {

 /**
 *
 * jquery.binarytransport.js
 *
 * @description. jQuery ajax transport for making binary data type requests.
 * @version 1.0 
 * @author Henry Algus <henryalgus@gmail.com>
 *
 */

// use this transport for "binary" data type
  $.ajaxTransport("+binary", function(options, originalOptions, jqXHR){
    // check for conditions and support for blob / arraybuffer response type
    if (window.FormData && ((options.dataType && (options.dataType == 'binary')) || (options.data && ((window.ArrayBuffer && options.data instanceof ArrayBuffer) || (window.Blob && options.data instanceof Blob))))) {
      return {
        // create new XMLHttpRequest
        send: function(headers, callback){
          // setup all variables
          var xhr = new XMLHttpRequest(),
          url = options.url,
          type = options.type,
          async = options.async || true,
          // blob or arraybuffer. Default is blob
          dataType = options.responseType || "blob",
          data = options.data || null,
          username = options.username || null,
          password = options.password || null;
          
          xhr.addEventListener('load', function(){
            var data = {};
            data[options.dataType] = xhr.response;
            // make callback and send data
            callback(xhr.status, xhr.statusText, data, xhr.getAllResponseHeaders());
          });
            
          xhr.open(type, url, async, username, password);
          
          // setup custom headers
          for (var i in headers ) {
            xhr.setRequestHeader(i, headers[i] );
          }
          
          xhr.responseType = dataType;
          xhr.send(data);
        },
        abort: function(){}
      };
    }
  });

  var loadTxouts = function(blockHash, cb) {
    var path = '/networks/f9beb4d9/blocks/' + blockHash  + '/txins';
    $.ajax({
      url: path,
      type: "GET",
      dataType: "binary",
      processData: false,
      success: function(blob){
        var reader = new FileReader();
        reader.addEventListener("loadend", function() {
          var arrayBuffer = reader.result;
          var view   = new Uint8Array(arrayBuffer);
          cb(view);
        });
        reader.readAsArrayBuffer(blob);
      }
    });
  }
  var loadBlock = function(blockHash, cb) {
    var path = '/networks/f9beb4d9/blocks/' + blockHash  + '/payload';
    $.ajax({
      url: path,
      type: "GET",
      dataType: "binary",
      processData: false,
      success: function(blob){
        var reader = new FileReader();
        reader.addEventListener("loadend", function() {
          var arrayBuffer = reader.result;
          var view   = new Uint8Array(arrayBuffer);
          var blk = block.parseBlock(view);
          cb(blk);
        });
        reader.readAsArrayBuffer(blob);
      }
    });
  }

  $(function() {
    var block = /[&\?]block=(.{64})/.exec(window.location.href)[1]
    loadBlock(block, function(blk) {console.log(blk);
      $('#ntx').html(blk.transactions.length);
    });

    loadTxouts(block, function(txs) {
      console.log(txs);
      var totalValue = new Long(0, 0, true)
      var values = [];
      for (var i = 8; i < txs.length; i += 8) {
        var sum = new Long(0, 0, true)
        for (var j = 7; j > -1; j--) {
          sum = sum.shiftLeft(8);
          sum = sum.add(txs[i + j]);
        }
        totalValue = totalValue.add(sum)
        console.log(totalValue.toString(10) + " => " + sum.toString(10))
        values.push(sum)
      }
      $('#txin-total').html(totalValue.toString(10));
    });
  });
});
