const ethSigUtil = require("eth-sig-util");

const RobustRelayer = artifacts.require("RobustRelayer");
const SimpleRelayer = artifacts.require("SimpleRelayer");
const OptimizedRelayer = artifacts.require("OptimizedRelayer");
const Calculator = artifacts.require("Calculator");

// 0x26fa9f1a6568b42e29b1787c403B3628dFC0C6FE
const PRI_KEY = "8179ce3d00ac1d1d1d38e4f038de00ccd0e0375517164ac5448e3acc847acb34";

contract("SimpleRelayer", function ([operator, relayee]) {
  const relayeeWallet = web3.eth.accounts.privateKeyToAccount(PRI_KEY);
  let rRelayer;
  let sRelayer;
  let oRelayer;
  let calculator;

  beforeEach(async function () {
    rRelayer = await RobustRelayer.new();
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
      const rReceipts = [];
      const sReceipts = [];
      const oReceipts = [];
      for (let i = 0; i < 5; i++) {
        // robust relayer
        const req = {
          from: relayee,
          to: calculator.address,
          value: "0",
          gas: "5000",
          nonce: Number(await rRelayer.getNonce(relayee)),
          data: abiEncodedCall,
        };
        const data = {
          types: {
            EIP712Domain: [
              { name: "name", type: "string" },
              { name: "version", type: "string" },
              { name: "chainId", type: "uint256" },
              { name: "verifyingContract", type: "address" },
            ],
            ForwardRequest: [
              { name: "from", type: "address" },
              { name: "to", type: "address" },
              { name: "value", type: "uint256" },
              { name: "gas", type: "uint256" },
              { name: "nonce", type: "uint256" },
              { name: "data", type: "bytes" },
            ],
          },
          domain: {
            name: "MinimalForwarder",
            version: "0.0.1",
            chainId: await web3.eth.getChainId(),
            verifyingContract: rRelayer.address,
          },
          primaryType: "ForwardRequest",
          message: req,
        };
        const signature = ethSigUtil.signTypedMessage(Buffer.from(PRI_KEY, "hex"), { data });
        rReceipts.push(await rRelayer.execute(req, signature, { from: operator }));

        // simple relayer
        const shash = await sRelayer.hashOfRequest(relayee, calculator.address, abiEncodedCall);
        const ssig = await web3.eth.accounts.sign(shash, relayeeWallet.privateKey);
        sReceipts.push(
          await sRelayer.execute(relayee, calculator.address, abiEncodedCall, ssig.v, ssig.r, ssig.s, { from: operator })
        );

        // optimized relayer
        const ohash = await oRelayer.hashOfRequest(relayee, calculator.address, abiEncodedCall);
        const osig = await web3.eth.accounts.sign(ohash, relayeeWallet.privateKey);
        oReceipts.push(
          await oRelayer.execute(relayee, calculator.address, abiEncodedCall, osig.v, osig.r, osig.s, { from: operator })
        );

        // assert that hash and signature between simple and optimized are equal
        assert.equal(shash, ohash, "hashes are not equal");
        assert.equal(ssig.signature, osig.signature, "signature are not equal");
      }

      // print gas cost
      for (let i = 0; i < rReceipts.length; i++) {
        const rRate =
          Math.round(((rReceipts[i].receipt.gasUsed - oReceipts[i].receipt.gasUsed) / rReceipts[i].receipt.gasUsed) * 100000) /
          1000;
        const sRate =
          Math.round(((sReceipts[i].receipt.gasUsed - oReceipts[i].receipt.gasUsed) / sReceipts[i].receipt.gasUsed) * 100000) /
          1000;
        console.log(
          `[${i + 1} times] robust: ${rReceipts[i].receipt.gasUsed}, simple: ${sReceipts[i].receipt.gasUsed}, optimized: ${
            oReceipts[i].receipt.gasUsed
          }, robust/optimized: ${rRate}%, simple/optimized: ${sRate}%`
        );
      }
    });
  });
});
