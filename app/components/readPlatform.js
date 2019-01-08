/*
 * description: 阅读器
 * author: 神编小码
 * time: 2018年03月20日15:50:28
 */

import React, { Component } from 'react'
import {
    View,
    StatusBar,
    Image,
    Text,
    TextInput,
    StyleSheet,
    ListView,
    TouchableOpacity,
    ScrollView,
    Modal,
    InteractionManager,
    Platform,
    BackHandler,
    FlatList,
    NativeModules
} from 'react-native'

import Icon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import CommonText from '../weight/commonText'
import BookDetail from './bookDetail'
import BookCommunity from './book/bookCommunity'
import request from '../utils/httpUtil'
import Dimen from '../utils/dimensionsUtil'
import {timeFormat, contentFormat,cloneObj,generateUUID} from '../utils/formatUtil'
import Toast from '../weight/toast'
import Loading from '../weight/loading'
import api from '../common/api'
import config from '../common/config'
import HtmlAnalysis from './source/htmlAnalysis'

var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

export default class ReadPlatform extends Component {
    constructor(props) {
        super(props)
        this.state = {
            isMainApi: true,//当前小说的源是否为追书神器
            book: null,//当前小说信息
            bookTemp: null,//临时小说信息
            bookChapter: null,//章节
            bookChapterTemp: null,//章节
            source: null,//源
            sourceTemp: null,//临时源
            chapterDetail: [],//当前阅读的小说内容

            showControlStation: false,
            showSourceListModal: false,
            showListModal: false,

            listModalDataSource: [],
            listModalData: [],//目录列表
            listModalOrder: 0,//目录排序方式，0：正序，1：倒序
            isLoadEnd: true,//是否加载结束
            isRefreshing: false,//是否刷新

            loadLen:0,
            chapterTotalPage: 0,//
            chapterPage: 0,      //读到某一章第几页
            chapterNum: 0,      //读到第几章
            chapterLength: 0,  //总章节数

            time: '',
            background: '#0000',
            fontSize: 18,
            fontColor: '#604733',
            lineHeight: 34,
            dayNight: '#000000',
            controlStationViewHeight: Dimen.window.height

        }
        this.x = 0;              // 当前的偏移量
        this.catalogListView = null;
        this.adVersion = 1;
        this.failNum = 0;//请求失败的次数
        this.failNumMax = 3;//请求失败的最大次数
    }
    componentDidMount() {
        let readerConfig = realm.objects('ReaderConfig')
        if (readerConfig[0]) {
            let rc = readerConfig[0]
            this.setState({
                background: rc.background,
                fontSize: rc.fontSize,
                lineHeight: rc.lineHeight,
                dayNight: rc.dayNight
            })
        } else {
            realm.write(() => {
                realm.create('ReaderConfig', {
                    configId: '0',
                    background: this.state.background,
                    fontSize: this.state.fontSize,
                    lineHeight: this.state.lineHeight,
                    dayNight: this.state.dayNight,
                    isFirstOpen: 0
                }, true)
            })
        }

        let bookId = this.props.bookId;
        let book = realm.objectForPrimaryKey('HistoryBook', bookId);
        let source;
        let isMainApi = true;
        if(book.sourceKey){
            for(let key in HtmlAnalysis.api){
                if(key == book.sourceKey){
                    source = HtmlAnalysis.api[key];
                    isMainApi = HtmlAnalysis.mainKey == key;
                }
            }
        }else{
            source = HtmlAnalysis.api[HtmlAnalysis.mainKey];
            isMainApi = true;
        }

        this.setState({
            isMainApi:isMainApi,
            book:book,
            source:source,
            chapterNum: book.historyChapterNum,
            chapterPage: book.historyChapterPage
        });

        // this._deleteAll();
        InteractionManager.runAfterInteractions(()=> {
            //得到章节列表
            this._getBookChapterList().then((data) => {
                this._getBookChapterDetail(null,this.state.chapterNum).then((data2)=> {
                    setTimeout(()=> {
                        this.setState({chapterTotalPage:data2.length});
                        //自动滑动到上次阅读的页数
                        this._scrollToIndex(this.state.chapterPage)

                        //加载下一章，不跳转
                        this._change_chapter(true,false)
                    }, 100)

                })
            });
        });

        realm.write(() => {
            realm.create('HistoryBook', {
                bookId: bookId,
                hasNewChapter: 0
            }, true)
        })
    }

