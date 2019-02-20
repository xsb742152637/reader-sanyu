/*
 * description: 书架tab
 * author: 神编小码
 * time: 2018年04月04日17:08:01
 */

import React, { Component } from 'react'
import {
    StyleSheet,
    StatusBar,
    ListView,
    RefreshControl,
    TouchableOpacity,
    View,
    ScrollView,
    Image,
    Text,
    Modal,
    InteractionManager,
    AppState,
    Linking,
    NativeModules
} from 'react-native'

import ReadPlatform from '../readPlatform'
import BookDetail from '../bookDetail'
import config from '../../common/config'
import api from '../../common/api'
import Dimen from '../../utils/dimensionsUtil'
import {dateFormat,dateFormat2} from '../../utils/formatUtil'
import Toast from '../../weight/toast'
import CommonText from '../../weight/commonText'
import request from '../../utils/httpUtil'
import Icon from 'react-native-vector-icons/Ionicons'
const TimerMixin = require('react-timer-mixin');
import Search from '../search'
import MsgBox from '../msgBox'
import HtmlAnalysis from '../source/htmlAnalysis'

var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

var last_time = new Date().getTime()

export default class Bookshelves extends Component {

    constructor(props) {
        super(props)
        this.state = {
            bookshelves: [],
            datasource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
            toShow: false,
            focusBook: null,
            isRefreshing: false,
            isLoadEnd: true,//是否加载结束
            appState: AppState.currentState,
            downloadDlg: false
        }
        this.timer = null;
        this.readerVersion = '20190213'//最新版本
        this.downloadVersion = ''//下载版本
        this.downloadUrl = ''//下载地址
        this.downloadRequired = false//是否强制更新，强制更新的话不能取消提示框
        this.adVersion = 1
        this.showAlert = false//是否显示调试信息
        this.messageText = "所有小说均来自第三方网站，本阅读器仅提供转码。\n阅读过程可使用 “换源” 按钮，来查找和阅读第三方网站提供的最新小说内容。";//
        this.isVaild = true;
        this.showBannerAD = true;//是否显示插屏广告
    }

    componentDidMount() {
        this.setState({isLoadEnd: false})
        InteractionManager.runAfterInteractions(()=> {
            console.log("componentDidMount");
            // alert("发起请求")
            //更新提示
            request.get('http://www.sanyureader.cn/app/latest.json', null, (data) => {
                console.log("componentDidMount, this.readerVersion", this.readerVersion)
                if(data.showBannerAD != undefined && data.showBannerAD != null){
                    this.showBannerAD = data.showBannerAD;
                }
                this.downloadUrl = data.downloadUrl;
                this.downloadRequired = data.required;
                this.downloadVersion = data.latest;
                console.log("componentDidMount, this.downloadVersion", this.downloadVersion)
                if (this.downloadVersion > this.readerVersion) {
                    this.setState({downloadDlg: true})
                }

                try{
                    this.isVaild = this._check_isValid(data.uniqueID)
                    // this.isVaild = false
                }catch (e){
                }
            }, (error) => {

            })
            this._setDefaultBooks();
            this._getBookshelves();
            this._onRefresh();
        });

        AppState.addEventListener('change', this._handleAppStateChange.bind(this));
    }

    componentWillUnmount() {
        AppState.removeEventListener('change', this._handleAppStateChange(this));
        this.timer && clearTimeout(this.timer);
    }

    componentWillReceiveProps() {
        // console.log("componentWillReceiveProps")
        // this._onRefresh()
        // this.timer = setTimeout(() => {
        //     console.log('componentDidMount timer')
        //     this._getBookshelves()
        //     //NativeModules.RNAdModule.showAd('com.axiamireader.BannerActivity')
        // }, 2000)
    }

