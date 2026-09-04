// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

interface IAction {
    function action() external returns (uint256);
}

contract BaseAction is IAction {
    function action() public virtual override returns (uint256) {
        return 1;
    }
}

contract ChildAction is BaseAction {
    function action() public virtual override returns (uint256) {
        return 2;
    }

    function callAction() public returns (uint256) {
        return action();
    }
}
