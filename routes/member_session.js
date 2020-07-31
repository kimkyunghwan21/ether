//파일명 : member_session.js
var express = require('express');
var router = express.Router();

// npm install mongodb --save --no-bin-links
var MongoClient = require('mongodb').MongoClient
var ObjectID = require('mongodb').ObjectID   // _id로 비교하기 위해서

//npm install ethereumjs-tx --save
const Tx = require('ethereumjs-tx').Transaction
const Common = require('ethereumjs-common').default;


//192.168.99.100:32302/session/index
router.get('/index', function(req, res, next) {
  var key = 0;
  if (req.session.mykey){
    key = 1;
  }
  res.render('session_index',{title:'index', key:key});
});

//192.168.99.100:32302/session/login
router.get('/login', function(req, res, next) {
  res.render('session_login', {title:'login'});
});
router.post('/login', function(req, res, next) {
  var id = req.body.userid;
  var pw = req.body.userpw;
  if (id == 'a' && pw == 'a'){ //로그인 성공
    //세션처리
    if (req.session.mykey){
        console.log('이미 세션이 있음.')
    }
    else {
      req.session.mykey = id; //mykey에 a를 넣어서 세션 추가
      req.session.mycode = '1234'; //mykey에 a를 넣어서 세션 추가
    }
    res.redirect('/session/index');
  }
  else{ //로그인 실패
    res.redirect('/session/login');
  }
});

//192.168.99.100:32302/session/logout
router.post('/logout', function(req, res, next) {
  req.session.destroy(function(err){ //세션 지우기
    if(!err){
      res.redirect("/session/index")
    }
  })
});

//////////////// 회원가입 //////////////////////////////
var mysql = require('mysql');  //npm install mysql --save
var config = require('./mariadb_config.js');
var conn = mysql.createConnection(config); //DB접속

var Web3  = require('web3');
var Accounts = require('web3-eth-accounts');

var url = "http://192.168.99.100:38545"; //geth 연결 주소
var w3 = new Web3(new Web3.providers.HttpProvider(url));

//192.168.99.100:32302/session/join
router.get('/join', function(req, res, next) {
  res.render('session_join', {title:'login'});
});



router.post('/join', function(req, res, next) {
  var arr = [req.body.userid, req.body.userpw, req.body.username, req.body.userphone]

  //계정생성하기
  const accounts = new Accounts(url)
  var ret = accounts.create();
  arr.push(ret.address)
  arr.push(ret.privateKey)
  
  const sql = "INSERT INTO member(userid, userpw, username, userphone, useraddress, userprivatekey, joindate) VALUES(?,SHA1(?),?,?,?,?,NOW())"
  conn.query(sql, arr, async function(err, result){
		if (!err){ //에러가 없으면
			console.log(result)
			if(result.affectedRows == 1){

        //이더 전송하기  > eth.accounts[0]
        const a1 = await w3.eth.getAccounts().catch((e) => {console.log(e)})
        w3.eth.sendTransaction({from:a1[0], to:arr[4], value: w3.utils.toWei('30', "ether")}, (err, txHash)=>{
            console.log(txHash) //수행시 바로 리턴
        }).on('receipt', function(receipt){
          //블록이 생성되는 시점에 호출됨.
          console.log('receipt : ', receipt);
          //잔고 확인하기
          w3.eth.getBalance(a1[0],(err, balanceOf)=>{
            console.log('balance : ', balanceOf);
          })
        });

        console.log('success')
        res.redirect('/session/index')
			}
			else{
				res.redirect('/session/join')
			}
		}
		else{ //에러가 있으면
			res.redirect('/session/join')
		}
	});
});

// 회원목록보기
// 크롬에서 192.168.99.100:32302/session/list
router.get('/list', async function (req, res, next) {
  var arr = []
	var sql = "SELECT * FROM member"
	conn.query(sql, arr, function (err, rows, fields) {
		if(!err){ //에러가 없다면
			res.render('session_member_list', { title: '회원목록1', list:rows});			
		}
		else{ //에러가 있다면
			res.redirect("/session/index");	
		}
	});
});

// 크롬에서 192.168.99.100:32302/session/get_balance?addr= 
router.get('/get_balance', function (req, res, next) {
  var addr = req.query.addr;    //GET
  //var addr = req.body.addr;   //POST
  w3.eth.getBalance(addr,(err, balanceOf)=>{
    if (err){
      res.json({ret:0})
      res.end()
    }
    else{
      console.log('balance : ', balanceOf);
      res.json({ret:1, bal:balanceOf})
      res.end()
    }
  })
});


//contract 를 mongodb에서 읽어 오기 위한 함수
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

