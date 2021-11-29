const firebase = require("firebase");
const CSVToJSON = require('csvtojson');
// Required for side-effects
require("firebase/firestore");

const DATABASE_STR = 'committee-dev-78cf7';
// const DATABASE_STR = 'committee-updates-7bc6a';

// Initialize Cloud Firestore through Firebase
// firebase.initializeApp({
//   apiKey: 'AIzaSyAeV0gyJoFuQ2K1nB1a0YWUAx-tOQ81ewg',
//   authDomain: DATABASE_STR + '.firebaseapp.com',
//   projectId: DATABASE_STR
// });

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
// console.log(mentionsRef)
let mentions = []

// db.collection('cctv_mentions').onSnapshot(res => {
//     res.docChanges().forEach(change => {
//       const doc = {...change.doc.data(), id: change.doc.id};
//       mentionsData = []
//       switch (change.type) {
//         case 'added': // on load
//           // delete doc['date']
//           // delete doc['id']
//           mentions.push(doc);
//           break;
//         case 'modified': // on change
//           const index = mentions.findIndex(item => item.id == doc.id);
//           mentions[index] = doc;
//           // console.log('modified')
//
//           break;
//         case 'removed':
//           mentions = mentions.filter(item => item.id !== doc.id)
//           break;
//         default:
//           break;
//       }
//     }
//   )}
// )
// console.log(mentions)

CSVToJSON().fromFile('CCTV_update_data.csv')
  .then(mentions => {
    // mentionsRef.doc('November 29, 2021').set({'Xi Jinping': '7'})
    mentions.forEach(el => {
      el['date'] = el.Date
      delete el["Date"]
      const date = new Date(el.date).toLocaleString("en-US", {timeZone: "Europe/London"});
      const dateStr = stringifyDate(date)
      // console.log(dateStr)
      // console.log(el)
      try {
        mentionsRef.doc(dateStr).set(el)
      } catch(error) {
        console.log(error)
      }
    })
  }).catch(err => {
      // log error if any
      console.log(err);
    });

function stringifyDate(date, short = false) {
  // return pretty date string
  if(short === true) {
    return new Date(date).toLocaleDateString('en-us', {year: 'numeric', month: 'short', day: '2-digit'})
  } else {
    return new Date(date).toLocaleDateString('en-us', {year: 'numeric', month: 'long', day: '2-digit'})
  }
}

// fs.createReadStream('CCTV_update_data.csv').pipe(parser);

// d3.csv('CCTV_update_data.csv').then(function(mentions) {
//     // add to firestore
//     mentions.forEach(el => {
//       // console.log(el)
//       delete el[""]
//       const date = new Date(el.Date).toLocaleString("en-US", {timeZone: "Europe/London"});
//       const dateStr = stringifyDate(date)
//       mentionsRef.doc(dateStr).set(el)
//     })
//     console.log(mentions)
//     // const MENTIONS_JSON = []
//     // mentions.forEach(day => {
//     //  Object.keys(day).map(key => {
//     //    if(key !== 'Date' && key !== '') {
//     //      let newObj = {
//     //        date: day.Date, name: key, count: day[key]
//     //      }
//     //      MENTIONS_JSON.push(newObj)
//     //    }
//     //  })
//     // })
//   })
