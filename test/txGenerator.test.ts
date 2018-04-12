import { assert } from 'chai';

import {
  BuilderParams,
  buildTransaction,
  getScriptAddress,
  parseParams
} from '../txGenerator';
import * as bjs from 'bitcoinjs-lib';

const sellerAddress = '2MxvBWEq38yWxqxgvNYPLVWMvDafL9breUF';
const buyerAddress = '2N3WiSpTLmLdjdwH5rFVmHXfhdC9qVswEWV';
const thirdpartyAddress = '2N4VF4FeSfvmL4wLPRWNQNx4oagQR4fwpzT';

const sellerInputs = [
  {
    txid: '1ece533038831e69e6b09c89441460c6e2715db10ab94f786b8fffe266a1e622',
    vout: 0,
    address: '2MxvBWEq38yWxqxgvNYPLVWMvDafL9breUF',
    account: '',
    redeemScript: '001423af1a3b9b3215b9f4b4e1236ee46639c5f5d3be',
    scriptPubKey: 'a9143e36c73d865cbeec91069a23c4c0dd1e43a0034f87',
    amount: 5.0,
    confirmations: 3,
    spendable: true,
    solvable: true,
    safe: true
  }
];

// example taken from https://github.com/bitcoinjs/bitcoinjs-lib/issues/856
const simpleScript = bjs.script.compile([
  bjs.opcodes.OP_ADD,
  bjs.opcodes.OP_7,
  bjs.opcodes.OP_EQUAL
]);

const amount = 2.0;
const thirdpartyFee = 0.02;
const minersFee = 0.0001;

describe('#getScriptAddress', () => {
  it('generate valid P2WSH address for random script', async () => {
    const scriptAddress = getScriptAddress(simpleScript, true);

    assert.equal(scriptAddress, '2NFCQZeVoMTjKUc3nxrx4w72xHnb6DJu6Jy');
  });

  it('generate valid P2WSH address for thirdparty script', async () => {
    const script = compileThirdpartyScript('A', 'B', 'C', 'D');
    const scriptAddress = getScriptAddress(script, true);

    console.log(scriptAddress);
  });
});

describe('#parseParameters', () => {
  it('should fail when no params', async () => {
    assert.isFalse(parseParams({} as BuilderParams));
  });

  // todo: assert other possibilities
});

describe('#buildTransaction', () => {
  const params = {
    sellerAddress,
    buyerAddress,
    thirdpartyAddress,
    scriptAddress: getScriptAddress(simpleScript, true),
    transactionVins: sellerInputs,
    amount,
    thirdpartyFee,
    minersFee
  };

  it('should generate valid hex transaction', async () => {
    const txHex = buildTransaction(params, true);
    assert.equal(
      txHex,
      '020000000122e6a166e2ff8f6b784fb90ab15d71e2c6601444899cb0e6691e83383053ce1e0000000000ffffffff0300c2eb0b0000000017a914f0ca58dc8e539421a3cb4a9c22c059973075287c8780841e000000000017a9147b501956506de428717e46d21db34065dc26d9788770f7c2110000000017a9143e36c73d865cbeec91069a23c4c0dd1e43a0034f8700000000'
    );
  });
});

function compileThirdpartyScript(
  secretS: string,
  secretB: string,
  sellerPK: string,
  buyerPK: string
) {
  return bjs.script.compile([
    bjs.opcodes.OP_HASH160,
    bjs.opcodes.OP_DUP,
    bjs.opcodes.OP_PUSHDATA1,
    1,
    Buffer.from(secretS, 'hex'),
    bjs.opcodes.OP_EQUALVERIFY,
    bjs.opcodes.OP_IF,
    bjs.opcodes.OP_DROP,
    // standard transaction to bjs address
    bjs.opcodes.OP_DUP,
    bjs.opcodes.OP_HASH160,
    bjs.opcodes.OP_PUSHDATA1,
    1,
    Buffer.from(sellerPK, 'hex'),
    bjs.opcodes.OP_EQUALVERIFY,
    bjs.opcodes.OP_CHECKSIG,
    // end
    bjs.opcodes.OP_ELSE,
    bjs.opcodes.OP_PUSHDATA1,
    1,
    Buffer.from(secretB, 'hex'),
    bjs.opcodes.OP_EQUALVERIFY,
    bjs.opcodes.OP_IF,
    // standard transaction to bjs address
    bjs.opcodes.OP_DUP,
    bjs.opcodes.OP_HASH160,
    bjs.opcodes.OP_PUSHDATA1,
    1,
    Buffer.from(buyerPK, 'hex'),
    bjs.opcodes.OP_EQUALVERIFY,
    bjs.opcodes.OP_CHECKSIG,
    // end
    bjs.opcodes.OP_ELSE,
    bjs.opcodes.OP_RETURN,
    bjs.opcodes.OP_ENDIF,
    bjs.opcodes.OP_ENDIF
  ]);
}
