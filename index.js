import { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [latestBlockNumber, setLatestBlockNumber] = useState(undefined);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const accounts = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(accounts);
    }
  };

  const handleAccount = (accounts) => {
    if (accounts && accounts.length > 0) {
      console.log("Account connected: ", accounts[0]);
      setAccount(accounts[0]);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
    handleAccount(accounts);

    // Once wallet is set, get a reference to the deployed contract
    getATMContract();
  };

  const logoutAccount = () => {
    setAccount(undefined);
    setBalance(undefined);
    setATM(undefined);
    setTransactionHistory([]);
    setLatestBlockNumber(undefined);
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);

    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm) {
      const balance = await atm.getBalance();
      setBalance(balance.toNumber());
    }
  };

  const deposit = async (amount) => {
    if (atm) {
      let tx = await atm.deposit(ethers.utils.parseEther(amount.toString()));
      await tx.wait();
      getBalance();
      updateTransactionHistory("Deposit", amount);
    }
  };

  const withdraw = async (amount) => {
    if (atm) {
      let tx = await atm.withdraw(ethers.utils.parseEther(amount.toString()));
      await tx.wait();
      getBalance();
      updateTransactionHistory("Withdraw", -amount);
    }
  };

  const updateTransactionHistory = (action, amount) => {
    const newTransaction = { action, amount, timestamp: Date.now() };
    setTransactionHistory([...transactionHistory, newTransaction]);
  };

  const getLatestBlockNumber = async () => {
    if (ethWallet) {
      const provider = new ethers.providers.Web3Provider(ethWallet);
      const blockNumber = await provider.getBlockNumber();
      setLatestBlockNumber(blockNumber);
    }
  };

  const renderTransactionHistory = () => {
    return (
      <div>
        <h3>Transaction History</h3>
        <ul>
          {transactionHistory.map((transaction, index) => (
            <li key={index}>
              {transaction.action} {Math.abs(transaction.amount)} ETH -{" "}
              {new Date(transaction.timestamp).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const initUser = () => {
    // Check if user has MetaMask
    if (!ethWallet) {
      return <p>Please install MetaMask to use this ATM.</p>;
    }

    // Check if user is connected. If not, connect to their account
    if (!account) {
      return (
        <button onClick={connectAccount}>Connect your MetaMask wallet</button>
      );
    }

    if (balance === undefined) {
      getBalance();
    }

    return (
      <div>
        <p>Your Account: {account}</p>
        <p>Your Balance: {balance}</p>
        <input type="number" id="depositAmount" placeholder="Deposit Amount" />
        <button onClick={() => deposit(document.getElementById("depositAmount").value)}>Deposit</button>
        <input type="number" id="withdrawAmount" placeholder="Withdraw Amount" />
        <button onClick={() => withdraw(document.getElementById("withdrawAmount").value)}>Withdraw</button>
        <button onClick={logoutAccount}>Logout</button>
        <button onClick={getLatestBlockNumber}>Get Latest Block Number</button>
        {latestBlockNumber !== undefined && (
          <p>Latest Block Number: {latestBlockNumber}</p>
        )}
        {renderTransactionHistory()}
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>Welcome to the Metacrafters ATM!</h1>
      </header>
      {initUser()}
      <style jsx>{`
        .container {
          text-align: center;
          margin-top: 50px;
          color: black;
          background-color: chocolate;
          padding: 20px;
          border-radius: 10px;
        }
        button {
          margin: 5px;
          padding: 10px 20px;
          background-color: #007bff;
          color: #fff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }
        button:hover {
          background-color: #0056b3;
        }
        input {
          margin: 5px;
          padding: 5px;
        }
        ul {
          list-style: none;
          padding: 0;
        }
        li {
          margin-bottom: 5px;
        }
      `}</style>
    </main>
  );
}
