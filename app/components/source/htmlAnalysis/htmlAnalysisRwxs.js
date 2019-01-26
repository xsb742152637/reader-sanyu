/*
 * description: 燃文小说html解析
 * author: 谢
 * time: 2019年01月
 */
import HtmlAnalysisBase from './htmlAnalysisBase'

var myModule = {};

//小说内容页面解析
myModule._getChapter_detail = (htmlStr) => {
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'</script></div><div id="content">','</div><div style="text-align: center"><script>read3()');
    htmlStr = htmlStr.replace("-- 上拉加载下一章 s -->","")
    htmlStr = HtmlAnalysisBase.replaceBrTag(htmlStr);
    return htmlStr;
}

//章节页面解析
myModule._chapter_html = (source,book,htmlStr) => {
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div class="box_con"><div id="list"><dl>','</dl></div></div><div id="footer" name="footer">');

    // alert(htmlStr)
    let htmls = htmlStr.split('</dd>');//根据li结束标签截取为数组，最后一个元素不循环。
    if(htmls.length < 2){
        // alert("没有后续章节了");
        return null;
    }

    let dataList = new Array();
    let beforNum = 0;
    for(let i in htmls) {
        if(htmls[i] == ""){
            continue;
        }

        try{
            let data = {};
            //<dd><a href="https://www.ranwena.com/files/article/16/16325/5586100.html">第九十四 王蛇</a>
            //<dd><a.href=\"(.*)\">(.*)<\/a>
            let ar = HtmlAnalysisBase.getMatchStr(htmls[i].match(/<dd><a.href=\"(.*)\">(.*)<\/a>/),2);

            data.link = ar[0];//章节路径
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
    htmlStr = htmlStr.replace(/\n/g,'');

    let list = [];
    if(htmlStr.indexOf("搜索结果</h2><ul>") > 0){
        htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'搜索结果</h2><ul>','</ul></div><div class="clear"></div>');
        htmlStr = htmlStr.replace(/<b.style=\"color:red\">/g,"").replace(/<\/b>/g,"");

        let htmls = htmlStr.split('</li>');//根据li结束标签截取为数组，最后一个元素不循环。
        if(htmls.length < 2){
            // alert("没有找到这本书");
            return null;
        }
        for(let i in htmls) {
            if(i == 0 || htmls[i] == ""){
                continue;
            }

            let data = {};
            //<li><span class="s1">[<a href="/xuanhuan/">玄幻小说</a>]</span><span class="s2"><a href="/files/article/16/16325/" target="_blank">网游之最强牧神</a></span><span class="s3"><a href="/files/article/16/16325/5590736.html" target="_blank">第九十五章 城池</a></span><span class="s4">西泉</span><span class="s6">18-07-16</span><span class="s6">已完成</span>

            let ar = HtmlAnalysisBase.getMatchStr(htmls[i].match(/<li>.*]<\/span><span.class=\"s2\"><a.href=\"(.*)\".target=\"_blank\">(.*)<\/a><\/span><span.class=\"s3\"><a.href=\"(.*)\".target=\"_blank\">(.*)<\/a><\/span><span.class=\"s4\">(.*)<\/span><span.class=\"s6\">(.*)<\/span><span.class=\"s6\">(.*)<\/span>/),7);

            data.bookUrlNew = source.baseUrl + ar[0];//小说路径
            data.bookName = ar[1];//小说名称
            data.longIntro = "";//简介
            data.bookType = ar[5];//连载、已完结等
            // data.newChapterUrl = source.baseUrl + ar[2];//最新章节路径
            data.lastChapterTitle = ar[3];//最新章节
            data.author = ar[4];//作者

            //作者或小说名称，不满足其一就跳过
            if(book.bookName != data.bookName || (book.author != "" && book.author != data.author)){
                continue;
            }

            if(data.bookUrlNew != null){
                list.push(data);
            }
        }
    }else{
        //说明只有一个结果，并且自动得到了这本小说的目录页面，但是只取小说信息。
        htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div id="maininfo">','</div><div id="sidebar">');
        htmlStr = htmlStr.replace(/&nbsp;/g,'');
        if(htmlStr == ""){
            // alert("没有找到这本书");
            return null;
        }
        let data = {};
        //<div id="info"><h1>圣墟</h1><p>作者：辰东</p><p>状态：连载中,<a rel="nofollow" href="/modules/article/addbookcase.php?bid=85830" target="_blank">加入书架</a>,<a rel="nofollow" href="/modules/article/uservote.php?id=85830" target="_blank">投推荐票</a>,<a href="#footer">直达底部</a></p><p>最后更新：2019-01-16 14:00</p><p>最新章节：<a href="22173371.html" target="_blank">第1351章 楚风的前世今生</a></p></div><div id="intro"><p>在破败中崛起，在寂灭中复苏。沧海成尘，雷电枯竭，那一缕幽雾又一次临近大地，世间的枷锁被打开了，一个全新的世界就此揭开神秘的一角……</p><p>各位书友要是觉得《圣墟》还不错的话请不要忘记向您QQ群和微博里的朋友推荐哦！</p></div>

        let ar = HtmlAnalysisBase.getMatchStr(htmlStr.match(/<div.id=\"info\"><h1>(.*)<\/h1><p>作者：(.*)<\/p><p>状态.*最后更新：(.*)<\/p><p>最新章节：<a.href=\"(.*)\".target=\"_blank\">(.*)<\/a><\/p><\/div><div.id=\"intro\"><p>(.*)<\/p><\/div>/),6);

        data.bookUrlNew = data1.url;//小说路径
        data.bookName = ar[0];//小说名称
        data.longIntro = HtmlAnalysisBase.replaceBrTag(ar[5]);//简介
        data.bookType = ar[2].split(" ")[0];//连载、已完结等或更新时间
        // data.newChapterUrl = data1.url + ar[3];//最新章节路径
        data.lastChapterTitle = ar[4];//最新章节
        data.author = ar[1];//作者
        if(data.bookUrlNew != null){
            list.push(data);
        }
    }

    return list;
}

module.exports = myModule;
