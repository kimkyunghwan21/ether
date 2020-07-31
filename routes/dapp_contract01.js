// 파일명 : dapp_contract01.js
var express = require('express');
var router = express.Router();
var Web3  = require('web3');

//geth 네트워크 접속
var url = "http://192.168.99.100:38545"; 
var w3 = new Web3(new Web3.providers.HttpProvider(url));

//mongodb 사용하기
var MongoClient = require('mongodb').MongoClient

//배포하는 account address
var EOA1 = '0x6263746d5F3337CE3a3A590321b35E08bF81E3f1'

console.log('dapp_contract01.js start')

async function insertOne(ca1){
  const client = await MongoClient.connect('mongodb://192.168.99.100:37017').catch(err => { console.log(err)})
  if (!client){
    return;
  }

  try{
    const db = client.db("db01")
    let collection = db.collection("ca")
    var arr = {"ca_address": ca1}
    let res = await collection.insertOne(arr);
    //console.log(res)
  }
  catch(err){
    console.log(err)
  }
  finally{
    client.close()
  }
}

async function findOne(code){
  const client = await MongoClient.connect('mongodb://192.168.99.100:37017').catch(err => { console.log(err)})
  if (!client){
    return;
  }

  try{
    const db = client.db("db01")
    let collection = db.collection("contract")
    var arr = { CODE : {$eq : code }}
    let res = await collection.find(arr).toArray();
    return res;
  }
  catch(err){
    console.log(err)
  }
  finally{
    client.close()
  }
}

//192.168.99.100:32302/contract/deploy_ex02
router.get('/deploy_ex02', async function(req, res, next){
  var docs = await findOne('ex02');

  var contract = new w3.eth.Contract(docs[0].ABI);
  contract. deploy({
    data : '0x' + docs[0].BYTECODE.object,
    arguments : ['a','홍길동','010-0000-1234',29]
  }).send({
    from : EOA1,
    gas : 2100000, //210000이 기본값 
    gasPrice : '30000000000' // 30gwei
  }, function(err, txHash){
    if (err){
      console.log(err)
    }
    else {
      console.log("tx", txHash)
      res.json({txHash:txHash})
      res.end()
    }
  }).on('error', function(error){
    console.log(error);
  }).on('receipt', function(receipt){ 
    console.log("CA : ", receipt.contractAddress)
    insertOne(receipt.contractAddress)
  });
});


//ex01 계약서 배포
router.get('/deploy_ex01', async function(req, res, next){
  var docs = await findOne('ex01');
  var contract = new w3.eth.Contract(docs[0].ABI);
  
  contract. deploy({
    data : '0x' + docs[0].BYTECODE.object,
    arguments : ['가나다', 22]
  }).send({
    from : EOA1,
    gas : 2100000, //210000이 기본값 
    gasPrice : '30000000000' // 30gwei
  }, function(err, txHash){
    if (err){
      console.log(err)
    }
    else{
      console.log("tx", txHash)
      res.json({ret:txHash});
      res.end();
    }
  }).on('error', function(error){
    console.log(error);
  }).on('receipt', function(receipt){ 
    console.log("CA : ", receipt.contractAddress)
    insertOne(receipt.contractAddress)
  });
});



//계약서 읽기
//192.168.99.100:32302/contract/get
router.get('/get', async function(req, res, next){
  //ABI, 읽고 싶은 계약서의 CA
  var CA = "0x42f1469fEA99923FAC43aCf3664FDe9f0B26eaF8";
  var docs = await findOne('ex02'); //[{  }]
  var contract = new w3.eth.Contract(docs[0].ABI, CA)
  contract.methods.getUserid().call().then(data => {
    console.log(data)
    res.json({ret:data});
    res.end()
  });
})


//계약서 변경
//192.168.99.100:32302/contract/set
router.get('/set', async function(req, res, next){
  var CA = "0x42f1469fEA99923FAC43aCf3664FDe9f0B26eaF8";
  var docs = await findOne('ex02'); //[{  }]

  var contract = new w3.eth.Contract(docs[0].ABI, CA)
  //변경하는 계정 주소
  var EOA1 = "0x6263746d5F3337CE3a3A590321b35E08bF81E3f1" 

  //계약서의 아이디변경
  var setStringExec = contract.methods.setUserid('change b'); 
  var setStringByteCode = setStringExec.encodeABI(); //string을 ABI로 변경

  var rawTx = {
    gasPrice : 21000000,
    gasLimit : 221000,
    data : setStringByteCode,
    from : EOA1,
    to : CA
  }

  w3.eth.sendTransaction(rawTx).then(function(txHash){
    console.log('txHash : ', txHash);
    res.json({"ret":txHash});
    res.end();
  }).on('receipt', function(receipt){
    console.log('receipt : ', receipt);
  });
})

module.exports = router;