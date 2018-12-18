/*
 * description: html解析
 * author: 谢
 * time: 2018年12月17日
 */

import request from '../../utils/httpUtil'

var myModule = {
    bookName:"",
    api:{
        zzdxsw:{
            webNameShort: '猪猪岛',//简称
            webName: '猪猪岛小说网',//全名
            baseUrl: 'http://m.zzdxsw.org',//网址
            searchUrl: '/wap.php?action=search&wd='//搜索路径及key
        },
        bqg:{
            webNameShort: '笔趣阁',
            webName: '笔趣阁',
            baseUrl: 'https://m.biqubao.com',
            searchUrl: '/search.php?keyword='
        }
    }
};

myModule.searchBook = (str,key) => {
    myModule.bookName = str;
    let source = myModule.api[key];

    return new Promise(function(resolve,reject){
        let url = source.baseUrl + source.searchUrl + myModule.bookName;
        request.ajax(url, null,true,(data) => {
            let book = myModule._search_html(key,data);
            book.webName = source.webNameShort;
            resolve(book);
        },(err) => {
            reject(err);
        });
    });
};

//搜索页面
myModule._search_html = (key,data) => {
    let book = {};
    // alert("aaa");
    if("zzdxsw" == key){
        // alert("bbb");
        book = myModule._zzdxsw_search_html(data);
    }else if("bqg" == key){
        // book = myModule._zzdxsw_search_html(data);
    }

    // alert("ccc");
    return book;
};

//正则表达式结果集取值
myModule._getMatchStr = (data) => {
    if (data != null && data.length > 1) {
        data = data[1];
    } else {
        data = "";
    }
    return data;
};




//------------------------------下面是对每个小说源网址的html的解析----------------------------
//猪猪岛搜索页面
myModule._zzdxsw_search_html = (data) => {
    let htmls = data.split('<div class="container">')[1].split('</div><div class="footer">')[0].split('<ul>')[1].split('</ul>')[0].split('</li>');
    let book = {};
    for(let i in htmls) {
        if(i == htmls.length -1){
            continue;
        }
        let s = htmls[i];
        book.bookUrl = myModule._getMatchStr(s.match(/href=\"(\S*)\">/));//小说路径
        book.bookName = myModule._getMatchStr(s.match(/<a.class=\"name\".href.*>(.*)<\/a>/));//小说名称

        if(myModule.bookName != book.bookName){
            //名称不同，说明不是同一本小说
            continue;
        }
        book.bookType = myModule._getMatchStr(s.match(/#999;\">(\S*)</));//连载、已完结等
        book.newChapterUrl = myModule._getMatchStr(s.match(/<a.href=\"(.*)\">/));//最新章节路径
        book.newChapter = myModule._getMatchStr(s.match(/html\">(.*)</));//最新章节
        book.author = myModule._getMatchStr(s.match(/作者：(.*)<span/));//作者
        book.wordNum = myModule._getMatchStr(s.match(/字数：(.*)</));//字数

        // alert("小说路径："+book.bookUrl+"    小说名称："+book.bookName+"    状态："+book.bookType+"    \n最新章节路径："+book.newChapterUrl+"    最新章节："+book.newChapter+"    \n作者："+book.author+"    字数："+book.wordNum);
        //如果已经找到一个，就不再循环
        break;
    }
    return book;
};


module.exports = myModule;
