/*
 * description: html解析
 * author: 谢
 * time: 2018年12月17日
 */

import request from '../../utils/httpUtil'
import HtmlAnalysisBase from './htmlAnalysis/htmlAnalysisBase'
import HtmlAnalysisZzdxsw from './htmlAnalysis/htmlAnalysisZzdxsw'
import HtmlAnalysisBqg from './htmlAnalysis/htmlAnalysisBqg'

var myModule = {
    bookName:""
}
myModule.mainKey = HtmlAnalysisBase.mainKey;
myModule.api = HtmlAnalysisBase.api;


/**
 * 根据章节信息得到小说内容
 * @param chapter
 */
myModule.getChapterDetail = (source,chapter) => {
    return new Promise(function(resolve,reject){
        // alert("得到小说："+JSON.stringify(chapter));
        //超时时间为
        request.ajax(chapter.link,10,source.charset, null,true,(data) => {
            let ha = myModule._get_type(source.key);
            if(ha != null){
                data = ha._getChapter_detail(data);
                resolve(data);
            }else{
                reject("无法识别的类型："+key);
            }

        },(err) => {
            alert("getChapterDetail\n"+JSON.stringify(err));
            reject(err);
        });
    });
}
/**
 *
 * @param source 小说来源对应的api数据
 * @param book 当前小说的数据
 * @param pageNum 当前请求的目录页数
 * @returns {Promise}
 */
myModule.getChapter = (source,book,pageNum) => {
    return new Promise(function(resolve,reject){
        //路径类型：true(相对路径,还需要加上网址）、false(绝对路径,直接可以使用)
        let url = book.urlType? source.baseUrl + book.bookUrl : book.bookUrl;
        if((pageNum == 1 && source.chapterUrlFirst) || pageNum != 1){
            url += source.chapterUrlBefor + pageNum + source.chapterUrlAfter;
        }

        // alert(book.webName+"获取目录："+url);
        //超时时间为
        request.ajax(url,10,source.charset, null,true,(data) => {
            let ha = myModule._get_type(book.key);
            if(ha != null){
                let dataList = ha._chapter_html(source,book,data);
                resolve(dataList);
            }else{
                reject("无法识别的类型："+key);
            }

        },(err) => {
            alert("getChapter\n"+JSON.stringify(err));
            reject(err);
        });
    });
}

/**
 * 搜索小说
 * @param str 小说名称
 * @param key 来源类型
 * @returns {*}
 */
myModule.searchBook = (bookName,key) => {
    if(bookName == undefined || bookName == null || bookName == ""){
        alert("小说名称是什么？");
        return;
    }
    myModule.bookName = bookName;
    let source = myModule.api[key];
    return new Promise(function(resolve,reject){
        if(source.isMainApi){
            resolve(source);
        }else{
            let url = source.baseUrl + source.searchUrl + myModule.bookName;
            // alert("url:"+url+"+++"+key);
            //超时时间为20秒
            request.ajax(url,20, null, null,true,(data) => {
                let ha = myModule._get_type(key);
                if(ha != null){
                    // alert("aaa");
                    let book = ha._search_html(data,myModule.bookName);
                    // alert("bbb");
                    if(book != undefined && book != null){
                        book.webName = source.webName;//小说网站简称
                        book.key = key;//小说网站
                    }
                    // alert(JSON.stringify(book));
                    resolve(book);
                }else{
                    // alert("无法识别的类型："+key);
                    reject("无法识别的类型："+key);
                }

            },(err) => {
                reject(err);
            });
        }

    });
};

//根据类型得到相应的对象
myModule._get_type = (key) => {
    let ha = null;
    switch (key){
        case "zzdxsw":
            ha = HtmlAnalysisZzdxsw;
            break;
        case "bqg":
            ha = HtmlAnalysisBqg;
            break;
    }
    return ha;
};

module.exports =  myModule;
