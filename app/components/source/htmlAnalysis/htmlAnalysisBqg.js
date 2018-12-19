/*
 * description: 笔趣阁html解析
 * author: 谢
 * time: 2018年12月19日
 */
import HtmlAnalysisBase from './htmlAnalysisBase'

var myModule = {};

//搜索页面解析
myModule._search_html = (htmlStr,bookName) => {
    htmlStr = HtmlAnalysisBase.htmlTrim(htmlStr);
    htmlStr = HtmlAnalysisBase.getNeedHtml(htmlStr,'<div class="result-list">','</div><div class="search-result-page">');

    let htmls = htmlStr.split('<div class="result-item result-game-item">');//根据class=result-item result-game-item的div开始标签截取为数组，第一个元素不循环。
    if(htmls.length < 2){
        // alert("没有找到这本书");
        return null;
    }

    let book = {};
    for(let i in htmls) {
        if(i == 0){
            continue;
        }
        //<div class="result-game-item-pic"><a cpos="img" href="https://m.biqubao.com/book/18569/" class="result-game-item-pic-link" target="_blank" style="width:110px;height:150px;"><img src="https://www.biqubao.com/cover/18/18569/18569s.jpg" class="result-game-item-pic-link-img" onerror="$(this).attr('src', 'https://www.biqubao.com/images/nocover.jpg')"></a></div><div class="result-game-item-detail"><h3 class="result-item-title result-game-item-title"><a cpos="title" href="https://m.biqubao.com/book/18569/" title="牧神记" class="result-game-item-title-link" target="_blank"><span>牧神记</span></a></h3><p class="result-game-item-desc">大墟的祖训说，天黑，别出门。　　大墟残老村的老弱病残们从江边...</p><div class="result-game-item-info"><p class="result-game-item-info-tag"><span class="result-game-item-info-tag-title preBold">作者：</span><span>宅猪</span></p><p class="result-game-item-info-tag"><span class="result-game-item-info-tag-title preBold">类型：</span><span class="result-game-item-info-tag-title">玄幻小说</span></p><p class="result-game-item-info-tag"><span class="result-game-item-info-tag-title preBold">更新时间：</span><span class="result-game-item-info-tag-title">2018-12-19</span></p><p class="result-game-item-info-tag"><span class="result-game-item-info-tag-title preBold">最新章节：</span><a cpos="newchapter" href=" https://m.biqubao.com/book/18569/12507524.html " class="result-game-item-info-tag-item" target="_blank">第一千二百一十六章 额头上香（第二更）</a></p></div></div></div>
        let ar = HtmlAnalysisBase.getMatchStr(htmls[i].match(/<h3.*.cpos=.title..href=.(.*)..title=.(.*)..class=.result-game-item-title-link..target=._blank.>.*作者：<\/span><span>(.*)<\/span><\/p><p.class=.result-game-item-info-tag.>.*类型.*更新时间：<\/span><span.class=.result-game-item-info-tag-title.>(.*)<\/span><\/p>.*最新章节.*newchapter..href=.(.*)..class=..*..target=._blank.>(.*)<\/a><\/p><\/div><\/div><\/div>/),6);

        book.urlType = false;//路径类型：true(相对路径,还需要加上网址）、false(绝对路径,直接可以使用)
        book.bookUrl = ar[0];//小说路径
        book.bookName = ar[1];//小说名称
        book.author = ar[2];//作者
        book.bookType = ar[3];//连载、已完结等
        book.newChapterUrl = ar[4];//最新章节路径
        book.newChapter = ar[5];//最新章节

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
