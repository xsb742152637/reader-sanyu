/*
 * description: 笔趣阁PC版html解析
 * author: 谢
 * time: 2019年01月
 */
import Cheerio from 'cheerio'
import HtmlAnalysisBase from './htmlAnalysisBase'

var myModule = {};

//小说内容页面解析
myModule._getChapter_detail = (htmlStr) => {
    //将html字符串载入Cheerio，decodeEntities：false表示不自动转换中文编码
    let $ = Cheerio.load(htmlStr, {decodeEntities: false})
    htmlStr = HtmlAnalysisBase.htmlTrim($("#content").html());
    return HtmlAnalysisBase.replaceBrTag(htmlStr);
}

//章节页面解析
myModule._chapter_html = (source,book,htmlStr) => {
    let dataList = new Array();
    let beforNum = 0;

    //将html字符串载入Cheerio，decodeEntities：false表示不自动转换中文编码
    let $ = Cheerio.load(htmlStr, {decodeEntities: false})
    $("#list dl dd").each((i,o) => {
        try{
            let data = {};
            data.link = source.baseUrl + $(o).find("a").attr("href");//章节路径
            data.title = $(o).find("a").text();//章节路径
            let zj = HtmlAnalysisBase.getMatchStr(data.title.match(/第(.*)章/));
            data.num = HtmlAnalysisBase.getChapterNumByCH(zj,beforNum) - 1;//当前章节的数字

            beforNum = data.num;
            dataList.push(data);
        }catch (e){
            // alert("截取章节HTML出错了");
        }
    });

    return dataList;
}

//搜索页面解析
myModule._search_html = (source,data1,book) => {
    let htmlStr = data1.content;

    let list = [];
    //说明搜索出来多个结果，得到名字完全一样的那本小说
    if(htmlStr.indexOf("<caption>搜索结果</caption>") > 0){
        //将html字符串载入Cheerio，decodeEntities：false表示不自动转换中文编码
        let $ = Cheerio.load(htmlStr, {decodeEntities: false});
        try{
            $("#content table tr[id='nr']").each((i,o) => {
                let data = {};
                $(o).find("td").each((ii,oo) => {
                    if(ii == 0){
                        data.bookUrlNew = $(oo).find("a").attr("href");//小说路径
                        data.bookName = $(oo).find("a").text();//小说名称
                    }else if(ii == 1){
                        data.newChapterUrl = source.baseUrl + $(oo).find("a").attr("href");//小说路径
                        data.lastChapterTitle = $(oo).find("a").text();//小说名称
                    }else if(ii == 2){
                        data.author = $(oo).text();//作者
                    }else if(ii == 4){
                        data.bookType = $(oo).text();//连载、已完结或更新日期
                    }
                })
                data.longIntro = "";//简介

                //作者或小说名称，不满足其一就跳过
                if(book.bookName != data.bookName || (book.author != "" && book.author != data.author)){
                    return;
                }

                // alert("小说路径："+data.bookUrlNew+"\n小说名称："+data.bookName+"\n状态："+data.bookType+"\n最新章节路径："+data.newChapterUrl+"\n最新章节："+data.newChapter+"\n作者："+data.author);
                //如果已经找到一个，就不再循环
                if(data.bookUrlNew != null){
                    list.push(data);
                }
            });
        }catch (e){
            // alert("错误："+JSON.stringify(e))
        }
    }else{
        try{
            //将html字符串载入Cheerio，decodeEntities：false表示不自动转换中文编码
            let $ = Cheerio.load(htmlStr, {decodeEntities: false});
            let data = {};
            $("#maininfo #info").children().each((i,o) => {
                if(i == 0){
                    data.bookName = $(o).text();
                }else if(i == 1){
                    data.author = $(o).text();
                    if(data.author.split("：").length > 1){
                        data.author = data.author.split("：")[1]
                    }
                }else if(i == 3){
                    data.bookType = $(o).text();
                    if(data.bookType.split("：").length > 1){
                        data.bookType = data.bookType.split("：")[1]
                    }
                }else if(i == 4){
                    data.newChapterUrl = data1.url + $(o).find("a").attr("href");
                    data.lastChapterTitle = $(o).text();
                }
            })

            data.bookUrlNew = data1.url;//小说路径
            data.longIntro =  $("#maininfo #intro").text();//简介
            if(data.bookUrlNew != null && data.bookName != null){
                list.push(data);
            }
        }catch (e){
            // alert("错误："+JSON.stringify(e))
        }

    }
    return list;
}

module.exports = myModule;
