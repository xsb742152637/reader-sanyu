/*
 * description: 猪猪岛小说网PC版html解析
 * author: 谢
 * time: 2019年01月
 */
import HtmlAnalysisBase from './htmlAnalysisBase'

var myModule = {};

//小说内容页面解析
myModule._getChapter_detail = (htmlStr) => {
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div id="content">','</div><script>bdshare()');
    htmlStr = HtmlAnalysisBase.replaceBrTag(htmlStr);
    return htmlStr;
}

//章节页面解析
myModule._chapter_html = (source,book,htmlStr) => {
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'全部章节</dt>','</dl></div></div><div id="footer" name="footer">');
    htmlStr = htmlStr.split("</dt>")[1];
    htmlStr = htmlStr.replace(/<dd>/g,'');

    // alert(htmlStr)
    let htmls = htmlStr.split('</dd>');//根据li结束标签截取为数组，最后一个元素不循环。
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
            //<a href="/22/22330/45781037.html">第601章 震星拳</a>
            let ar = HtmlAnalysisBase.getMatchStr(htmls[i].match(/<a.href=\"(.*)\">(.*)<\/a>/),2);

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
myModule._search_html = (source,data1,book) => {
    let htmlStr = data1.content;
    // alert("Jing");
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'小说搜索结果</caption>','</table></div></div><div class="footer"><div class="footer_link">');
    htmlStr = htmlStr.replace(/<font.color=\"red\">/g,"").replace(/<\/font>/g,"").replace(/\n/g,'');

    let htmls = htmlStr.split('</tr>');//根据li结束标签截取为数组，最后一个元素不循环。
    if(htmls.length < 2){
        // alert("没有找到这本书");
        return null;
    }
    let list = [];
    for(let i in htmls) {
        if(i == 0 || htmls[i] == ""){
            continue;
        }

        let data = {};
        //<tr><td class="odd">[<a href="/list/1/1.html">玄幻</a>]<a href="http://www.31xs.com/22/22330/" target="_blank">神山圣尊</a></td><td class="odd"><a href="http://www.31xs.com/22/22330/45847912.html" target="_blank">第609章 传承师门</a></td><td class="even">肃爽</td><td class="odd">2019-01-17 12:41:51</td>

        let ar = htmls[i].split("</td>");

        let a = ar[0].match(/.*<a.href=\"(.*)\".target=\"_blank\">(.*)<\/a>/);
        //<tr><td class="odd">[<a href="/list/1/1.html">玄幻</a>]<a href="http://www.31xs.com/22/22330/" target="_blank">神山圣尊</a>
        data.bookUrlNew = a[1];//小说路径
        data.bookName = a[2];//小说名称
        data.longIntro = '';//简介
        data.bookType = ar[3].replace('<td class="odd">',"").split(" ")[0];//连载、已完结等
        a = ar[1].match(/.*<a.href=\"(.*)\".target=\"_blank\">(.*)<\/a>/);
        // data.newChapterUrl = a[1];//最新章节路径
        data.lastChapterTitle = a[2];//最新章节
        data.author = ar[2].replace('<td class="even">',"");//作者

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