    _deleteAll(){
        try{

            //删除目录缓存
            realm.write(() => {
                let allBooks = realm.objects('BookChapterList');
                realm.delete(allBooks);
                alert("成功删除BookChapterList")
            });

            //删除小说缓存
            realm.write(() => {
                let allBooks = realm.objects('BookChapterDetail');
                realm.delete(allBooks);
                alert("成功删除BookChapterDetailSchema")
            });

        }catch (e){
            alert("删除表失败：")
        }

    }
    //得到小说目录
    _getBookChapterList(){
        this.setState({
            isLoadEnd: false,
        });
        let isTemp = true;
        let book = this.state.bookTemp;
        if(book == null){
            book = this.state.book;
            isTemp = false;
        }
        let source = isTemp ? this.state.sourceTemp : this.state.source;
        return new Promise((resolve,reject) => {
            //得到其它源中的小说章节
            try{
                let chapterList = realm.objects('BookChapterList').filtered('listKey = "'+(this._getKey(source))+'"');

                if(chapterList == null || chapterList.length < 1){
                    //得到追书神器中的小说章节
                    if((!isTemp && this.state.isMainApi) || (isTemp && book.sourceKey == HtmlAnalysis.mainKey) ){
                        request.get(api.READ_BOOK_CHAPTER_LIST(book.bookId), null, (data) => {
                            if (data.ok) {
                                chapterList = data.mixToc.chapters;
                                for(let i = 0 ; i < chapterList.length ; i++){
                                    chapterList[i].num = i;
                                    chapterList[i].bookName = chapterList[i].title;
                                }
                                //保存目录
                                this._setBookChapterList(source,chapterList).then((data1) => {
                                    resolve(data1);
                                });
                            } else {
                                Toast.toastShort('获取章节失败~~')
                                this.setState({bookChapter: null});
                                reject()
                            }
                        }, (error) => {
                            Toast.toastShort('加载失败,请重试');
                            this.setState({bookChapter: null});
                            reject()
                        })
                    }else{
                        let pageNum = 1;
                        let dataList = new Array();
                        this._getOnePageChapter(source,book,pageNum,dataList).then((data) => {
                            //保存目录
                            this._setBookChapterList(source,data).then((data1) => {
                                resolve(data1);
                            });
                        }).catch((err) => {
                            alert("获取章节失败:\n"+JSON.stringify(err))
                            reject(err);
                        });
                    }
                }else{
                    resolve(chapterList);
                }
            }catch (e){
                alert("获取新章节失败\n:"+JSON.stringify(e));
            }


        }).then((data) => {
            this.setState({
                isLoadEnd: true,
                bookChapter: isTemp ? this.state.bookChapter : data,
                bookChapterTemp: isTemp ? data : null,
                listModalData: cloneObj(data),
                source: isTemp ? this.state.source : source,
                sourceTemp: isTemp ? source : this.state.sourceTemp,
                chapterLength: data.length,
                time: timeFormat()
            });
            return data;
        })
    }

    _getKey(source){
        return source.key+"_"+this.state.book.bookName;
    }
    //保存小说目录
    _setBookChapterList(source,data){
        return new Promise((resolve,reject) => {
            let bcL = new Array();
            try{
                realm.write(() => {
                    for(let i = 0 ; i < data.length ; i++){
                        let bc = {
                            listId: this._getKey(source)+"_"+i,
                            listKey: this._getKey(source),
                            link: data[i].link,
                            title: data[i].title,
                            num: data[i].num,
                            orderNum: i
                        };
                        bcL.push(bc);
                        realm.create('BookChapterList', bc, true)
                    }
                    resolve(bcL);
                })
            }catch (e){
                alert("保存小说目录出错：\n"+JSON.stringify(e));
                reject(e);
            }

        }).then((data) => {
            // alert("保存小说目录结束！"+data.length);
            return data;
        });
    }


