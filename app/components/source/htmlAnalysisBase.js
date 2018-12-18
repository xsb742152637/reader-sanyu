/*
 * description: html解析
 * author: 谢
 * time: 2018年12月17日
 */

var myModule = {
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
    let source = myModule.api[key];

    return new Promise(function(resolve,reject){
        request.ajax(source.baseUrl + source.searchUrl + str, null,(data) => {
            resolve(this._search_html(key,data));
        },(err) => {
            reject(err);
        });
    });
};

//搜索页面
myModule._search_html = (key,data) => {
    let book = {};
    switch (key){
        case "zzdxsw":
            alert("猪猪岛html解析");
            book = this._zzdxsw_search_html(data);
            break;
        case "bqg":
            alert("我不认识");
            // book = this._zzdxsw_search_html(data);
            break;
    }
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
    let htmls = data.responseText.split('<div class="container">')[1].split('</div><div class="footer">')[0].split('<ul>')[1].split('</ul>')[0].split('</li>');
    var book = {};
    book.webName = WEB_NAME_SHORT;
    for(let i in htmls) {
        if(i == htmls.length -1){
            continue;
        }
        let s = htmls[i]
        book.bookUrl = this._getMatchStr(s.match(/href=\"(\S*)\">/));//小说路径
        book.bookName = this._getMatchStr(s.match(/<a.class=\"name\".href.*>(.*)<\/a>/));//小说名称

        if(str != book.bookName){
            //名称不同，说明不是同一本小说
            continue;
        }
        book.bookType = this._getMatchStr(s.match(/#999;\">(\S*)</));//连载、已完结等
        book.newChapterUrl = this._getMatchStr(s.match(/<a.href=\"(.*)\">/));//最新章节路径
        book.newChapter = this._getMatchStr(s.match(/html\">(.*)</));//最新章节
        book.author = this._getMatchStr(s.match(/作者：(.*)<span/));//作者
        book.wordNum = this._getMatchStr(s.match(/字数：(.*)</));//字数

        // alert("小说路径："+book.bookUrl+"    小说名称："+book.bookName+"    状态："+book.bookType+"    \n最新章节路径："+book.newChapterUrl+"    最新章节："+book.newChapter+"    \n作者："+book.author+"    字数："+book.wordNum);
        //如果已经找到一个，就不再循环
        break;
    }
    return book;
};


module.exports = myModule;
