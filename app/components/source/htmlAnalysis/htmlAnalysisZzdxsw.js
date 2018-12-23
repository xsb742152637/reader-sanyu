/*
 * description: 猪猪岛html解析
 * author: 谢
 * time: 2018年12月17日
 */
import HtmlAnalysisBase from './htmlAnalysisBase'

var myModule = {};

//章节页面解析
myModule._chapter_html = (source,book,htmlStr) => {
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div class="mod block update chapter-list">','<div class="mod page"><div class="pagelistbox">');

    let htmls = htmlStr.split('</li>');//根据li结束标签截取为数组，最后一个元素不循环。
    if(htmls.length < 2){
        // alert("没有后续章节了");
        return null;
    }

    let dataList = new Array();
    for(let i in htmls) {
        if(i == htmls.length -1){
            continue;
        }

        try{
            let data = {};
            //<li><a href="8090455.html">卷 第二百四十六章 似幻还真</a>
            //<li><a.href="(.*)">(.*)<\/a>
            let ar = HtmlAnalysisBase.getMatchStr(htmls[i].match(/<a.href="(.*)">(.*)<\/a>/),2);

            data.link = source.baseUrl + book.bookUrl + ar[0];//章节路径
            data.title = ar[1];//章节名称

            dataList.push(data);
            // alert("章节名称："+data.title+"\n章节路径："+data.link);
        }catch (e){
            alert("截取章节HTML出错了");
        }
    }
    return dataList;
}

//搜索页面解析
myModule._search_html = (htmlStr,bookName) => {
    // alert("Jing");
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div class="container">','</div><div class="footer">');
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<ul>','</ul>');

    let htmls = htmlStr.split('</li>');//根据li结束标签截取为数组，最后一个元素不循环。
    if(htmls.length < 2){
        // alert("没有找到这本书");
        return null;
    }
    let data = {};
    for(let i in htmls) {
        if(i == htmls.length -1){
            continue;
        }

        //<div class="right"><a class="name" href="/mushenji/">牧神记</a><span style="float:right;font-size:0.8125em;color: #999;">连载中</span><p class="update">最新章节：<a href="/mushenji/9992696.html">第一千二百一十四章 战斗明王</a></p><p class="info">作者：宅猪<span class="words">字数：4175457</span></p></div>
        let ar = HtmlAnalysisBase.getMatchStr(htmls[i].match(/<div.class=\"right\"><a.class=\"name\".href=\"(.*)\">(.*)<\/a><span.style=\".*\">(.*)<\/span><p.class=\"update\">最新章节：<a.href=\"(.*)\">(.*)<\/a><\/p><p.class=\"info\">作者：(.*)<span.class=\"words\">字数：(.*)<\/span><\/p>/),7);

        data.urlType = true;//路径类型：true(相对路径,还需要加上网址）、false(绝对路径,直接可以使用)
        data.bookUrl = ar[0];//小说路径
        data.bookName = ar[1];//小说名称
        data.bookType = ar[2];//连载、已完结等
        data.newChapterUrl = ar[3];//最新章节路径
        data.newChapter = ar[4];//最新章节
        data.author = ar[5];//作者

        if(bookName != data.bookName){
            //名称不同，说明不是同一本小说
            data = null;
            continue;
        }

        // alert("小说路径："+data.bookUrl+"\n小说名称："+data.bookName+"\n状态："+data.bookType+"\n最新章节路径："+data.newChapterUrl+"\n最新章节："+data.newChapter+"\n作者："+data.author);
        //如果已经找到一个，就不再循环
        break;
    }
    return data;
}

module.exports = myModule;
