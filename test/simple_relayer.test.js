const SimpleRelayer = artifacts.require("SimpleRelayer");
const Hello = artifacts.require("Hello");

// 0x26fa9f1a6568b42e29b1787c403B3628dFC0C6FE
const PRI_KEY = "8179ce3d00ac1d1d1d38e4f038de00ccd0e0375517164ac5448e3acc847acb34"

contract("SimpleRelayer", function ([operator, relayee]) {
  const relayeeWallet = web3.eth.accounts.privateKeyToAccount(PRI_KEY);
  let relayer;
  let hello;

  beforeEach(async function () {
    relayer = await SimpleRelayer.new();
    hello = await Hello.new();
  });

  describe('execute', () => {
    it('mesure gas cost 3 times', async function () {
      const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
        name: 'greet',
        type: 'function',
        inputs: []
      }, []);

      // execute 3 times
      const receipts = [];
      for (let i = 0; i < 3; i++) {
        const hash = await relayer.hashOfRequest(relayee, hello.address, abiEncodedCall);
        const sig = await web3.eth.accounts.sign(hash, relayeeWallet.privateKey);
        receipts.push(await relayer.execute(relayee, hello.address, abiEncodedCall, sig.v, sig.r, sig.s, {from: operator}));
      }

      // print gas cost
      for (let i = 0; i < 3; i++) {
        console.log(`${i+1} times GasUsed: ${receipts[i].receipt.gasUsed}`)
      }
    });
  });
});
