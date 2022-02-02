const axios = require('axios')
const cheerio = require('cheerio');
const fs = require('fs')
const rp = require('request-promise');
var querySelectorAll = require('query-selector');

const firebase = require("firebase");
const CSVToJSON = require('csvtojson');
// Required for side-effects
require("firebase/firestore");
// const DATABASE_STR = 'committee-dev-78cf7';
const DATABASE_STR = 'committee-updates-7bc6a';

var firebaseConfig = {
  apiKey: "AIzaSyAeV0gyJoFuQ2K1nB1a0YWUAx-tOQ81ewg",
  authDomain: DATABASE_STR + ".firebaseapp.com",
  databaseURL: "https://" + DATABASE_STR + ".firebaseio.com",
  projectId: DATABASE_STR,
  storageBucket: DATABASE_STR + ".appspot.com",
  // messagingSenderId: "945029831038",
  // appId: "1:192871705037:web:799bb786824a4fdb"
};
const app = firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();
mentionsRef = db.collection('cctv_mentions')

const NAMES = {'习近平':'Xi Jinping', '李克强':'Li Keqiang', '栗战书':'Li Zhanshu', '汪洋':'Wang Yang', '王沪宁':'Wang Huning', '赵乐际':'Zhao Leji', '韩正':'Han Zheng'}
const NAMES_CN = ['习近平', '李克强', '栗战书', '汪洋', '王沪宁', '赵乐际', '韩正']
const NAMES_EN = ['Xi Jinping','Li Keqiang', 'Li Zhanshu', 'Wang Yang', 'Wang Huning', 'Zhao Leji', 'Han Zheng']
let mentions = {}
const TODAY_STR = ymd(new Date())
// const TODAY_STR = '20220130'
const MASTER_URL = 'https://tv.cctv.com/lm/xwlb/';
// const MASTER_URL = 'http://localhost:8888/macropolo/wp-content/themes/macropolo/assets/files/cctv-mentions-today-20220131.html';
// const url = 'https://cn.govopendata.com/xinwenlianbo/' + TODAY_STR + '/';
// console.log('URL: ' + url)
let fullNewsContent = [];

axios.get(MASTER_URL)
.then((res) => {
  // let dateStr = url.substring(url.length - 9, url.length - 1)
  let dateStr = TODAY_STR;
  console.log(dateStr)
  // console.log(res.data)
  let $ = cheerio.load(res.data)
  let promises = []

  NAMES_EN.forEach(name => {
    mentions[name] = 0
  })

  // get list of URLs for today's broadcast, each URL is a single story
  let storiesList = []
  $('#content li .image a').each(function(i, e) {
    if(i > 0) {
      promises.push(
        axios.get($(this).attr('href'))
        .then((response) => {
          // console.log(response.data)
          let body = cheerio.load(response.data)
          let headline = body('.cnt_nav h3').text()
          if(headline.indexOf('[视频 ]')!== 0) {
            headline = headline.substring(4)
          }
          let headlineHTML = '<h2 class="h4">' + headline + '</h2>'
          let content = body('.cnt_bd').text()
          let contentHTML = '<p>' + content + '</p>';
          let articleHTML = '<div class="article">' + headlineHTML + contentHTML + '</div>';
          // console.log(headline)
          fullNewsContent.push(articleHTML)
          calcMentions(articleHTML)
        })
        .catch((error) => {
          console.log(error)
        })
      )

    }
  })

  Promise.all(promises).then(() => {
    // console.log(fullNewsContent)
    fs.writeFile('cctv-mentions-today-' + TODAY_STR +  '.html', fullNewsContent.join(), (err) => {
      if (err)
        console.log(err);
      else {
        console.log("File written successfully\n");
        // console.log("The written has the following contents:");
        // console.log(fs.readFileSync(dateStr + ".html", "utf8"));
      }
    });
    console.log(mentions)

    // write mentions to Firebase
    writeMentionsToFirebase(mentions)
  })

})
.catch((error) => {
  console.log(error)
})

function calcMentions(content) {
  // console.log(content)
  NAMES_CN.forEach((nameCN) => {
    if(content.includes(nameCN)) {
      console.log('found a mention for ' + nameCN)
      if(mentions[NAMES[nameCN]]) {
        mentions[NAMES[nameCN]] += 1
      } else {
        mentions[NAMES[nameCN]] = 1
      }
    }
  })
}

function writeMentionsToFirebase(mentions) {
  let year = TODAY_STR.substring(0,4)
  let month = TODAY_STR.substring(4,6)
  let day = TODAY_STR.substring(6,8)
  const dateOfMentions = new Date(year + '-' + month + '-' + day).toLocaleString("en-US", {timeZone: "Europe/London"});
  // const dateOfMentions = new Date('2022-01-31').toLocaleString("en-US", {timeZone: "Europe/London"});
  mentions['date'.toString()] = year + '-' + month + '-' + day
  // mentions['date'.toString()] = '2022-01-31'

  const dateStr = stringifyDate(dateOfMentions)
  try {
    mentionsRef.doc(dateStr).set(mentions)
  } catch(error) {
    console.log(error)
  }
}

function ymd(date) {
  // return year-month-day format
  let dateStr = new Date(date).toISOString().slice(0, 10);
  return dateStr.replace(/-/g, '')
}

function stringifyDate(date, short = false) {
  // return pretty date string
  if(short === true) {
    return new Date(date).toLocaleDateString('en-us', {year: 'numeric', month: 'short', day: '2-digit'})
  } else {
    return new Date(date).toLocaleDateString('en-us', {year: 'numeric', month: 'long', day: '2-digit'})
  }
}
