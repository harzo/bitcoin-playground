import * as bjs from 'bitcoinjs-lib';

interface Vin {
  txid: string;
  vout: number;
  address: string;
  amount: number;
}

export interface BuilderParams {
  sellerAddress: string;
  buyerAddress: string;
  thirdpartyAddress: string;
  scriptAddress: string;
  transactionVins: Vin[];
  amount: number;
  thirdpartyFee: number;
  minersFee: number;
}

function btcToSatoshi(amount: number) {
  return Math.floor(amount * Math.pow(10, 8));
}

export function getScriptAddress(witnessScript: Buffer, testnet?: boolean) {
  const witnessScriptHash = bjs.crypto.sha256(witnessScript);
  const redeemScript = bjs.script.witnessScriptHash.output.encode(
    witnessScriptHash
  );
  const redeemScriptHash = bjs.crypto.hash160(redeemScript);
  const scriptPubKey = bjs.script.scriptHash.output.encode(redeemScriptHash);

  return bjs.address.fromOutputScript(
    scriptPubKey,
    testnet ? bjs.networks.testnet : bjs.networks.bitcoin
  );
}

export function parseParams(params: BuilderParams) {
  if (!('buyerAddress' in params)) {
    return false;
  }
  // todo: parse rest of params
}

export function buildTransaction(params: BuilderParams, testnet?: boolean) {
  const txb = new bjs.TransactionBuilder(
    testnet ? bjs.networks.testnet : bjs.networks.bitcoin
  );

  txb.setVersion(testnet ? 2 : 1);

  // todo: compare vins value with transaction value
  let vinsValue = 0;
  for (let utxo of params.transactionVins) {
    txb.addInput(utxo.txid, utxo.vout);
    vinsValue += utxo.amount;
  }

  txb.addOutput(params.scriptAddress, btcToSatoshi(params.amount));

  txb.addOutput(params.thirdpartyAddress, btcToSatoshi(params.thirdpartyFee));

  txb.addOutput(
    params.sellerAddress,
    btcToSatoshi(
      vinsValue - (params.amount + params.thirdpartyFee + params.minersFee)
    )
  );

  const tx = txb.buildIncomplete();
  return tx.toHex();
}
