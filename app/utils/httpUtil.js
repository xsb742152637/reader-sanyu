/*
 * description: 网络请求工具类
 * author: 神编小码
 * time: 2018年03月12日19:23:15
 */

'use strict'

import queryString from 'query-string'
import _ from 'lodash'
import Mock from 'mockjs'
import config from '../common/config'
const Buffer = require('buffer').Buffer;
const iconvLite = require('iconv-lite');

var request = {}

request.get = (url, params, successCallBack, failCallBack) => {
    if (params) {
        url += '?' + queryString.stringify(params)
    }
    console.log('httpUtil -- GET -- URL : ' + url)
    return fetch(url)
        .then((response) => response.json())
        .then((response) => {
            //console.log(response)
            successCallBack(response)
        })
        .catch((error) => {
            //console.log(error)
            failCallBack(error)
        })
}

request.post = (url, body, successCallBack, failCallBack) => {
    var options = _.extend(config.header, {
        body: JSON.stringify(body)
    })
    console.log('httpUtil -- POST -- URL : ' + url + ' -- BODY : ' + body)
    return fetch(url, options)
        .then((response) => response.json())
        .then((response) => {
            //console.log(response)
            successCallBack(response)
        })
        .catch((error) => {
            //console.log(response)
            failCallBack(error)
        })
}

/**
 *
 * @param url 请求路径
 * @param timeout 超时时间 单位是秒
 * @param isUtf8 是否为utf8编码格式，
 * @param params 请求参数
 * @param async 是否异步
 * @param successCallBack 成功回调
 * @param failCallBack 失败回调
 * @returns {Promise.<T>|*}
 */
request.ajax = (url,timeout,isUtf8, params,async, successCallBack,failCallBack) => {
    if (params) {
        url += '?' + queryString.stringify(params)
    }
    if(isUtf8 == null){
        isUtf8 = true;
    }

    if(async){
        //异步
        return new Promise(function(resolve,reject){
            var request = new XMLHttpRequest();

            if(timeout == null){
                timeout = 60 ;//默认一分钟
            }
            timeout *= 1000;
            var time = false;
            var timer = setTimeout(function(){
                time = true;
                request.abort();
            },timeout);

            if(!isUtf8){
                request.responseType = "arraybuffer";
            }
            // alert("开始")
            request.onreadystatechange = e => {
                if (request.readyState === 4) {
                    if(time){
                        // alert("超时")
                        reject("请求超时："+url);
                    }else if(request.status === 200){
                        // alert("完成")
                        //如果没有超时，手动结束计时
                        clearTimeout(timer);
                        if(!isUtf8){
                            // alert("aaa")
                            //request.response是ArrayBuffer数据，可通过下面的方式得到其中可用的Uint8Array
                            let b1 = new Uint8Array(request.response);
                            //Buffer.from(b1,'hex')是把Uint8Array转化成Buffer类型数据
                            let htmlStr = iconvLite.decode(Buffer.from(b1,'hex'), 'gbk');
                            resolve(htmlStr);
                        }else{
                            resolve(request.responseText);
                        }
                    }else if(request.status === 404 || request.status === 500 ){
                        resolve(null);
                    }
                }
            }
            request.open("GET", url);
            request.send();
        }).then((data) => {
            successCallBack(data);
        }).catch((err) => {
            failCallBack(err);
        });
    }else{
        //同步
        var request = new XMLHttpRequest();
        request.open("GET", url, async);  // 同步请求
        request.send();
        return request.responseText;
    }
};

module.exports = request;