// 크롬에서 192.168.99.100:32302/session/deploy_contract?addr=53787355837583758397538375895
router.get('/deploy_contract', async function (req, res, next) {
  var addr = req.query.addr;
  var pk   = req.query.pk;
  var docs = await findOne('ex03');
  
  //addr에 해당하는 주소의 nonce값을 얻기 위해 
  w3.eth.getTransactionCount(addr, "pending", function(err, nonce){
    //1. 배포할 계약서 데이터 만들기 ABI + BYTECODE
    const contract = new w3.eth.Contract(docs[0].ABI)  
    var contractData = contract.deploy({
      data : '0x' + docs[0].BYTECODE.object,
      arguments : [] 
    }).encodeABI()

    //2. 체인 설정하기, 체인 정보 genesis1.json에서 chainId확인
    const customCommon = Common.forCustomChain(
      'mainnet',{
        name : 'eth_node2',
        networkId : 2345,
        chainId : 190130
      },'petersburg')
    
    //3. 보내고자 하는 트랜잭션 정보 생성
    let rawTx = {
      nonce : nonce,
      gasPrice : 210000000000,
      gasLimit : 221000,
      data : contractData,
      from : addr
    }

    //4. 개인키를 가지고 서명하기
    let privateKey = new Buffer.from(pk.substr(2), "hex") //개인키 읽기
    let tx = new Tx(rawTx, {common:customCommon}) //트랜젝션정보, 체인정보 생성
    tx.sign(privateKey)                  //서명하기 

    //5. 전송가능 타입으로 직렬화, 전송하기 위한 데이터로 변환
    let sdata = tx.serialize()

    //6. 전송하기
    w3.eth.sendSignedTransaction("0x" + sdata.toString("hex"), (err, txHash) => {
      if(err){
        console.log(err)
        res.json({ret:0})
        res.end()
      } else {
        console.log('txHash : ', txHash) //트랜젝션 발생 시점
        res.json({ret:1, txHash:txHash})
        res.end()
      }
    }).on('receipt', function(receipt){
      //socket.io를 이용하여 체결후 통보하는 방식이 필요함.
      console.log('receipt : ', receipt); //블록생성 시점
    });
  });
});

// 크롬에서 192.168.99.100:32302/session/set_contract?addr=53787355837583758397538375895
router.get('/set_contract', async function (req, res, next) {
  var addr = req.query.addr; // 계정 주소
  var pk   = req.query.pk;   // 개인키
  var ca   = '0xe8143b3cd3442a124269D6ca96f0054c164c2B0c';   // 컨트랙트 주소
  var docs = await findOne('ex03');

  //addr에 해당하는 주소의 nonce값을 얻기 위해 
  w3.eth.getTransactionCount(addr, "pending", function(err, nonce){
    //1. 계약서 변경
    const contract = new w3.eth.Contract(docs[0].ABI, ca)  
    //balance값을 9999로 변경하기
    var str1 = contract.methods.setBalance(9999).encodeABI()

    //2. 체인 설정하기, 체인 정보 genesis1.json에서 chainId확인
    const customCommon = Common.forCustomChain(
      'mainnet',{
        name : 'eth_node2',
        networkId : 2345,
        chainId : 190130
      },'petersburg')
    
    //3. 보내고자 하는 트랜잭션 정보 생성
    let rawTx = {
      nonce : nonce,
      gasPrice : 210000000000,
      gasLimit : 221000,
      data : str1,
      from : addr,
      to : ca
    }

    //4. 개인키를 가지고 서명하기
    let privateKey = new Buffer.from(pk.substr(2), "hex") //개인키 읽기
    let tx = new Tx(rawTx, {common:customCommon}) //트랜젝션정보, 체인정보 생성
    tx.sign(privateKey)                  //서명하기 

    //5. 전송가능 타입으로 직렬화, 전송하기 위한 데이터로 변환
    let sdata = tx.serialize()

    //6. 전송하기
    w3.eth.sendSignedTransaction("0x" + sdata.toString("hex"), (err, txHash) => {
      if(err){
        console.log(err)
        res.json({ret:0})
        res.end()
      } else {
        console.log('txHash : ', txHash) //트랜젝션 발생 시점
        res.json({ret:1, txHash:txHash})
        res.end()
      }
    }).on('receipt', function(receipt){
      //socket.io를 이용하여 체결후 통보하는 방식이 필요함.
      console.log('receipt : ', receipt); //블록생성 시점
    });
  });
});

// 계약서 읽기
// 크롬에서 192.168.99.100:32302/session/get_contract
router.get('/get_contract', async function (req, res, next) {
  var addr = req.query.addr;
  var pk   = req.query.pk;
  var ca   = '0xe8143b3cd3442a124269D6ca96f0054c164c2B0c'
  var docs = await findOne('ex03');

  console.log("ADDR : ", addr)

  //addr에 해당하는 주소의 nonce값을 얻기 위해 
  w3.eth.getTransactionCount(addr, "pending", function(err, nonce){
    //1. 계약서 가자오기
    const contract = new w3.eth.Contract(docs[0].ABI, ca)  
    var str1 = contract.methods.getBalance().encodeABI()

    //2. 체인 설정하기, 체인 정보 genesis1.json에서 chainId확인
    const customCommon = Common.forCustomChain(
      'mainnet',{
        name : 'eth_node2',
        networkId : 2345,
        chainId : 190130
      },'petersburg')
    
    //3. 보내고자 하는 트랜잭션 정보 생성
    let rawTx = {
      nonce : nonce,
      gasPrice : 210000000000,
      gasLimit : 221000,
      data : str1,
      from : addr,
      to : ca
    }

    //4. 개인키를 가지고 서명하기
    let privateKey = new Buffer.from(pk.substr(2), "hex") //개인키 읽기
    let tx = new Tx(rawTx, {common:customCommon}) //트랜젝션정보, 체인정보 생성
    tx.sign(privateKey)                  //서명하기 

    //5. 전송가능 타입으로 직렬화, 전송하기 위한 데이터로 변환
    let sdata = tx.serialize()

    //6. 전송하기
    w3.eth.sendSignedTransaction("0x" + sdata.toString("hex"), (err, txHash) => {
      if(err){
        console.log(err)
        res.json({ret:0})
        res.end()
      } else {
        console.log('txHash : ', txHash) //트랜젝션 발생 시점
        res.json({ret:1, txHash:txHash})
        res.end()
      }
    }).on('receipt', function(receipt){
      //socket.io를 이용하여 체결후 통보하는 방식이 필요함.
      console.log('receipt : ', receipt); //블록생성 시점
    });
  });
});


module.exports = router;