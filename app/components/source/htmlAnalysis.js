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
import HtmlAnalysisBqg from './htmlAnalysis/htmlAnalysisBqg'

var myModule = {
    bookName:"",
    outTime: 12//超时时间
}
myModule.mainKey = HtmlAnalysisBase.mainKey;
myModule.api = HtmlAnalysisBase.api;


/**
 * 根据章节信息得到小说内容
 * @param chapter
 */
myModule.getChapterDetail = (source,chapter) => {
    return new Promise((resolve,reject) => {
        // alert("得到小说："+JSON.stringify(chapter)+"\n"+JSON.stringify(source));
        //超时时间为
        request.ajax(chapter.link,myModule.outTime,source.isUtf8, null,true,(data) => {
            let ha = myModule._get_type(source.key);
            // alert("结果："+data);
            if(ha != null){
                data = ha._getChapter_detail(data);
                resolve(data);
            }else{
                reject("无法识别的类型："+key);
            }

        },(err) => {
            alert("getChapterDetail\n"+JSON.stringify(err));
            reject("获取小说章节出错");
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

        // alert(book.webName+"获取目录："+url+"\n"+JSON.stringify(source));
        //超时时间为
        request.ajax(url,myModule.outTime,source.isUtf8, null,true,(data) => {
            // alert(JSON.stringify(data))
            if(data == null || data == ""){
                resolve(null);
            }else{
                let ha = myModule._get_type(book.sourceKey);
                if(ha != null){
                    let dataList = ha._chapter_html(source,book,data);
                    resolve(dataList);
                }else{
                    reject("无法识别的类型："+key);
                }
            }

        },(err) => {
            alert("请求章节列表错误：\n"+url+"\n\n"+JSON.stringify(err)+"\n\n"+JSON.stringify(source)+"\n\n"+JSON.stringify(book));
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
myModule.searchBook = (bookId,bookName,key) => {
    if((bookId == undefined || bookId == null || bookId == "") && (bookName == undefined || bookName == null || bookName == "")){
        alert("小说名称是什么？");
        return;
    }
    myModule.bookName = bookName;
    let source = myModule.api[key];
    return new Promise((resolve,reject) => {
        if(source.isMainApi){
            request.get(api.BOOK_DETAIL(bookId), null, (book) => {
                book.sourceKey = source.key;
                book.webName = source.webName;//小说网站简称
                book.isMainApi = true;
                book.bookUrlNew = book.cover;
                book.bookId = book._id;
                book.bookName = book.title;
                book.lastChapterTitle = book.lastChapter;
                // alert("searchBook:\n"+JSON.stringify(book));
                resolve(book);
            }, (err) => {
                reject(err);
            })
        }else{
            // alert(JSON.stringify(source))
            let url = source.baseUrl + source.searchUrl;
            if(source.isUtf8){
                url += myModule.bookName;
            }else{
                url += myEncode(myModule.bookName,"gbk");
            }
            // alert("url:"+url+"+++"+key+"\n"+JSON.stringify(source));
            //超时时间为20秒
            request.ajax(url,myModule.outTime, source.isUtf8, null,true,(data) => {

                // alert(JSON.stringify(data))
                let ha = myModule._get_type(key);
                if(ha != null){
                    // alert("aaa");
                    let book = ha._search_html(source,data,myModule.bookName);
                    // alert("bbb");
                    if(book != undefined && book != null){
                        if(JSON.stringify(book) == "{}"){
                            book = null;
                        }else{
                            book.webName = source.webName;//小说网站简称
                            book.sourceKey = key;//小说网站
                        }
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
        case "psw":
            ha = HtmlAnalysisPsw;
            break;
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
