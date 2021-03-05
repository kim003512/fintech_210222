const express = require('express');
const path = require('path');
const app = express();
const request = require('request');
var jwt = require('jsonwebtoken');
var auth = require('./lib/auth');
//var moment = require('moment');

app.use(express.json());
//json 타입에 데이터 전송을 허용한다
app.use(express.urlencoded({ extended: false }));
//form 타입에 데이터 전송을 허용한다
app.use(express.static(path.join(__dirname, 'public')));//to use static asset

app.set('views', __dirname + '/views');
//뷰파일이 있는 디렉토리를 설정합니다
app.set('view engine', 'ejs');
//뷰엔진으로 ejs 사용한다 

// connection.end();
app.get('/', function (req, res) {
  res.send('Hello World');
})

app.get('/signup', function(req, res){
    res.render('signup');
})

app.get('/login', function(req, res){
    res.render('login');
})

app.get('/main', function(req, res){
    res.render('main');
})

var companyId = "M202111582U";

app.get('/authTest', auth, function(req, res){
    res.send("정상적으로 로그인 하셨다면 해당 화면이 보입니다.");
})

app.get('/balance', function(req, res){
    res.render('balance');
})

app.get('/qrcode', function(req, res){
    res.render('qrcode');
})

app.get('/qrreader', function(req, res){
    res.render('qrreader');
})

app.get('/authResult', function(req, res){
    var authCode = req.query.code;
    var option = {
        method : "POST",
        url : "https://testapi.openbanking.or.kr/oauth/2.0/token",
        header : {
            'Content-Type' : 'application/x-www-form-urlencoded'
        },
        form : {
            code : authCode,
            client_id : "33deec0f-a841-4daa-9765-73141d6765f9",
            client_secret : "5841ced2-0f88-4ddb-95e8-5314c1f1e198",
            redirect_uri : "http://localhost:3000/authResult",
            grant_type : "authorization_code"
        }
    }
    request(option, function(err, response, body){
        if(err){
            console.error(err);
            throw err;
        }
        else {
            var accessRequestResult = JSON.parse(body);
            res.render('resultChild', {data : accessRequestResult});
        }
    })
})

app.post('/signup', function(req, res) {
    var userName = req.body.userName;
    var userEmail = req.body.userEmail;
    var userPassword = req.body.userPassword;
    var userAccessToken = req.body.userAccessToken;
    var userRefreshToken = req.body.userRefreshToken;
    var userSeqNo = req.body.userSeqNo;

    var sql = "INSERT INTO user (name, email, password, accesstoken, refreshtoken, userseqno) VALUES (?,?,?,?,?,?)";
    connection.query(sql,[userName, userEmail, userPassword, userAccessToken, userRefreshToken, userSeqNo], function (err, result) {
        if(err){
            console.error(err);
            throw err;
        }
        else {
            res.json(1);
        }
    });
    
})

app.post('/login', function(req, res){
    var userEmail = req.body.userEmail;
    var userPassword = req.body.userPassword;
    var sql = "SELECT * FROM user WHERE email = ?";
    connection.query(sql, [userEmail], function(err, result){
        if(err){
            console.error(err);
            res.json(0);
            throw err;
        }
        else {
            if(result.length == 0){
                res.json(3)
            }
            else {
                var dbPassword = result[0].password;
                if(dbPassword == userPassword){
                    var tokenKey = "f@i#n%tne#ckfhlafkd0102test!@#%"
                    jwt.sign(
                      {
                          userId : result[0].id,
                          userEmail : result[0].email
                      },
                      tokenKey,
                      {
                          expiresIn : '10d',
                          issuer : 'fintech.admin',
                          subject : 'user.login.info'
                      },
                      function(err, token){
                          res.json(token)
                      }
                    )            
                }
                else {
                    res.json(2);
                }
            }
        }
    })
})

app.post('/list', auth, function(req, res){
    var user = req.decoded;
    var sql = "SELECT * FROM user WHERE id = ?";
    connection.query(sql,[user.userId], function(err, result){
        if(err) throw err;
        else {
            var dbUserData = result[0];
            var option = {
                method : "GET",
                url : "https://testapi.openbanking.or.kr/v2.0/user/me",
                headers : {
                    Authorization : "Bearer " + dbUserData.accesstoken
                },
                qs : {
                    user_seq_no : dbUserData.userseqno
                }
            }
            request(option, function(err, response, body){
                if(err){
                    console.error(err);
                    throw err;
                }
                else {
                    var listRequestResult = JSON.parse(body);
                    res.json(listRequestResult)
                }
            })        
        }
    })
})

