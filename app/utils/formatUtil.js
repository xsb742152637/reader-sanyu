/*
 * description: 时间/字数格式化工具
 * author: 神编小码
 * time: 2018年04月19日23:18:14
 */

'use strict'

import {
  PixelRatio
} from 'react-native'

import Dimen from '../utils/dimensionsUtil'

const ONE_MINUTE = 60000;
const ONE_HOUR = 3600000;
const ONE_DAY = 86400000;
const ONE_WEEK = 604800000;

const ONE_SECOND_AGO = "秒前";
const ONE_MINUTE_AGO = "分钟前";
const ONE_HOUR_AGO = "小时前";
const ONE_DAY_AGO = "天前";
const ONE_MONTH_AGO = "个月前";
const ONE_YEAR_AGO = "年前";
var iconvLite = require('iconv-lite');

let toSeconds = (date) => {
    return date / 1000
}

let toMinutes = (date) => {
    return toSeconds(date) / 60
}

let toHours = (date) => {
    return toMinutes(date) / 60
}

let toDays = (date) => {
    return toHours(date) / 24
}

let toMonths = (date) => {
    return toDays(date) / 30
}

let toYears = (date) => {
    return toMonths(date) / 365
}

let _getDescriptionTimeFromDate = (date) => {
  let delta = new Date().getTime() - date
  if (delta < 1 * ONE_MINUTE) {
      let seconds = parseInt(toSeconds(delta))
      return (seconds <= 0 ? 1 : seconds) + ONE_SECOND_AGO;
  }
  if (delta < 45 * ONE_MINUTE) {
      let minutes = parseInt(toMinutes(delta))
      return (minutes <= 0 ? 1 : minutes) + ONE_MINUTE_AGO;
  }
  if (delta < 24 * ONE_HOUR) {
      let hours = parseInt(toHours(delta))
      return (hours <= 0 ? 1 : hours) + ONE_HOUR_AGO;
  }
  if (delta < 48 * ONE_HOUR) {
      return "昨天";
  }
  if (delta < 30 * ONE_DAY) {
      let days = parseInt(toDays(delta))
      return (days <= 0 ? 1 : days) + ONE_DAY_AGO;
  }
  if (delta < 12 * 4 * ONE_WEEK) {
      let months = parseInt(toMonths(delta))
      return (months <= 0 ? 1 : months) + ONE_MONTH_AGO;
  } else { 
      let years = parseInt(toYears(delta))
      return (years <= 0 ? 1 : years) + ONE_YEAR_AGO
  }
}

export let dateFormat = (date) => {
  if (!date) {
    return ''
  } else {
    let temp = date.replace('T', ' ').split('.')[0]
    return _getDescriptionTimeFromDate(parseDate(temp))
  }
}

export let wordCountFormat = (wordCount) => {
  if (wordCount / 10000 > 0) {
      return parseInt((wordCount / 10000) + 0.5) + '万字';
  } else if (wordCount / 1000 > 0) {
      return parseInt((wordCount / 1000) + 0.5) + '千字';
  } else {
      return wordCount + '字';
  }
}

export let dateFormat2 = () => {
  let temp = new Date();
  var y = temp.getFullYear();

  var m = temp.getMonth() + 1;
  m = m < 10 ? ('0' + m) : m;

  var d = temp.getDate()
  d = d < 10 ? ('0' + d) : d
  return y  +  '' + m + '' + d;
}

export let timeFormat = () => {
  let temp = new Date()
  var h = temp.getHours()
  h = h < 10 ? ('0' + h) : h
  var minute = temp.getMinutes()
  minute = minute < 10 ? ('0' + minute) : minute
  return h + ':' + minute
}

export let parseDate = (date) => {
  var isoExp, parts
  isoExp = /^\s*(\d{4})-(\d\d)-(\d\d)\s(\d\d):(\d\d):(\d\d)\s*$/
  try {
    parts = isoExp.exec(date)
  } catch (error) {
    return date
  }
  if (parts) {
    date = new Date(parts[1], parts[2] - 1, parts[3], parts[4], parts[5], parts[6]).getTime()
  } else {
    return date
  }
  return date
}

