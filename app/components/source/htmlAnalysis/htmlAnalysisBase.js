/*
 * description: html解析的公共类
 * author: 谢
 * time: 2018年12月17日
 */
const CH_DW = {"十": 10,"百": 100,"千": 1000,"万":10000};//中文数字单位
const CH_SZ = {"一": 1,"二": 2,"三": 3,"四": 4,"五": 5,"六": 6,"七": 7,"八": 8,"九": 9,"零": 0};//中文数字

var myModule = {
    title:"",//小说名称
    mainKey:'zssq',
    api:{
        zssq:{
            key:'zssq',
            webNameShort: '追书神器',//简称
            webName: '追书神器',//全名
            isUse: true,//是否启用
            isMainApi: true,
            chapterRowNum: -1//每页目录行数
        },
        psw:{
            key:'psw',
            webNameShort: '品',//简称
            webName: '品书网',//全名
            isUse: true,//是否启用
            isMainApi: false,
            isUtf8: false,//编码是否为UTF-8
            baseUrl: 'https://www.vodtw.com',//网址
            searchUrl: '/Book/Search.aspx?SearchClass=1&SearchKey=',//搜索路径及key
            chapterRowNum: -1//每页目录行数
        },
        bqgpc:{
            key:'bqgpc',
            webNameShort: '笔',//简称
            webName: '笔趣阁',//全名
            isUse: true,//是否启用
            isMainApi: false,
            isUtf8: false,//编码是否为UTF-8
            baseUrl: 'http://www.biquyun.com',//网址
            searchUrl: '/modules/article/soshu.php?searchkey=',//搜索路径及key
            chapterRowNum: -1//每页目录行数
        },
        ddxs:{
            key:'ddxs',
            webNameShort: '顶',//简称
            webName: '顶点小说',//全名
            isUse: true,//是否启用
            isMainApi: false,
            isUtf8: false,//编码是否为UTF-8
            baseUrl: 'https://www.x23us.com',//网址，该网站搜索间隔不能小于10秒
            searchUrl: '/modules/article/search.php?searchtype=keywords&searchkey=',//搜索路径及key
            chapterRowNum: -1//每页目录行数
        },
        byzww:{
            key:'byzww',
            webNameShort: '八',//简称
            webName: '八一中文网',//全名
            isUse: true,//是否启用
            isMainApi: false,
            isUtf8: false,//编码是否为UTF-8
            isUtf8_search: true,//搜索页面的编码是否为UTF-8，默认为空，表示一致
            baseUrl: 'https://www.zwdu.com',//网址
            searchUrl: '/search.php?keyword=',//搜索路径及key
            chapterRowNum: -1//每页目录行数
        },
        rwxs:{
            key:'rwxs',
            webNameShort: '燃',//简称
            webName: '燃文小说',//全名
            isUse: true,//是否启用
            isMainApi: false,
            isUtf8: false,//编码是否为UTF-8
            baseUrl: 'https://www.ranwena.com',//网址，该网站搜索间隔不能小于6秒
            searchUrl: '/modules/article/search.php?searchtype=keywords&searchkey=',//搜索路径及key
            chapterRowNum: -1//每页目录行数
        },
        syxsw:{
            key:'syxsw',
            webNameShort: '31',//简称
            webName: '31小说网',//全名
            isUse: true,//是否启用
            isMainApi: false,
            isUtf8: false,//编码是否为UTF-8
            baseUrl: 'http://www.31xs.org',//网址
            searchUrl: '/search.php?keywords=',//搜索路径及key
            chapterRowNum: -1//每页目录行数
        },
        zzdxsw:{
            key:'zzdxsw',
            webNameShort: '猪',//简称
            webName: '猪猪岛小说网',//全名
            isUse: false,//是否启用
            isMainApi: false,
            isUtf8: true,//编码是否为UTF-8
            baseUrl: 'http://m.zzdxsw.org',//网址
            searchUrl: '/wap.php?action=search&wd=',//搜索路径及key
            chapterUrlFirst: false,//章节路径的第一页不加路径
            chapterUrlBefor: 'list_',//后续章节需要添加的前面部分
            chapterUrlAfter: '.html',//后续章节需要添加的后面部分
            chapterRowNum: 25//每页目录行数
        }
    }
}

//将br换行标签转换成\n
myModule.replaceBrTag = (htmlStr) => {
    htmlStr = htmlStr.replace(/<br.{0,2}><br.{0,2}>/g,'\n').replace(/&nbsp;/g,' ').replace(/<\/p><p>/g,'\n').replace(/<p>/g,'').replace(/<\/p>/g,'');
    return htmlStr.replace(/<br.{0,2}>/g,'\n');
}
//通过特别的字符串截取从headStr到footStr之间的html内容
myModule.getNeedHtml =(htmlStr,headStr,footStr) => {
    return myModule.removeFoot(myModule.removeHead(htmlStr,headStr),footStr);
}
//移除html中前面不需要的部分
myModule.removeHead = (htmlStr,str) => {
    let r = htmlStr.split(str);
    if(r.length < 2){
        return "";
    }else {
        return r[1];
    }
}
//移除html中后面不需要的部分
myModule.removeFoot = (htmlStr,str) => {
    return htmlStr.split(str)[0];
}
//移除html中标签外的空格
myModule.htmlTrim = (htmlStr) => {
    return htmlStr.replace(/>\s*/g,'>').replace(/\s*</g,'<');
}

//正则表达式结果集取值,如果只取一个结果，直接返回字符串，如果取多个结果，返回数组
myModule.getMatchStr = (data,lens = 1) => {
    if(lens > 1){
        let ar = new Array(lens);
        for(let i = 0 ; i < ar.length ; i++){
            if(data != null && data[i+1]){
                ar[i] = data[i+1].trim();//去前后空格
            }else{
                ar[i] = "";
            }
        }
        return ar;
    }else{
        if (data != null && data.length > 1) {
            data = data[1].trim();
        } else {
            data = "";
        }
        return data;
    }

    return "";
};

//根据中文大写数字转阿拉伯数字,如果无法识别当前章节数量就使用上一个章节数量+1
myModule.getChapterNumByCH = (ch,beforNum) => {
    let r = 0;
    if(ch != null && ch != ""){
        //是数字
        if(!isNaN(parseInt(ch))){
            r = ch;
        }else{
            let b_n = 0;
            let bf = true;//true:上一个是单位，false:上一个是数字
            for(let c in ch){
                let c1 = ch[c];
                if(CH_SZ[c1] != null){
                    if(bf){
                        b_n = CH_SZ[c1];
                    }else{
                        if(r == 0){
                            r = "";
                        }
                        // console.log(r + '+='+ b_n+"+"+CH_SZ[c1])
                        r += b_n+ "" + CH_SZ[c1];
                        b_n = "";
                    }
                    bf = false;
                    // alert("数字："+c1+"+++"+b_n);
                }else if(CH_DW[c1]){
                    if(b_n == 0){
                        b_n = 1;
                    }
                    r += b_n * CH_DW[c1];
                    b_n = 0;
                    bf = true;
                    // alert("结果："+c1+"+++"+CH_DW[c1]+"+++"+r);
                }
            }
            r += b_n;
        }

    }else{
        r = beforNum + 1;
    }
    return parseInt(r);
}

module.exports =  myModule;
