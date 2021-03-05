var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '1q2w3e4r',
  database : 'fintech210222',
});
 
connection.connect();
 
connection.query('SELECT * FROM user;', function (error, results, fields) {
    console.log(results);
});
 
connection.end();
