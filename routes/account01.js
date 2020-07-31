//파일명 : account01.js
var express = require('express');
var router = express.Router();

var Web3  = require('web3');
var Accounts = require('web3-eth-accounts');

var url = "http://192.168.99.100:38545"; //geth 연결 주소
var w3 = new Web3(new Web3.providers.HttpProvider(url));

/*
//계정생성하기
const accounts = new Accounts(url)
var ret = accounts.create();
console.log(ret)
*/

/*
//이더 전송하기
w3.eth.sendTransaction({
  from:'0x6263746d5F3337CE3a3A590321b35E08bF81E3f1', 
  to:'0xfDfAD44308cFD5D17afea1868Abf7eFB46Ebce41', 
  value:200000000000000000000}, (err, txHash)=>{
    console.log(txHash) //수행시 바로 리턴
}).on('receipt', function(receipt){
  //블록이 생성되는 시점에 호출됨.
  console.log('receipt : ', receipt);
  //잔고 확인하기
  w3.eth.getBalance('0xfDfAD44308cFD5D17afea1868Abf7eFB46Ebce41',(err, balanceOf)=>{
    console.log('balance : ', balanceOf);
  })
});
*/


//보내는 계정
const EOA  = '0xfDfAD44308cFD5D17afea1868Abf7eFB46Ebce41';
const PK   = '946efe2574be9b2418b36712757d47e928f7c9f22464f7d91567cdb1f1fff392';

//받는 계정
const EOA1 = '0x506a9Aef643fBa2A01FfB8735737EeEdB0600414';

//npm install ethereumjs-tx --save
const Tx = require('ethereumjs-tx').Transaction
const Common = require('ethereumjs-common').default;

w3.eth.getBalance(EOA,(err, balanceOf)=>{
  console.log('balance : ', balanceOf);
})

//미해결 중인 것이 있는지 확인하여 nonce(트랜잭션번호)값 얻음
//순차적인 트랜잭션 번호를 부여하기 위해서
w3.eth.getTransactionCount(EOA, "pending", (err, nonce) => {
  //보내고자 하는 트랜잭션 생성
  let rawTx = {
    nonce : nonce,
    gasPrice : 210000000000,
    gasLimit : 221000,
    value : 50000000000000,
    from : EOA,
    to : EOA1
  }

  //체인 정보 genesis1.json에서 chainId확인
  const customCommon = Common.forCustomChain(
    'mainnet',{
      name : 'eth_node2',
      networkId : 2345,
      chainId : 190130
    },'petersburg',
  )

  let privateKey = new Buffer.from(PK, "hex") //개인키 읽기
  let tx = new Tx(rawTx, {common:customCommon}) //트랜젝션정보, 체인정보 생성
  tx.sign(privateKey)                  //서명하기 
  let sdata = tx.serialize()    //전송하기 위한 데이터로 변환

  w3.eth.sendSignedTransaction("0x" + sdata.toString("hex"), (err, txHash) => {
    if(err){
      console.log(err)
    } else {
      console.log('txHash : ', txHash) //트랜젝션 발생 시점
    }
  }).on('receipt', function(receipt){
    console.log('receipt : ', receipt); //블록생성 시점
  })
})

module.exports = router;

