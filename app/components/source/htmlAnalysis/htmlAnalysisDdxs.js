/*
 * description: 顶点小说html解析
 * author: 谢
 * time: 2019年01月
 */
import HtmlAnalysisBase from './htmlAnalysisBase'

var myModule = {};

//小说内容页面解析
myModule._getChapter_detail = (htmlStr) => {
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<dd id="contents">','</dd><div class="adhtml">');
    htmlStr = htmlStr.replace("-- 上拉加载下一章 s -->","");
    // htmlStr = htmlStr.replace("-- 上拉加载下一章 s -->","").replace(/顶.{0,2}点.{0,2}小.{0,2}说/g,"").replace(/Ｘ.{0,2}２.{0,2}３.{0,2}Ｕ.{0,2}Ｓ.{0,2}Ｃ.{0,2}ＯＭ/g,"").replace(/更.{0,2}新.{0,2}最.{0,2}快/g,"")
    htmlStr = HtmlAnalysisBase.replaceBrTag(htmlStr);
    return htmlStr;
}

//章节页面解析
myModule._chapter_html = (source,book,htmlStr) => {
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<script>show_share();</script>','<div class="adlist"><script>show_list2()');

    // alert(htmlStr)
    let htmls = htmlStr.split('</a></td>');//根据li结束标签截取为数组，最后一个元素不循环。
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
            //<td class="L"><a href="29321318.html">第二章 四灵血
            //<td.class=\"L\"><a.href=\"(.*)\">(.*)
            let ar = HtmlAnalysisBase.getMatchStr(htmls[i].match(/<td.class=\"L\"><a.href=\"(.*)\">(.*)/),2);

            data.link = book.bookUrlNew + ar[0];//章节路径
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
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = htmlStr.replace(/\n/g,'');

    let list = [];
    //说明搜索出来多个结果，得到名字完全一样的那本小说
    if(htmlStr.indexOf("</b>搜索结果</caption>") > 0){
        htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'</b>搜索结果</caption>','</table><div class="pages">');
        htmlStr = htmlStr.replace(/<b.style=\"color:red\">/g,"").replace(/<\/b>/g,"");
        let htmls = htmlStr.split("</tr>");//根据li结束标签截取为数组，最后一个元素不循环。
        if(htmls.length < 2){
            // alert("没有找到这本书");
            return null;
        }
        for(let i in htmls) {
            if( i == 0 || i == htmls.length -1 || htmls[i] == ""){
                continue;
            }
            let data = {};
            //<tr><td class="odd"><a href="https://www.x23us.com/book/25148">网游之最强<b style="color:red">牧神</b></a></td><td class="even"><a href="http://www.x23us.com/html/25/25148/" target="_blank">第九十五章 城池</a></td><td class="odd">西泉</td><td class="even">5561K</td><td class="odd" align="center">18-07-13</td><td class="even" align="center">完成</td>

            //<tr><td.class=\"odd\"><a.href=\"(.*)\">(.*)<\/a><\/td><td.class=\"even\"><a.href=\"(.*)\".target=\"_blank\">(.*)<\/a><\/td><td.class=\"odd\">(.*)<\/td><td.class=\"even\">.*<\/td><td.class=\"odd\".align=\"center\">(.*)<\/td><td.class=\"even\".align=\"center\">.*<\/td>
            let ar = HtmlAnalysisBase.getMatchStr(htmls[i].match(/<tr><td.class=\"odd\"><a.href=\"(.*)\">(.*)<\/a><\/td><td.class=\"even\"><a.href=\"(.*)\".target=\"_blank\">(.*)<\/a><\/td><td.class=\"odd\">(.*)<\/td><td.class=\"even\">.*<\/td><td.class=\"odd\".align=\"center\">(.*)<\/td><td.class=\"even\".align=\"center\">.*<\/td>/),6);

            data.bookUrlNew = ar[2];//小说路径
            data.bookName = ar[1];//小说名称
            data.longIntro = "";//简介
            data.bookType = ar[5];//连载、已完结等
            // data.newChapterUrl = ar[2];//最新章节路径
            data.lastChapterTitle = ar[3];//最新章节
            data.author = ar[4];//作者

            //作者或小说名称，不满足其一就跳过
            if(book.bookName != data.bookName || (book.author != "" && book.author != data.author)){
                continue;
            }
            if(data.bookUrlNew != null && data.bookName != null){
                list.push(data);
            }
        }
    }else{
        //说明只有一个结果，并且自动得到了这本小说的目录页面，但是只取小说信息。
        htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'全文阅读</h1>','读后感');
        htmlStr = htmlStr.replace(/&nbsp;/g,'');
        if(htmlStr == ""){
            // alert("没有找到这本书");
            return null;
        }
        let data = {};
        //</dd><dd><div class="fl"><a class="hst" href="https://www.x23us.com/html/68/68255/"><img style="padding:7px; border:1px solid #E4E4E4; width:120px; height:150px; margin:0 25px 0 15px;" alt="牧神记最新章节列表,牧神记全文阅读" src="https://www.x23us.com/modules/article/images/nocover.jpg"  onerror="this.src='/modules/article/images/nocover.jpg'"/></a></div><div class="fl" style="width:550px;"><style>.pl{background:#F2F2F2; padding-left:10px;}</style><p><table cellspacing="1" cellpadding="0" bgcolor="#E4E4E4" id="at"><tr><th>文章类别</th><td>&nbsp;<a href="/class/1_1.html">玄幻魔法</a></td><th>文章作者</th><td>&nbsp;宅猪</td><th>文章状态</th><td>&nbsp;连载中</td></tr><tr><th>收 藏 数</th><td>&nbsp;6269</td><th>全文长度</th><td>&nbsp;4703980字</td><th>最后更新</th><td>&nbsp;2019-01-16</td></tr><tr><th>总点击数</th><td>&nbsp;52607</td><th>本月点击</th><td>&nbsp;3148</td><th>本周点击</th><td>&nbsp;553</td></tr><tr><th>总推荐数</th><td>&nbsp;13913</td><th>本月推荐</th><td>&nbsp;498</td><th>本周推荐</th><td>&nbsp;114</td></tr></table></p><p class="btnlinks"><a class="read" href="https://www.x23us.com/html/68/68255/" title="牧神记最新章节更新列表">章节列表</a><a href="Javascript:void(0);" onclick="javascript:Ajax.Request('https://www.x23us.com/modules/article/addbookcase.php?bid=68255',{onComplete:function(){alert(this.response.replace(/<br[^<>]*>/g,'\n'));}});">加入书架</a><a href="Javascript:void(0);" onclick="javascript:Ajax.Request('https://www.x23us.com/modules/article/uservote.php?id=68255',{onComplete:function(){alert(this.response.replace(/<br[^<>]*>/g,'\n'));}});">推荐本书</a><a href="http://xiazai.x23us.com/down/68255?fname=牧神记" rel="nofollow" title="牧神记TXT下载">TXT下载</a><a class="ji" href="https://www.x23us.com/jifen.html">获取积分</a></p></dd><div class="cl"></div><dd style="padding-top:10px;"><!-- Baidu Button BEGIN --><div class="jia fl"><script>info_share();</script></div><div class="mobile fl"></div></dd><!-- Baidu Button END --><div class="cl"></div><dd style="padding:10px 30px 0 25px;"><p class="pl"><b>牧神记内容简介：</b></p><table width="740px" border="0" cellspacing="0" cellpadding="0" style="padding:5px 5px 5px 5px;"><tr><td align="right" style="padding:5px 5px 5px 5px;"><script>show_book2();</script></td><td align="left" style="padding:5px 5px 5px 5px;"><script>show_book2();</script></td></tr></table><p>&nbsp;&nbsp;&nbsp;&nbsp;大墟的祖训说，天黑，别出门。大墟残老村的老弱病残们从江边捡到了一个婴儿，取名秦牧，含辛茹苦将他养大。这一天夜幕降临，黑暗笼罩大墟，秦牧走出了家门……做个春风中荡漾的反派吧！瞎子对他说。秦牧的反派之路，正在崛起！<br /></p><p style="display:none" id="sidename">分享书籍《牧神记》作者：宅猪</p><p style="height:10px;"></p><p>&nbsp;&nbsp;&nbsp;&nbsp;　　关键字：<u>牧神记 宅猪</u><u>牧神记全文阅读</u><u>牧神记TXT下载</u></p><p style="font-weight:bold; font-size:14px;">&nbsp;&nbsp;&nbsp;&nbsp;　　牧神记最新章节：<a href="https://www.x23us.com/html/68/68255/">第一三二八章 幕后黑手（第四更）</a></p><p style="height:10px;"></p></dd><dd style="padding:10px 25px 0 25px;"><p class="pl"><font class="fr">[<a href="https://www.x23us.com/modules/article/reviews.php?aid=68255&type=good" target="_blank" rel="nofollow">精华书评</a>]&nbsp;&nbsp;&nbsp; [<a href="https://www.x23us.com/modules/article/reviews.php?aid=68255&type=all" target="_blank" rel="nofollow">全部书评</a>]&nbsp;&nbsp;&nbsp;</font><b>牧神记评论/


        //<\/dd><dd><div.class=\"fl\"><a.class=\"hst\".href=\"(.*)\"><img.*作者<\/th><td>(.*)<\/td><th>文章状态.*最后更新<\/th><td>(.*)<\/td><\/tr><tr><th>总点击数.*内容简介：.*show_book2();<\/script><\/td><\/tr><\/table><p>(.*)<br.\/><\/p>.*最新章节：<a.href=\"(.*)\">(.*)<\/a><\/p><p.style=\"height:10px;\">

        let ar = HtmlAnalysisBase.getMatchStr(htmlStr.match(/<\/dd><dd><div.class=\"fl\"><a.class=\"hst\".href=\"(.*)\"><img.*作者<\/th><td>(.*)<\/td><th>文章状态.*最后更新<\/th><td>(.*)<\/td><\/tr><tr><th>总点击数.*内容简介.*<\/table><p>(.*)<\/p>.*最新章节：<a.href=\"(.*)\">(.*)<\/a><\/p><p.style.*/),6);

        data.bookUrlNew = ar[0];//小说路径
        data.bookName = book.bookName;//小说名称
        data.longIntro = ar[3];//简介
        data.bookType = ar[2];//连载、已完结等或更新时间
        // data.newChapterUrl = ar[4];//最新章节路径
        data.lastChapterTitle = ar[5];//最新章节
        data.author = ar[1];//作者
        if(data.bookUrlNew != null && data.bookName != null){
            list.push(data);
        }
    }

    return list;
}

module.exports = myModule;
