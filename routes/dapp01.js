//파일명 : routes 폴더에 dapp01.js
var express = require('express');
var router = express.Router();

// DB 연동하기
var mysql = require('mysql');  //npm install mysql --save
var config = require('./mariadb_config.js');
var conn = mysql.createConnection(config); //DB접속

// npm install web3 --save --no-bin-links
var Web3  = require('web3');

console.log('dapp01.js start');

var url = "http://192.168.99.100:38545"; //geth 연결 주소
var hp3 = new Web3(new Web3.providers.HttpProvider(url));


hp3.eth.getBlock(6525, true, (err, txHash) => {
  //console.log(txHash);
})


//block의 개수 가져오기
hp3.eth.getBlockNumber((err, blockCount) => {
  console.log('block count', blockCount);
});

// http://192.168.99.100:32302/dapp/new_block
router.get('/new_block', function(req, res, next) {
  res.render('dapp_new_block', {title: '실시간블록확인'});
});


// http://192.168.99.100:32302/dapp/block_list
router.get('/block_list', function(req, res, next) {
  const app = async() => {
    try{
      var a1 = []
      for(var i=1; i<=10; i++){
        const b = await hp3.eth.getBlock(i);
        //console.log(b)
        a1.push(b)
      }
      res.render('dapp_block_list', {title: '블록목록', rows:a1});
    }catch(error){
      console.log(error);
    }
  };
  app();
});



// http://192.168.99.100:32302/dapp/account_list
router.get('/account_list', function(req, res, next) {
  //계정 목록 가져오기
  hp3.eth.getAccounts(function(err, result) {
  
      // hp3.eth.getBalance(result[i], (err, balanceOf) => {
      //   console.log(i, balanceOf)
      // });

      const app = async() => {
        try{
          var a1 = []    //[{  },{  },{},{},{} ]
          for (var i=0;i<result.length;i++){// 0 1 2 3 4 5 6 7 8 
            const b = await hp3.eth.getBalance(result[i]);
            console.log(result[i], b);
            a1.push({'address':result[i], 'balance':b})
          }
          console.log(a1)
          res.render('dapp_account_list', {title: '계정목록', rows:a1});
        }
        catch(error){
          console.log(error);
        }
      };
      app();
  });
  
});



// http://192.168.99.100:32302/dapp/index
router.get('/index', function(req, res, next) {
  res.render('dapp_index', {title: 'Home'});
});

// http://192.168.99.100:32302/dapp/join
router.get('/join', function(req, res, next) {
  //views의 폴더의 dapp_join.ejs를 표시
  res.render('dapp_join', {title: '회원등록'});
});


router.post('/join', function(req, res, next) {
  var arr = [  req.body.userid, req.body.userpw, req.body.username ]

  //계정 생성하기
  hp3.eth.personal.newAccount(arr[1], (err, createdAddress) => {
    if(!err){ //에러가 없다면
      console.log('account address : ', createdAddress);
      //DB에 추가한다.
      arr.push(createdAddress);
      var sql = "INSERT INTO member(userid, userpw, username, joindate, account) VALUES(?, SHA1(?), ?, NOW(), ?)";
      
      conn.query(sql, arr, function(err, result){
        if (!err){ //에러가 없으면
          if(result.affectedRows == 1){ //추가를 성공한 개수
            console.log('insert success');
          }
          else{ //추가한 개수가 원하는 수가 아님.
            console.log('insert failure');
          }
        }
        else{ //에러가 있으면
          console.log('insert failure');
        }
        res.redirect('/dapp/index'); //이페이지는 존재하지 않음
      });
    }
    else{
      res.redirect('/dapp/join'); //자동으로 크롬에 주소 넣고 엔터키
    }
  });

});


module.exports = router;

// hp3.eth.getBalance('0x7BdE70C530e14C5dca84B5F1ce7231da86259634', (err, balanceOf) => {
//   console.log(balanceOf)
// });


//계정 생성하기------
//var Accounts = require('web3-eth-accounts');   //계정생성
//var url
//const accounts = new Accounts(url)
//var a  = accounts.create();
//console.log(a)
//-------------------

//block 정보보기
// hp3.eth.getBlock(4417, (err, blockInfo) => {
//   console.log(blockInfo);
// });



// hp3.eth.personal.unlockAccount('0xffAe9AbAae2BBe925D022d77d41d08241381138e', '1234');
// hp3.eth.sendTransaction({from:'0xffAe9AbAae2BBe925D022d77d41d08241381138e', to:'0x3c5cde8dA7C2C81724F40923bF961Ed417f56F6D', value:1343000}, (err, txHash)=>{
//   if (err) {
//     console.log(err)
//   }
//   console.log(txHash)
// });