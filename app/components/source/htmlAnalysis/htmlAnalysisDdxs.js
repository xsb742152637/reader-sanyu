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
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'</table><div id="content">','</div><script>read3();</script>');
    htmlStr = htmlStr.replace("<p><content>","").replace("</content></p>","")
    htmlStr = HtmlAnalysisBase.replaceBrTag(htmlStr);
    return htmlStr;
}

//章节页面解析
myModule._chapter_html = (source,book,htmlStr) => {
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div class="box_con"><div id="list">','<div id="footer" name="footer">');
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<dl>','<dt>');

    // alert(htmlStr)
    let htmls = htmlStr.split('</dd>');//根据li结束标签截取为数组，最后一个元素不循环。
    if(htmls.length < 2){
        // alert("没有后续章节了");
        return null;
    }

    let dataList = new Array();
    let beforNum = 0;
    // alert("11");
    for(let i in htmls) {
        if(i == htmls.length -1 || htmls[i] == ""){
            continue;
        }

        try{
            let data = {};
            //<dd><a href="/19_19887/9657634.html">第三百四十八章 魔兽也戈</a>
            //<dd><a href="(.*)">(.*)</a>
            let ar = HtmlAnalysisBase.getMatchStr(htmls[i].match(/<dd><a.href=\"(.*)\">(.*)<\/a>/),2);

            data.link = source.baseUrl + ar[0];//章节路径
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
myModule._search_html = (source,data1,bookName) => {
    let htmlStr = data1.content;
    // alert("Jing："+JSON.stringify(data1));
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);

    let data = {};
    //说明搜索出来多个结果，得到名字完全一样的那本小说
    if(htmlStr.indexOf(bookName+"</b>搜索结果</caption>") > 0){
        htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,bookName+'</b>搜索结果</caption>','</table><div class="pages">');

        let htmls = htmlStr.split("</tr>");//根据li结束标签截取为数组，最后一个元素不循环。
        if(htmls.length < 2){
            // alert("没有找到这本书");
            return null;
        }
        let data = {};
        for(let i in htmls) {
            if( i == 0 || i == htmls.length -1 || htmls[i] == ""){
                continue;
            }
            //<tr><td class="odd"><a href="https://www.x23us.com/book/25148">网游之最强<b style="color:red">牧神</b></a></td><td class="even"><a href="http://www.x23us.com/html/25/25148/" target="_blank">第九十五章 城池</a></td><td class="odd">西泉</td><td class="even">5561K</td><td class="odd" align="center">18-07-13</td><td class="even" align="center">完成</td>

            //<tr.id=\"nr\"><td.class=\"odd\"><a.href=\"(.*)\">(.*)<\/a><\/td><td.class=\"even\"><a.href=\"(.*)\".target=\"_blank\">(.*)<\/a><\/td><td.class=\"odd\">(.*)<\/td><td.class=\"even\">.*<\/td><td.class=\"odd\".align=\"center\">(.*)<\/td><td.class=\"even\".align=\"center\">.*<\/td>
            let ar = HtmlAnalysisBase.getMatchStr(htmls[i].match(/<tr.id=\"nr\"><td.class=\"odd\"><a.href=\"(.*)\">(.*)<\/a><\/td><td.class=\"even\"><a.href=\"(.*)\".target=\"_blank\">(.*)<\/a><\/td><td.class=\"odd\">(.*)<\/td><td.class=\"even\">.*<\/td><td.class=\"odd\".align=\"center\">(.*)<\/td><td.class=\"even\".align=\"center\">.*<\/td>/),6);

            data.bookUrlNew = ar[0];//小说路径
            data.bookName = ar[1];//小说名称
            data.longIntro = "";//简介
            data.bookType = ar[5];//连载、已完结等
            // data.newChapterUrl = source.baseUrl + ar[2];//最新章节路径
            data.lastChapterTitle = ar[3];//最新章节
            data.author = ar[4];//作者

            if(bookName != data.bookName){
                //名称不同，说明不是同一本小说
                data = {};
                continue;
            }

            // alert("小说路径："+data.bookUrlNew+"\n小说名称："+data.bookName+"\n状态："+data.bookType+"\n最新章节路径："+data.newChapterUrl+"\n最新章节："+data.newChapter+"\n作者："+data.author);
            //如果已经找到一个，就不再循环
            break;
        }
    }else{
        //说明只有一个结果，并且自动得到了这本小说的目录页面，但是只取小说信息。
        htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div id="maininfo">','<div id="sidebar">');
        if(htmlStr == ""){
            // alert("没有找到这本书");
            return null;
        }
//<div id="info"><h1>牧神记</h1><p>作&nbsp;&nbsp;&nbsp;&nbsp;者：宅猪</p><p>动&nbsp;&nbsp;&nbsp;&nbsp;作：<a href="javascript:;" onClick="showpop('/modules/article/addbookcase.php?bid=6595&ajax_request=1');">加入书架</a>,<a href="javascript:;" onClick="showpop('/modules/article/uservote.php?id=6595&ajax_request=1');">投推荐票</a>,<a href="#footer">直达底部</a></p><p>最后更新：2019-01-15</p><p>最新章节：<a href="9657557.html">第一三二二章 豢人者终被豢之（第二更）</a></p></div><div id="intro"><p>大墟的祖训说，天黑，别出门。　　大墟残老村的老弱病残们从江边捡到了一个婴儿，取名秦牧，含辛茹苦将他养大。这一天夜幕降临，黑暗笼罩大墟，秦牧走出了家门……　　做个春风中荡漾的反派吧！　　瞎子对他说。　　秦牧的反派之路，正在崛起！</p></div></div>

        //<div.id=\"info\"><h1>(.*)<\/h1><p>作.*者：(.*)<\/p><p>动.*最后更新：(.*)<\/p><p>最新章节：<a.href=\"(.*)\">(.*)<\/a><\/p><\/div><div.id=\"intro\"><p>(.*)<\/p><\/div><\/div>
        let ar = HtmlAnalysisBase.getMatchStr(htmlStr.match(/<div.id=\"info\"><h1>(.*)<\/h1><p>作.*者：(.*)<\/p><p>动.*最后更新：(.*)<\/p><p>最新章节：<a.href=\"(.*)\">(.*)<\/a><\/p><\/div><div.id=\"intro\"><p>(.*)<\/p><\/div><\/div>/),6);

        data.bookUrlNew = data1.url;//小说路径
        data.bookName = ar[0];//小说名称
        data.longIntro = ar[5];//简介
        data.bookType = ar[2];//连载、已完结等或更新时间
        // data.newChapterUrl = ar[3];//最新章节路径
        data.lastChapterTitle = ar[4];//最新章节
        data.author = ar[1];//作者
    }

    return data;
}

module.exports = myModule;
