/*
 * description: html解析
 * author: 谢
 * time: 2018年12月17日
 */

import request from '../../utils/httpUtil'
import api from '../../common/api'
import {myEncode} from '../../utils/formatUtil'
import HtmlAnalysisBase from './htmlAnalysis/htmlAnalysisBase'

import HtmlAnalysisPsw from './htmlAnalysis/htmlAnalysisPsw'
import HtmlAnalysisZzdxsw from './htmlAnalysis/htmlAnalysisZzdxsw'
import HtmlAnalysisBqgpc from './htmlAnalysis/htmlAnalysisBqgpc'
import HtmlAnalysisDdxs from './htmlAnalysis/htmlAnalysisDdxs'
import HtmlAnalysisByzww from './htmlAnalysis/htmlAnalysisByzww'
import HtmlAnalysisRwxs from './htmlAnalysis/htmlAnalysisRwxs'
import HtmlAnalysisSyxsw from './htmlAnalysis/htmlAnalysisSyxsw'

var myModule = {
    outTime: 18//超时时间
}
myModule.mainKey = HtmlAnalysisBase.mainKey;
myModule.api = HtmlAnalysisBase.api;
myModule.showAlert = true;//是否显示调试信息

/**
 * 根据章节信息得到小说内容
 * @param chapter
 */
myModule.getChapterDetail = (source,chapter) => {

    return new Promise((resolve,reject) => {
        request.ajax(chapter.link,myModule.outTime,source.isUtf8, null).then((data) => {
            let ha = myModule._get_type(source.key);
            // alert("结果："+data);
            if(ha != null){
                data = ha._getChapter_detail(data.content);
                resolve(data);
            }else{
                reject("无法识别的类型："+key);
            }
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
    return new Promise((resolve,reject) => {
        //路径类型：true(相对路径,还需要加上网址）、false(绝对路径,直接可以使用)
        let url = book.bookUrlNew;
        if(source.chapterRowNum > 0){
            if((pageNum == 1 && source.chapterUrlFirst) || pageNum != 1){
                url += source.chapterUrlBefor + pageNum + source.chapterUrlAfter;
            }
        }

        // alert(book.webName+"获取目录："+url+"\n"+JSON.stringify(source)+"\n"+JSON.stringify(book));
        //超时时间为
        request.ajax(url,myModule.outTime,source.isUtf8, null).then((data) => {
            // alert(JSON.stringify(data))
            if(data == null || data == ""){
                resolve(null);
            }else{
                let ha = myModule._get_type(book.sourceKey);
                if(ha != null){
                    let dataList = ha._chapter_html(source,book,data.content);
                    resolve(dataList);
                }else{
                    reject("无法识别的类型："+key);
                }
            }

        }).catch((err) => {
            if(myModule.showAlert){
                alert("请求章节列表错误：\n"+url+"\n\n"+JSON.stringify(err)+"\n\n"+JSON.stringify(source)+"\n\n"+JSON.stringify(book));
            }
            resolve([]);
            // reject(err);
        });
    });
}

/**
 * 搜索小说
 * @param str 小说名称
 * @param key 来源类型
 * @returns {*}
 */
myModule.searchBook = (book,key) => {
    if((book.bookId == undefined || book.bookId == null || book.bookId == "") && (book.bookName == undefined || book.bookName == null || book.bookName == "")){
        if(myModule.showAlert){
            alert("小说名称是什么？");
        }
        return;
    }
    let source = myModule.api[key];
    return new Promise((resolve,reject) => {
        if(source.isMainApi){
            request.get(api.BOOK_DETAIL(book.bookId), null, (data) => {
                if(myModule.showAlert){
                    // alert(JSON.stringify(book)+"\n\n"+JSON.stringify(data))
                }
                data.sourceKey = source.key;
                data.webName = source.webName;//小说网站简称
                data.isMainApi = true;
                data.bookUrlNew = data.cover;
                data.bookId = data._id;
                data.bookName = data.title;
                data.lastChapterTitle = data.lastChapter;
                resolve(data);
            }, (err) => {
                reject(err);
            })
        }else{
            if(source.isUse != undefined && source.isUse != null && source.isUse == false){
                resolve(null);
            }else{
                // alert(JSON.stringify(source))
                let url = source.baseUrl + source.searchUrl;
                let isUtf8 = source.isUtf8_search;
                if(isUtf8 == undefined || isUtf8 == null){
                    isUtf8 = source.isUtf8;
                }
                if(isUtf8){
                    url += book.bookName;
                }else{
                    url += myEncode(book.bookName,"gbk");
                }

                //超时时间为20秒
                request.ajax(url,myModule.outTime, isUtf8, null).then((data) => {

                    let ha = myModule._get_type(key);
                    if(ha != null){
                        // alert("aaa");
                        let books = ha._search_html(source,data,book);
                        // alert(JSON.stringify(books));
                        if(books != undefined && books != null && books.length > 0){
                            if(JSON.stringify(books) == "{}"){
                                books = null;
                            }else{
                                //如果查询出来多本作者和名称都相同的小说，只取第一个
                                books = books[0];
                                books.webName = source.webName;//小说网站简称
                                books.sourceKey = key;//小说网站
                            }
                        }else{
                            books = null;
                        }
                        // alert(JSON.stringify(books));
                        resolve(books);
                    }else{
                        // alert("无法识别的类型："+key);
                        reject("无法识别的类型："+key);
                    }

                }).catch((err) => {
                    reject(err);
                });
            }
        }
    });
};

//根据类型得到相应的对象
myModule._get_type = (key) => {
    let ha = null;
    switch (key){
        case "psw":
            ha = HtmlAnalysisPsw;
            break;
        case "zzdxsw":
            ha = HtmlAnalysisZzdxsw;
            break;
        case "bqgpc":
            ha = HtmlAnalysisBqgpc;
            break;
        case "ddxs":
            ha = HtmlAnalysisDdxs;
            break;
        case "byzww":
            ha = HtmlAnalysisByzww;
            break;
        case "rwxs":
            ha = HtmlAnalysisRwxs;
            break;
        case "syxsw":
            ha = HtmlAnalysisSyxsw;
            break;
    }
    return ha;
};

module.exports =  myModule;
