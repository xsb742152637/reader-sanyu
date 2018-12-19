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

myModule.searchBook = (str,key) => {
    myModule.bookName = str;
    let source = myModule.api[key];
    return new Promise(function(resolve,reject){
        let url = source.baseUrl + source.searchUrl + myModule.bookName;
        request.ajax(url, null,true,(data) => {
            let book = myModule._search_html(key,data);
            if(data != undefined && data != null){
                book.webName = source.webNameShort;//小说网站简称
            }
            resolve(book);
        },(err) => {
            reject(err);
        });
    });
};

//搜索页面
myModule._search_html = (key,data) => {
    let book = {};
    // alert("aaa");
    if("zzdxsw" == key){
        book = HtmlAnalysisZzdxsw._search_html(data,myModule.bookName);
    }else if("bqg" == key){
        book = HtmlAnalysisBqg._search_html(data,myModule.bookName);
    }

    // alert("ccc");
    return book;
};




module.exports =  myModule;