app.post('/balance', auth, function(req, res){
    //사용자 정보 조회
    //사용자 정보를 바탕으로 request(잔액조회 api) 요청 작성하기
    var user = req.decoded;
    var finusernum = req.body.fin_use_num;
    var countnum = Math.floor(Math.random() * 1000000000) + 1;
    var transId = companyId + countnum;  
    var sql = "SELECT * FROM user WHERE id = ?";
   // var transdtime = moment(new Date()).format('YYYYMMDDhhmmss');
    connection.query(sql,[user.userId], function(err, result){
        if(err) throw err;
        else {
            var dbUserData = result[0];
            var option = {
                method : "GET",
                url : "https://testapi.openbanking.or.kr/v2.0/account/balance/fin_num",
                headers : {
                    Authorization : "Bearer " + dbUserData.accesstoken
                },
                qs : {
                    bank_tran_id : transId,
                    fintech_use_num : finusernum,
                    tran_dtime : 20210225140800
                }
            }
            request(option, function(err, response, body){
                if(err){
                    console.error(err);
                    throw err;
                }
                else {
                    var balanceRquestResult = JSON.parse(body);
                    res.json(balanceRquestResult)
                }
            })        
        }
    })
})

app.post('/transactionList', auth, function(req, res){
    var user = req.decoded;
    var finusernum = req.body.fin_use_num;
    var countnum = Math.floor(Math.random() * 1000000000) + 1;
    var transId = companyId + countnum;  
    var sql = "SELECT * FROM user WHERE id = ?";
    connection.query(sql, [user.userId], function(err, result){
        if(err) throw err;
        else{
            var dbUserData = result[0];
            var option = {
                method : "GET",
                url : "https://testapi.openbanking.or.kr/v2.0/account/transaction_list/fin_num",
                headers : {
                    Authorization : "Bearer " + dbUserData.accesstoken
                },
                qs : {
                    bank_tran_id : transId,
                    fintech_use_num : finusernum,
                    inquiry_type : "A",
                    inquiry_base : "D",
                    from_date : 20160404,
                    to_date : 20210225,
                    sort_order : "D",
                    tran_dtime : 20210225152200
                }
            }
            request(option, function(err, response, body){
                if(err){
                    console.error(err);
                    throw err;
                } else{
                    var transactionList = JSON.parse(body);
                    res.json(transactionList);
                }
            })
        }
    })
})

// app.post('/withdraw', auth, function(req, res){
//     console.log(req.body);
//     //사용자 출금 이제 api 수행
//     var user = req.decoded;
//     var finusernum = req.body.fin_use_num;
//     var countnum = Math.floor(Math.random() * 1000000000) + 1;
//     var transId = companyId + countnum;  
//     var sql = "SELECT * FROM user WHERE id = ?";
//     connection.query(sql, [user.userId], function(err, result){
//         if(err) throw err;
//         else{
//             //request 출금 이체 api 요청
//             var dbUserData = result[0];
//             var option = {
//                 method : "POST",
//                 url : "https://testapi.openbanking.or.kr/v2.0/transfer/withdraw/fin_num",
//                 headers : {
//                     Authorization : "Bearer " + dbUserData.accesstoken,
//                     //'Content-Type' : 'application/json'
//                 },
//                 json : {
//                     bank_tran_id : transId,
//                     cntr_account_type : "N",
//                     cntr_account_num : "100000000001",
//                     dps_print_content : "쇼핑몰환불",
//                     fintech_use_num : finusernum,
//                     wd_print_content : "오픈뱅킹출금",
//                     tran_amt : req.body.amount,
//                     tran_dtime : "20210225152200",
//                     req_client_name : "홍길동",
//                     req_client_fintech_use_num : finusernum,
//                     req_client_num : "HONGGILDONG1234",
//                     transfer_purpose : "ST", 
//                     recv_client_name : "김민진",
//                     recv_client_bank_code : "097",
//                     recv_client_account_num : "100000000001"
//                 }
//             }
//             request(option, function(err, response, body){
//                 if(err){
//                     console.error(err);
//                     throw err;
//                 } else{
//                     //var withdrawList = JSON.parse(body);
//                     var withdrawList = body;
//                     //res.json(withdrawList);
//                     if(withdrawList.resp_code === "A000"){
//                         var countnum2 = Math.floor(Math.random() * 1000000000) + 1;
//                         var transId2 = companyId + countnum2;  
//                         //var transdtime2 = moment(new Date()).format('YYYYMMDDhhmmss');                    
//                         var option = {
//                             method : "POST",
//                             url : "https://testapi.openbanking.or.kr/v2.0/transfer/deposit/fin_num",
//                             headers : {
//                               Authorization : "Bearer " + "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJNMjAyMTExNTgyIiwic2NvcGUiOlsib29iIl0sImlzcyI6Imh0dHBzOi8vd3d3Lm9wZW5iYW5raW5nLm9yLmtyIiwiZXhwIjoxNjIyMDg5NjQ1LCJqdGkiOiJkNzY5NDdiMy1kMzkyLTQ3MTUtOWVhZi1jNzRkYTYyZWZkNmYifQ.kudZVuQH1TrewaGSu12oKUcmuZQ7cw1E891I2wEm_hQ"
//                             },
//                             //get 요청을 보낼때 데이터는 qs, post 에 form, json 입력가능
//                             json : {
//                               "cntr_account_type": "N",
//                               "cntr_account_num": "200000000001",
//                               "wd_pass_phrase": "NONE",
//                               "wd_print_content": "환불금액",
//                               "name_check_option": "off",
//                               "tran_dtime": 20210226134900,
//                               "req_cnt": "1",
//                               "req_list": [
//                                 {
//                                   "tran_no": "1",
//                                   "bank_tran_id": transId2,
//                                   "fintech_use_num": req.body.to_fin_use_num,
//                                   "print_content": "쇼핑몰환불",
//                                   "tran_amt": req.body.amount,
//                                   "req_client_name": "홍길동",
//                                   "req_client_num": "HONGGILDONG1234",
//                                   "req_client_fintech_use_num": req.body.fin_use_num,
//                                   "transfer_purpose": "ST"
//                                 }
//                               ]
//                             }
//                         }
//                         request(option, function (error, response, body) {
//                             console.log(body);
//                             res.json(body);
//                         });
//                     }
//                 }
//             })
//         }
//     })
// })

