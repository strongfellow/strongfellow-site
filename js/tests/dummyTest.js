
"use strict";
define(
    ['btc/util', 'block'],
    function(util, block) {
        var run = function() {
          test('genesis block hash should be 000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f', function() {
            var genesisHeader = '0100000000000000000000000000000000000000000000000000000000000000000000003BA3EDFD7A7B12B27AC72C3E67768F617FC81BC3888A51323A9FB8AA4B1E5E4A29AB5F49FFFF001D1DAC2B7C';
            var bytes = util.hexToBytes(genesisHeader);
            var actualHash = util.doubleSha(bytes);
            var expectedHash = '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
            equal(actualHash, expectedHash);
            var blockHex = 'f9beb4d9d800000001000000b19184bcabf052a9d2cd7009ab899fb1ad66583fd5c540a3df31530c0000000000b2b68c989652a58bb8ee56e45691a42db753e2e020dba86c88b000c0e31e2af1729849ffff001d747354040101000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0804ffff001d027e03ffffffff0100f2052a0100000043410425b984737c80cd783fc9b79d41936ba1773b9ec2154aa290cbdc7463af9e13ffa90481364eeb229abb4da9125c68854682bac9c798787afb5faadefd08111c6dac00000000';
            var blk = block.parseBlockHex(blockHex);
            equal('f9beb4d9', blk.magic);
            equal(216, blk.length);
            equal('00000000fc713cb2f96439f80c82d1c7d24f7c0ee6e29466a19acd3665fe0abd', blk.header.hash);
            equal('2a1ee3c000b0886ca8db20e0e253b72da49156e456eeb88ba55296988cb6b200', blk.header.hashMerkleRoot)
            equal(72643444, blk.header.nonce);
            console.log(blk);
          });
        };
        return {run: run}
    }
);
