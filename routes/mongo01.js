//파일명 : mongo01.js
var express = require('express');
var router = express.Router();

// npm install mongodb --save --no-bin-links
var MongoClient = require('mongodb').MongoClient
var ObjectID = require('mongodb').ObjectID   // _id로 비교하기 위해서
console.log('mongo01 start'); //확인용

//geth 설정
var Web3 = require('web3');  
var url = "ws://192.168.99.100:38546"; //geth 연결 주소
var ws3 = new Web3(new Web3.providers.WebsocketProvider(url));

ws3.eth.subscribe('newBlockHeaders', (err, ret) => {
  if(!err){
    console.log(ret);

    MongoClient.connect('mongodb://192.168.99.100:37017/db01', (err, dbconn) => {
      if(!err){
        var collection = dbconn.db("db01").collection("block01")
        collection.insertOne(ret).then((result) => {
          console.log(result)
          res.redirect('/mongo/insert')
        })
      }
      else{
        console.log('err', err); //디버그 용
      }
      dbconn.close()
    })

  }
});


router.post('/delete', function(req, res, next) {
  var a = {_id: new ObjectID(req.body.userid)};
  console.log(a)
  MongoClient.connect('mongodb://192.168.99.100:37017/db01', (err, dbconn) => {
    if(!err){
      var collection = dbconn.db("db01").collection("col01")
      collection.deleteOne(a).then((result) => {
        console.log(result)
        res.redirect('/mongo/select')
      })
    }
    else{
      console.log('err', err); //디버그 용
    }
    dbconn.close()
  })
})

//192.168.99.100:32302/mongo/select
router.get('/select', function(req, res, next) {
  MongoClient.connect('mongodb://192.168.99.100:37017/db01', (err, dbconn) => {
    if(!err){
      var collection = dbconn.db("db01").collection("col01")
      //SELECT * FROM col01
      collection.find({}).toArray((err, docs) => {
        //console.log(docs) //[{},{},{},{}]
        res.render('mongo_select', {title: 'NOSQL_SELECT', rows:docs});
      })
      //SELECT * FROM col01 ORDER BY userid ASC
      //collection.find({}).sort({userid:1}).toArray((err, docs) => {

      //SELECT * FROM col01 ORDER BY userid DESC
      //collection.find({}).sort({userid:-1}).toArray((err, docs) => { 

      //SELECT * FROM col01 LIMIT 5
      //collection.find({}).limit(5).toArray((err, docs) => { 

      //SELECT * FROM col01 ORDER BY userid DESC LIMIT 5
      //collection.find({}).sort({userid:-1}).limit(5).toArray((err, docs) => { 

      //SELECT userid, username FROM col01
      //collection.find({},{'projection':{userid:1, username:1}}).toArray((err, docs) => { 

      //SELECT * FROM col01 WHERE userage > 10  
      //collection.find({age:{$gt : 10}}).toArray((err, docs) => { 

      //SELECT * FROM col01 WHERE userage = 10  
      //collection.find({age:{$eq : 10}}).toArray((err, docs) => { 

      //SELECT * FROM col01 WHERE userage < 10  
      //collection.find({age:{$lt : 10}}).toArray((err, docs) => { 

      //INSERT INTO col01(컬럼명) VALUES(추가할값)
      //collection.insertOne(ret).then((result) => {

      //UPDATE col01 SET username=변경값, useremail=변경값 WHERE userid=조건
      //var a = {userid:'a'}    조건에 해당
      //var b = {username:'b', useremail:'c'}   변경할 내용들
      //collection.update(a, {$set:b}).then((result) => {

      //DELETE FROM col01 WHERE userid=조건
      //var a = {_id:'a'}    조건에 해당
      //collection.remove(a).then((result) => {

    }
    else{
      console.log(err)
    }
    dbconn.close();
  });
});



//192.168.99.100:32302/mongo/insert
router.get('/insert', function(req, res, next) {
  res.render('mongo_insert', {title: 'NOSQL_INSERT'});
});

router.post('/insert', function(req, res, next) {
  var arr = {
    "userid":req.body.userid,
    "userpw":req.body.userpw,
    "username":req.body.username,
    "userphone":req.body.userphone,
    "useremail":req.body.useremail}

  //var arr = [{  },{   },{   },{  }]

  //console.log(arr)
  MongoClient.connect('mongodb://192.168.99.100:37017/db01', (err, dbconn) => {
    if(!err){
      var collection = dbconn.db("db01").collection("col01")
      collection.insertOne(arr).then((result) => {
        console.log(result)
        res.redirect('/mongo/insert')
      })
    }
    else{
      console.log('err', err); //디버그 용
    }
    dbconn.close()
  })

});


module.exports = router;
