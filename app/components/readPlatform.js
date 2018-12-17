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

import BookDetail from './bookDetail'
import SourceList from './source/sourceList'
import BookCommunity from './book/bookCommunity'
import request from '../utils/httpUtil'
import Dimen from '../utils/dimensionsUtil'
import {timeFormat, contentFormat} from '../utils/formatUtil'
import Toast from '../weight/toast'
import Loading from '../weight/loading'
import api from '../common/api'
import config from '../common/config'

var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

export default class ReadPlatform extends Component {

    constructor(props) {
        super(props)
        this.state = {
            bookName: '',
            showControlStation: false,
            showSaveModal: false,
            showListModal: false,
            bookChapter: null,
            chapterDetail: [],
            chapterPage: 0,      //读到某一章第几页
            chapterNum: 0,      //读到第几章
            chapterLength: 0,  //总章节数
            listModalDataSource: [],
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

        this._initBookChapter()
    }

    _initBookChapter() {
        console.log('_initBookChapter')
        let bookId = this.props.bookId
        let book = realm.objectForPrimaryKey('HistoryBook', bookId)
        if (this.props.bookDetail) {
            this.setState({
                bookName: this.props.bookDetail.title,
                chapterNum: book.historyChapterNum,
                chapterPage: book.historyChapterPage
            })
        } else {
            this.setState({
                bookName: book.bookName,
                chapterNum: book.historyChapterNum,
                chapterPage: book.historyChapterPage
            })
        }

        InteractionManager.runAfterInteractions(()=> {
            this._initBookChapterContent(bookId, book ? book.historyChapterNum : 0)

        })

        realm.write(() => {
            realm.create('HistoryBook', {
                bookId: bookId,
                hasNewChapter: 0
            }, true)
        })
    }

    _getBookChapterListSync(bookId) {
        let q = new Promise((resolve, reject)=> {
            request.get(api.READ_BOOK_CHAPTER_LIST(bookId), null,
                (data) => {
                    if (data.ok) {
                        let bookChapter = data.mixToc
                        this.setState({
                            bookChapter: bookChapter,
                            chapterLength: bookChapter.chapters.length,
                            time: timeFormat(),
                            listModalDataSource: bookChapter.chapters.slice(0)
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
        })
        return q
    }

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

    _initBookChapterContent(bookId, num) {
        this._getBookChapterListSync(bookId).then((bookChapter)=> {
            this._appendChapter(num - 1).then((data)=> {
                this._appendChapter(num).then((data1)=> {
                    setTimeout(()=> {
                        this._scrollToIndex(data.length + this.state.chapterPage)
                    }, 100)
                })
            })
        })
    }

    _formatChapter(content, num, title) {
        console.log('_formatChapter:' + content)
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

    _appendChapter(chapterNum) {
        console.log('_appendChapter', chapterNum)

        let q = new Promise((resolve, reject)=> {
            if (chapterNum < 0) {
                resolve([])
                return
            }
            this._getBookChapterDetailSync(this.state.bookChapter, chapterNum).then((data)=> {
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
        return q
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

    _back() {
        if (this.state.showListModal) {
            this.setState({showListModal: false})
            return
        }

        if (this.state.showControlStation) {
            this.setState({showControlStation: false})
            return
        }

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

    _next_chapter() {
        if (this.state.chapterNum + 1 >= this.state.chapterLength) {
            return
        }
        this.setState({showListModal: false, showControlStation: false, chapterDetail: []})
        this._appendChapter(this.state.chapterNum + 1).then((data)=> {
            this.setState({chapterNum: this.state.chapterNum + 1, chapterPage: 0})
        })
    }

    _closeModal() {
        this.setState({showSaveModal: false})
    }

    _toPop() {
        this.props.navigator.pop()
    }

    /**
     * 进入备用源列表
     */
    _toSourceList() {
        this.setState({showListModal: false, showControlStation: false})
        this.props.navigator.push({
            name: 'sourceList',
            component: SourceList,
            params: {
                bookName: this.state.bookName,
                chapterNum: this.state.chapterNum,
                page: 0
            }
        })
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


    _closeListModal() {
        this.setState({showListModal: false})
    }

    _clickListModalItem(title) {
        console.log('_clickListModalItem')
        for (var i = 0; i < this.state.bookChapter.chapters.length; ++i) {
            var chapter = this.state.bookChapter.chapters[i]
            if (chapter.title == title) {
                this.setState({showListModal: false, showControlStation: false, chapterDetail: []})
                this._appendChapter(i).then((data)=> {
                    this.setState({
                        chapterNum: data[0].num,
                        chapterPage: 0
                    })
                    this._updateHistoryBookChapter(this.props.bookId, data[0].num, 0)
                    this._closeListModal()
                })
                break
            }
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

    _updateHistoryBookChapter(bookId, chapterNum, chapterPage) {
        var books = realm.objects('HistoryBook').sorted('sortNum')
        var book = realm.objectForPrimaryKey('HistoryBook', bookId)
        if (book) {
            realm.write(() => {
                if (book.bookId === books[books.length - 1].bookId) {
                    realm.create('HistoryBook', {
                        bookId: book.bookId,
                        historyChapterNum: chapterNum,
                        historyChapterPage: chapterPage
                    }, true)
                } else {
                    var sortNum = books[books.length - 1].sortNum + 1
                    realm.create('HistoryBook', {
                        bookId: book.bookId,
                        sortNum: books[books.length - 1].sortNum + 1,
                        historyChapterNum: chapterNum,
                        historyChapterPage: chapterPage
                    }, true)
                }
            })
        }
    }

    _showListModal() {
        this.setState({
            showListModal: true,
            showControlStation: false,
            listModalDataSource: this.state.bookChapter.chapters,
            listModalOrder: 0
        });

        setTimeout(()=> {
            if (this.catalogListView) {
                this.catalogListView.scrollToIndex({index: this.state.chapterNum, viewPosition: 0, animated: true})
            }
        }, 50)

    }

    _sortListModal() {
        if (this.catalogListView && this.state.bookChapter) {
            //this.catalogListView.scrollTo({x:20000, y:20000});
            var cs = this.state.bookChapter.chapters.slice(0);
            if (this.state.listModalOrder == 0) {
                cs.reverse()
                this.setState({listModalDataSource: cs, listModalOrder: 1})
            } else {
                this.setState({listModalDataSource: cs, listModalOrder: 0})
            }
        }
    }

    renderListModal(rowData) {
        return (
            <TouchableOpacity
                style={{height:40}}
                activeOpacity={1}
                onPress={() => this._clickListModalItem(rowData.item.title)}>
                {
                    this.state.bookChapter.chapters[this.state.chapterNum].title !== rowData.item.title ?
                        <Text
                            numberOfLines={1}
                            style={[styles.listModalText, {fontSize: config.css.fontSize.title, color: config.css.fontColor.title}]}>
                            {rowData.item.title}
                        </Text>
                        :
                        <Text
                            numberOfLines={1}
                            style={[styles.listModalText, {fontSize: config.css.fontSize.title, fontWeight: 'bold'}]}>
                            {rowData.item.title}
                        </Text>
                }
            </TouchableOpacity>
        )
    }

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
                    <Text style={styles.controlHeaderTitle} onPress={this._toSourceList.bind(this)}>换源</Text>
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
                    <TouchableOpacity style={styles.controlFooterItem} onPress={this._showListModal.bind(this)}>
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

    render() {
        return (
            <Image style={{width: Dimen.window.width, height:Dimen.window.height, flex:1}}
                   source={require('../imgs/read_bg.jpg')}>
                <StatusBar
                    hidden={!(this.state.showControlStation || this.state.showListModal)}
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
                    onRequestClose={this._back.bind(this)}>
                    {this.renderControlStation()}
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

                        <FlatList
                            ref={(scrollView) => {
                                        this.catalogListView = scrollView
                                    }
                                 }
                            keyExtrator={"title"}
                            style={styles.innerListView}
                            getItemLayout={(data,index)=>(
                                {length: 40, offset: 40 * index, index}
                            )}
                            data={this.state.listModalDataSource}
                            renderItem={this.renderListModal.bind(this)}
                        />
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
    }
})