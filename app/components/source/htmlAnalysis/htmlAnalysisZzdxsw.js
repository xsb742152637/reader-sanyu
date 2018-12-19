/*
 * description: 猪猪岛html解析
 * author: 谢
 * time: 2018年12月17日
 */
import HtmlAnalysisBase from './htmlAnalysisBase'

var myModule = {};

//搜索页面解析
myModule._search_html = (htmlStr,bookName) => {
    // alert("Jing");
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div class="container">','</div><div class="footer">');
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<ul>','</ul>');

    let htmls = htmlStr.split('</li>');//根据li结束标签截取为数组，最后一个元素不循环。
    let book = {};
    for(let i in htmls) {
        if(i == htmls.length -1){
            continue;
        }

        //<div class="right"><a class="name" href="/mushenji/">牧神记</a><span style="float:right;font-size:0.8125em;color: #999;">连载中</span><p class="update">最新章节：<a href="/mushenji/9992696.html">第一千二百一十四章 战斗明王</a></p><p class="info">作者：宅猪<span class="words">字数：4175457</span></p></div>
        let ar = HtmlAnalysisBase.getMatchStr(htmls[i].match(/<div.class=\"right\"><a.class=\"name\".href=\"(.*)\">(.*)<\/a><span.style=\".*\">(.*)<\/span><p.class=\"update\">最新章节：<a.href=\"(.*)\">(.*)<\/a><\/p><p.class=\"info\">作者：(.*)<span.class=\"words\">字数：(.*)<\/span><\/p>/),7);

        book.urlType = true;//路径类型：true(相对路径,还需要加上网址）、false(绝对路径,直接可以使用)
        book.bookUrl = ar[0];//小说路径
        book.bookName = ar[1];//小说名称
        book.bookType = ar[2];//连载、已完结等
        book.newChapterUrl = ar[3];//最新章节路径
        book.newChapter = ar[4];//最新章节
        book.author = ar[5];//作者

        if(bookName != book.bookName){
            //名称不同，说明不是同一本小说
            book = null;
            continue;
        }

        // alert("小说路径："+book.bookUrl+"\n小说名称："+book.bookName+"\n状态："+book.bookType+"\n最新章节路径："+book.newChapterUrl+"\n最新章节："+book.newChapter+"\n作者："+book.author);
        //如果已经找到一个，就不再循环
        break;
    }
    return book;
};

module.exports = myModule;