    //验证
    _check_isValid(uniqueID){
        let isValid = false;
        if(uniqueID != undefined && uniqueID != null && uniqueID != ""){
            var thisDate = dateFormat2();//今天的年月日
            // var thisDate = "20190228";//今天的年月日
            let u = uniqueID.split("-");
            //长度为5，不能多或少，第三段必须为0xx0
            if(u.length == 5 && u[2] == "0xx0"){
                //第一段：头加尾+0
                let u1 = u[0];
                u1 = (parseInt(u1.substring(0,1)) + parseInt(u1.substring(3)))+"0";

                //第二段：四位相加
                let u2 = u[1];
                u2 = parseInt(u2.substring(0,1)) + parseInt(u2.substring(1,2)) + parseInt(u2.substring(2,3)) + parseInt(u2.substring(3));

                //第四段
                let u4 = u[3];
                u4 = "0" + (parseInt(u4.substring(1,2)) - parseInt(u4.substring(2,3)));

                //第五段：第一位/第二位*第三位-第四位
                let u5 = u[4];
                u5 = parseInt(u5.substring(0,1)) / parseInt(u5.substring(1,2)) * parseInt(u5.substring(2,3)) - parseInt(u5.substring(3));

                let uu = u1 + "" + u2 + "" + u4 + "" + u5;
                // alert(u1 + "+" + u2 + "+" + u4 + "+" + u5)
                //年，不能超过2029年。年的前两位数字不能超过20，年的后两位不能超过29.既：年分不能超过2029年
                //月，不能超过10
                //日，不能超过20
                //日期不能小于2019年1月1日
                if(u1 == "20" && u2 <= 29 && u4 < 10 && u5 < 20 && parseInt(uu) > parseInt(thisDate) && parseInt(uu) > 20190101){
                    isValid = true;
                }
            }
        }
        return isValid;
    }