    /**
     * 根据章节数得到章节内容
     * @param type null:覆盖式加载，true:加载到后面,false:加载到前面
     * @param chapterNum 章节数
     * @returns {Promise}
     * @private
     */
    _getBookChapterDetail(type,chapterNum) {
        let chapter = this.state.bookChapter[chapterNum];
        return new Promise((resolve, reject)=> {
            if (chapterNum < 0) {
                resolve([])
                return
            }

            new Promise((resolve1, reject1)=> {
                let chapterDetail = realm.objects('BookChapterDetail').filtered('listId = "'+chapter.listId+'"');
                if(chapterDetail == null || chapterDetail.length < 1 ||chapterDetail[0] == null  ||chapterDetail[0].length < 1 ){
                    if(this.state.isMainApi){
                        let tempUrl = chapter.link.replace(/\//g, '%2F').replace('?', '%3F')
                        request.get(api.READ_BOOK_CHAPTER_DETAIL(tempUrl), null, (data) => {
                            if (data.ok) {
                                this._setBookChapterDetail(chapter,data.chapter.body).then((data1) => {
                                    resolve1(data1);
                                });
                            } else {
                                Toast.toastLong('更新章节失败~~检查网络后左右滑动屏幕重试~~')
                            }
                        }, (error) => {
                            Toast.toastLong('更新章节失败~~检查网络后左右滑动屏幕重试~~')
                        })
                    }else{
                        HtmlAnalysis.getChapterDetail(this.state.source,chapter).then((data)=> {
                            this.failNum = 0;
                            this._setBookChapterDetail(chapter,data).then((data1) => {
                                resolve1(data1);
                            });
                        }).catch((err) => {
                            this.failNum += 1;
                            if(this.failNum > this.failNumMax){
                                alert("获取小说内容失败：\n"+chapterNum+"++\n"+JSON.stringify(chapter)+"++\n"+JSON.stringify(this.state.source));
                            }else{
                                alert("获取小说内容失败：第"+this.failNum+"次再次尝试获取");
                                this._getBookChapterDetail(type,chapterNum).then((data1) => {
                                    resolve1(data1);
                                });
                            }
                        });
                    }
                }else{
                    resolve1(chapterDetail[0]);
                }
            }).then((data)=> {
                let tempArr = this._formatChapter(data.content, chapterNum, chapter.title);
                this.setState({
                    chapterDetail: type == null ? tempArr : (type ? this.state.chapterDetail.concat(tempArr) : tempArr.concat(this.state.chapterDetail))
                })
                resolve(tempArr)
            })
        });
    }
    //保存小说目录
    _setBookChapterDetail(chapter,content){
        return new Promise((resolve,reject) => {
            realm.write(() => {
                let cd = {
                    bcdId: generateUUID(),
                    listId: chapter.listId,
                    content: content,
                    orderNum: chapter.orderNum
                };
                realm.create('BookChapterDetail', cd, true);
                resolve(cd);
            })
        }).then((data) => {
            // alert("保存小说内容结束！\n"+JSON.stringify(chapter));
            return data;
        });
    }


    _getOnePageChapter(source,book,pageNum,dataList){
        return new Promise((resolve,reject) => {
            HtmlAnalysis.getChapter(source,book,pageNum).then((data)=> {
                this.failNum = 0;
                if(data != null && data.length > 0){
                    dataList = dataList.concat(data);
                    this.setState({
                        loadLen: dataList.length
                    })
                    // resolve(dataList);
                    this._getOnePageChapter(source,book,(pageNum + 1),dataList).then((data1) => {
                        resolve(data1)
                    });
                }else{
                    resolve(dataList);
                }
            }).catch((err) => {
                this.failNum += 1;
                if(this.failNum > this.failNumMax){
                    alert("_getOnePageChapter方法：\n"+JSON.stringify(err));
                    reject(err);
                }else{
                    alert("获取小说目录失败：第"+this.failNum+"次再次尝试获取");
                    this._getOnePageChapter(source,book,pageNum,dataList).then((data1) => {
                        resolve(data1)
                    });
                }

            });
        });

    }

    /**
     * 加载章节
     * @param type true（下一章），false（上一章）
     * @param type2 true(要跳转到相应章节的第一页)，false（只加载章节，不跳转页面）
     * @private
     */
    _change_chapter(type,type2) {
        return new Promise((resolve,reject) => {
            if(!this.state.isLoadEnd){
                alert("正在加载");
                resolve(false);
            }else if (this.state.chapterNum < 1 && !type) {
                if(type2){
                    alert("已经是第一章了！！！");
                }
                resolve(false);
            }else if (this.state.chapterNum + 1 >= this.state.chapterLength && type) {
                if(type2){
                    alert("已经是最后一章了！！！");
                }
                resolve(false);
            }else{
                alert("开始加载")
                this.setState({
                    isLoadEnd: false
                });
                let num = this.state.chapterNum;
                if(type){
                    num += 1;
                }else{
                    num -= 1;
                }

                //chapterDetail中是否存在该章节，如果存在，直接翻到该章节的第一页
                let isHave = false;
                let totalPage = 0;
                let indexNum = 0;
                for(let i = 0 ; i <= this.state.chapterDetail.length ; i++){
                    let chapter = this.state.chapterDetail[i];
                    if(chapter == null)
                        continue;
                    if(chapter.orderNum == num){
                        indexNum = i;
                        isHave = true;
                        totalPage = chapter.totalPage;
                        break;
                    }
                }

                if(!isHave){
                    if(type2){
                        this.setState({
                            showControlStation: false,
                            chapterPage: 0
                        });
                    }

                    // alert("新加载第"+(num+1)+"章")
                    this._getBookChapterDetail(type,num).then((data)=> {
                        //要跳转
                        if(type2){
                            this.setState({
                                isLoadEnd: true
                            });
                            //下一章
                            if(type){
                                // alert("跳转到："+this.state.chapterDetail.length)
                                this._scrollToIndex(this.state.chapterDetail.length);
                            }else{
                                this._scrollToIndex(0);
                            }
                            this._updateHistoryBookChapter(this.props.bookId, num, 0);

                            alert("加载完成")
                        }else{
                            this.setState({
                                isLoadEnd: true
                            });
                            //不跳转，并且是往前加载章节，需要重新设置当前位置
                            if(!type){
                                // alert("bbb");
                                let oldIndexNum = 0;
                                let chapter = null;
                                for(let i = 0 ; i <= this.state.chapterDetail.length ; i++){
                                    chapter = this.state.chapterDetail[i];
                                    if(chapter == null)
                                        continue;
                                    if(chapter.orderNum == this.state.chapterNum){
                                        oldIndexNum = i + chapter.totalPage - 1;
                                        break;
                                    }
                                }

                                alert("加载完成")
                                this._scrollToIndex(oldIndexNum);
                            }
                        }
                        resolve(true);
                    })
                }else{
                    this.setState({
                        isLoadEnd: true,
                        showControlStation: false
                    });

                    //要跳转
                    if(type2){
                        this._scrollToIndex(indexNum);
                    }else if(!type){
                        //不跳转，并且是往前加载章节，需要重新设置当前位置
                        let oldIndexNum = 0;
                        for(let i = 0 ; i <= this.state.chapterDetail.length ; i++){
                            let chapter = this.state.chapterDetail[i];
                            if(chapter == null)
                                continue;
                            if(chapter.orderNum == this.state.chapterNum){
                                oldIndexNum = i + chapter.totalPage - 1;
                                break;
                            }
                        }
                        this._scrollToIndex(oldIndexNum);
                    }
                    alert("加载完成")
                    resolve(true);
                }
            }
        });
    }

    //格式化小说内容
    _formatChapter(content, num, title) {
        // alert("num:"+num+"\n"+"title:"+title+"\n"+"content:"+content);
        // console.log('_formatChapter:' + content)
        let _arr = []
        let _content = '\u3000\u3000' + content.replace(/\n/g, '@\u3000\u3000')
        let _arrTemp = contentFormat(_content, this.state.fontSize, this.state.lineHeight)
        let totalPage = _arrTemp.length

        _arrTemp.forEach(function (element, index) {
            let _chapterInfo = {
                title: title,
                orderNum: num,
                page: index,
                totalPage: totalPage,
                content: element
            }
            _arr.push(_chapterInfo)
        });
        return _arr
    }

    _scrollToIndex(index) {
        console.log('_scrollToIndex', index)
        let maxIndex = this.state.chapterDetail.length - 1
        if (index > maxIndex) {
            return
        }
        let scrollView = this.refs.scrollView
        scrollView.scrollTo({x: index * Dimen.window.width, y: 0, animated: false})
    }

    _onScrollBeginDrag(e) {
        console.log('_onScrollBeginDrag, x', e.nativeEvent.contentOffset.x)
    }

    _onMomentumScrollEnd(e) {
        console.log('_onMomentumScrollEnd, x', e.nativeEvent.contentOffset.x)
    }

    //得到当前页的位置数
    _getScrollIndex(){
        return this.x / Dimen.window.width;
    }

    //翻页时，手指离开屏幕时触发，还没翻到下一页
    _onScrollEndDrag(e){
        //第一页，但是不是第一章的情况
        if (this.x  == 0) {
            //加载上一章，不跳转
            this._change_chapter(false,false).then((data) => {
                if(data){
                    // this.setState({
                    //     chapterTotalPage: this.state.chapterDetail[0].totalPage
                    // });
                    // alert("往前翻一页"+(this.state.chapterDetail[0].totalPage-1))
                    //往前翻一页
                    this.x = this.state.chapterDetail[0].totalPage * Dimen.window.width
                    this._scrollToIndex(this.state.chapterDetail[0].totalPage-1)
                }
            });
        }
    }

    //翻页完成后触发事件
    _handleScroll(e) {
        try{
            let ori_right = e.nativeEvent.contentOffset.x > this.x
            this.x = e.nativeEvent.contentOffset.x
            if (this.x % Dimen.window.width > 0) {
                return
            }

            let scrollIndex = this._getScrollIndex();
            let chapterNum = this.state.chapterDetail[scrollIndex].orderNum;
            let chapterPage = this.state.chapterDetail[scrollIndex].page;
            let totalPage = this.state.chapterDetail[scrollIndex].totalPage;

            // alert("当前位置："+scrollIndex+"\n当前章节："+(chapterNum+1)+"\n当前页："+chapterPage)
            try {
                if ((this.state.chapterNum + 1) % 3 == 0 && chapterPage + 1 == totalPage) {
                    // NativeModules.RNAdModule.showAd('banner_ad')
                }
            } catch (e) {
            }

            if (chapterNum != this.state.chapterNum || chapterPage != this.state.chapterPage) {
                let isChange = false;
                if(chapterNum != this.state.chapterNum){
                    // alert(chapterNum+1+"++"+this.state.isLoadEnd)
                    isChange = true;
                }
                // alert(scrollIndex+"++"+chapterPage+"++"+totalPage+"\n"+isChange+"++"+ori_right)
                this.setState({
                    chapterTotalPage: totalPage,
                    chapterNum: chapterNum,
                    chapterPage: chapterPage
                },(data) => {
                    // 章节发生变化,自动加载上下章
                    if(isChange){
                        // alert("自动加载+"+(this.state.chapterNum+1))
                        if(ori_right){
                            //加载下一章，不跳转
                            this._change_chapter(true,false)
                        }else{
                            //加载上一章，不跳转
                            this._change_chapter(false,false)
                        }
                    }
                });
                this._updateHistoryBookChapter(this.props.bookId, chapterNum, chapterPage);
            }

        }catch (e){
            alert("翻页错误：\n"+JSON.stringify(e))
        }
    }

    //屏幕点击事件
    _showControlStation_LR(evt) {
        console.log('_showControlStation_LR', evt.nativeEvent.pageX, evt.nativeEvent.pageY)
        var pageX = evt.nativeEvent.pageX;
        var pageY = evt.nativeEvent.pageY;

        if (pageX > Dimen.window.width / 3 && pageX < Dimen.window.width * 2 / 3 && pageY > Dimen.window.height / 3 && pageY < Dimen.window.height * 2 / 3) {
            //点击的屏幕中间
            this.setState({showControlStation: true})
        }else{
            if (pageX >= Dimen.window.width * 2 / 3) {
                let scrollView = this.refs.scrollView
                scrollView.scrollTo({x: (this.x + Dimen.window.width)})
            }else if (pageX < Dimen.window.width / 3) {
                let scrollView = this.refs.scrollView
                scrollView.scrollTo({x: (this.x - Dimen.window.width)})
            }
        }
    }

    //显示来源列表
    _showSourceListModal() {
        this.setState({
            listModalDataSource: [],
            isLoadEnd: false,
            showSourceListModal: true
        });
        var li = new Array();
        var i = 0;
        var apiLen = 0;
        let bookName = this.state.book.bookName;
        for(let key in HtmlAnalysis.api){
            apiLen++;
        }
        new Promise((resolve,reject) => {
            for(let key in HtmlAnalysis.api){
                HtmlAnalysis.searchBook(this.props.bookId,bookName,key).then((data)=> {
                    // alert("aafff"+JSON.stringify(data))
                    if(data != undefined && data != null){
                        li.push(data);
                    }
                    i++;
                    if(i == apiLen){
                        resolve(li);
                    }
                }).catch((err) => {
                    //这个源如果请求超时了，就直接抛弃，继续去下一个源查找
                    // alert("出错了2："+JSON.stringify(err));
                    i++;
                    if(i == apiLen){
                        resolve(li);
                    }
                });
            }
        }).then((data) => {
            this.setState({
                isLoadEnd: true,
                listModalDataSource: data
            });
        }).catch((err) => {
            this.setState({
                isLoadEnd: true,
                listModalDataSource: []
            });
            alert("出错了："+JSON.stringify(err));
        });

    }

    //显示目录列表
    _showListModal(book) {
        let source = null;
        if(book != null){
            for(let key in HtmlAnalysis.api){
                if(key == book.sourceKey){
                    source = HtmlAnalysis.api[key];
                }
            }
        }

        this.setState({
            isLoadEnd:false,
            showListModal: true,
            listModalOrder: 0,
            bookTemp: book,
            sourceTemp: source,
            listModalData: [],
            loadLen: 0
        });

        InteractionManager.runAfterInteractions(()=> {
            this._getBookChapterList().then((data) => {
                setTimeout(()=> {
                    if (this.catalogListView) {
                        this.catalogListView.scrollToIndex({index: this.state.chapterNum, viewPosition: 0, animated: true})
                    }
                }, 150)
            })
        });
    }

    //选择目录中的新章节
    _clickListModalItem(item) {
        //点击章节的时候，临时选择的源变成固定源
        let source = this.state.sourceTemp;
        if(source == null){
            source = this.state.source;
        }
        let book = this.state.bookTemp;
        if(book == null){
            book = this.state.book;
        }
        let bookChapter = this.state.bookChapterTemp;
        if(bookChapter == null){
            bookChapter = this.state.bookChapter;
        }
        let isMainApi = this.state.isMainApi;
        if(source.key == HtmlAnalysis.mainKey){
            isMainApi = true;
        }else{
            isMainApi = false;
        }
        this.setState({
            book: book,
            bookTemp: null,
            source: source,
            sourceTemp: null,
            bookChapter: bookChapter,
            bookChapterTemp: null,
            isMainApi: isMainApi,
            chapterDetail: [],
            chapterPage: 0
        });
        this.x = 0;
        this._back(false)
        InteractionManager.runAfterInteractions(()=> {
            // alert("isMainApi:"+this.state.isMainApi+"++"+isMainApi)
            console.log('_clickListModalItem');
            let num = item.orderNum;

            this._getBookChapterDetail(null,num).then((data)=> {
                this.setState({chapterNum: num})
                this._updateHistoryBookChapter(this.props.bookId, num, 0)
            })
        });

    }

    //目录排序
    _sortListModal() {
        if (this.catalogListView) {
            this.setState({
                listModalData: this.state.listModalData.reverse(),
                listModalOrder: this.state.listModalOrder == 0 ? 1 : 0
            });

            setTimeout(()=> {
                if (this.catalogListView) {
                    this.catalogListView.scrollToIndex({index: 0, viewPosition: 0, animated: true})
                }
            }, 50)
        }
    }

    //更新阅读进度
    _updateHistoryBookChapter(bookId, chapterNum, chapterPage) {
        var books = realm.objects('HistoryBook').sorted('sortNum')
        var book = realm.objectForPrimaryKey('HistoryBook', bookId)
        if (book) {
            realm.write(() => {
                if (book.bookId === books[books.length - 1].bookId) {
                    // alert("Aaa:"+this.state.source.key);
                    realm.create('HistoryBook', {
                        bookId: book.bookId,
                        bookUrlNew: this.state.book.bookUrlNew,
                        historyChapterTitle: this.state.bookChapter[chapterNum].title,
                        historyChapterNum: chapterNum,
                        historyChapterPage: chapterPage,
                        sourceKey: this.state.source.key
                    }, true)
                } else {
                    // alert("bbb:"+this.state.source.key);
                    realm.create('HistoryBook', {
                        bookId: book.bookId,
                        bookUrlNew: this.state.book.bookUrlNew,
                        sortNum: books[books.length - 1].sortNum + 1,
                        historyChapterTitle: this.state.bookChapter[chapterNum].title,
                        historyChapterNum: chapterNum,
                        historyChapterPage: chapterPage,
                        sourceKey: this.state.source.key
                    }, true)
                }
            })
        }
    }

    /**
     * 退回
     * @param type true:退回一步，false:直接退回到阅读界面
     * @private
     */
    _back(type = true) {
        //隐藏目录列表
        if (this.state.showListModal) {
            this.setState({
                showListModal: false,
                isLoadEnd : true,
                showControlStation: false
            });
            if(type || !this.state.showSourceListModal)
                return
        }

        //隐藏换源列表
        if (this.state.showSourceListModal) {
            this.setState({
                isLoadEnd: true,
                bookTemp: null,//临时小说信息
                sourceTemp: null,//临时源
                showSourceListModal: false,
                showControlStation: false
            });
            return
        }


        //隐藏控制台
        if (this.state.showControlStation) {
            this.setState({showControlStation: false});
            // return
        }

        //退出阅读
        let bookId = this.props.bookId
        let book = realm.objectForPrimaryKey('HistoryBook', bookId)
        if (book && book.isToShow !== 0) {
            this._toPop()
        } else {
            this.setState({showSaveModal: true})
        }
    }

    _toPop() {
        this.props.navigator.pop()
    }

    /**
     * 进入书籍社区
     */
    _toBookCommunity() {
        this.setState({showListModal: false, showControlStation: false})
        this.props.navigator.push({
            name: 'bookCommunity',
            component: BookCommunity,
            params: {
                bookId: this.props.bookId,
                page: 0
            }
        })
    }

    /**
     * 进入书籍详情界面
     */
    _toBookDetail() {
        this.setState({showListModal: false, showControlStation: false})
        this.props.navigator.push({
            name: 'bookDetail',
            component: BookDetail,
            params: {
                bookId: this.props.bookId
            }
        })
    }

    //调整字体大小，type:true（变大），false（变小）
    _changeFontSize(type) {
        let config = realm.objects('ReaderConfig')
        if (config) {
            let new_font = this.state.fontSize;
            if(type){
                new_font += 2;
            }else{
                new_font -= 2;
                //最小字体为8
                if (new_font < 8) {
                    new_font = 8
                }
            }
            realm.write(() => {
                realm.create('ReaderConfig', {configId: '0', fontSize: new_font}, true);
            })
            this.setState({
                fontSize: new_font,
                showControlStation: false,
                chapterDetail: []
            })
            this._getBookChapterDetail(null,this.state.chapterNum).then((data2)=> {
                setTimeout(()=> {
                    this.setState({chapterTotalPage:data2.length});
                    //自动滑动到上次阅读的页数
                    this._scrollToIndex(this.state.chapterPage);

                    //加载下一章，不跳转
                    this._change_chapter(true,false)
                }, 100)

            });
        } else {
        }
    }

    //夜间模式
    _dayNight(color) {
        var new_daynight = '#ffffff'
        var color_table = {
            '#0000': '#000000',
            '#C7EDCC': '#000000',
            '#14446A': '#FFFFFF',
            '#B3A896': '#000000',
            '#8A977B': '#000000',
            '#6E7049': '#FFFFFF',
            '#26BCD5': '#000000',
            '#E3E65F': '#000000',
            '#E5BE9D': '#000000',
            '#1d1d1d': '#666666'
        }

        if (color == '#0000' && this.state.dayNight == '#000000') {
            color = '#1d1d1d'
        }

        for (var key in color_table) {
            if (color == key) {
                new_daynight = color_table[key]
            }
        }
        console.log('_dayNight: color=' + color)
        console.log('_dayNight: new_daynightt=' + new_daynight)

        this.setState({background: color, dayNight: new_daynight})

        let readerConfig = realm.objects('ReaderConfig')
        var book = readerConfig[0]
        if (book) {
            realm.write(() => {
                realm.create('ReaderConfig', {
                    configId: '0',
                    background: color,
                    dayNight: new_daynight,
                    fontSize: 18,
                    lineHeight: 34
                }, true)
            })

        } else {
            realm.write(() => {
                realm.create('ReaderConfig', {
                    configId: '0',
                    background: new_background,
                    dayNight: new_daynight,
                    fontSize: 18,
                    lineHeight: 34
                })
            })
        }
    }

    //章节明细，每一章分为多页显示
    renderListView() {
        return (
            <ListView
                enableEmptySections
                horizontal={true}
                pagingEnabled={true}
                initialListSize={100}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={false}
                dataSource={ds.cloneWithRows(this.state.chapterDetail)}
                renderRow={this.renderRow.bind(this)}/>
        )
    }

    //每页
    renderRow(rowData) {
        return (
            <View>
                <TouchableOpacity
                    style={{flex:1, width: Dimen.window.width}}
                    activeOpacity={1}>
                    {this.renderContent(rowData)}
                </TouchableOpacity>
            </View>
        )
    }

    //当前页正文
    renderContent(rowData) {
        return (

            <View
                style={{flex: 1, justifyContent: 'space-between', width:Dimen.window.width, height:Dimen.window.height, borderWidth: 0.1}}
                onStartShouldSetResponder={() => true}
                onResponderRelease={(evt) => {this._showControlStation_LR(evt)}}>
                <Text
                    style={{fontSize: 12, color: this.state.dayNight, marginLeft: 10,marginBottom: 5}}>
                    {rowData.title}
                </Text>
                <View style={{alignSelf: 'center', flex: 1}}>
                    {rowData.content ? rowData.content.map((value, index, chapterContent) => {
                        return (
                            <Text
                                style={{color: this.state.dayNight,fontSize: this.state.fontSize,lineHeight:this.state.lineHeight}}
                                key={index}>
                                {value ? value : ' '}
                            </Text>
                        )
                    }) : null }
                </View>
                <View style={{marginBottom: 2, flexDirection: 'row', justifyContent: 'space-around'}}>
                    <Text style={{fontSize: 12, color: this.state.dayNight}}>
                        {this.state.time}
                    </Text>
                    <Text style={{fontSize: 12, color: this.state.dayNight}}>
                        {' 第 '+(this.state.chapterPage+1)+"/"+this.state.chapterTotalPage+" 页 "}
                        {/*{this.state.pageStr+'  第 '+(rowData.num + 1) + ' / ' + this.state.chapterLength+' 章'}*/}
                    </Text>
                </View>
            </View>
        )
    }

    //控制台：点击屏幕中间显示
    renderControlStation() {
        return (
            <View
                style={{width: Dimen.window.width, flex:1, height:this.state.controlStationViewHeight}}
                onLayout={(event)=>{
                    this.setState({controlStationViewHeight:event.nativeEvent.layout.height})
                }}>
                <View
                    style={styles.control}>
                    <Icon
                        name='ios-arrow-back-outline'
                        style={{marginLeft: 14, flex: 1}}
                        size={25}
                        color={config.css.color.white}
                        onPress={this._back.bind(this)}/>
                    <Text style={styles.controlHeaderTitle} onPress={this._showSourceListModal.bind(this)}>换源</Text>
                    <Text style={styles.controlHeaderTitle} onPress={this._toBookCommunity.bind(this)}>社区</Text>
                    <Text style={styles.controlHeaderTitle} onPress={this._toBookDetail.bind(this)}>简介</Text>
                </View>

                <TouchableOpacity
                    onPress={() => {this.setState({showControlStation: false})}}
                    activeOpacity={1}
                    style={{flex: 1}}>
                    <View style={{flex: 1}}>
                        <TouchableOpacity style={{position:'absolute', justifyContent: 'center',alignItems: 'center', height:44, width:44, backgroundColor: 'rgba(0,0,0,0)',
                            bottom:30, right:10, borderRadius: 5
                        }} onPress={this._dayNight.bind(this, '#0000')}
                                          activeOpacity={0.5}>
                            <Icon
                                name='ios-eye'
                                //name='ios-moon'
                                color={'green'}
                                size={40}/>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
                <View
                    style={styles.control}>
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._showListModal.bind(this,null)}>
                        <Icon
                            name='ios-list-box'
                            color={'white'}
                            size={25}/>
                        <Text style={styles.controlFooterTitle}>目录</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._changeFontSize.bind(this,true)}>
                        <Icon
                            name='ios-arrow-dropup-circle'
                            color={'white'}
                            size={25}/>
                        <Text style={styles.controlFooterTitle}>A+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._changeFontSize.bind(this,false)}>
                        <Icon
                            name='ios-arrow-dropdown-circle'
                            color={'white'}
                            size={25}/>
                        <Text style={styles.controlFooterTitle}>A-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._change_chapter.bind(this,false,true)}>
                        <Icon
                            name='md-return-left'
                            //name='ios-moon'
                            color={'white'}
                            size={25}/>
                        <Text style={styles.controlFooterTitle}>上一章</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._change_chapter.bind(this,true,true)}>
                        <Icon
                            name='md-return-right'
                            //name='ios-moon'
                            color={'white'}
                            size={25}/>
                        <Text style={styles.controlFooterTitle}>下一章</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.control}>
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._dayNight.bind(this, "#C7EDCC")}>
                        <Icon
                            name='md-square'
                            style={[styles.controlFooterIcon]}
                            color="#C7EDCC"
                            size={40}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._dayNight.bind(this, "#14446A")}>
                        <Icon
                            name='md-square'
                            style={styles.controlFooterIcon}
                            color="#14446A"
                            size={40}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._dayNight.bind(this, "#B3A896")}>
                        <Icon
                            name='md-square'
                            style={styles.controlFooterIcon}
                            color="#B3A896"
                            size={40}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._dayNight.bind(this, "#8A977B")}>
                        <Icon
                            name='md-square'
                            color="#8A977B"
                            style={styles.controlFooterIcon}
                            size={40}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._dayNight.bind(this, "#6E7049")}>
                        <Icon
                            name='md-square'
                            color="#6E7049"
                            style={styles.controlFooterIcon}
                            size={40}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._dayNight.bind(this, "#26BCD5")}>
                        <Icon
                            name='md-square'
                            color="#26BCD5"
                            style={styles.controlFooterIcon}
                            size={40}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._dayNight.bind(this, "#E3E65F")}>
                        <Icon
                            name='md-square'
                            color="#E3E65F"
                            style={styles.controlFooterIcon}
                            size={40}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._dayNight.bind(this, "#E5BE9D")}>
                        <Icon
                            name='md-square'
                            color="#E5BE9D"
                            style={styles.controlFooterIcon}
                            size={40}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._dayNight.bind(this, "#1d1d1d")}>
                        <Icon
                            name='md-square'
                            color="#000000"
                            style={styles.controlFooterIcon}
                            size={40}/>
                    </TouchableOpacity>
                </View >
            </View>
        )
    }

    //来源列表
    renderSourceListModal(rowData) {
        return (
            <TouchableOpacity
                style={{height:60}}
                activeOpacity={1}
                onPress={() => this._showListModal(rowData.item)}>
                <View style={styles.itemSource}>
                    <View style={styles.itemSourceBodyLeft}>
                        <Text style={styles.itemSourceTitle}>{rowData.item.webName}</Text>
                        <Text style={styles.itemSourceDesc}>{rowData.item.lastChapterTitle}</Text>
                    </View>
                    <View style={styles.itemSourceBodyRight}>
                        {
                            this.state.source == null || this.state.source.key !== rowData.item.sourceKey ?
                                <Text style={styles.itemXZ}></Text>
                                :
                                <Text style={styles.itemXZ}>{'当前选择'}</Text>
                        }

                    </View>
                </View>


            </TouchableOpacity>
        )
    }

    //目录列表
    renderListModal(rowData) {
        return (
            <TouchableOpacity
                style={{height:40}}
                activeOpacity={1}
                onPress={() => this._clickListModalItem(rowData.item)}>
                {
                    this.state.chapterNum == rowData.item.orderNum ?
                        <Text
                            numberOfLines={1}
                            style={[styles.listModalText, {fontSize: config.css.fontSize.title, fontWeight: 'bold'}]}>
                            {rowData.item.title}
                        </Text>
                        :
                        <Text
                            numberOfLines={1}
                            style={[styles.listModalText, {fontSize: config.css.fontSize.title, color: config.css.fontColor.title}]}>
                            {rowData.item.title}
                        </Text>
                }
            </TouchableOpacity>
        )
    }

    render() {
        return (
            <Image style={{width: Dimen.window.width, height:Dimen.window.height, flex:1}} source={require('../imgs/read_bg.jpg')}>

                <StatusBar
                    hidden={!(this.state.showControlStation || this.state.showSourceListModal || this.state.showListModal)}
                    backgroundColor={"#333333"}
                    translucent={true}
                    showHideTransition={'slide'}
                    barStyle={'dark-content'}/>

                <View
                    style={{width: Dimen.window.width, height: Dimen.window.height, backgroundColor: this.state.background, flex:1, paddingTop:10}}>
                    {this.state.chapterDetail.length === 0 ?
                        <Loading />
                        :
                        <ScrollView
                            ref='scrollView'
                            scrollEventThrottle={200}
                            horizontal={true}
                            onScroll={this._handleScroll.bind(this)}
                            onScrollEndDrag={this._onScrollEndDrag.bind(this)}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            pagingEnabled={true}>
                            {this.renderListView()}
                        </ScrollView>
                    }
                </View>

                <Modal
                    visible={this.state.showControlStation}
                    animationType={'fade'}
                    transparent={true}
                    onRequestClose={this._back.bind(this,true)}>
                    {this.renderControlStation()}
                </Modal>

                <Modal
                    visible={this.state.showSourceListModal}
                    animationType={'slide'}
                    transparent={false}
                    onRequestClose={this._back.bind(this)}>
                    <TouchableOpacity
                        style={styles.listModal}
                        activeOpacity={1}>
                        <View>
                            <View style={styles.listModalHeader}>
                                <Icon
                                    name='ios-arrow-back-outline'
                                    style={[styles.listModalSort, {marginLeft: 14}]}
                                    size={35}
                                    color={config.css.fontColor.white}
                                    onPress={this._back.bind(this)}
                                />
                                <Text style={styles.listModalTitle}>{'选择来源'}</Text>

                            </View>
                        </View>


                        {this.state.listModalDataSource && this.state.listModalDataSource.length > 0 ?
                            <FlatList ref={(scrollView) => {this.catalogListView = scrollView}}
                                      keyExtrator={"title"}
                                      style={styles.innerListView}
                                      getItemLayout={(data,index)=>({length: 40, offset: 40 * index, index})}
                                      data={this.state.listModalDataSource}
                                      renderItem={this.renderSourceListModal.bind(this)}
                            />
                            :
                            <CommonText text={this.state.isLoadEnd ? '没有找到合适的来源~~' : '正在加载~~'}/>
                        }

                    </TouchableOpacity>
                </Modal>

                <Modal
                    visible={this.state.showListModal}
                    animationType={'slide'}
                    transparent={false}
                    onRequestClose={this._back.bind(this)}>
                    <TouchableOpacity
                        style={styles.listModal}
                        activeOpacity={1}>
                        <View>
                            <View style={styles.listModalHeader}>
                                <Icon
                                    name='ios-arrow-back-outline'
                                    style={[styles.listModalSort, {marginLeft: 14}]}
                                    size={35}
                                    color={config.css.fontColor.white}
                                    onPress={this._back.bind(this)}
                                />
                                <Text style={styles.listModalTitle}>{this.state.book == null ? '' : this.state.book.bookName}</Text>

                                <TouchableOpacity
                                    onPress={() => {this.setState({showControlStation: false})}}
                                    activeOpacity={1}
                                    style={{flex: 1}}
                                    onPress={this._sortListModal.bind(this)}>
                                    <Icon
                                        name='md-reorder'
                                        style={[styles.listModalSort, {marginLeft: 14}]}
                                        size={35}
                                        color={config.css.fontColor.white}
                                    />
                                </TouchableOpacity>

                            </View>
                        </View>


                        {this.state.listModalData && this.state.listModalData.length > 0  ?
                            <FlatList
                                ref={(scrollView) => {this.catalogListView = scrollView}}
                                keyExtrator={"title"}
                                style={styles.innerListView}
                                getItemLayout={(data,index)=>(
                                    {length: 40, offset: 40 * index, index}
                                )}
                                data={this.state.listModalData}
                                renderItem={this.renderListModal.bind(this)}

                                // refreshing={this.state.isRefreshing}
                                // ListHeaderComponent={this._header}
                                // ListFooterComponent={this._footer.bind(this)}
                                // onRefresh={this._onRefreshChapter.bind(this,false)}
                                // onEndReachedThreshold={0.8}
                                // onEndReached={this._onRefreshChapter.bind(this,true)}
                            />
                            :
                            <CommonText text={this.state.isLoadEnd ? '没有找到任何一章~~' : '正在加载'+(this.state.loadLen > 0 ? ('（'+this.state.loadLen+'）'):'')+'~~'}/>
                        }

                    </TouchableOpacity>
                </Modal>
            </Image>
        )
    }


}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    textTitle: {
        marginTop: 20,
        marginLeft: 20,
        marginRight: 20,
        fontWeight: 'bold',
        fontSize: config.css.fontSize.appTitle,
        color: config.css.fontColor.title
    },
    textBody: {
        margin: 15,
        fontSize: config.css.fontSize.title,
        color: config.css.fontColor.title,
        lineHeight: 30
    },
    ficContent: {
        color: '#604733',
        fontSize: 18,
        lineHeight: 34,
    },
    control: {
        height: 55,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: "#333333",
    },
    controlHeaderTitle: {
        marginRight: 14,
        color: config.css.fontColor.white,
        fontSize: config.css.fontSize.title
    },
    controlFooterItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    controlFooterTitle: {
        color: config.css.fontColor.white,
        fontSize: config.css.fontSize.desc
    },
    modal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        justifyContent: 'center'
    },
    innerView: {
        backgroundColor: config.css.color.white,
        borderWidth: 1,
        borderColor: config.css.color.line,
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
        fontSize: config.css.fontSize.desc,
        color: config.css.fontColor.title,
    },
    modalButton: {
        paddingLeft: 20,
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: config.css.fontSize.desc,
        color: config.css.fontColor.appMainColor,
    },
    listModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    innerListView: {
        backgroundColor: '#ffffff',
        width: Dimen.window.width,
        flex: 1
    },
    listModalHeader: {
        height: config.css.headerHeight,
        backgroundColor: config.css.color.appMainColor,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomColor: config.css.color.line,
        borderBottomWidth: 1,
    },
    listModalTitle: {
        flex: 4,
        color: config.css.fontColor.white,
        fontSize: config.css.fontSize.appTitle,
        fontWeight: 'bold',
        justifyContent: "center",
        textAlign: 'center'

    },
    listModalSort: {
        color: config.css.fontColor.desc,
    },
    listModalText: {
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 20,
        borderBottomWidth: 1,
        borderColor: config.css.color.line
    },
    itemSource: {
        flex: 1,
        alignItems: 'center',
        paddingLeft: 10,
        paddingRight: 10,
        borderBottomColor: config.css.color.line,
        borderBottomWidth: 1,
        flexDirection:'row'
    },
    itemSourceBodyLeft: {
        flex: 1,
        textAlign: 'left',
        flexDirection: 'column'
    },
    itemSourceBodyRight: {

    },
    itemSourceTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: config.css.fontColor.title,
        marginBottom: 3
    },
    itemSourceDesc: {
        fontSize: 12,
        color: config.css.fontColor.desc,
        marginTop: 3
    },
    itemXZ: {
        fontSize: 12,
        color: '#604733',
        textAlign: 'right'
    }
})

