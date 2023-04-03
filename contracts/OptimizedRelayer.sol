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
        (bool success, int calldataPtr) = verify(sender, to, data, v, r, s);
        if (!success) _revert(NotMatchWithRecoverdSigner.selector);

        assembly {
            // Inclement nonce
            // same as: _nonces[sender] += 1;
            mstore(0x20, _nonces.slot)
            mstore(0x00, sender)
            let slot := keccak256(0x00, 0x40)
            sstore(slot, add(sload(slot), 1))

            // Append the address of the original function executer to the end of calldata
            // same as: bytes memory cdata = abi.encodePacked(data, sender);
            let appendSize := add(data.length, 0x14)
            mstore(add(calldataPtr, data.length), shl(96, sender))

            // Call relayee function
            // same as: (bool success, bytes memory returndata) = to.call(cdata);
            if iszero(call(gas(), to, 0, calldataPtr, appendSize, 0, 0)) {
                switch returndatasize()
                case 0 {
                    mstore(0x00, 0xbbdf0a77) // -> CallReverted.selector
                    revert(0x00, 0x04)
                }
                default {
                    returndatacopy(0x00, 0x00, returndatasize())
                    revert(0x00, returndatasize())
                }
            }
        }
    }

    function verify(
        address sender,
        address to,
        bytes calldata data,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public view returns (bool result, int calldataPtr) {
        bytes32 hash;

        assembly {
            // NOTE: inlined hashOfRequest to save gas
            // ********** start **********

            // Get nonce
            mstore(0x20, _nonces.slot)
            mstore(0x00, sender)
            let nonce := sload(keccak256(0x00, 0x40))

            // Get free memory pointer
            calldataPtr := mload(0x40)

            // Compute hash of data
            // dataHash := keccak256(add(data, 0x20), mload(data))
            calldatacopy(calldataPtr, data.offset, data.length)
            hash := keccak256(calldataPtr, data.length) // dataHash

            // Update free memory pointer to preserve mem stored calldata
            let ptr := add(calldataPtr, data.length)
            mstore(0x40, ptr)

            // Store the function arguments sequentially in memory
            mstore(ptr, sender)
            mstore(add(ptr, 0x20), to)
            mstore(add(ptr, 0x40), nonce)
            mstore(add(ptr, 0x60), hash) // dataHash

            // Compute the final hash
            hash := keccak256(ptr, 0x80) // finalHash

            // ********** end **********

            // Store the Ethereum Signed Message prefix and the hash
            mstore(ptr, "\x19Ethereum Signed Message:\n32\x00\x00\x00\x00")
            mstore(add(ptr, 0x1c), hash) // finalHash

            // Compute the ethSignedMessageHash
            hash := keccak256(ptr, 0x3c) // ethSignedMessageHash
        }

        result = sender == ecrecover(hash, v, r, s);
    }

    function hashOfRequest(
        address sender,
        address to,
        bytes calldata data
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
