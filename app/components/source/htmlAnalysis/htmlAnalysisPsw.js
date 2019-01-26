/*
 * description: 品书网html解析
 * author: 谢
 * time: 2019年01月
 */
import HtmlAnalysisBase from './htmlAnalysisBase'

var myModule = {};

//小说内容页面解析
myModule._getChapter_detail = (htmlStr) => {
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div id="trail" style="visibility:hidden; border:#E1E1E1 1px solid; padding:3px;"></div>','</div><div class="button_con">');
    htmlStr = htmlStr.replace("<p><content>","").replace("</content></p>","").split("本书来自")[0];
    htmlStr = HtmlAnalysisBase.replaceBrTag(htmlStr);
    return htmlStr;
}

//章节页面解析
myModule._chapter_html = (source,book,htmlStr) => {
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div class="insert_list">','<div id="adfour"><script');
    htmlStr = htmlStr.replace(/<li>/g,'');

    // alert(htmlStr)
    let htmls = htmlStr.split('</li>');//根据li结束标签截取为数组，最后一个元素不循环。
    if(htmls.length < 2){
        // alert("没有后续章节了");
        return null;
    }

    let dataList = new Array();
    let beforNum = 0;
    for(let i in htmls) {
        if(i == htmls.length -1 || htmls[i] == ""){
            continue;
        }

        try{
            let data = {};
            //<li><a href="32139774.html" title="更新时间:2018-12-1 16:26:15 更新字数:3315">第一百四十章 守擂人选</a>
            //<li><a.href=\"(.*)\".title=\".*\">(.*)<\/a>
            let ar = HtmlAnalysisBase.getMatchStr(htmls[i].match(/<a.href=\"(.*)\".title=\".*\">(.*)<\/a>/),2);

            data.link = book.bookUrlNew.replace("index.html","") + ar[0];//章节路径
            data.title = ar[1];//章节名称
            let zj = HtmlAnalysisBase.getMatchStr(data.title.match(/第(.*)章/));
            data.num = HtmlAnalysisBase.getChapterNumByCH(zj,beforNum) - 1;//当前章节的数字

            // alert("aaaaa+++"+zj+"++"+data.num)
            beforNum = data.num;
            dataList.push(data);
            // alert("章节名称："+data.title+"\n章节路径："+data.link);
        }catch (e){
            // alert("截取章节HTML出错了");
        }
    }
    // alert("22++"+dataList.length);
    return dataList;
}

//搜索页面解析
myModule._search_html = (source,data1,book) => {
    let htmlStr = data1.content;
    // alert("Jing");
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div id="Content"><div id="CrTitle">','<form name="__aspnetForm" method="post"');
    htmlStr = htmlStr.replace(/\n/g,'');

    let htmls = htmlStr.split('<div id="CListTitle">');//根据li结束标签截取为数组，最后一个元素不循环。
    if(htmls.length < 2){
        // alert("没有找到这本书");
        return null;
    }
    let list = [];
    for(let i in htmls) {
        if(i == 0|| htmls[i] == ""){
            continue;
        }

        let data = {};
        //<a href="/html/book/52/52747/index.html" target="_blank"><b>牧葬诸天</b></a>[<a href="/Author/WB/52747.aspx">请饮余生</a>|<a href="/Book/LC/5.aspx">玄幻奇幻</a><a href="/Book/LN/57.aspx" target="_blank">东方玄幻</a>| 最新章节 >>><a href="/Html/Book/52/52747/32292744.html" target="_blank">第一百五十二章 灭杀</a>| 12月6日 更新 ]</div><div id="CListText">觉醒紫色灵塔的天才，却因为身体羸弱无法修灵，当禁锢源魂的枷锁打开，黎牧注定要埋葬诸天神界，这是他的命，也是前生的恨！...</div>
        let ar = HtmlAnalysisBase.getMatchStr(htmls[i].match(/<a.href=\"(.*)\".target=\"_blank\"><b>(.*)<\/b><\/a>.<a.href=\".*\">(.*)<\/a>.<a.href=\".*\">.*<\/a><a.href=\".*\".target=\"_blank\">.*<\/a>..最新章节.>>><a.href=\"(.*)\".target=\"_blank\">(.*)<\/a>.*<\/div><div.id=\"CListText\">.*/),5);

        data.bookUrlNew = source.baseUrl + ar[0];//小说路径
        data.bookName = ar[1];//小说名称
        data.longIntro = "";//简介
        data.bookType = "";//连载、已完结等
        // data.newChapterUrl = ar[3];//最新章节路径
        data.lastChapterTitle = ar[4];//最新章节
        data.author = ar[2];//作者

        //作者或小说名称，不满足其一就跳过
        if(book.bookName != data.bookName || (book.author != "" && book.author != data.author)){
            continue;
        }

        if(data.bookUrlNew != null && data.bookName != null){
            list.push(data);
        }
    }
    return list;
}

module.exports = myModule;
