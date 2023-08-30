// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;


contract eventTransfer {
	event transfer(address indexed from, address indexed to, uint256 value);

	constructor() {

	}

	function sendEther(address _receiver) public payable {
		payable(_receiver).transfer(msg.value);
		emit transfer(msg.sender, _receiver, msg.value);
	}

}