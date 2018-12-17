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

request.ajax = (url, params, successCallBack, failCallBack) => {
    if (params) {
        url += '?' + queryString.stringify(params)
    }

    var request = new XMLHttpRequest();
    request.onreadystatechange = e => {
        if (request.readyState !== 4) {

            return failCallBack(request);
        }

        if (request.status === 200) {
            alert("aaaaa");
            return successCallBack(request.responseText)
        }
    }
    request.open("GET", url);
    request.send();
}


module.exports = request