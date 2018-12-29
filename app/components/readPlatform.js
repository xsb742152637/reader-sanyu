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
import {timeFormat, contentFormat} from '../utils/formatUtil'
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
            bookName: '',
            showControlStation: false,
            showSaveModal: false,
            showListModal: false,
            showSourceListModal: false,
            isLoadSourceEnd: true,//加载来源是否结束
            isLoadEnd: true,//加载目录是否结束
            bookChapter: null,

            book: null,//当前小说信息
            isMainApi: true,//当前小说的源是否为追书神器
            currentSource:null,//当前选择的源

            //换源的时候，只要还没有在新的源中点击章节开始阅读，那么信息都属于临时存放，不影响现有源
            listModalDataSource: [],
            sourceTemp:null,//临时选择的源
            bookTemp:null,//临时小说信息
            listModalDataTemp: [],//临时目录列表

            isRefreshing: false,
            chapterDetail: [],
            chapterPage: 0,      //读到某一章第几页
            chapterNum: 0,      //读到第几章
            chapterLength: 0,  //总章节数

            isFirstLoad:true,//是否为第一次加载
            firstLoadPageNum: 5,//第一次加载的目录页数
            loadIndexStart:0,//目录加载开始页
            loadIndexEnd:0,//目录加载结束页

            listModalData: [],//目录列表
            listModalOrder: 0,
            time: '',
            background: '#0000',
            fontSize: 18,
            fontColor: '#604733',
            lineHeight: 34,
            dayNight: '#000000',
            controlStationViewHeight: Dimen.window.height
        }

        this.x = 0               // 当前的偏移量
        this.catalogListView = null
        this.lock = false
        this.adVersion = 1
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

        this._initBookAndSource()
    }

    //得到当前小说信息以及选择的来源
    _initBookAndSource(){

        // try{
        //     var request = new XMLHttpRequest();
        //     // alert(typeof(Buffer))
        //     request.onreadystatechange = e => {
        //         if (request.readyState === 4 && request.status === 200) {
        //             if(request.status === 200){
        //                 var arrBuf = [];
        //                 var bufLength = 0;
        //                 var chunk = request.responseText;
        //                 // var a = new MyIconvLite();
        //                 // a.constructor
        //                 // alert(JSON.stringify(request))
        //                 // MyIconvLite.decode(,'gbk')
        //                 // arrBuf.push(chunk);
        //                 // bufLength += chunk.length;
        //                 //
        //                 // var chunkAll = Encoding.decode(chunk, 'UTF-8');
        //                 // alert(chunkAll)
        //             }
        //         }
        //     }
        //     request.open("GET", 'https://m.biqubao.com/book/18569/');
        //     request.send();
        //
        // }catch (e){
        //     alert("aaaaaaaaaaaaaaaaa\n"+JSON.stringify(e));
        // }
        let bookId = this.props.bookId;
        let book = realm.objectForPrimaryKey('HistoryBook', bookId)
        let source;
        let isMainApi = true;
        // alert("缓存信息：\n"+JSON.stringify(book));
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
        if (this.props.bookDetail) {
            this.setState({
                book:book,
                isMainApi:isMainApi,
                currentSource:source,
                bookName: this.props.bookDetail.title,
                chapterNum: book.historyChapterNum,
                chapterPage: book.historyChapterPage
            })
        } else {
            this.setState({
                book:book,
                isMainApi:isMainApi,
                currentSource:source,
                bookName: book.bookName,
                chapterNum: book.historyChapterNum,
                chapterPage: book.historyChapterPage
            })
        }
        InteractionManager.runAfterInteractions(()=> {
            let book = this.state.book;
            this._initBookChapterContent(book.bookId, book ? book.historyChapterNum : 0)
            if(!isMainApi){
                this._initBookChapter(null);
            }
        });

        realm.write(() => {
            realm.create('HistoryBook', {
                bookId: bookId,
                hasNewChapter: 0
            }, true)
        })
    }

    /**
     * 得到当前小说的章节信息
     * @param type 获取目录的方式，true：获取下一页章节，false:获取上一页章节
     * @private
     */
    _initBookChapter(type) {
        return new Promise((resolve,reject) => {
            let isLoad = true;//是否重新加载目录
            if(type == null){
                type = true;
                if(!this.state.isFirstLoad){
                    isLoad = false;
                }
            }
            // alert("isFirstLoad:"+this.state.isFirstLoad+"++isLoad:"+isLoad)
            let isTemp = true;
            let book = this.state.bookTemp;
            if(book == null){
                book = this.state.book;
                isTemp = false;
            }

            // alert("af\n"+JSON.stringify(this.state.sourceTemp))
            // alert("临时源：\n"+JSON.stringify(this.state.sourceTemp))
            let source = this.state.sourceTemp;
            if(source == null){
                source = this.state.currentSource;
            }

            let pageNum = 0;
            if(this.state.isFirstLoad){
                //根据章节得到当前目录页数，并从前3页开始加载，共加载7页
                pageNum = Math.ceil (this.state.chapterNum / source.chapterRowNum) - 2;
                if(pageNum < 1){
                    pageNum = 1;
                }
            }else if(type){
                pageNum = this.state.loadIndexEnd + 1;
            }else{
                pageNum = this.state.loadIndexStart -1;
            }
            // alert("isLoad："+isLoad+"+isTemp："+isTemp);
            if(isLoad){
                let dataList = new Array();
                this._getOnePageChapter(source,book,pageNum,pageNum,dataList).then((data) => {
                    // alert(JSON.stringify(data));

                    if(data != null && data.length > 0){

                    }else{
                        // alert("没有找到章节！")
                        pageNum = -1;//没有后续章节了，所以设置为-1
                    }

                    // alert(this.state.listModalData.length + "++" + data.length);
                    //新获取的章节与现有章节的位置问题
                    let listData = []
                    if(isTemp){
                        listData = this.state.listModalDataTemp;
                    }else{
                        listData = this.state.listModalData;
                    }
                    let new_type = type;
                    if(this.state.listModalOrder == 1){
                        new_type = !new_type;
                        data = data.reverse();
                    }
                    if(new_type){
                        data = listData.concat(data);
                    }else{
                        data = data.concat(listData);
                    }
                    this.setState({
                        isLoadEnd: true,
                        listModalData: isTemp ? this.state.listModalData : data,
                        listModalDataTemp: isTemp ? data : [],
                        loadIndexStart: type && !this.state.isFirstLoad ? this.state.loadIndexStart : pageNum,
                        loadIndexEnd: type ? (this.state.isFirstLoad ? (pageNum + this.state.firstLoadPageNum) : pageNum) : this.state.loadIndexEnd,
                        isFirstLoad: false
                    });


                    resolve(data);
                }).catch((err) => {
                    alert("asdf:\n"+JSON.stringify(err))
                    reject(err);
                });
            }else{
                alert("再次进入，不重新加载。。")
                resolve(null);
            }
        });
    }

    _initBookChapterContent(bookId, num) {
        new Promise((resolve, reject)=> {
            request.get(api.READ_BOOK_CHAPTER_LIST(bookId), null,
                (data) => {
                    if (data.ok) {
                        // alert(JSON.stringify(data));
                        let bookChapter = data.mixToc
                        this.setState({
                            bookChapter: bookChapter,
                            chapterLength: bookChapter.chapters.length,
                            time: timeFormat()
                            // listModalData: bookChapter.chapters.slice(0)
                        })
                        resolve(bookChapter)
                    } else {
                        Toast.toastShort('获取章节失败~~')
                        this.setState({bookChapter: null})
                        reject()
                    }
                },
                (error) => {
                    Toast.toastShort('加载失败,请重试')
                    this.setState({bookChapter: null})
                    reject()
                })
        }).then((bookChapter)=> {
            this._appendChapter(num - 1).then((data)=> {
                this._appendChapter(num).then((data1)=> {
                    setTimeout(()=> {
                        this._scrollToIndex(data.length + this.state.chapterPage)
                    }, 100)
                })
            })
        })
    }


    //得到没章页数
    _getBookChapterDetailSync(bookChapter, chapterNum) {
        let q = new Promise((resolve, reject)=> {
            let tempUrl = bookChapter.chapters[chapterNum].link.replace(/\//g, '%2F').replace('?', '%3F')
            request.get(api.READ_BOOK_CHAPTER_DETAIL(tempUrl), null,
                (data) => {
                    if (data.ok) {
                        resolve(data)
                    } else {
                        Toast.toastLong('更新章节失败~~检查网络后左右滑动屏幕重试~~')
                    }
                },
                (error) => {
                    Toast.toastLong('更新章节失败~~检查网络后左右滑动屏幕重试~~')
                })
        })
        return q
    }

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
                num: num,
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

    //上一章
    _prev_chapter() {
        if (this.state.chapterNum < 1) {
            return
        }
        this.x = 0
        this.setState({showListModal: false, showControlStation: false, chapterDetail: []})
        this._appendChapter(this.state.chapterNum - 1).then((data)=> {
            this.setState({chapterNum: this.state.chapterNum - 1, chapterPage: 0})
        })
    }

    //下一章
    _next_chapter() {
        if (this.state.chapterNum + 1 >= this.state.chapterLength) {
            return
        }
        this.setState({showListModal: false, showControlStation: false, chapterDetail: []})
        this._appendChapter(this.state.chapterNum + 1).then((data)=> {
            this.setState({chapterNum: this.state.chapterNum + 1, chapterPage: 0})
        })
    }

    _appendChapter(chapterNum) {
        console.log('_appendChapter', chapterNum)
        return new Promise((resolve, reject)=> {
            if (chapterNum < 0) {
                resolve([])
                return
            }
            // alert(chapterNum+"\n"+JSON.stringify(this.state.bookChapter));
            this._getBookChapterDetailSync(this.state.bookChapter, chapterNum).then((data)=> {
                // alert(data.chapter.body+"\n"+this.state.bookChapter.chapters[chapterNum].title);
                let tempArr = this._formatChapter(data.chapter.body, chapterNum, this.state.bookChapter.chapters[chapterNum].title)
                if (this.state.chapterDetail.length > 1) {
                    let x = this.state.chapterDetail[this.state.chapterDetail.length - 1].num
                    let y = tempArr[tempArr.length - 1].num
                    if (x == y) {
                        console.log('_appendChapter, chapter already existed', chapterNum)
                        resolve([])
                        return
                    }
                }
                this.setState({
                    chapterDetail: this.state.chapterDetail.concat(tempArr),
                    time: timeFormat()
                }, ()=> {
                    console.log('_appendChapter, page num', tempArr.length)
                    resolve(tempArr)
                })
            })
        })
    }

    _prependChapter(chapterNum) {
        console.log('_prependChapter', chapterNum)
        let q = new Promise((resolve, reject)=> {
            if (chapterNum < 0) {
                resolve([])
                return
            }
            this._getBookChapterDetailSync(this.state.bookChapter, chapterNum).then((data)=> {
                let tempArr = this._formatChapter(data.chapter.body, chapterNum, this.state.bookChapter.chapters[chapterNum].title)
                if (this.state.chapterDetail.length > 1) {
                    let x = this.state.chapterDetail[0].num
                    let y = tempArr[0].num
                    if (x == y) {
                        console.log('_prependChapter, chapter already existed', chapterNum)
                        resolve([])
                        return
                    }
                }
                this.setState({
                    chapterDetail: tempArr.concat(this.state.chapterDetail),
                    time: timeFormat()
                }, ()=> {
                    console.log('_prependChapter, page num', tempArr.length)
                    resolve(tempArr)
                })
            })
        })
        return q
    }

    _onScrollBeginDrag(e) {
        console.log('_onScrollBeginDrag, x', e.nativeEvent.contentOffset.x)
        //if (this.x == e.nativeEvent.contentOffset.x && this.x === 0) {
        //    if (this.state.chapterNum < 1) {
        //        return
        //    }
        //    this.x = 0
        //    this.setState({chapterDetail: []})
        //    this._appendChapter(this.state.chapterNum - 1).then((data)=> {
        //        let scrollView = this.refs.scrollView
        //        scrollView.scrollToEnd({animated: false})
        //    })
        //}
    }

    _onMomentumScrollEnd(e) {
        console.log('_onMomentumScrollEnd, x', e.nativeEvent.contentOffset.x)
    }

    _handleScroll(e) {

        let ori_right = e.nativeEvent.contentOffset.x > this.x
        this.x = e.nativeEvent.contentOffset.x
        if (this.x % Dimen.window.width > 0) {
            return
        }

        let scrollIndex = this.x / Dimen.window.width
        let scrollCount = this.state.chapterDetail.length

        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>handleScroll, scrollIndex', scrollIndex)
        let chapterNum = this.state.chapterDetail[scrollIndex].num
        let chapterPage = this.state.chapterDetail[scrollIndex].page
        let totalPage = this.state.chapterDetail[scrollIndex].totalPage

        console.log('handleScroll, chapterNum, chapterPage, totalPage', chapterNum, chapterPage, totalPage)

        try {
            if ((this.state.chapterNum + 1) % 3 == 0 && chapterPage + 1 == totalPage) {
                NativeModules.RNAdModule.showAd('banner_ad')
            }
        } catch (e) {

        }

        // 章节发生变化
        if (chapterNum != this.state.chapterNum || chapterPage != this.state.chapterPage) {
            this.setState({
                chapterNum: chapterNum,
                chapterPage: chapterPage
            })
            this._updateHistoryBookChapter(this.props.bookId, chapterNum, chapterPage)
        }

        if (ori_right) {
            if (scrollIndex + 6 > scrollCount) {
                let tmp = this.state.chapterDetail[this.state.chapterDetail.length - 1].num + 1

                setTimeout(()=> {
                    this._appendChapter(tmp)
                }, 100)

            }
        } else {
            if (scrollIndex < 5) {
                let tmp = this.state.chapterDetail[0].num - 1

                this._prependChapter(tmp).then((data)=> {
                    setTimeout(()=> {
                        this._scrollToIndex(data.length + scrollIndex)
                    }, 100)
                })
            }
        }
    }

    /**
     * 退回
     * @param type true:退回一步，false:直接退回到阅读界面
     * @private
     */
    _back(type = true) {
        // alert("type:"+type);
        //隐藏目录列表
        if (this.state.showListModal) {
            this.setState({
                showListModal: false,
                isLoadEnd : true,
                showControlStation: false
            });
            if(type)
                return
        }

        //隐藏换源列表
        if (this.state.showSourceListModal) {
            this.setState({
                sourceTemp:null,//临时选择的源
                bookTemp:null,//临时小说信息
                listModalDataTemp: [],//临时目录列表
                showSourceListModal: false,
                isLoadSourceEnd: true,
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

    _addFontSize() {
        let config = realm.objects('ReaderConfig')
        if (config) {
            let new_font = this.state.fontSize + 2
            realm.write(() => {
                realm.create('ReaderConfig', {configId: '0', fontSize: new_font}, true);
            })
            this.setState({
                fontSize: new_font,
                showListModal: false,
                showControlStation: false,
                chapterDetail: []
            })
            this._appendChapter(this.state.chapterNum).then((data)=> {
                this._scrollToIndex(this.state.chapterPage)
            })
        } else {
        }
    }

    _downFontSize() {
        let config = realm.objects('ReaderConfig')
        if (config) {
            let new_font = this.state.fontSize - 2
            if (new_font < 8) {
                new_font = 8
            }
            realm.write(() => {
                realm.create('ReaderConfig', {configId: '0', fontSize: new_font}, true);
            })

            this.setState({
                fontSize: new_font,
                showListModal: false,
                showControlStation: false,
                chapterDetail: []
            })
            this._appendChapter(this.state.chapterNum).then((data)=> {
                this._scrollToIndex(this.state.chapterPage)
            })
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

    _closeModal() {
        this.setState({showSaveModal: false})
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
                bookId: this.state.bookChapter.book
            }
        })
    }

    //显示来源列表
    _showSourceListModal() {
        this.setState({
            listModalDataSource: [],
            sourceTemp:null,//临时选择的源
            bookTemp:null,//临时小说信息
            listModalDataTemp: [],//临时目录列表
            showListModal: false,
            showControlStation: false,
            isLoadSourceEnd: false,
            showSourceListModal: true
        });
        var li = new Array();
        var i = 0;
        var apiLen = 0;
        let bookName = this.state.bookName;
        for(let key in HtmlAnalysis.api){
            apiLen++;
        }
        new Promise((resolve,reject) => {
            for(let key in HtmlAnalysis.api){
                HtmlAnalysis.searchBook(this.props.bookId,bookName,key).then((data)=> {
                            // alert("aafff"+JSON.stringify(data))
                    if(data != undefined && data != null){
                        if(data.isMainApi){

                            data.lastChapterTitle = this.state.bookChapter.chapters[this.state.bookChapter.chapters.length-1].title
                        }
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
            // alert(JSON.stringify(data));
            this.setState({
                showListModal: false,
                showControlStation: false,
                isLoadSourceEnd: true,
                showSourceListModal: true,
                listModalDataSource: data
            });
        }).catch((err) => {
            this.setState({
                showListModal: false,
                showControlStation: false,
                isLoadSourceEnd: true,
                showSourceListModal: true,
                listModalDataSource: []
            });
            alert("出错了："+JSON.stringify(err));
        });

    }

    _getOnePageChapter(source,book,startPageNum,pageNum,dataList){
        // alert(pageNum+"++"+dataList.length);

        return new Promise((resolve,reject) => {
            HtmlAnalysis.getChapter(source,book,pageNum).then((data)=> {
                let loadPageNum = pageNum - startPageNum;
                dataList = dataList.concat(data);
                if(this.state.isFirstLoad && data != null && data.length > 0 && loadPageNum < this.state.firstLoadPageNum){
                    // alert("结果："+dataList.length);
                    this._getOnePageChapter(source,book,startPageNum,++pageNum,dataList).then((data) => {
                        resolve(data)
                    });
                }else{
                    // alert("没有了");
                    resolve(dataList);
                }
            }).catch((err) => {
                alert("_getOnePageChapter\n"+JSON.stringify(err));
                reject(err);
            });
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

        // alert("ffff\n"+JSON.stringify(book))
        this.setState({
            showListModal: true,
            isLoadEnd: false,
            listModalDataTemp: [],
            isFirstLoad: true,
            listModalOrder: 0,
            bookTemp: book,
            sourceTemp: source
        });

        InteractionManager.runAfterInteractions(()=> {
            if((book == null && this.state.isMainApi) || (book != null && book.sourceKey == HtmlAnalysis.mainKey)){
                // alert("加载原始目录");
                // alert(JSON.stringify(this.state.bookChapter.chapters))
                this.setState({
                    isLoadEnd: true,
                    listModalDataTemp: this.state.bookChapter.chapters
                });

                //列表导航到当前章节
                setTimeout(()=> {
                    if (this.catalogListView) {
                        this.catalogListView.scrollToIndex({index: this.state.chapterNum, viewPosition: 0, animated: true})
                    }
                }, 50)
            }else{
                // alert("isFirstLoad:"+this.state.isFirstLoad)
                this._initBookChapter(null).then((d) => {
                    // alert("临时目录："+this.state.listModalDataTemp.length+"\n主目录："+this.state.listModalData.length)
                    let data = this.state.listModalDataTemp;
                    if(data == null || data.length < 1){
                        data = this.state.listModalData;
                    }
                    let newNum = 0;//由于只加载部分目录，所以需要计算当前目录所在位置
                    for(let i in data){
                        let d = data[i];
                        if(d.num == this.state.chapterNum){
                            newNum = i;
                            break;
                        }
                    }
                    // alert(newNum+"++++"+this.state.chapterNum+"\n"+JSON.stringify(data));

                    //列表导航到当前章节
                    setTimeout(()=> {
                        if (this.catalogListView) {
                            this.catalogListView.scrollToIndex({index: newNum, viewPosition: 0, animated: true})
                        }
                    }, 100)
                }).catch((err) => {
                    alert("aaa\n"+JSON.stringify(err))
                });
            }
        });
    }

    //目录排序
    _sortListModal() {
        if (this.catalogListView) {
            var d1 = this.state.listModalData;
            var d2 = this.state.listModalDataTemp;

            d1.reverse();
            d2.reverse();

            this.setState({
                listModalData: d1,
                listModalDataTemp: d2,
                listModalOrder: this.state.listModalOrder == 0 ? 1 : 0
            });

            setTimeout(()=> {
                if (this.catalogListView) {
                    this.catalogListView.scrollToIndex({index: 0, viewPosition: 0, animated: true})
                }
            }, 50)
        }
    }

    // _header = () => {
    //     return <Text style={[styles.txt, { backgroundColor: 'white' }]}>这是头部</Text>;
    // }
    _footer = () => {
        // alert("aasdf");
        if(this.state.loadIndexEnd == -1 || this.state.listModalOrder == 1){
            return <View style={{textAlign:'center' }}><Text style={{ backgroundColor: '#ddd',color:'#C7EDCC',textAlign:'center'}}>....我的底线...</Text></View>;
        }
        return <View style={{textAlign:'center' }}><Text style={{ backgroundColor: '#ddd',color:'#fff',textAlign:'center'}}>....正在拼命加载...</Text></View>;
    }

    //刷新
    /**
     *
     * @param type false:上拉，true:下拉
     * @private
     */
    _onRefreshChapter(type) {
        if(!this.state.isLoadEnd){
            console.log("正在加载，别急！！！");
            return
        }

        if(this.state.listModalOrder == 1){
            type = !type;
        }
        //第一页、正序上拉、倒序下拉
        if(this.state.loadIndexStart <= 1 && !type){
            alert('已经是第一章了');
            return;
        }
        //最后一页、正序下拉、倒序上拉
        if(this.state.loadIndexEnd == -1 && type){
            alert('这已经是我的底线了，请住手！！！');
            return;
        }

        this.setState({
            isLoadEnd: false,
        });

        this._initBookChapter(type);
    }

    //选择目录中的新章节
    _clickListModalItem(item) {
        //点击章节的时候，临时选择的源变成固定源
        let source = this.state.sourceTemp;
        if(source == null){
            source = this.state.currentSource;
        }
        let book = this.state.bookTemp;
        if(book == null){
            book = this.state.book;
        }
        let isMainApi = this.state.isMainApi;
        if(source.key == HtmlAnalysis.mainKey){
            isMainApi = true;
        }else{
            isMainApi = false;
        }
        // alert("source：\n"+JSON.stringify(source)+"book：\n"+JSON.stringify(book))
        this.setState({
            book: book,
            bookTemp: null,
            currentSource: source,
            sourceTemp: null,
            isMainApi: isMainApi,
            chapterDetail: []
        });

        // alert("isMainApi:"+isMainApi)
        console.log('_clickListModalItem');
        if(isMainApi){
            for (var i = 0; i < this.state.bookChapter.chapters.length; ++i) {
                var chapter = this.state.bookChapter.chapters[i]
                if (chapter.title == item.title) {
                    // this.setState({
                    //     // showListModal: false,
                    //     // showControlStation: false,
                    //     chapterDetail: []
                    // });
                    // alert("chapter:\n"+JSON.stringify(chapter));

                    this._appendChapter(i).then((data)=> {
                        // alert(JSON.stringify(data));
                        this.setState({
                            chapterNum: data[0].num,
                            chapterPage: 0
                        })
                        this._back(false)
                        this._updateHistoryBookChapter(this.props.bookId, data[0].num, 0)
                    })
                    break
                }
            }
        }else{
            HtmlAnalysis.getChapterDetail(source,item).then((data)=> {
                let tempArr = this._formatChapter(data, item.num, item.title)
                alert("新的小说：\n"+JSON.stringify(tempArr))
                this.setState({
                    chapterDetail: this.state.chapterDetail.concat(tempArr),
                    time: timeFormat(),
                    chapterNum: tempArr[0].num,
                    chapterPage: 0
                }, ()=> {
                    console.log('_appendChapter, page num', tempArr.length)
                })
                this._updateHistoryBookChapter(this.props.bookId, tempArr[0].num, 0)
                this._back(false)
            }).catch((err) => {
                alert("_clickListModalItem\n"+JSON.stringify(err));
            });
        }

    }

    _showControlStation(evt) {
        var pageX = evt.nativeEvent.pageX
        var pageY = evt.nativeEvent.pageY
        if (pageX > Dimen.window.width / 3 && pageX < Dimen.window.width * 2 / 3
            && pageY > Dimen.window.height / 3 && pageY < Dimen.window.height * 2 / 3) {
            this.setState({showControlStation: true})
        }
        if (pageY >= Dimen.window.height * 2 / 3) {
            let scrollView = this.refs.scrollView
            scrollView.scrollTo({x: (this.x + Dimen.window.width)})
        }

        if (pageY < Dimen.window.height / 3) {
            let scrollView = this.refs.scrollView
            scrollView.scrollTo({x: (this.x - Dimen.window.width)})
        }
    }

    //显示控制台
    _showControlStation_LR(evt) {
        console.log('_showControlStation_LR', evt.nativeEvent.pageX, evt.nativeEvent.pageY)
        var pageX = evt.nativeEvent.pageX
        var pageY = evt.nativeEvent.pageY
        if (pageX > Dimen.window.width / 3 && pageX < Dimen.window.width * 2 / 3
            && pageY > Dimen.window.height / 3 && pageY < Dimen.window.height * 2 / 3) {
            this.setState({showControlStation: true})
        }
        if (pageX >= Dimen.window.width * 2 / 3) {
            console.log('_showControlStation_LR x=', this.x)
            let scrollView = this.refs.scrollView
            scrollView.scrollTo({x: (this.x + Dimen.window.width)})
        }

        if (pageX < Dimen.window.width / 3) {
            let scrollView = this.refs.scrollView
            scrollView.scrollTo({x: (this.x - Dimen.window.width)})
        }
    }

    //更新阅读进度
    _updateHistoryBookChapter(bookId, chapterNum, chapterPage) {
        var books = realm.objects('HistoryBook').sorted('sortNum')
        var book = realm.objectForPrimaryKey('HistoryBook', bookId)
        // alert("book:\n"+JSON.stringify(this.state.book));
        if (book) {
            realm.write(() => {
                if (book.bookId === books[books.length - 1].bookId) {
                    realm.create('HistoryBook', {
                        bookId: book.bookId,
                        bookUrl: this.state.book.bookUrl,
                        historyChapterNum: chapterNum,
                        historyChapterPage: chapterPage,
                        sourceKey: this.state.currentSource.key
                    }, true)
                } else {
                    var sortNum = books[books.length - 1].sortNum + 1
                    realm.create('HistoryBook', {
                        bookId: book.bookId,
                        bookUrl: this.state.book.bookUrl,
                        sortNum: books[books.length - 1].sortNum + 1,
                        historyChapterNum: chapterNum,
                        historyChapterPage: chapterPage,
                        sourceKey: this.state.currentSource.key
                    }, true)
                }
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
                        {(rowData.num + 1) + ' / ' + this.state.chapterLength}
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

                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._addFontSize.bind(this)}>
                        <Icon
                            name='ios-arrow-dropup-circle'
                            color={'white'}
                            size={25}/>
                        <Text style={styles.controlFooterTitle}>A+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._downFontSize.bind(this)}>
                        <Icon
                            name='ios-arrow-dropdown-circle'
                            color={'white'}
                            size={25}/>
                        <Text style={styles.controlFooterTitle}>A-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._prev_chapter.bind(this)}>
                        <Icon
                            name='md-return-left'
                            //name='ios-moon'
                            color={'white'}
                            size={25}/>
                        <Text style={styles.controlFooterTitle}>上一章</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._next_chapter.bind(this)}>
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
                            this.state.currentSource == null || this.state.currentSource.key !== rowData.item.sourceKey ?
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
                    (this.state.chapterNum == rowData.item.num) || (this.state.bookChapter.chapters[this.state.chapterNum].title == rowData.item.title) ?
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
                            <CommonText text={this.state.isLoadSourceEnd ? '没有找到合适的来源~~' : '正在加载~~'}/>
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
                                <Text style={styles.listModalTitle}>{this.state.title}</Text>

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


                        {(this.state.sourceTemp == null && this.state.listModalData && this.state.listModalData.length > 0 ) || (this.state.sourceTemp != null && this.state.listModalDataTemp && this.state.listModalDataTemp.length > 0 ) ?
                            <FlatList
                                ref={(scrollView) => {this.catalogListView = scrollView}}
                                keyExtrator={"title"}
                                style={styles.innerListView}
                                getItemLayout={(data,index)=>(
                                    {length: 40, offset: 40 * index, index}
                                )}
                                data={this.state.listModalDataTemp && this.state.listModalDataTemp.length > 0 ? this.state.listModalDataTemp : this.state.listModalData}
                                renderItem={this.renderListModal.bind(this)}

                                refreshing={this.state.isRefreshing}
                                // ListHeaderComponent={this._header}
                                ListFooterComponent={this._footer.bind(this)}
                                onRefresh={this._onRefreshChapter.bind(this,false)}
                                onEndReachedThreshold={0.8}
                                onEndReached={this._onRefreshChapter.bind(this,true)}
                            />
                            :
                            <CommonText text={this.state.isLoadEnd ? '没有找到任何一章~~' : '正在加载~~'}/>
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