    _handleAppStateChange(nextAppState) {
        console.log(nextAppState);
        try {
            let current_time = new Date().getTime()
            if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
                console.log('App has come to the foreground!')
                if (current_time - last_time > 30000) {
                    NativeModules.RNAdModule.showAd('com.axiamireader.SplashActivity')
                    this._onRefresh()
                }
                last_time = current_time
            }
            this.setState({appState: nextAppState});
        } catch (ex) {
            console.log(ex);
        }
    }

    _getBookshelves() {
        console.log('_getBookshelves start')
        var booklist = realm.objects('HistoryBook').filtered('isToShow = 1').sorted('sortNum', true);
        this.setState({
            bookshelves: booklist,
            datasource: ds.cloneWithRows(booklist),
            isLoadEnd:true
        })
        console.log('_getBookshelves end')
    }

    _setDefaultBooks() {
        console.log('_setDefaultBooks')
        var configs = realm.objects('ReaderConfig')
        if (configs.length > 0) {
            return
        }

        this._setDefaultBook({
            bookId: '5ab9d8f4ce88777b51df45c2',
            bookName: '时光和你都很美',
            author: '叶非夜',
            bookUrl: '/agent/http%3A%2F%2Fimg.1391.com%2Fapi%2Fv1%2Fbookcenter%2Fcover%2F1%2F2259361%2F2259361_0ad97e42d80748d18bf52717d76f8a7d.jpg%2F',
            lastChapterTitle: ''
        })

        this._setDefaultBook({
            bookId: '5a814ea71de990532e1461f9',
            bookName: '国民男神是女生：恶魔，住隔壁',
            author: '战七少',
            bookUrl: '/agent/http%3A%2F%2Fimg.1391.com%2Fapi%2Fv1%2Fbookcenter%2Fcover%2F1%2F2226274%2F2226274_d2842585f49c417b844fe365dd7011c8.jpg%2F',
            lastChapterTitle: ''
        })

        this._setDefaultBook({
            bookId: '58f6cf5e071d24c05e88bc14',
            bookName: '毒妃在上，邪王在下',
            author: '穆丹枫',
            bookUrl: '/agent/http%3A%2F%2Fimg.1391.com%2Fapi%2Fv1%2Fbookcenter%2Fcover%2F1%2F1505754%2F1505754_81b22622819e476fb78b2d760f94b617.jpg%2F',
            lastChapterTitle: ''
        })

        this._setDefaultBook({
            bookId: '5948c17d031fdaa005680400',
            bookName: '牧神记',
            author: '宅猪',
            bookUrl: '/agent/http%3A%2F%2Fimg.1391.com%2Fapi%2Fv1%2Fbookcenter%2Fcover%2F1%2F2044498%2F2044498_b1e079fc34864ade953606f4a3ad8c68.jpg%2F',
            lastChapterTitle: ''
        })

        this._setDefaultBook({
            bookId: '5ab0c808e02fb07a94479321',
            bookName: '我的时空旅舍',
            author: '金色茉莉花',
            bookUrl: '/agent/http%3A%2F%2Fimg.1391.com%2Fapi%2Fv1%2Fbookcenter%2Fcover%2F1%2F2253541%2F2253541_1c6f6c39b1d9444b99e7c001331036bf.jpg%2F',
            lastChapterTitle: ''
        })

        this._setDefaultBook({
            bookId: '5816b415b06d1d32157790b1',
            bookName: '圣墟',
            author: '辰东',
            bookUrl: '/agent/http%3A%2F%2Fimg.1391.com%2Fapi%2Fv1%2Fbookcenter%2Fcover%2F1%2F1228859%2F1228859_d14f18e849b34420904ead54936e440a.jpg%2F',
            lastChapterTitle: '第1203章 肯定被绿了'
        })
    }

    _setDefaultBook(bookDetail) {
        var book = realm.objectForPrimaryKey('HistoryBook', bookDetail.bookId)
        if (book) {
            return
        }

        realm.write(() => {
            realm.create('HistoryBook', {
                bookId: bookDetail.bookId,
                bookName: bookDetail.bookName,
                author: bookDetail.author,
                bookUrl: bookDetail.bookUrl,
                bookUrlNew: bookDetail.bookUrl,
                lastChapterTitle: bookDetail.lastChapterTitle,
                historyChapterNum: 0,
                historyChapterPage: 0,
                isToShow: 1,
                hasNewChapter: 1,
                lastChapterTime: '',
                saveTime: new Date(),
                sortNum: 0
            })
        })
    }

    //对缓存章节的调试
    _getErrorChapter(bookId,bookName,key){
        if(key == ""){
            key = HtmlAnalysis.mainKey;
        }
        let aaa = []
        realm.write(() => {
            let allBooks = realm.objects('BookChapterList').filtered('bookName = "'+bookName+'"').sorted('orderNum');
            // if(bookName == "牧神记"){

                // realm.delete(allBooks[allBooks.length - 1]);
                // alert("aa:"+allBooks.length)
            //     realm.create('HistoryBook', {
            //         bookId: bookId,
            //         isToShow: 1,
            //         lastChapterTitle: "测试",
            //         hasNewChapter: 1,
            //         saveTime: new Date()
            //     }, true)
            // }
            let thisBookChapterList = new Array();
            let otherBookChapterList = new Array();
            for(let j = 0 ; j < allBooks.length ; j++){
                if(allBooks[j].listKey.split("_")[0] == key){
                    thisBookChapterList.push(allBooks[j]);
                }else{
                    otherBookChapterList.push(allBooks[j]);
                }
            }
            if(otherBookChapterList.length > 0){
                if(this.showAlert){
                    // alert("删除多余缓存："+otherBookChapterList.length)
                }
                realm.delete(otherBookChapterList);
            }
            let b = '';
            let beforNum = 0;
            for(let i = 0 ; i < thisBookChapterList.length ; i++){
                let a = thisBookChapterList[i];
                if(a.orderNum - 1 > beforNum){
                    b += a.orderNum+"("+a.title+")\n";
                    aaa.push(a);
                }
                beforNum = a.orderNum;

            }

            // alert(thisBookChapterList.length+"++"+thisBookChapterList[thisBookChapterList.length -1].orderNum)
            // realm.delete(aaa);
            if(aaa.length > 0){
                if(this.showAlert){
                    alert(bookName+"已修复缓存错误章节：\n"+b)
                }
                realm.delete(aaa);
            }
            // alert("成功删除BookChapterList")
        });
        if(aaa.length > 0){
            return true;
        }else{
            return false;
        }
    }
    _updateBookDetail() {
        return new Promise((resolve1,reject1) => {
            try{
                // Toast.toastLong("更新中。。。");
                var books = realm.objects('HistoryBook').sorted('sortNum');

                var ii = 0;
                var bookLen = books.length;
                for (var i = 0; i < books.length; ++i) {
                    var book = books[i];

                    // if(i == books.length -1){
                    //     // alert("asdf")
                    //     resolve1(i);
                    // }
                    this._getErrorChapter(book.bookId,book.bookName,book.sourceKey);
                    // continue;

                    new Promise((resolve,reject) => {
                        let key = book.sourceKey;
                        if(key == ""){
                            key = HtmlAnalysis.mainKey;
                        }

                        let bookChapterList = realm.objects('BookChapterList').filtered('bookName = "'+book.bookName+'"').sorted('orderNum');
                        if(bookChapterList.length < 1){
                            // alert("没缓存："+book.bookName);
                            request.get(api.BOOK_DETAIL(book.bookId), null, (data) => {
                                this._saveBookToRealm(data);
                                resolve(null);
                            }, (error) => {
                                resolve(null);
                            });

                        }else{
                            // alert("缓存："+book.bookName);
                            let thisBookChapterList = new Array();
                            for(let j = 0 ; j < bookChapterList.length ; j++){
                                if(bookChapterList[j].listKey.split("_")[0] == key){
                                    thisBookChapterList.push(bookChapterList[j]);
                                }
                            }

                            //根据目录长度计算出最大的目录页数
                            let source = HtmlAnalysis.api[key];
                            let maxPageNum = 1;//缓存目录的最大页数，向上取整
                            let c = 0;//得到无法整除的多余数量，用于后面orderNum的计算
                            if(source.chapterRowNum != -1){
                                maxPageNum = Math.ceil(thisBookChapterList.length / source.chapterRowNum);
                                c = thisBookChapterList.length % source.chapterRowNum
                            }

                            let rd = {
                                book: book,
                                key: key,
                                bookChapterList: bookChapterList,
                                thisBookChapterList: thisBookChapterList,
                                source: source,
                                c: c,
                                maxPageNum: maxPageNum
                            }
                            // alert(bookChapterList.length+"++"+thisBookChapterList.length+"++"+maxPageNum+"++"+c)
                            if(key == HtmlAnalysis.mainKey){
                                request.get(api.READ_BOOK_CHAPTER_LIST(book.bookId), null, (data) => {
                                    if (data.ok) {
                                        rd["data"] = data.mixToc.chapters;
                                        resolve(rd);
                                    } else {
                                        resolve(null);
                                    }
                                })
                            }else{
                                this._getOnePageChapter(source,book,maxPageNum,new Array()).then((data) => {
                                    rd["data"] = data;
                                    resolve(rd);
                                });
                            }
                        }

                    }).then((rd) => {
                        ii++;

                        // alert(ii+"++"+bookLen +"++"+rd)
                        if(rd == null){
                            if(ii >= bookLen){
                                resolve1(null);
                            }
                            return;
                        }
                        let data = rd.data;
                        if(data != null && data.length > 0){
                            let book1 = rd.book;
                            let key = rd.key;
                            let bookChapterList = rd.bookChapterList;
                            let thisBookChapterList = rd.thisBookChapterList;
                            let source = rd.source;
                            let c = rd.c;
                            let maxPageNum = rd.maxPageNum;

                            let newChapterList = new Array();
                            //maxPageNum == 1 ，说明目录是一次性加载的全部，
                            if(maxPageNum == 1){
                                //得到数据库中不存在的部分
                                for(let i = thisBookChapterList.length ; i < data.length ; i++){
                                    if(key == HtmlAnalysis.mainKey){
                                        data[i].num = i;
                                        data[i].bookName = data[i].title;
                                    }
                                    newChapterList.push(data[i]);
                                }
                            }else{
                                //得到数据库中不存在的部分
                                for(let i = c ; i < data.length ; i++){
                                    newChapterList.push(data[i]);
                                }
                            }

                            // alert("取值："+data.length+"++"+newChapterList.length);
                            //如果有新的目录，存入数据库
                            if(newChapterList.length > 0){
                                // alert(book1.bookName+"更新："+newChapterList.length+"\n"+newChapterList[newChapterList.length - 1].title)
                                realm.write(() => {
                                    let len = bookChapterList.length;//bookChapterList得长度会因为下面的保存成功而实时更新，所以长度必须先保存到一个变量中
                                    // alert(bookChapterList[0].orderNum +"++"+ (bookChapterList.length))
                                    let bb = bookChapterList[bookChapterList.length - 1].orderNum+"\n";
                                    for(let m = 0 ; m < newChapterList.length ; m++){
                                        let orderNum = m + len;
                                        let bc = {
                                            listId: this._getKey(source,book1)+"_"+orderNum,
                                            listKey: this._getKey(source,book1),
                                            bookName: book1.bookName,
                                            link: newChapterList[m].link,
                                            title: newChapterList[m].title,
                                            num: newChapterList[m].num,
                                            orderNum: orderNum
                                        };
                                        bb += bc.orderNum+"\n";
                                        // alert(JSON.stringify(bookChapterList[bookChapterList.length -1])+"\n\n"+JSON.stringify(bc))
                                        realm.create('BookChapterList', bc, true)
                                    }

                                    // alert(book1.bookName+"\n"+(newChapterList.length)+"\n\n"+newChapterList[newChapterList.length - 1].title)
                                    // alert(JSON.stringify(book))
                                    realm.create('HistoryBook', {
                                        bookId: book1.bookId,
                                        isToShow: 1,
                                        lastChapterTitle: newChapterList[newChapterList.length - 1].title,
                                        hasNewChapter: 1,
                                        saveTime: new Date()
                                    }, true)
                                });
                                // alert("更新："+newChapterList.length+"\n"+JSON.stringify(newChapterList));
                            }

                        }else{

                        }
                        if(ii >= bookLen){
                            // alert("a:"+ii+"++"+bookLen);
                            resolve1(null);
                        }
                    }).catch((err) => {
                        ii++;

                        if(this.showAlert){
                            alert("更新错误："+JSON.stringify(err));
                        }
                        if(ii >= bookLen){
                            resolve1(null);
                        }
                    });
                }
            }catch (e){
                if(this.showAlert){
                    alert("更新错误11");
                }
                reject1(e);
            }
        });
    }

    _saveBookToRealm(bookDetail) {
        var book = realm.objectForPrimaryKey('HistoryBook', bookDetail._id)
        realm.write(() => {
            if (book) {
                var hasNew = book.lastChapterTitle == bookDetail.lastChapter ? book.hasNewChapter : 1
                realm.create('HistoryBook', {
                    bookId: bookDetail._id,
                    isToShow: 1,
                    lastChapterTitle: bookDetail.lastChapter,
                    hasNewChapter: hasNew,
                    lastChapterTime: bookDetail.updated,
                    saveTime: new Date()
                }, true)
            }
        })
    }

    _getKey(source,book){
        return source.key+"_"+book.bookName;
    }
    _getOnePageChapter(source,book,pageNum,dataList){
        return new Promise((resolve,reject) => {
            HtmlAnalysis.getChapter(source,book,pageNum).then((data)=> {
                if(data != null && data.length > 0){
                    dataList = dataList.concat(data);
                    if(source.chapterRowNum > 0){
                        this._getOnePageChapter(source,book,(pageNum + 1),dataList).then((data1) => {
                            resolve(data1)
                        });
                    }else {
                        resolve(dataList);
                    }
                }else{
                    resolve(dataList);
                }
            }).catch((err) => {
                if(this.showAlert){
                    alert("获取目录失败：\n"+JSON.stringify(err)+"\n"+JSON.stringify(source)+"\n"+JSON.stringify(book)+"\npageNum:"+pageNum);
                }
                reject(err);
            });
        });

    }
    _onRefresh = () => {
        this._updateBookDetail().then((rd) => {
            // alert("刷新")
            this._getBookshelves();
        });

        //this.setState({
        //    isRefreshing: false
        //});
    }


    _readBook(bookId) {
        realm.write(() => {
            realm.create('HistoryBook', {
                bookId: bookId,
                hasNewChapter: 0
            }, true)
        });
        this._getBookshelves();

        if(this.isVaild){
            this.props.navigator.push({
                name: 'readPlatform',
                component: ReadPlatform,
                params: {
                    bookId: bookId,
                    showBannerAD: this.showBannerAD
                }
            })
        }
    }

    _showModal(book) {
        this.setState({
            toShow: true,
            focusBook: book
        })
    }

    _closeModal() {
        this.setState({toShow: false})
    }

    /**
     * modal置顶
     */
    _toTop() {
        let bookDetail = this.state.focusBook
        var books = realm.objects('HistoryBook').sorted('sortNum')
        realm.write(() => {
            realm.create('HistoryBook', {
                bookId: bookDetail.bookId,
                sortNum: books && books.length > 0 ? books[books.length - 1].sortNum + 1 : 0
            }, true)
        })
        this.setState({
            bookshelves: realm.objects('HistoryBook').filtered('isToShow = 1').sorted('sortNum', true),
            toShow: false
        })
    }

    /**
     * modal书籍详情
     */
    _toBookDetail() {
        let bookDetail = this.state.focusBook
        this.props.navigator.push({
            name: 'bookDetail',
            component: BookDetail,
            params: {
                bookId: bookDetail.bookId
            }
        })
        this.setState({toShow: false})
    }

    /**
     * modal移入养肥区
     */
    _toBookFatten() {
        let bookDetail = this.state.focusBook
        var books = realm.objects('HistoryBook').sorted('sortNum')
        realm.write(() => {
            realm.create('HistoryBook', {
                bookId: bookDetail.bookId,
                sortNum: books && books.length > 0 ? books[books.length - 1].sortNum + 1 : 0,
                isToShow: 2
            }, true)
        })
        this.setState({
            bookshelves: realm.objects('HistoryBook').filtered('isToShow = 1').sorted('sortNum', true),
            toShow: false
        })
    }

    /**
     * modal缓存全本
     */
    _toSaveBook() {
        Toast.toastLong('拼命开发中~~~')
        this.setState({toShow: false})
    }

    /**
     * modal删除
     */
    _toDelete() {
        let bookName = this.state.focusBook.bookName;
        console.log('_toDelete ' + bookName)
        new Promise((resolve,reject) => {
            try{
                realm.write(() => {
                    realm.delete(this.state.focusBook)
                    resolve(true);
                });
            }catch (e){
                reject(e)
            }
        }).then((data) => {
            setTimeout(()=> {
                let bookList = realm.objects('HistoryBook').filtered('isToShow = 1').sorted('sortNum', true);
                // Toast.toastLong(bookList.length+"++"+this.state.bookshelves);
                this.setState({
                    bookshelves: bookList,
                    datasource: ds.cloneWithRows(bookList),
                    toShow: false,
                    focusBook: null,
                    isLoadEnd:true
                })
            }, 200);

            // alert("删除缓存："+bookName)
            try{
                if(bookName != null && bookName != ""){
                    InteractionManager.runAfterInteractions(()=> {
                        setTimeout(()=> {
                            realm.write(() => {
                                //删除数据库中存的目录，所有源
                                let BookChapterList = realm.objects('BookChapterList').filtered('bookName = "'+bookName+'"');
                                if(BookChapterList != null && BookChapterList.length > 0){
                                    realm.delete(BookChapterList);
                                }

                                //删除数据库中存的小说内容，所有源
                                let BookChapterDetail = realm.objects('BookChapterDetail').filtered('bookName = "'+bookName+'"');
                                if(BookChapterDetail != null && BookChapterDetail.length > 0){
                                    realm.delete(BookChapterDetail);
                                }
                            });
                        }, 500);
                    });
                }
            }catch (e){
                if(this.showAlert){
                    alert("删除缓存失败："+JSON.stringify(bookDetail))
                }
            }
        })
    }

    renderBookshelves(rowData) {
        if (rowData == undefined) {
            return null
        }
        return (
            <TouchableOpacity
                activeOpacity={0.5}
                onLongPress={() => this._showModal(rowData)}
                onPress={() => this._readBook(rowData.bookId)}>
                <View style={styles.item}>
                    <Image
                        style={styles.itemImage}
                        source={rowData.bookUrl
              ? {uri: (api.IMG_BASE_URL + rowData.bookUrl)} 
              : require('../../imgs/splash.jpg')}
                    />
                    <View style={styles.itemBody}>
                        <Text style={styles.itemTitle}>{rowData.bookName}</Text>
                        <Text style={styles.itemDesc}>
                            {'阅读进度：'+(rowData.historyChapterTitle == '' ? '第 ' + (rowData.historyChapterNum + 1) + ' 章' : rowData.historyChapterTitle)}
                        </Text>
                        <Text
                            style={styles.itemDesc}>{'最近更新：' + dateFormat(rowData.lastChapterTime) + '  ' + rowData.lastChapterTitle}
                        </Text>

                    </View>
                    {rowData.hasNewChapter == 1 ?
                        <View style={{marginRight:5}}>
                            <Text/>
                            <Text/>
                            <Text/>
                            <Text/>
                            <Text/>
                            <Icon name={'ios-clock'} size={12} color={'red'}/>
                            <Text/>
                            <Text/>
                            <Text/>
                            <Text/>
                        </View>
                        :
                        <View>
                            <Text/>
                            <Text/>
                            <Text/>
                            <Text/>
                            <Text/>
                            <Text/>
                            <Text/>
                            <Text/>
                            <Text/>
                            <Text/>
                        </View>
                    }

                </View>
            </TouchableOpacity>
        )
    }

    /**
     * 跳转到搜索页面
     */
    _search() {
        this.props.navigator.push({
            name: 'search',
            component: Search
        })
    }

    render() {
        return (
            <View style={{flex: 1}}>

                <StatusBar
                    hidden={false}
                    backgroundColor={"darkgreen"}
                    translucent={true}
                    showHideTransition={'slide'}
                    barStyle={'dark-content'}
                />

                <View style={styles.header}>
                    <Text style={styles.headerLeftText}>书架</Text>

                    <TouchableOpacity style={{width: 60}}
                                      onPress={this._search.bind(this)}>
                        <Icon
                            name='ios-search'
                            style={styles.headerIcon}
                            size={25}
                            color={config.css.fontColor.white}/>
                    </TouchableOpacity>


                </View>
                <View style={styles.messageView}>
                    <Text style={styles.messageText}>{this.messageText}</Text>
                </View>
                {this.state.bookshelves && this.state.bookshelves.length > 0 ?
                    <ListView
                        enableEmptySections={true}
                        dataSource={this.state.datasource}
                        renderRow={this.renderBookshelves.bind(this)}
                        refreshControl={<RefreshControl
                    refreshing={this.state.isRefreshing}
                    onRefresh={this._onRefresh.bind(this)}
                    tintColor='red'
                    title= {this.state.isRefreshing? '刷新中....':'下拉刷新'}/>
                    }
                    />
                    :
                    <CommonText text={this.state.isLoadEnd ? '您还没有收藏过任何书籍哦~~' : '正在加载~~'}/>
                }
                {this.state.focusBook ?
                    <Modal
                        visible={this.state.toShow}
                        animationType={'none'}
                        transparent={true}>
                        <TouchableOpacity
                            style={styles.modal}
                            activeOpacity={1}
                            onPress={() => this._closeModal()}>
                            <View style={styles.innerView}>
                                <Text style={styles.modalTitle}>{this.state.focusBook.bookName}</Text>
                                <Text style={styles.modalBody} onPress={this._toTop.bind(this)}>置顶</Text>
                                <Text style={styles.modalBody} onPress={this._toDelete.bind(this)}>删除</Text>
                            </View>
                        </TouchableOpacity>
                    </Modal>
                    :
                    null
                }
                <MsgBox title="发现新版本" message="是否下载新版本？" ref="_customModal" visibility={this.state.downloadDlg}
                        onLeftPress={()=>{
                                if (!this.downloadRequired) {
                                    this.setState({downloadDlg:false})
                                }
                             }}
                        onRightPress={()=>{
                                    if (!this.downloadRequired) {
                                        this.setState({downloadDlg:false})
                                    }
                                    Linking.openURL(this.downloadUrl)
                                }
                             }/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    modal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center'
    },
    messageView: {
        backgroundColor: "#999999",
        borderBottomColor: config.css.color.line,
        borderBottomWidth: 1
    },
    messageText: {
        fontSize: 10,
        marginLeft: 14,
        color: config.css.fontColor.white

    },
    header: {
        height: config.css.headerHeight,
        backgroundColor: config.css.color.appMainColor,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomColor: config.css.color.appMainColor,
        borderBottomWidth: 1,
        paddingTop:8
    },
    headerLeftText: {
        flex: 1,
        color: config.css.fontColor.white,
        marginLeft: 14,
        fontSize: config.css.fontSize.appTitle,
        fontWeight: 'bold',
        alignItems: 'center',
        paddingTop: 15
    },
    headerIcon: {
        marginLeft: 14,
        marginRight: 14,
        paddingTop: 15
    },
    innerView: {
        backgroundColor: config.css.color.white,
        borderRadius: 4,
        marginLeft: 20,
        marginRight: 20,
        paddingBottom: 10
    },
    modalTitle: {
        fontSize: config.css.fontSize.title,
        color: config.css.fontColor.title,
        paddingLeft: 20,
        paddingTop: 20,
        paddingBottom: 10
    },
    modalBody: {
        paddingLeft: 20,
        paddingTop: 10,
        paddingBottom: 10,
        width: Dimen.window.width - 80,
        fontSize: config.css.fontSize.desc,
        color: config.css.fontColor.title,
    },
    item: {
        flexDirection: 'row',
        minHeight: 100,
        width: Dimen.window.width,
        borderBottomWidth: 1,
        borderBottomColor: config.css.color.line
    },
    itemImage: {
        marginLeft: 14,
        marginRight: 14,
        alignSelf: 'center',
        width: 60,
        height: 90
    },
    itemBody: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center'
    },
    itemTitle: {
        fontSize: config.css.fontSize.title + 2,
        color: config.css.fontColor.title,
        marginBottom: 3
    },
    itemDesc: {
        fontSize: 12,
        color: config.css.fontColor.desc,
        marginTop: 3
    }
})