var express = require('express');
var router = express.Router();

var mysql = require('mysql');  //npm install mysql --save
var config = require('./mariadb_config.js');
var conn = mysql.createConnection(config); //DB접속


// 크롬에서 192.168.99.100:32302/member/list1?page=1
router.get('/list1', function (req, res, next) {
	var page = req.query.page;
	var arr  = [(page-1)*10, 10]

	// SELECT 컬럼명, 컬러명 FROM 테이블명 WHERE 조건 ORDER BY 컬럼 LIMIT 0, 10
	// SELECT userid, username FROM member 
	// WHERE username LIKE '%가%' ORDER BY userid DESC LIMIT 0,10
	var sql = "SELECT * FROM member LIMIT ?, ?"
	conn.query(sql, arr, function (err, rows, fields) {
		if(!err){ //에러가 없다면
			res.render('member_list1', { title: '회원목록1', rows:rows});			
		}
		else{ //에러가 있다면
			res.render('member_list1', { title: '회원목록1'});	
		}
	});
});





router.get('/chat', function (req, res, next) {
	res.render('member_chat', { title: '회원채팅'});
});


//회원 삭제
//http://192.168.99.100:32302/member/delete?id=1
router.get('/delete', function(req, res, next) {
	var arr = [ req.query.id ]
	var sql = "DELETE FROM member WHERE userid=?"
	conn.query(sql, arr, function(err, result){
		if (!err){ //에러가 없으면
			console.log(result)
			if(result.affectedRows == 1){
				console.log('delete success')
			}
			else{
				console.log('delete X')
			}
		}
		else{ //에러가 있으면
			console.log(err)
		}
		res.redirect('/member/list') // 페이지를 다른곳을 이동
	});
});



//회원정보수정
router.get('/update', function(req, res, next) {
	var arr = [ req.query.id ]
	var sql = "SELECT * FROM member WHERE userid=?"
	conn.query(sql, arr, function (err, rows, fields) {
		if (!err) {	//에러가 없다면
			if (rows.length > 0) { //내용이 있다면
				console.log(rows);  // 
				res.render('member_update', { title: '회원수정', data: rows[0] });
			}
		}
		else { //에러가 있다면
			res.redirect("/member/list");
		}
	});
});


router.post('/update', function(req, res, next) {
	var arr = [  req.body.username, req.body.userid ]
	var sql = "UPDATE member SET username=? WHERE userid=?"
	conn.query(sql, arr, function(err, result){
		if (!err){ //에러가 없으면
			if(result.affectedRows == 1){ //추가를 성공한 개수
				console.log('update success');
			}
			else{ //추가한 개수가 원하는 수가 아님.
				console.log('update failure');
			}
		}
		else{ //에러가 있으면
			console.log('update failure');
		}
		res.redirect('/member/list') // 페이지를 다른곳을 이동
	});
});


//http://192.168.99.100:32302/member/list
router.get('/list', function (req, res, next) {
	var sql = "SELECT * FROM member";
	conn.query(sql, function (err, rows, fields) {
		if (!err) {	//에러가 없다면
			console.log(rows)
			res.render('member_list', { title: '회원목록', list: rows });
		}
		else { //에러가 있다면
			res.redirect("/member");
		}
	});
});

//http://192.168.99.100:32302/member/list.ajax
router.get('/list.ajax', function (req, res, next) {
	res.render('member_ajax', { title: '회원목록'});
});



//http://192.168.99.100:32302/member/list.json
router.get('/list.json', function (req, res, next) {
	var sql = "SELECT * FROM member";
	conn.query(sql, function (err, rows, fields) {
		if (!err) {	//에러가 없다면
			if (rows.length > 0) { //내용이 있다면
				console.log(rows)
				res.json({ret:'y', data:rows})
				res.end()
			}
		}
		else { //에러가 있다면
			res.json({ret:'n'})
			res.end()
		}
	});
});

// 크롬에서 192.168.0.X:3000/member/join
router.get('/join', function(req, res, next) {
	res.render('member_join') // member_join.ejs
});

router.post('/join', function(req, res, next) {
	// jsp에 넘어온값을 배열로 만듬
	var arr = [ req.body.userid, req.body.userpw, req.body.username ]
	console.log(arr) // 결과를 콘솔에 출력함
	var sql = "INSERT INTO member(userid, userpw, username, joindate) VALUES(?, SHA1(?), ?, NOW())";

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
		res.redirect('/member/join') // 페이지를 다른곳을 이동
	});
});

router.get('/', function(req, res, next) {
	res.json({
		name : '홍길동',
		age : 34,
		tel : "010-0000-0001"
	})
	res.end()
});

// 서버주소:3000/member/test1
router.get('/test1', function(req, res, next) {
	var data = {
		ret : 1,
		data : {
			name : '가나다',
			age : 24,
			tel : "010-0000-0002"
		}
	}
	res.json(data)
	res.end()
});


router.get('/a2', function(req, res, next) {
	res.json({
		name : '홍길동',
		age : 34,
		tel : "010-0000-0001"
	})
	res.end()
});

router.get('/a6', function(req, res, next) {
	res.json({
		name : '홍eeee길동',
		age : 34,
		tel : "010-0000-0001"
	})
	res.end()
});

module.exports = router;
