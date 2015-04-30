

define(['sha256'], function(jsSHA) {
  var hex = '0123456789abcdef';

  var byteToHex = function(b) {
    return hex.charAt((b >> 4) & 0x0f) + hex.charAt(b & 0x0f);
  };

  var bytesToHex = function(bs, start, end) {
    start = (typeof start == 'undefined') ? 0 : start;
    end = (typeof end == 'undefined') ? bs.length : end;
    var result = '';
    for (var i = start; i < end; i++) {
      result += byteToHex(bs[i]);
    }
    return result;
  };

  var hexToBytes = function(hexEncodedString) {
    var result = new Uint8Array(hexEncodedString.length / 2);
    for (var i = 0; i < result.length; i++) {
      var byte = hexEncodedString.substring(2*i, 2*i + 2);
      result[i] = parseInt(byte, 16);
    }
    return result;
  };

  var doubleSha = function(bytes, start, end) {
    var hex = bytesToHex(bytes, start, end);
    var shaObj = new jsSHA(hex, "HEX");
    var hash = shaObj.getHash("SHA-256", "HEX");
    shaObj = new jsSHA(hash, "HEX");
    hash = shaObj.getHash("SHA-256", "HEX");
    var result = '';
    for (var i = 0; i < 32; i++) {
      result += hash.charAt(62 - (2 * i));
      result += hash.charAt(63 - (2 * i));
    }
    return result;
  };

  return {
    doubleSha: doubleSha,
    byteToHex: byteToHex,
    bytesToHex: bytesToHex,
    hexToBytes: hexToBytes
  };

});
    
