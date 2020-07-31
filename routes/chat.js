var express = require('express');
var router = express.Router();

//웹 소켓을 위한 포트 1004번 열기
var http = require('http').createServer(function(req, res){
}).listen(1004)

//웹 소켓 객체 생성
var io = require('socket.io').listen(http)

//console.log(io)
//console.log('start routes chat.js')


//클라이언트가 접속이 되면 호출되는 부분
io.on('connection', function(socket){
  //접속하는 클라이언트 최초 1회 전달하는 값
  socket.on('init', function(data){
    console.log(data)
    socket.join(data.id) //접속한 클라이언트 아이디를 소켓에 등록함.
  })
  
  //실제적인 채팅내용
  socket.on('publish', function(data){
    console.log(data)
    io.emit('subscribe', {id:String(data.id), msg:String(data.msg) })
  })
});

module.exports = router;