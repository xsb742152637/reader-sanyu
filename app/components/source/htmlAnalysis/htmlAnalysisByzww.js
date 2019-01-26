/*
 * description: 八一中文网html解析
 * author: 谢
 * time: 2019年01月
 */
import HtmlAnalysisBase from './htmlAnalysisBase'

var myModule = {};

//小说内容页面解析
myModule._getChapter_detail = (htmlStr) => {
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'</script></div><div id="content">','</div><div style="text-align: center"><script>read3()');
    // htmlStr = htmlStr.replace("<p><content>","").replace("</content></p>","").split("本书来自")[0];
    htmlStr = HtmlAnalysisBase.replaceBrTag(htmlStr);
    return htmlStr;
}

//章节页面解析
myModule._chapter_html = (source,book,htmlStr) => {
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div class="box_con"><div id="list"><dl>','</dl></div></div><div id="footer" name="footer">');
    htmlStr = htmlStr.replace(' class="empty"','');

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
            //<dd><a href="/book/34640/13949329.html">第十三章 加速空间</a>
            //<dd><a.href=\"(.*)\">(.*)<\/a>
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
myModule._search_html = (source,data1,book) => {
    let htmlStr = data1.content;
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div class="result-list">','<div class="search-result-page">');
    htmlStr = htmlStr.replace(/\n/g,'');

    let htmls = htmlStr.split('<div class="result-item result-game-item">');//根据li结束标签截取为数组，最后一个元素不循环。
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
        //<div class="result-game-item-pic"><a cpos="img" href="https://www.zwdu.com/book/23488/" class="result-game-item-pic-link" target="_blank" style="width:110px;height:150px;"><img src="https://www.zwdu.com/files/article/image/23/23488/23488s.jpg" class="result-game-item-pic-link-img" onerror="$(this).attr('src', 'https://www.zwdu.com/images/nocover.jpg')"></a></div><div class="result-game-item-detail"><h3 class="result-item-title result-game-item-title"><a cpos="title" href="https://www.zwdu.com/book/23488/" title="圣墟" class="result-game-item-title-link" target="_blank"><span>圣墟</span></a></h3><p class="result-game-item-desc">在破败中崛起，在寂灭中复苏。沧海成尘，雷电枯竭，那一缕幽雾又一次临近大地，世间的枷锁被打开了，一个全新的世界就此揭开神秘的一角……</p><div class="result-game-item-info"><p class="result-game-item-info-tag"><span class="result-game-item-info-tag-title preBold">作者：</span><span>辰东</span></p><p class="result-game-item-info-tag"><span class="result-game-item-info-tag-title preBold">类型：</span><span class="result-game-item-info-tag-title">玄幻小说</span></p><p class="result-game-item-info-tag"><span class="result-game-item-info-tag-title preBold">更新时间：</span><span class="result-game-item-info-tag-title">2019-01-16</span></p><p class="result-game-item-info-tag"><span class="result-game-item-info-tag-title preBold">最新章节：</span><a cpos="newchapter" href=" https://www.zwdu.com/book/23488/15312105.html " class="result-game-item-info-tag-item" target="_blank">第1351章 楚风的前世今生</a></p></div></div></div></div>

        let ar = HtmlAnalysisBase.getMatchStr(htmls[i].match(/<div.class=\"result-game-item-pic\"><a.cpos=\"img\".href=\"(.*)\".class=\"result-game-item-pic-link\".*class=\"result-game-item-title-link\".target=\"_blank\"><span>(.*)<\/span><\/a><\/h3><p.class=\"result-game-item-desc\">(.*)<\/p><div.class=\"result-game-item-info\">.*作者：<\/span><span>(.*)<\/span><\/p><p.class=\"result-game-item-info-tag\"><span.class=\"result-game-item-info-tag-title preBold\">类型.*更新时间：<\/span><span.class=\"result-game-item-info-tag-title\">(.*)<\/span><\/p><p.class=\"result-game-item-info-tag\">.*最新章节：<\/span><a.cpos=\"newchapter\".href=\"(.*)\".class=\"result-game-item-info-tag-item\".target=\"_blank\">(.*)<\/a><\/p><\/div>.*/),7);

        data.bookUrlNew = ar[0];//小说路径
        data.bookName = ar[1];//小说名称
        data.longIntro = ar[2];//简介
        data.bookType = ar[4];//连载、已完结等
        // data.newChapterUrl = ar[5];//最新章节路径
        data.lastChapterTitle = ar[6];//最新章节
        data.author = ar[3];//作者

        //作者或小说名称，不满足其一就跳过
        if(book.bookName != data.bookName || (book.author != "" && book.author != data.author)){
            continue;
        }

        if(data.bookUrlNew != null){
            list.push(data);
        }
    }
    return list;
}

module.exports = myModule;
