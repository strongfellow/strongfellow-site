
requirejs.config({
  shim : {
    'bootstrap' : { deps :['jquery'] }
  },
  paths: {
    jquery: 'jquery-2.1.3',
    bootstrap: '//netdna.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min'
  }
});

require(['jquery', 'moment.min', 'bootstrap', 'block'], function($, moment, bootstrap, block) {

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


  var loadBlock = function(blockHash) {
    var path = '/v1/block/' + blockHash  + '/raw';
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
          console.log(blk);

          var table = $('<table>').addClass('table-striped');
          var appendTr = function(label, value) {
            table.append($('<tr>').append($('<td>').html(label)).append($('<td>').html(value)));
          };

          appendTr('Number of Transactions', blk.transactions.length);
          appendTr('Timestamp', moment.unix(blk.header.time).utc().format());
          var sum = 0;
          for (var i = 0; i < blk.transactions.length; i++) {
            var outputs = blk.transactions[i].outputs;
            for (var j = 0; j < outputs.length; j++) {
              sum += outputs[j].value;
            }
          }
          appendTr('Output Total', sum);

          $('#block-summary').empty().append(table);

          var div = $('#transactions');
          div.append($('<h3>').html('Transactions'));
          var transactionsTable = $('<table>').appendTo(div);
          for (var i = 0; i < blk.transactions.length; i++) {
            var tx = blk.transactions[i];
            var tr = $('<tr>').appendTo(transactionsTable);
            tr.append($('<p>').append($('<a>').html(tx.hash)));
            tr.append($('<p>').html(JSON.stringify(tx)));
          }

        });
        reader.readAsArrayBuffer(blob);
      }
    });

  }

  $(function() {
    $("#search-form").submit(function( event ) {
      event.preventDefault();
      var block = $('#search-input').val();
      loadBlock(block);
    });
    loadBlock('000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f');
  });
});
