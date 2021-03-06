const axios = require('axios')
const cheerio = require('cheerio');
const fs = require('fs')
const rp = require('request-promise');
var querySelectorAll = require('query-selector');

const NAMES = {'习近平':'Xi Jinping', '李克强':'Li Keqiang', '栗战书':'Li Zhanshu', '汪洋':'Wang Yang', '王沪宁':'Wang Huning', '赵乐际':'Zhao Leji', '韩正':'Han Zheng'}
const NAMES_CN = ['习近平', '李克强', '栗战书', '汪洋', '王沪宁', '赵乐际', '韩正']
const TODAY_STR = ymd(new Date())
const url = 'https://cn.govopendata.com/xinwenlianbo/' + TODAY_STR + '/';

console.log('URL: ' + url)

axios.get(url)
.then((res) => {
  let dateStr = url.substring(url.length - 9, url.length - 1)
  console.log(dateStr)
  fs.writeFile('cctv-mentions-today.html', res.data, (err) => {
    if (err)
      console.log(err);
    else {
      console.log("File written successfully\n");
      // console.log("The written has the following contents:");
      // console.log(fs.readFileSync(dateStr + ".html", "utf8"));
    }
  });
  // console.log(res)

})
.catch((error) => {
  console.log(error)
})

function ymd(date) {
  // return year-month-day format
  let dateStr = new Date(date).toISOString().slice(0, 10);
  return dateStr.replace(/-/g, '')
}
