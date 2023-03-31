// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./interfaces/IOptimizedRelayer.sol";

contract OptimizedRelayer is IOptimizedRelayer {
    mapping(address => uint256) private _nonces;

    function execute(
        address sender,
        address to,
        bytes calldata data,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        if (!verify(sender, to, data, v, r, s)) _revert(NotMatchWithRecoverdSigner.selector);

        unchecked {
            _nonces[sender] += 1;
        }

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
            _revert(CallReverted.selector);
        }
    }

    function verify(
        address sender,
        address to,
        bytes memory data,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public view returns (bool) {
        uint256 nonce = _nonces[sender];
        bytes32 hash;

        assembly {
            // NOTE: inlined hashOfRequest to save gas
            // ********** start **********

            // Compute hash of data
            let size := mload(data)
            hash := keccak256(add(data, 0x20), size)

            // Get free memory pointer
            let ptr := mload(0x40)

            // Store the function arguments sequentially in memory
            mstore(ptr, sender)
            mstore(add(ptr, 0x20), to)
            mstore(add(ptr, 0x40), nonce)
            mstore(add(ptr, 0x60), hash)

            // Compute the final hash
            hash := keccak256(ptr, 0x80)

            // ********** end **********

            // Store the Ethereum Signed Message prefix and the hash
            mstore(ptr, "\x19Ethereum Signed Message:\n32\x00\x00\x00\x00")
            mstore(add(ptr, 0x1c), hash)

            // Compute the ethSignedMessageHash
            hash := keccak256(ptr, 0x3c)
        }

        return sender == ecrecover(hash, v, r, s);
    }

    function hashOfRequest(
        address sender,
        address to,
        bytes memory data
    ) public view returns (bytes32) {
        return keccak256(abi.encode(sender, to, _nonces[sender], keccak256(data)));
    }

    function nonces(address sender) public view returns (uint256) {
        return _nonces[sender];
    }

    function _revert(bytes4 errorSelector) internal pure {
        assembly {
            mstore(0x00, errorSelector)
            revert(0x00, 0x04)
        }
    }
}
