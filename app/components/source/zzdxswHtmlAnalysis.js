/*
 * description: 猪猪岛html解析
 * author: 谢
 * time: 2018年12月17日
 */
import request from '../../utils/httpUtil'
import HtmlAnalysisBase from './htmlAnalysisBase'
const API_BASE_URL = 'http://m.zzdxsw.org';

var api = {
    HTML_STR: "",
    SEARCH_BOOK_URL: API_BASE_URL+"/wap.php?action=search&wd=" //搜索路径及key
};
var myModule = {};
myModule.searchBook = (str) => {
    let p = new Promise(function(resolve,reject){
        request.ajax(api.SEARCH_BOOK_URL + str, null,
            (data) => {
                let htmls = data.split('<div class="container">')[1].split('</div><div class="footer">')[0].split('<ul>')[1].split('</ul>')[0].split('</li>');
                var book = {};
                for(let i in htmls) {
                    if(i == htmls.length -1){
                        continue;
                    }
                    let s = htmls[i]
                    book.bookUrl = HtmlAnalysisBase.getMatchStr(s.match(/href=\"(\S*)\">/));//小说路径
                    book.bookName = HtmlAnalysisBase.getMatchStr(s.match(/<a.class=\"name\".href.*>(.*)<\/a>/));//小说名称

                    if(str != book.bookName){
                        //名称不同，说明不是同一本小说
                        continue;
                    }
                    book.bookType = HtmlAnalysisBase.getMatchStr(s.match(/#999;\">(\S*)</));//连载、已完结等
                    book.newChapterUrl = HtmlAnalysisBase.getMatchStr(s.match(/<a.href=\"(.*)\">/));//最新章节路径
                    book.newChapter = HtmlAnalysisBase.getMatchStr(s.match(/html\">(.*)</));//最新章节
                    book.author = HtmlAnalysisBase.getMatchStr(s.match(/作者：(.*)<span/));//作者
                    book.wordNum = HtmlAnalysisBase.getMatchStr(s.match(/字数：(.*)</));//字数

                    alert("小说路径："+book.bookUrl+"    小说名称："+book.bookName+"    状态："+book.bookType+"    \n最新章节路径："+book.newChapterUrl+"    最新章节："+book.newChapter+"    \n作者："+book.author+"    字数："+book.wordNum);
                    //如果已经找到一个，就不再循环
                    break;
                }
                resolve(book);
            },
            (error) => {
                // Toast.toastShort('加载失败,请重试')
                reject(error)
        })
    })
    return p;
}

module.exports = myModule;


//
// var request = new XMLHttpRequest();
// request.onreadystatechange = e => {
//     if (request.readyState !== 4) {
//         return;
//     }
//
//     if (request.status === 200) {
//         let str = request.responseText.split('<div class="container">')[1].split('</div><div class="footer">')[0].split('<ul>')[1].split('</ul>')[0];
//         let strs = str.split('</li>');
//         for(let i in strs){
//             let s = strs[i]
//             let u = s.match(/href=\"(\S*)\">/);
//             if(u != null && u.length > 1){
//                 u = u[1];
//             }else{
//                 u = "";
//             }
//             let type = s.match(/#999;\">(\S*)</);//连载、已完结等
//             if(type != null && type.length > 1){
//                 type = type[1];
//             }else{
//                 type = "";
//             }
//             let u2 = s.match(/<a.href=\"(.*)\">/);
//             if(u2 != null && u2.length > 1){
//                 u2 = u2[1];
//             }else{
//                 u2 = "";
//             }
//             let nzj = s.match(/html\">(.*)</);
//             if(nzj != null && nzj.length > 1){
//                 nzj = nzj[1];
//             }else{
//                 nzj = "";
//             }
//             console.log(u);
//             console.log(type);
//             console.log(u2);
//             console.log(nzj);
//         }
//
//
//     } else {
//         alert("error");
//     }
// };
//
// request.open("GET", "http://m.zzdxsw.org/wap.php?action=search&wd=牧神记");
// request.send();