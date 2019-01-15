/*
 * description: 猪猪岛html解析
 * author: 谢
 * time: 2018年12月17日
 */
import HtmlAnalysisBase from './htmlAnalysisBase'

var myModule = {};

//章节页面解析
myModule._getChapter_detail = (htmlStr) => {
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div id="trail" style="visibility:hidden; border:#E1E1E1 1px solid; padding:3px;"></div>','本书来自</p>');
    htmlStr = htmlStr.replace("<p><content>","").replace("</content></p>","")
    htmlStr = HtmlAnalysisBase.replaceBrTag(htmlStr);
    return htmlStr;
}

//章节页面解析
myModule._chapter_html = (source,book,htmlStr) => {
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div class="insert_list">','<div id="adfour"><script');

    // alert(htmlStr)
    let htmls = htmlStr.split('</li>');//根据li结束标签截取为数组，最后一个元素不循环。
    if(htmls.length < 2){
        // alert("没有后续章节了");
        return null;
    }

    let dataList = new Array();
    let beforNum = 0;
    // alert("11");
    for(let i in htmls) {
        if(i == htmls.length -1){
            continue;
        }

        try{
            let data = {};
            //<li><a href="32139774.html" title="更新时间:2018-12-1 16:26:15 更新字数:3315">第一百四十章 守擂人选</a>
            //<li><a.href=\"(.*)\".title=\".*\">(.*)<\/a>
            let ar = HtmlAnalysisBase.getMatchStr(htmls[i].match(/<li><a.href=\"(.*)\".title=\".*\">(.*)<\/a>/),2);

            data.link = book.bookUrlNew.replace("index.html","") + ar[0];//章节路径
            data.title = ar[1];//章节名称
            let zj = HtmlAnalysisBase.getMatchStr(data.title.match(/第(.*)章/));
            data.num = HtmlAnalysisBase.getChapterNumByCH(zj,beforNum) - 1;//当前章节的数字

            // alert("aaaaa+++"+zj+"++"+data.num)
            beforNum = data.num;
            dataList.push(data);
            // alert("章节名称："+data.title+"\n章节路径："+data.link);
        }catch (e){
            alert("截取章节HTML出错了");
        }
    }
    // alert("22++"+dataList.length);
    return dataList;
}

//搜索页面解析
myModule._search_html = (source,htmlStr,bookName) => {
    // alert("Jing");
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div id="maininfo">','<div id="sidebar">');

    if(htmlStr == ""){
        // alert("没有找到这本书");
        return null;
    }
    let data = {};

    //<div id="info"><h1>牧神记</h1><p>作&nbsp;&nbsp;&nbsp;&nbsp;者：宅猪</p><p>动&nbsp;&nbsp;&nbsp;&nbsp;作：<a href="javascript:;" onClick="showpop('/modules/article/addbookcase.php?bid=6595&ajax_request=1');">加入书架</a>,<a href="javascript:;" onClick="showpop('/modules/article/uservote.php?id=6595&ajax_request=1');">投推荐票</a>,<a href="#footer">直达底部</a></p><p>最后更新：2019-01-15</p><p>最新章节：<a href="9657557.html">第一三二二章 豢人者终被豢之（第二更）</a></p></div><div id="intro"><p>大墟的祖训说，天黑，别出门。　　大墟残老村的老弱病残们从江边捡到了一个婴儿，取名秦牧，含辛茹苦将他养大。这一天夜幕降临，黑暗笼罩大墟，秦牧走出了家门……　　做个春风中荡漾的反派吧！　　瞎子对他说。　　秦牧的反派之路，正在崛起！</p></div></div>
    //<div id="info"><h1>(.*)</h1><p>作&nbsp;&nbsp;&nbsp;&nbsp;者：宅猪</p><p>动&nbsp;&nbsp;&nbsp;&nbsp;作：<a href="javascript:;" onClick="showpop('/modules/article/addbookcase.php?bid=6595&ajax_request=1');">加入书架</a>,<a href="javascript:;" onClick="showpop('/modules/article/uservote.php?id=6595&ajax_request=1');">投推荐票</a>,<a href="#footer">直达底部</a></p><p>最后更新：2019-01-15</p><p>最新章节：<a href="9657557.html">第一三二二章 豢人者终被豢之（第二更）</a></p></div><div id="intro"><p>大墟的祖训说，天黑，别出门。　　大墟残老村的老弱病残们从江边捡到了一个婴儿，取名秦牧，含辛茹苦将他养大。这一天夜幕降临，黑暗笼罩大墟，秦牧走出了家门……　　做个春风中荡漾的反派吧！　　瞎子对他说。　　秦牧的反派之路，正在崛起！</p></div></div>
    let ar = HtmlAnalysisBase.getMatchStr(htmlStr.match(/<a.href=\"(.*)\".target=\"_blank\"><b>(.*)<\/b><\/a>.<a.href=\".*\">(.*)<\/a>.<a.href=\".*\">.*<\/a><a.href=\".*\".target=\"_blank\">.*<\/a>..最新章节.>>><a.href=\"(.*)\".target=\"_blank\">(.*)<\/a>.*<\/div><div.id=\"CListText\">.*/),5);

    data.bookUrlNew = source.baseUrl + ar[0];//小说路径
    data.bookName = ar[1];//小说名称
    data.longIntro = "";//简介
    data.bookType = "";//连载、已完结等
    // data.newChapterUrl = ar[3];//最新章节路径
    data.lastChapterTitle = ar[4];//最新章节
    data.author = ar[2];//作者

    return data;
}

module.exports = myModule;
