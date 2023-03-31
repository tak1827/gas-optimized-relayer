const SimpleRelayer = artifacts.require("SimpleRelayer");
const OptimizedRelayer = artifacts.require("OptimizedRelayer");
const Calculator = artifacts.require("Calculator");

// 0x26fa9f1a6568b42e29b1787c403B3628dFC0C6FE
const PRI_KEY = "8179ce3d00ac1d1d1d38e4f038de00ccd0e0375517164ac5448e3acc847acb34";

contract("SimpleRelayer", function ([operator, relayee]) {
  const relayeeWallet = web3.eth.accounts.privateKeyToAccount(PRI_KEY);
  let sRelayer;
  let oRelayer;
  let calculator;

  beforeEach(async function () {
    sRelayer = await SimpleRelayer.new();
    oRelayer = await OptimizedRelayer.new();
    calculator = await Calculator.new();
  });

  describe("execute", () => {
    it("mesure gas cost 5 times", async function () {
      const abiEncodedCall = web3.eth.abi.encodeFunctionCall(
        {
          name: "sum",
          type: "function",
          inputs: [
            { type: "uint256", name: "a" },
            { type: "uint256", name: "b" },
          ],
        },
        [1, 2]
      );

      // execute 5 times
      const sReceipts = [];
      const oReceipts = [];
      for (let i = 0; i < 5; i++) {
        // simple relayer
        const shash = await sRelayer.hashOfRequest(relayee, calculator.address, abiEncodedCall);
        const ssig = await web3.eth.accounts.sign(shash, relayeeWallet.privateKey);
        sReceipts.push(
          await sRelayer.execute(
            relayee,
            calculator.address,
            abiEncodedCall,
            ssig.v,
            ssig.r,
            ssig.s,
            {
              from: operator,
            }
          )
        );

        // optimized relayer
        const ohash = await oRelayer.hashOfRequest(relayee, calculator.address, abiEncodedCall);
        const osig = await web3.eth.accounts.sign(ohash, relayeeWallet.privateKey);
        oReceipts.push(
          await oRelayer.execute(
            relayee,
            calculator.address,
            abiEncodedCall,
            osig.v,
            osig.r,
            osig.s,
            {
              from: operator,
            }
          )
        );

        // assert that hash and signature are equal
        assert.equal(shash, ohash, "hashes are not equal");
        assert.equal(ssig.signature, osig.signature, "signature are not equal");
      }

      // print gas cost
      for (let i = 0; i < sReceipts.length; i++) {
        const rate =
          ((sReceipts[i].receipt.gasUsed - oReceipts[i].receipt.gasUsed) /
            sReceipts[i].receipt.gasUsed) *
          100;
        console.log(
          `[${i + 1} times] simple: ${sReceipts[i].receipt.gasUsed}, optimized: ${
            oReceipts[i].receipt.gasUsed
          }, reducedRate: ${rate}%`
        );
      }
    });
  });
});
