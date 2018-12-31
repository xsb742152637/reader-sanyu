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
            isMainApi: true,//当前小说的源是否为追书神器
            book: null,//当前小说信息
            bookTemp: null,//临时小说信息
            bookChapter: null,//章节
            bookChapterTemp: null,//临时章节
            source: null,//源
            sourceTemp: null,//临时源
            chapterDetail: [],//当前阅读的小说内容

            showControlStation: false,
            showSourceListModal: false,
            showListModal: false,

            listModalDataSource: [],
            listModalData: [],//目录列表
            listModalOrder: 0,//目录排序方式，0：正序，1：倒序
            isLoadEnd: true,//是否加载结束，所以页面共用此变量
            isRefreshing: false,//是否刷新

            firstLoadPageNum: 5,//第一次加载的目录页数
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

        let bookId = this.props.bookId;
        let book = realm.objectForPrimaryKey('HistoryBook', bookId);
        let source;
        let isMainApi = true;
        // alert("缓存信息：\n"+JSON.stringify(book));
        // alert("Aaa:"+book.sourceKey);
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

        // alert(this.props.bookDetail);
        this.setState({
            isMainApi:isMainApi,
            book:book,
            source:source,
            chapterNum: book.historyChapterNum,
            chapterPage: book.historyChapterPage
        });

        InteractionManager.runAfterInteractions(()=> {
            //得到章节列表
            this._initBookChapter(null).then((data) => {
                // alert("得到章节：\n"+JSON.stringify(this.state.bookChapter));
                //得到当前阅读章节的内容
                this._appendChapter(null,this.state.chapterNum).then((data1)=> {
                    setTimeout(()=> {
                        //自动滑动到上次阅读的页数
                        this._scrollToIndex(this.state.chapterPage)
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

    /**
     * 得到当前小说的章节信息
     * @param type 获取目录的方式,null：第一次获取，true：获取下一页章节，false:获取上一页章节
     * @private
     */
    _initBookChapter(type) {
        return new Promise((resolve,reject) => {
            let isTemp = true;
            let book = this.state.bookTemp;
            if(book == null){
                book = this.state.book;
                isTemp = false;
            }

            //得到追书神器中的小说章节
            if((!isTemp && this.state.isMainApi) || (isTemp && book.sourceKey == HtmlAnalysis.mainKey) ){
                // alert("aaaaaa:  \n"+JSON.stringify(book));
                request.get(api.READ_BOOK_CHAPTER_LIST(book.bookId), null, (data) => {
                    // alert("bbbb:\n"+JSON.stringify(data))
                    if (data.ok) {
                        let bookChapter = data.mixToc.chapters;
                        for(let i = 0 ; i < bookChapter.length ; i++){
                            bookChapter[i].num = i;
                            bookChapter[i].bookName = bookChapter[i].title;
                        }
                        // alert(JSON.stringify(bookChapter));
                        this.setState({
                            bookChapter: isTemp ? this.state.bookChapter : bookChapter,
                            bookChapterTemp: isTemp ? bookChapter : null,
                            listModalData: bookChapter,
                            chapterLength: bookChapter.length,
                            isLoadEnd: true,
                            time: timeFormat()
                        })
                        resolve(bookChapter)
                    } else {
                        Toast.toastShort('获取章节失败~~')
                        this.setState({bookChapter: null})
                        reject()
                    }
                }, (error) => {
                    Toast.toastShort('加载失败,请重试')
                    this.setState({bookChapter: null})
                    reject()
                })
            }else{
                //得到其它源中的小说章节
                let source = isTemp ? this.state.sourceTemp : this.state.source;
                let pageNum = 0;
                let isLoad = true;

                if(type == null && !isTemp && this.state.bookChapter != null){
                    isLoad = false;
                }
                // alert("asdfsadf:\n"+isLoad+"++"+this.state.bookChapter)
                if(isLoad){
                    if(type == null){
                        //根据章节得到当前目录页数，并从前1页开始加载
                        pageNum = Math.ceil (this.state.chapterNum / source.chapterRowNum) - 1;
                        if(pageNum < 1){
                            pageNum = 1;
                        }
                    }else if(type){
                        // alert("得到下一页目录")
                        pageNum = source.loadIndexEnd + 1;
                    }else{
                        // alert("得到上一页目录")
                        pageNum = source.loadIndexStart -1;
                    }
                    // alert("bbbbbb:"+pageNum);

                    let dataList = new Array();
                    this._getOnePageChapter(source,book,pageNum,pageNum,dataList,type).then((data) => {
                        // alert(JSON.stringify(data));
                        // alert("aaaa");

                        if(data == null || data.length < 1){
                            // alert("没有找到章节！")
                            pageNum = -1;//没有后续章节了，所以设置为-1
                        }

                        // alert(this.state.listModalData.length + "++" + data.length);
                        //新获取的章节与现有章节的位置问题
                        let new_type = type == null ? true : type;
                        if(this.state.listModalOrder == 1){
                            new_type = !new_type;
                            data = data.reverse();
                        }
                        if(!isTemp && this.state.bookChapter != null ){
                            data = new_type ? this.state.bookChapter.concat(data) : data.concat(this.state.bookChapter);
                        }else if(isTemp && this.state.bookChapterTemp != null){
                            data = new_type ? this.state.bookChapterTemp.concat(data) : data.concat(this.state.bookChapterTemp);
                        }
                        data = data.sort(this._compare("num"));//排序
                        // alert("aa\n"+JSON.stringify(data.sort(this._compare("num"))));

                        source.loadIndexStart = type == null ? pageNum : (type ? source.loadIndexStart : pageNum);
                        source.loadIndexEnd = type == null ? (pageNum + this.state.firstLoadPageNum) : (type ? pageNum : source.loadIndexEnd);
                        // alert("源：\n"+JSON.stringify(source));
                        this.setState({
                            isLoadEnd: true,
                            bookChapter: isTemp ? this.state.bookChapter : data,
                            bookChapterTemp: isTemp ? data : null,
                            listModalData: data,
                            source: isTemp ? this.state.source : source,
                            sourceTemp: isTemp ? source : this.state.sourceTemp,
                            chapterLength: data[data.length - 1].num,
                            time: timeFormat()
                        });


                        resolve(data);
                    }).catch((err) => {
                        alert("asdf:\n"+JSON.stringify(err))
                        reject(err);
                    });
                }else{
                    // alert("再次进入，不重新加载。。\n"+JSON.stringify(this.state.bookChapter))
                    this.setState({
                        isLoadEnd: true,
                        listModalData: this.state.bookChapter,
                        time: timeFormat()
                    });
                    resolve(null);
                }


            }
        });
    }

    _compare(key){
        return function(a,b){
            return a[key] - b[key];
        }
    }

    _getOnePageChapter(source,book,startPageNum,pageNum,dataList,type){
        return new Promise((resolve,reject) => {
            HtmlAnalysis.getChapter(source,book,pageNum).then((data)=> {
                let loadPageNum = pageNum - startPageNum;
                dataList = dataList.concat(data);
                if(type == null && data != null && data.length > 0 && loadPageNum < this.state.firstLoadPageNum){
                    // alert("结果："+dataList.length);
                    this._getOnePageChapter(source,book,startPageNum,++pageNum,dataList,type).then((data) => {
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

    //上一章
    _prev_chapter() {
        if (this.state.chapterNum < 1) {
            alert("已经是第一章了！！！");
            return
        }
        // alert(this.state.chapterNum+"++"+this.state.bookChapter[0].num)
        //对于局部加载的源，提前五章开始加载上一页
        if(!this.state.isMainApi){
            if(this.state.chapterNum < this.state.bookChapter[0].num - 5){
                // this._initBookChapter(false).then((data) => {
                //     alert("先获取上一页目录");
                //     this._prev_chapter();
                // });
                return;
            }
        }
        // alert(--this.state.chapterNum)
        // alert(--this.state.chapterNum)
        this.x = 0;
        this.setState({isLoadEnd: false,showControlStation: false});

        let num = this.state.chapterNum - 1;
        this._appendChapter(null,num).then((data)=> {
            this.setState({isLoadEnd: true,chapterNum: num, chapterPage: 0});
            this._updateHistoryBookChapter(this.props.bookId, num, 0);
        })
    }

    //下一章
    _next_chapter() {
        //对于局部加载的源，提前五章开始加载上一页
        if(!this.state.isMainApi){
            if(this.state.chapterNum > this.state.bookChapter[this.state.bookChapter.length - 1].num - 5){
                this._initBookChapter(true).then((data) => {
                    alert("先获取下一页目录");
                    this._next_chapter();
                });
                return;
            }
        }
        if (this.state.chapterNum + 1 >= this.state.chapterLength) {
            return
        }

        this.setState({isLoadEnd: false,showControlStation: false});

        let num = this.state.chapterNum + 1;
        this._appendChapter(null,num).then((data)=> {
            this.setState({isLoadEnd: true,chapterNum: num, chapterPage: 0});
            this._updateHistoryBookChapter(this.props.bookId, num, 0);
        })
    }

    /**
     * 根据章节数得到章节内容
     * @param type null:覆盖式加载，true:加载到后面,false:加载到前面
     * @param chapterNum 章节数
     * @returns {Promise}
     * @private
     */
    _appendChapter(type,chapterNum) {
        return new Promise((resolve, reject)=> {
            if (chapterNum < 0) {
                resolve([])
                return
            }
            // alert(JSON.stringify(this.state.chapterDetail));
            //判断是否已经加载了该章节,？？？
            // if (this.state.chapterDetail.length > 1 ) {
            //     for(let i = 0 ; i < this.state.chapterDetail.length ; i++){
            //         if(this.state.chapterDetail[i].num == chapterNum){
            //             alert("已经加载过了")
            //             resolve([])
            //             return
            //         }
            //     }
            //
            // }
            // alert("得到章节："+chapterNum);

            this._getBookChapterDetailSync(chapterNum).then((data)=> {
                // alert("得到一章小说：\n"+JSON.stringify(data));
                let tempArr = null;
                if(this.state.isMainApi){
                    tempArr = this._formatChapter(data.chapter.body, chapterNum, this.state.bookChapter[chapterNum].title)
                }else{
                    tempArr = this._formatChapter(data.body, data.chapter.num, data.chapter.title)
                }

                this.setState({
                    chapterDetail: type == null ? tempArr : (type ? this.state.chapterDetail.concat(tempArr) : tempArr.concat(this.state.chapterDetail)),
                    time: timeFormat()
                }, ()=> {
                    console.log('_appendChapter, page num', tempArr.length)
                    resolve(tempArr)
                })
            })
        });
    }

    _getBookChapterDetailSync(chapterNum) {
        return new Promise((resolve, reject)=> {
            // alert("_getBookChapterDetailSync:"+this.state.isMainApi)
            if(this.state.isMainApi){
                let tempUrl = this.state.bookChapter[chapterNum].link.replace(/\//g, '%2F').replace('?', '%3F')
                request.get(api.READ_BOOK_CHAPTER_DETAIL(tempUrl), null, (data) => {
                    if (data.ok) {
                        resolve(data)
                    } else {
                        Toast.toastLong('更新章节失败~~检查网络后左右滑动屏幕重试~~')
                    }
                }, (error) => {
                    Toast.toastLong('更新章节失败~~检查网络后左右滑动屏幕重试~~')
                })
            }else{
                let thisCahpter = null;
                for(let i = 0 ; i < this.state.bookChapter.length ; i++){
                    if(this.state.bookChapter[i].num == chapterNum){
                        thisCahpter = this.state.bookChapter[i];
                        break;
                    }
                }
                // alert("fffff:\n"+JSON.stringify(this.state.source)+"\n"+JSON.stringify(thisCahpter))
                HtmlAnalysis.getChapterDetail(this.state.source,thisCahpter).then((data)=> {
                    let re = {
                        chapter: thisCahpter,
                        body: data
                    }
                    resolve(re);
                }).catch((err) => {
                    alert("_getBookChapterDetailSync\n"+JSON.stringify(err));
                });
            }

        })
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

    _onScrollBeginDrag(e) {
        console.log('_onScrollBeginDrag, x', e.nativeEvent.contentOffset.x)
    }

    _onMomentumScrollEnd(e) {
        console.log('_onMomentumScrollEnd, x', e.nativeEvent.contentOffset.x)
    }

    //翻页
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
            //往后翻页，倒数第六页开始加载下一章
            if (scrollIndex + 6 > scrollCount) {
                let tmp = this.state.chapterDetail[this.state.chapterDetail.length - 1].num
                setTimeout(()=> {
                    this._appendChapter(true,tmp)
                }, 100)

            }
        } else {
            //往前翻页，第五页前开始加载上一章
            if (scrollIndex < 5) {
                let tmp = this.state.chapterDetail[0].num
                this._appendChapter(false,tmp).then((data)=> {
                    setTimeout(()=> {
                        this._scrollToIndex(data.length + scrollIndex)
                    }, 100)
                })
            }
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
        // alert("bookName:"+JSON.stringify(this.state.book));
        new Promise((resolve,reject) => {
            for(let key in HtmlAnalysis.api){
                HtmlAnalysis.searchBook(this.props.bookId,bookName,key).then((data)=> {
                    // alert("aafff"+JSON.stringify(data))
                    if(data != undefined && data != null){
                        if(data.isMainApi){
                            // if(this.state.isMainApi){
                            //     data.lastChapterTitle = this.state.bookChapter[this.state.bookChapter.length-1].bookName
                            // }else{
                            //
                            // }
                            data.lastChapterTitle = "未知"
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

        // alert("ffff\n"+JSON.stringify(book))
        this.setState({
            showListModal: true,
            isLoadEnd: false,
            listModalOrder: 0,
            bookTemp: book,
            sourceTemp: source,
            listModalData: [],
            bookChapterTemp: null
        });
        let isMainApi = false;
        if((book == null && this.state.isMainApi) || (book != null && book.sourceKey == HtmlAnalysis.mainKey)){
            isMainApi = true;
        }
        InteractionManager.runAfterInteractions(()=> {
            this._initBookChapter(null).then((data) => {
                // alert("ffffffffffffffff:"+this.state.bookChapter.length);
                this.setState({
                    isLoadEnd: true
                    // listModalData: this.state.bookChapter
                });
                if(isMainApi){
                    //列表导航到当前章节

                    // alert("jjjjj\n"+JSON.stringify(this.state.listModalData))
                    setTimeout(()=> {
                        if (this.catalogListView) {
                            this.catalogListView.scrollToIndex({index: this.state.chapterNum, viewPosition: 0, animated: true})
                        }
                    }, 50)
                }else{
                    let newNum = 0;//由于只加载部分目录，所以需要计算当前目录所在位置
                    for(let i = 0 ; i < this.state.listModalData.length ; i++){
                        let d = this.state.listModalData[i];
                        if(d.num == this.state.chapterNum){
                            newNum = i;
                            break;
                        }
                    }
                    //列表导航到当前章节
                    setTimeout(()=> {
                        if (this.catalogListView) {
                            this.catalogListView.scrollToIndex({index: newNum, viewPosition: 0, animated: true})
                        }
                    }, 50)
                }
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
        // alert("bookChapter：\n"+JSON.stringify(bookChapter))
        this.setState({
            book: book,
            bookTemp: null,
            source: source,
            sourceTemp: null,
            bookChapter: bookChapter,
            bookChapterTemp: null,
            isMainApi: isMainApi,
            isLoadEnd: false,
            chapterDetail: []
        });

        this._back(false)
        InteractionManager.runAfterInteractions(()=> {
            // alert("isMainApi:"+this.state.isMainApi+"++"+isMainApi)
            console.log('_clickListModalItem');
            let num = 0;
            if(isMainApi){
                for (var i = 0; i < this.state.bookChapter.length; ++i) {
                    var chapter = this.state.bookChapter[i]
                    if (chapter.title == item.title) {
                        num = i;
                        break;
                    }
                }
            }else{
                num = item.num;
            }

            this._appendChapter(null,num).then((data)=> {
                this.setState({isLoadEnd: true,chapterNum: item.num, chapterPage: 0})
                this._updateHistoryBookChapter(this.props.bookId, item.num, 0)
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
        // alert("book:\n"+JSON.stringify(this.state.book));
        // alert("source:\n"+JSON.stringify(this.state.source));
            realm.write(() => {
                if (book.bookId === books[books.length - 1].bookId) {
                    // alert("Aaa:"+this.state.source.key);
                    realm.create('HistoryBook', {
                        bookId: book.bookId,
                        bookUrlNew: this.state.book.bookUrlNew,
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
                        historyChapterNum: chapterNum,
                        historyChapterPage: chapterPage,
                        sourceKey: this.state.source.key
                    }, true)
                }
            })
        }
    }

    // _header = () => {
    //     return <Text style={[styles.txt, { backgroundColor: 'white' }]}>这是头部</Text>;
    // }
    _footer = () => {
        if(this.state.loadIndexEnd == -1 || this.state.listModalOrder == 1){
            return <View style={{textAlign:'center' }}><Text style={{ backgroundColor: '#ddd',color:'#C7EDCC',textAlign:'center'}}>....我的底线...</Text></View>;
        }
        return <View style={{textAlign:'center' }}><Text style={{ backgroundColor: '#ddd',color:'#fff',textAlign:'center'}}>....正在拼命加载...</Text></View>;
    }

    /**
     *刷新
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
        let loadIndexStart = this.state.sourceTemp != null ? this.state.sourceTemp.loadIndexStart : this.state.source.loadIndexStart;
        //第一页、正序上拉、倒序下拉
        if(loadIndexStart <= 1 && !type){
            alert('已经是第一章了');
            return;
        }
        let loadIndexEnd = this.state.sourceTemp != null ? this.state.sourceTemp.loadIndexEnd : this.state.source.loadIndexEnd;
        //最后一页、正序下拉、倒序上拉
        if(loadIndexEnd == -1 && type){
            alert('这已经是我的底线了，请住手！！！');
            return;
        }

        this.setState({
            isLoadEnd: false,
        });

        this._initBookChapter(type);
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
            if(type || !this.state.showSourceListModal)
                return
        }

        //隐藏换源列表
        if (this.state.showSourceListModal) {
            this.setState({
                isLoadEnd: true,
                bookTemp: null,//临时小说信息
                sourceTemp: null,//临时源
                bookChapterTemp: null,//临时章节
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
                bookId: this.state.bookChapter.book
            }
        })
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
                    this.state.chapterNum == rowData.item.num ?
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
                                <Text style={styles.listModalTitle}>{this.state.bookName}</Text>

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

