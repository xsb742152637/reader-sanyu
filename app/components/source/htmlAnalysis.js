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

myModule.getChapter = (book) => {
    return new Promise(function(resolve,reject){
        let url = book.bookUrl;
        if(book.urlType){
            url = book.baseUrl + book.bookUrl;
        }
        alert(book.webName+"获取目录："+url);
        request.ajax(url, null,true,(data) => {
            let ha = myModule._get_type(book.key);
            if(ha != null){
                let chapter = ha._chapter_html(data);
                if(chapter != undefined && chapter != null){

                }
                resolve(chapter);
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
        alert("小说名称是什么？")
        return;
    }
    myModule.bookName = bookName;
    let source = myModule.api[key];
    return new Promise(function(resolve,reject){
        let url = source.baseUrl + source.searchUrl + myModule.bookName;
        request.ajax(url, null,true,(data) => {
            let ha = myModule._get_type(key);
            if(ha != null){
                let book = ha._search_html(data,myModule.bookName);
                if(book != undefined && book != null){
                    book.webName = source.webNameShort;//小说网站简称
                    book.baseUrl = source.baseUrl;//小说网站
                    book.key = key;//小说网站
                }
                resolve(book);
            }else{
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
