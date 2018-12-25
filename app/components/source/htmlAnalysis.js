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
myModule.api = HtmlAnalysisBase.api;

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
        //超时时间为4秒
        request.ajax(url,4,source.charset, null,true,(data) => {
            let ha = myModule._get_type(book.key);
            if(ha != null){
                let dataList = ha._chapter_html(source,book,data);
                resolve(dataList);
            }else{
                reject("无法识别的类型："+key);
            }

        },(err) => {
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
        let url = source.baseUrl + source.searchUrl + myModule.bookName;
        // alert("url:"+url+"+++"+key);
        //超时时间为10秒
        request.ajax(url,10, null, null,true,(data) => {
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
