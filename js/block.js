
 
define(['btc/util', 'Long'], function(util, Long) {

  var BlockParser = function() {

    this.hex = function(n) {
      var result = '';
      for (var i = 0; i < n; i++) {
        result += util.byteToHex(this.bytes[this.index + i]);
      }
      this.index += n;
      return result;
    };

    this.uint = function(n) {
      var result = new Long();
      for (var i = 0; i < n; i++) {
        var addend = new Long(this.bytes[this.index + i]).shiftLeft(8 * i);
        result = result.add(addend);
      }
      this.index += n;
      return result;
    };

    this.uint32 = function() {
      return this.uint(4);
    };

    this.uint64 = function() {
      return this.uint(8);
    }

    this.hash = function() {
      var result = '';
      for (var i = 31; i > -1; i--) {
        result += util.byteToHex(this.bytes[this.index + i]);
      }
      this.index += 32;
      return result;
    }

    this.nTimes = function(fun, a, b, c, d, e, f, g, h) {
      while (a || b || c || d || e || f || g || h) {
        fun();
        if (a) {
          a--;
        } else if (b) {
          b--;
          a = 255;
        } else if (c) {
          c--;
          b = 255; 
          a = 255;
        } else if (d) {
          d--;
          c = 255;
          b = 255;
          a = 255;
        } else if (e) {
          e--;
          d = 255;;
          c = 255;
          b = 255;
          a = 255;
        } else if (f) {
          f--;
          e = 255;
          d = 255;;
          c = 255;
          b = 255;
          a = 255;
        } else if (g) {
          g--;
          f = 255;
          e = 255;
          d = 255;;
          c = 255;
          b = 255;
          a = 255;
        } else if (h) {          
          h--;
          g = 255;
          f = 255;
          e = 255;
          d = 255;;
          c = 255;
          b = 255;
          a = 255;
        }
      }
    };

    this.bytes = null;
    this.index = 0;

    this.header = function() {
      var sha = util.doubleSha(this.bytes, this.index, this.index + 80);
      console.log(sha);

      var version = this.uint32();
      var hashPrevBlock = this.hash();
      var hashMerkleRoot = this.hash();
      var time = this.uint32();
      var bits = this.hex(4);
      var nonce = this.uint32();
      return {
        hash: sha,
        version: version,
        hashPrevBlock: hashPrevBlock,
        hashMerkleRoot: hashMerkleRoot,
        time: time,
        bits: bits,
        nonce: nonce,
      }
    };

    this.inputScriptAppender = function(input) {
      var that = this;
      return function() {
        input.script += util.byteToHex(that.bytes[that.index]);
        that.index++;
      };
    }

    this.outputScriptAppender = function(output) {
      var that = this;
      return function() {
        output.script += util.byteToHex(that.bytes[that.index]);
        that.index++;
      };
    }

    this.inputAdder = function(inputs) {
      var that = this;
      return function() {
        var input = {};
        input.previousTx = that.hash();
        input.previousIndex = that.uint32();
        input.script = '';
        that.varInt(that.inputScriptAppender(input));
        input.sequenceNo = that.hex(4);
        inputs.push(input);
      };
    };

    this.outputAdder = function(outputs) {
      var that = this;
      return function() {
        var output = {};
        output.value = that.uint64();
        output.script = '';
        that.varInt(that.outputScriptAppender(output));
        outputs.push(output);
      };
    }

    this.transactionAdder = function(ts) {
      var that = this;
      return function() {
        var start = that.index;
        var tx = {};
        tx.version = that.uint32();
        tx.inputs = [];
        that.varInt(that.inputAdder(tx.inputs));
        tx.outputs = [];
        that.varInt(that.outputAdder(tx.outputs));
        tx.lockTime = that.uint32();
        var end = that.index;

        var sha = util.doubleSha(that.bytes, start, end);
        tx.hash = sha;
        tx.length = (end - start);
        ts.push(tx);
      }
    }

    this.parseBlock = function(bytes, idx) {
      this.bytes = bytes;
      this.index = (typeof idx != 'undefined') ? idx : 0;

      var magic = this.hex(4);
      var length = this.uint32();
      var header = this.header();
      var txs = [];
      this.varInt(this.transactionAdder(txs));

      return {
        magic: magic,
        length: length,
        header: header,
        transactions: txs
      }
    }

    this.varInt = function(f) {
      var start = this.index;
      var byte = this.bytes[this.index];
      if (byte < 0xfd) {
        this.index++;
        this.nTimes(f, byte);
      } else if (byte == 0xfd) {
        this.index += 3;
        this.nTimes(f,
                    this.bytes[start + 1],
                    this.bytes[start + 2]);
      } else if (byte == 0xfe) {
        this.index += 5;
        this.nTimes(f,
                    this.bytes[start + 1],
                    this.bytes[start + 2],
                    this.bytes[start + 3],
                    this.bytes[start + 4]);
      } else {
        this.index += 9;
        this.nTimes(f,
                    this.bytes[start + 1],
                    this.bytes[start + 2],
                    this.bytes[start + 3],
                    this.bytes[start + 4],
                    this.bytes[start + 5],
                    this.bytes[start + 6],
                    this.bytes[start + 7],
                    this.bytes[start + 8]);
      }
    };
  }

  var parser = new BlockParser();

  return {
    parseBlock: function(bytes, index) {
      return parser.parseBlock(bytes, index);
    },
    parseBlockHex: function(hex) {
      var bytes = util.hexToBytes(hex);
      return parser.parseBlock(bytes);
    }
  };
});