export let contentFormat = (content, font_size, line_height) => {
  let fontCount = parseInt(Dimen.window.width / (font_size) - 1)
  let fontLines = parseInt((Dimen.window.height - 115) / (line_height))
    // alert(Dimen.window.width+"++"+Dimen.window.height+"\n"+font_size+"++"+line_height+"\n"+PixelRatio.getFontScale()+"++"+font_size * PixelRatio.getFontScale()+"++"+line_height * PixelRatio.getFontScale()+"\n"+fontCount+"++"+fontLines)
  const length = content.length
  let array = []
  let x = 0, y, m = 0
  while (x < length) {
    let _array = []
    for (var i = 0; i <= fontLines; i++) {
      let str = content.substring(x, x + fontCount)
      if (str.indexOf('@') != -1) {
        y = x + str.indexOf('@') + 1
        _array[i] = content.substring(x, y).replace('@', '')
        x = y
        continue
      } else {
        y = x + fontCount
        _array[i] = content.substring(x, y)
        x = y
        continue
      }
    }
     array[m] = _array
    m++
  }
  return array
}

export let cloneObj = (obj) => {
    let a = new Array();
    for(let i = 0 ; i < obj.length ; i++){
        a.push(JSON.parse(JSON.stringify(obj[i])))
    }
    return a;
}
//生成随机UUID
export let generateUUID =() => {
    var d = new Date().getTime();
    if (window.performance && typeof window.performance.now === "function") {
        d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

//中文转码
export let myEncode = (str, charset) => {
    // if (isUTF8(charset)) {
    //     return encodeURIComponent(str);
    // }
    if(charset == undefined || charset == null || charset == ""){
        alert("请设置编码格式");
        return "";
    }

    //得到中文的gbk二进制数组
    var buf = []
    try{
        buf = iconvLite.encode(str, charset);
    }catch (e){
        alert("cw")
    }
    var encodeStr = '';
    var ch = '';
    //将数组中的每一个元素转换成16进制，转换后的长度小于2的在前面加0，然后用%拼接
    for (var i = 0; i < buf.length; i++) {
        ch = buf[i].toString('16');
        if (ch.length === 1) {
            ch = '0' + ch;
        }
        encodeStr += '%' + ch;
    }
    encodeStr = encodeStr.toUpperCase();
    return encodeStr;
}
// export let contentFormat = (content) => {
//   const length = content.length
//   var array = []
//   let x = 0,y,m = 0
//   while (x < length) {
//     let _array = []
//     for (let i = 0; i <= 16; i++) {
//       let str_spa = content.substring(x, x + 1)
//       let str_sto = content.substring(x, x + 18)
//       const re = /^\s+$/
//       if (str_sto.indexOf('”') != -1) {
//         y = x + str_sto.indexOf('”') + 1
//         _array[i] = content.substring(x, y)
//         x = y
//         continue
//       }
//       else if (str_sto.indexOf('。') != -1 ) {
//         y = x + str_sto.indexOf('。') + 1
//         if (re.exec(content.substring(y, y + 1))) {
//           y = x + str_sto.indexOf('。') + 1
//           _array[i] = content.substring(x, y)
//           x = y
//           continue
//         }
//         else {
//           if (str_sto.indexOf('！') != -1) {
//             y = x + str_sto.indexOf('！') + 1
//             _array[i] = content.substring(x, y)
//             x = y
//             continue
//           }
//           else {
//             y = x + 18
//             _array[i] = content.substring(x, y)
//             x = y
//             continue
//           }
//         }
//       }
//       else if (str_sto.indexOf('！') != -1) {
//         y = x + str_sto.indexOf('！') + 1
//         if (re.exec(content.substring(y, y + 1))) {
//           y = x + str_sto.indexOf('！') + 1
//           _array[i] = content.substring(x, y)
//           x = y
//           continue
//         }
//         else {
//           y = x + 18
//           _array[i] = content.substring(x, y)
//           x = y
//           continue
//         }
//       }
//       else if (str_sto.indexOf('？') != -1){
//         y = x + str_sto.indexOf('？') + 1
//         if (re.exec(content.substring(y, y + 1))) {
//           y = x + str_sto.indexOf('？') + 1
//           _array[i] = content.substring(x, y)
//           x = y
//           continue
//         }
//         else {
//           y = x + 18
//           _array[i] = content.substring(x, y)
//           x = y
//           continue
//         }
//       }
//       else if (re.exec(str_spa)) {
//         y = x + 24
//         if (content.substring(x,y).indexOf('。') != -1) {
//           y = x + content.substring(x,y).indexOf('。') + 1
//           _array[i] = content.substring(x, y)
//           x = y
//           continue
//         }
//         _array[i] = content.substring(x, y)
//         x = y
//         continue
//       }
//       else {
//         y = x + 18
//         _array[i] = content.substring(x, y)
//         x = y
//       }
//     }
//     array[m] = _array
//     m++
//   }
//   // console.log((m - 1) * 375);
//   return array
// }