app.post('/withdraw', auth, function(req, res){
    //사용자 출금이체 API 수행하기
    console.log(req.body);
    var user = req.decoded;
    var finusernum = req.body.fin_use_num;
    var sql = "SELECT * FROM user WHERE id = ?";
    var countnum = Math.floor(Math.random() * 1000000000) + 1;
    var transId = companyId + countnum;  
   // var transdtime = moment(new Date()).format('YYYYMMDDhhmmss');

    connection.query(sql,[user.userId], function(err, result){
        if(err) throw err;
        else {
            var dbUserData = result[0];
            console.log(dbUserData);
            var option = {
                method : "POST",
                url : "https://testapi.openbanking.or.kr/v2.0/transfer/withdraw/fin_num",
                headers : {
                    Authorization : "Bearer " + dbUserData.accesstoken
                },
                json : {
                    bank_tran_id : transId,
                    cntr_account_type : "N",
                    cntr_account_num : "100000000001",
                    dps_print_content : "쇼핑몰환불",
                    fintech_use_num : finusernum,
                    wd_print_content : "오픈뱅킹출금",
                    tran_amt : req.body.amount,
                    tran_dtime : "20210225152200",
                    req_client_name : "홍길동",
                    req_client_fintech_use_num : finusernum,
                    req_client_num : "HONGGILDONG1234",
                    transfer_purpose : "ST", 
                    recv_client_name : "김민진",
                    recv_client_bank_code : "097",
                    recv_client_account_num : "100000000001"
                }
            }
            request(option, function(err, response, body){
                if(err){
                    console.error(err);
                    throw err;
                }
                else {
                    var transactionListResuult = body;
                    if(transactionListResuult.rsp_code === "A0000"){
                        var countnum2 = Math.floor(Math.random() * 1000000000) + 1;
                        var transId2 = companyId + countnum2;  
                        var finusernum2 = req.body.fin_use_num;
                        //var transdtime2 = moment(new Date()).format('YYYYMMDDhhmmss');                    
                        var option = {
                            method : "POST",
                            url : "https://testapi.openbanking.or.kr/v2.0/transfer/deposit/fin_num",
                            headers : {
                              Authorization : "Bearer " + "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJNMjAyMTExNTgyIiwic2NvcGUiOlsib29iIl0sImlzcyI6Imh0dHBzOi8vd3d3Lm9wZW5iYW5raW5nLm9yLmtyIiwiZXhwIjoxNjIyMDg5NjQ1LCJqdGkiOiJkNzY5NDdiMy1kMzkyLTQ3MTUtOWVhZi1jNzRkYTYyZWZkNmYifQ.kudZVuQH1TrewaGSu12oKUcmuZQ7cw1E891I2wEm_hQ"
                            },
                            //get 요청을 보낼때 데이터는 qs, post 에 form, json 입력가능
                            json : {
                              "cntr_account_type": "N",
                              "cntr_account_num": "200000000001",
                              "wd_pass_phrase": "NONE",
                              "wd_print_content": "환불금액",
                              "name_check_option": "off",
                              "tran_dtime": "20210225152200",
                              "req_cnt": "1",
                              "req_list": [
                                {
                                  "tran_no": "1",
                                  "bank_tran_id": transId2,
                                  "fintech_use_num": finusernum2,
                                  "print_content": "쇼핑몰환불",
                                  "tran_amt": req.body.amount,
                                  "req_client_name": "홍길동",
                                  "req_client_num": "HONGGILDONG1234",
                                  "req_client_fintech_use_num": finusernum2,
                                  "transfer_purpose": "ST"
                                }
                              ]
                            }
                        }
                        request(option, function (error, response, body) {
                            console.log(body);
                            res.json(body);
                        });
                
                    }
                    //입금 api 실행 A0000 res_code 입급이체 발생
                }
            })        
        }
    })
})


var mysql      = require('mysql');
const { strictEqual } = require('assert');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'dkssud003512!!',
  database : 'fintech210222',
});

connection.connect();


app.listen(3000)
