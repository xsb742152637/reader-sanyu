/*
 * description: html解析的公共类
 * author: 谢
 * time: 2018年12月17日
 */

var myModule = {
    bookName:"",
    api:{
        zzdxsw:{
            webNameShort: '猪猪岛',//简称
            webName: '猪猪岛小说网',//全名
            charset: 'text/html;charset=gbk',//编码
            baseUrl: 'http://m.zzdxsw.org',//网址
            searchUrl: '/wap.php?action=search&wd=',//搜索路径及key
            chapterUrlFirst: false,//章节路径的第一页不加路径
            chapterUrlBefor: 'list_',//后续章节需要添加的前面部分
            chapterUrlAfter: '.html'//后续章节需要添加的后面部分
        },
        bqg:{
            webNameShort: '笔趣阁',
            webName: '笔趣阁',
            charset: 'text/html;charset=gb2312',//编码
            baseUrl: 'https://m.biqubao.com',
            searchUrl: '/search.php?keyword=',
            chapterUrlFirst: false,
            chapterUrlBefor: 'index_',
            chapterUrlAfter: '.html'
        }
    }
}

myModule.getNeedHtml =(htmlStr,headStr,footStr) => {
    return myModule.removeFoot(myModule.removeHead(htmlStr,headStr),footStr);
}
//移除html中前面不需要的部分
myModule.removeHead = (htmlStr,str) => {
    return htmlStr.split(str)[1];
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



module.exports =  myModule;
