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

  var showContext = function(context) {
    var reward = context.outputValue.subtract(context.inputValue).toString(10);
    var tx0 = context.block.transactions[0];
    var v = new Long();
    for (var i = 0; i < tx0.outputs.length; i++) {
      v = v.add(tx0.outputs[i].value);
    }
    $('#reward').html(reward);
    v = v.subtract(reward);
    $('#fees').html(v.toString(10));

    var n = 0;
    var txs = context.block.transactions;
    for (var i = 0; i < txs.length; i++) {
      var tx = txs[i];
      var txdiv = $('<div>').addClass('txdiv');
      var table = $('<table>')
        .attr({cellspacing:'0', cellpadding: '0'})
        .css({padding: '0px', float: 'left',margin:'0px',width:'100%'})
        .addClass('table table-striped').appendTo(txdiv);
      var tbody = $('<tbody>').appendTo(table);
      tbody.append($('<tr>').append(
        $('<th>').attr({align:'left',colspan:'3'})
                 .append($('<a>').html(tx.hash))));
      var txtotal = new Long();
      $('<div>').css({'padding-bottom':'30px', 'width':'100%', 'text-align': 'right', 'clear':'both'})
        .append($('<button>')
                .addClass('btn btn-success cb').append($('<span>').html(txtotal.toString(10))))
        .appendTo(txdiv)
      $('#tx-div').append(txdiv);
    }
  }

  $(function() {
    var context = {}
    var blockHash = /[&\?]block=(.{64})/.exec(window.location.href)[1]
    loadBlock(blockHash, function(blk) {
      $('#ntx').html(blk.transactions.length);
      $('#timestamp').html(moment.unix(blk.header.time).utc().format());
      $('#nonce').html(blk.header.nonce);
      $('#size').html(blk.length);
      $('#version').html(blk.header.version);
      
      var bits = blk.header.bits;
      var bitsAsLong = "";
      for (var i = 0; i < 4; i++) {
        bitsAsLong += bits.substring(6 - 2*i, 8 - 2 * i);
      }
      
      var b = new Long.fromString(bitsAsLong, true, 16);

      $('#bits').html(b.toString(10));

      var t = bitsAsLong.substring(2);
      var exp = parseInt(bitsAsLong.substring(0, 2), 16);
      for (var i = 0; i < (exp - 3); i++) {
        t += "00";
      }

      var target = t;
      while (target.length < 64) {
        target = "00" + target;
      }

      var difficulty = 0;
      $('#target').html(target);
     
      var base = 'FFFF0000000000000000000000000000000000000000000000000000'
      while (t.substring(t.length - 2) == "00" && base.substring(base.length - 2) == "00") {
        t = t.substring(0, t.length - 2);
        base = base.substring(0, base.length - 2);
      }
      var difficulty = parseInt(base, 16) / parseInt(t, 16);

      $('#difficulty').html(difficulty);
      
      // hashes
      $('#hash').html(blk.header.hash);
      $('#prevBlockHash').html(blk.header.hashPrevBlock);
      $('#merkleRoot').html(blk.header.hashMerkleRoot);

      var totalOutputValue = new Long();
      for (var i = 0; i < blk.transactions.length; i++) {
        var tx = blk.transactions[i];
        var outputs = tx.outputs;
        for (var j = 0; j < outputs.length; j++) {
          totalOutputValue = totalOutputValue.add(outputs[j].value);
        }
      }
      $('#txout-total').html(totalOutputValue.toString(10));

      context.outputValue = totalOutputValue;
      context.block = blk;
      if (context.txins) {
        showContext(context);
      }
    });

    loadTxouts(blockHash, function(txs) {
      var totalValue = new Long(0, 0, true)
      var values = [];
      for (var i = 8; i < txs.length; i += 8) {
        var sum = new Long(0, 0, true)
        for (var j = 7; j > -1; j--) {
          sum = sum.shiftLeft(8);
          sum = sum.add(txs[i + j]);
        }
        totalValue = totalValue.add(sum)
        values.push(sum)
      }
      $('#txin-total').html(totalValue.toString(10));

      context.inputValue = totalValue;
      context.txins = txs;
      if (context.block) {
        showContext(context);
      }
    });
  });
});
