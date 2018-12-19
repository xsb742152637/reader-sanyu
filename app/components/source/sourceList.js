/*
 * description: 换源列表
 * author: 谢
 * time: 2018年12月16日
 */

import React, { Component } from 'react'
import {
    StyleSheet,
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
import config from '../../common/config'
import Dimen from '../../utils/dimensionsUtil'
import {dateFormat} from '../../utils/formatUtil'
import CommonText from '../../weight/commonText'
import request from '../../utils/httpUtil'
import Icon from 'react-native-vector-icons/Ionicons'
const TimerMixin = require('react-timer-mixin');
import Search from '../search'
import ToolBar from '../../weight/toolBar'
import HtmlAnalysis from './htmlAnalysis'


var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
var last_time = new Date().getTime();

export default class Bookshelves extends Component {

    constructor(props) {
        super(props)
        this.state = {
            bookSourceList: new Array(),
            datasource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
            isRefreshing: false,
            appState: AppState.currentState,
            downloadDlg: false
        };
        this.bookName = this.props.bookName;//小说名称，用于在其它源进行搜索
        this.chapterNum = this.props.chapterNum;//小说目前已看章节数
    }

    //渲染后触发
    componentDidMount() {
        InteractionManager.runAfterInteractions(()=> {
            console.log("componentDidMount")
            this._onRefresh();

        })

        AppState.addEventListener('change', this._handleAppStateChange.bind(this));
    }

    //组件移除之前调用
    componentWillUnmount() {
        AppState.removeEventListener('change', this._handleAppStateChange(this));
        this.timer && clearTimeout(this.timer);
    }

    //组件接收到新的props时调用，并将其作为参数nextProps使用，可在此更改组件state
    componentWillReceiveProps() {
        console.log("componentWillReceiveProps");
        this._onRefresh();
        this.timer = setTimeout(() => {
            console.log('componentDidMount timer');
            this._getBookSourceList()
            //NativeModules.RNAdModule.showAd('com.axiamireader.BannerActivity')
        }, 2000);
    }

    _handleAppStateChange(nextAppState) {
        console.log(nextAppState);
        try {
            let current_time = new Date().getTime()
            if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
                console.log('App has come to the foreground!')
                if (current_time - last_time > 30000) {
                    NativeModules.RNAdModule.showAd('com.axiamireader.SplashActivity')
                }
                last_time = current_time
                this._onRefresh()
            }
            this.setState({appState: nextAppState});
        } catch (ex) {
            console.log(ex);
        }
    }

    //刷新页面
    _onRefresh = () => {
        console.log("刷新页面");
        //加载小说源列表
        this._getBookSourceList();
    }

    //加载小说源列表
    _getBookSourceList(){
        for(let key in HtmlAnalysis.api){
            HtmlAnalysis.searchBook(this.bookName,key).then((data)=> {
                // alert("asdf:"+JSON.stringify(data));
                if(data != undefined && data != null){
                    // alert("bbb:"+data.bookName);
                    // this.setState({bookSourceList: this.state.bookSourceList.push(data)})
                    this.setState({
                        bookSourceList: this.state.bookSourceList.push(data),
                        datasource: ds.cloneWithRows(this.state.bookSourceList)
                    })
                    // this.state.bookSourceList.push(data);
                    // alert(JSON.stringify(this.state.bookSourceList));
                }
            }).then((err) => {
                console.log(err);
            });
        }
        // alert(this.state.bookSourceList.length);

        // HtmlAnalysisBase.searchBook(this.bookName).then((data)=> {
        //     alert("c");
        //     alert(data.bookName+"    \n作者："+data.author);
        // }).then((err) => {
        //     console.log(err);
        // });
        // var bookSources = realm.objects("BookSource").sorted('sortNum');
        //
        // if(bookSources.length < 1){
        //     this._setBookSourceList();
        //     bookSources = realm.objects("BookSource").sorted('sortNum');
        // }
    }

    //向数据库写入小说源
    _setBookSourceList(){
        realm.write(() => {
            realm.create("BookSource",{
                sourceId: this._getUUID(),
                sourceName:"猪猪岛",
                sourceUrl: 'http://m.zzdxsw.org',
                searchUrl: '/wap.php?action=search&wd=',//搜索网址
                sortNum: 1
            });
            realm.create("BookSource",{
                sourceId: this._getUUID(),
                sourceName:"笔趣阁",
                sourceUrl: 'https://m.biqubao.com',
                searchUrl: '/search.php?keyword=',//搜索网址
                sortNum: 2
            });
        })
    }

    //自动生成唯一ID
    _getUUID(){
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }).toUpperCase();
    }

    //进入源
    _getNewBook(sourceId){
        this.props.navigator.push({
            name: 'readPlatform',
            component: ReadPlatform,
            params: {
                sourceId: sourceId
            }
        })
    }
    renderBookSource(data) {

        if (data == undefined) {
            return null
        }
        // alert(JSON.stringify(data));
        //根据这个源，得到该小说，如果没找到，则不显示该源
        return (
            <TouchableOpacity activeOpacity={0.5} onPress={() => this._getNewBook(data.bookName)}>
                <View style={styles.item}>
                    <View style={styles.itemBody}>
                        <Text style={styles.itemTitle}>{data.webName}</Text>
                        <Text style={styles.itemDesc}>{'最近更新：'+data.newChapter}</Text>
                    </View>
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

    //返回上一页
    _back() {
        this.props.navigator.pop()
    }

    //渲染函数
    render() {
        return (
            <View style={styles.container}>
                <ToolBar leftClick={this._back.bind(this)} title={'选择来源'}/>

                {this.state.bookSourceList && this.state.bookSourceList.length > 0 ?
                    <ListView
                        enableEmptySections={true}
                        dataSource={this.state.datasource}
                        renderRow={this.renderBookSource.bind(this)}
                        refreshControl={<RefreshControl
                            refreshing={this.state.isRefreshing}
                            onRefresh={this._onRefresh.bind(this)}
                            tintColor='red'
                            title= {this.state.isRefreshing? '刷新中....':'下拉刷新'}/>
                        }
                    />
                    :
                    <CommonText text='您还没有收藏过任何书籍哦~~'/>
                }
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: config.css.color.appBackground
    },
    modal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center'
    },
    header: {
        height: config.css.headerHeight,
        backgroundColor: config.css.color.appMainColor,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomColor: config.css.color.line,
        borderBottomWidth: 1
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
        height: 100,
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