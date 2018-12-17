/*
 * description: html解析
 * author: 谢
 * time: 2018年12月17日
 */

var myModule = {};
myModule.getMatchStr = (data) => {
    if (data != null && data.length > 1) {
        data = data[1];
    } else {
        data = "";
    }
    return data;
}

module.exports = myModule;
