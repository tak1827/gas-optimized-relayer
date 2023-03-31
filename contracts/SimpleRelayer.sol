// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract SimpleRelayer {
    mapping(address => uint256) public nonces;

    function hashOfRequest(
        address sender,
        address to,
        bytes memory data
    ) public view returns (bytes32) {
        return keccak256(abi.encode(sender, to, nonces[sender], keccak256(data)));
    }

    function execute(
        address sender,
        address to,
        bytes calldata data,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        require(verify(sender, to, data, v, r, s), "signature does not match request");

        nonces[sender] += 1;

        // Append the address of the original function executer to the end of calldata
        bytes memory cdata = abi.encodePacked(data, sender);

        (bool success, bytes memory returndata) = to.call(cdata);

        // revert on failure
        if (!success) {
            if (returndata.length > 0) {
                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            }
            revert("call reverted without message");
        }
    }

    function verify(
        address sender,
        address to,
        bytes calldata data,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal view returns (bool) {
        bytes32 hash = hashOfRequest(sender, to, data);
        // wrap hash value
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );
        address signer = ecrecover(ethSignedMessageHash, v, r, s);
        // Make sure the signer is the same as the original executor
        return signer == sender;
    }
}
