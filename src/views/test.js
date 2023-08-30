import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

const INFURA_ENDPOINT = 'https://sepolia.infura.io/v3/1b3d1e6f66fb41d4bf7e1b8b783a0e2b';
const PRIVATE_KEY = '0x7337ba90651e577aaf4cbb4d661fa71d343d6487bcd06462aee2b405c5b1a36b';

const contractAddress = '0x491768E98AFf8d47FaE7848CA8f28994f3f57e58';
const eventTransferABI = require('./eventTransfer.json');

function Test() {
  const [web3, setWeb3] = useState();
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('');
  const [block, setBlock] = useState({});
  const [transaction, setTransaction] = useState({});

  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');

  const [items, setItems] = useState([]);

  useEffect(() => {
    // const web3Instance = new Web3(new Web3.providers.HttpProvider(INFURA_ENDPOINT));

    const web3Instance = new Web3(window.ethereum);
    window.ethereum.enable();

    setWeb3(web3Instance);
  }, []);

  useEffect(() => {
    if (web3) {
      loadBalance();
      loadBlock();
      loadTransaction();
      listenEvent();
      loadEvent();
    }
  }, [web3]);

  const loadEvent = async () => {
    const number = await web3.eth.getBlockNumber();
    const topic = web3.utils.keccak256('Transfer(address,address,uint256)');

    console.log(number);
    const eventObject = {
      address: contractAddress,
      topics: [topic],
      fromBlock: number - 500n,
      toBlock: 'latest',
    };

    const logs = await web3.eth.getPastLogs(eventObject);
    const array = logs.map((log) => {
      const eventData = web3.eth.abi.decodeLog(
        [
          { type: 'address', name: 'from', indexed: true },
          { type: 'address', name: 'to', indexed: true },
          { type: 'uint256', name: 'value' },
        ],
        log.data,
        log.topics
      );

      return eventData;
    });

    setItems(array);
  };

  const listenEvent = async () => {
    const contract = new web3.eth.Contract(eventTransferABI, contractAddress);

    const eventName = 'transfer';

    contract.events[eventName]({
      fromBlock: 'latest',
    }).on('data', (event) => {
      setItems([event.returnValues, ...items]);
      alert('Complete');
    });
  };

  const loadTransaction = async () => {
    const transaction = await web3.eth.getTransaction(
      '0xb90de0e667b6f881aa53ab801bd322caea35a19e84607337b037ee3cd0e7312a'
    );
    setTransaction(transaction);
  };

  const loadBlock = async () => {
    const block = await web3.eth.getBlock(1);
    setBlock(block);
  };

  const loadBalance = async () => {
    // const account = await web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);

    // setAddress(account.address);
    // const balance = await web3.eth.getBalance(account.address);

    const account = await web3.eth.getAccounts();
    setAddress(account[0]);

    const balance = await web3.eth.getBalance(account[0]);
    setBalance(web3.utils.fromWei(balance, 'ether'));
  };

  const sendMetamask = async () => {
    const contract = new web3.eth.Contract(eventTransferABI, contractAddress);

    // await web3.eth.sendTransaction({
    //   from: address,
    //   to: receiver,
    //   value: web3.utils.toWei(amount, 'ether'),
    // });
    await web3.eth.sendTransaction({
      from: address,
      to: contractAddress, // 스마트 컨트랙트 주소
      value: web3.utils.toWei(amount, 'ether'),
      data: contract.methods.sendEther(receiver).encodeABI(),
    });
  };

  const sendInfura = async () => {
    const nonce = await web3.eth.getTransactionCount(address);

    const txData = {
      nonce: nonce,
      gasLimit: 21000,
      gasPrice: web3.utils.toWei('10', 'gwei'),
      to: receiver,
      value: web3.utils.toWei(amount, 'ether'),
    };

    const account = await web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    const tx = await account.signTransaction(txData);
    await web3.eth.sendSignedTransaction(tx.rawTransaction);
  };

  const printObject = (data) => {
    return JSON.stringify(data, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    });
  };

  return (
    <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
      <div>지갑주소 : {address}</div>
      <div>보유확인 : {balance}</div>
      <div>블록정보 : {printObject(block)}</div>
      <div>트랜젝션 : {printObject(transaction)}</div>

      <div>
        <input
          type="text"
          placeholder="Receiver Address"
          value={receiver}
          onChange={(e) => {
            setReceiver(e.target.value);
          }}
        ></input>
      </div>

      <div>
        <input
          type="text"
          placeholder="Amount"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
          }}
        ></input>
      </div>

      <div>
        <button onClick={sendMetamask}>send</button>
      </div>
      <div>
        {items.map((x) => {
          return (
            <div>
              {x.from}-{x.to}: {web3.utils.toWei(x.value, 'ether')}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Test;
