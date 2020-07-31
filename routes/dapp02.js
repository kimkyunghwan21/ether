var express = require('express');
var router = express.Router();

//웹 소켓을 위한 포트 1004번 열기
var http = require('http').createServer(function(req, res){
}).listen(1004)
var io = require('socket.io').listen(http)

//geth 설정
var Web3 = require('web3');  
var url = "ws://192.168.99.100:38546"; //geth 연결 주소
var ws3 = new Web3(new Web3.providers.WebsocketProvider(url));


//소켓 서버가 정상적으로 생성되면
//geth에서 새로운 블록 정보를 받아옴.
io.on('connection', function(socket){
  console.log('dapp02.js start')  //확인용

  ws3.eth.subscribe('newBlockHeaders', (err, result) => {
    if(!err){
      console.log(result);
      socket.emit('subscribe', {code:'newblock', msg:result })
    }
  });

  ws3.eth.subscribe('pendingTransactions', (err, result) => {
    if(!err){
      console.log(result)
      socket.emit('subscribe1', {code:'pendingTran', msg:result })
    }
  });

});

module.exports = router;
