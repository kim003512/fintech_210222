const request = require('request');
var parseString = require('xml2js').parseString;
var xml = undefined;
request('http://www.weather.go.kr/weather/forecast/mid-term-rss3.jsp?stnld=109', function (error, response, body) {
  xml = body;
  parseString(xml, function (err, result) {
    console.dir(result.rss.channel[0].item[0].description[0].header[0].wf);
    //#work3 wf 데이터 조회후 출력하기
  });
});
