const OptimizedRelayer = artifacts.require("OptimizedRelayer");

module.exports = function (deployer) {
  deployer.deploy(OptimizedRelayer);
};
