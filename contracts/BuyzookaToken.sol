pragma solidity ^0.5.7;

import "../../openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../../openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol";
import "../../openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import "../../openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

/**
 * @dev An ERC20 implementation of the BuyzookaToken ecosystem token. All tokens are initially pre-assigned to
 * the creator, and can later be distributed freely using transfer transferFrom and other ERC20
 * functions.
 */
contract BuyzookaToken is ERC20, ERC20Pausable, ERC20Burnable, ERC20Detailed {
    uint32 public constant VERSION = 8;

    uint8 private constant DECIMALS = 18;
    uint256 private constant TOKEN_WEI = 10 ** uint256(DECIMALS);

    uint256 private constant INITIAL_WHOLE_TOKENS = uint256((10 ** 8));
    uint256 private constant INITIAL_SUPPLY = uint256(INITIAL_WHOLE_TOKENS) * uint256(TOKEN_WEI);

    /**
     * @dev Constructor that gives msg.sender all of existing tokens.
     */
    constructor () ERC20Detailed("BuyzookaToken", "BZOO", DECIMALS) public {
        // This is the only place where we ever mint tokens.
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}
