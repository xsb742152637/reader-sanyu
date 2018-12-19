/*
 * description: 章节列表
 * author: 谢
 * time: 2018年12月19日
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

export default class ChapterList extends Component {

    constructor(props) {
        super(props)
        this.state = {
            dataList: [],
            datasource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
            isRefreshing: false,
            appState: AppState.currentState,
            downloadDlg: false
        };
        this.book = this.props.book;//小说信息
        this.chapterNum = this.props.chapterNum;//小说目前已看章节数
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(()=> {
            console.log("componentDidMount")
            this._onRefresh();

        })

        AppState.addEventListener('change', this._handleAppStateChange.bind(this));
    }

    componentWillUnmount() {
        AppState.removeEventListener('change', this._handleAppStateChange(this));
        this.timer && clearTimeout(this.timer);
    }

    componentWillReceiveProps() {
        console.log("componentWillReceiveProps");
        this._onRefresh();
        this.timer = setTimeout(() => {
            console.log('componentDidMount timer');
            this._getDataList()
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

    _onRefresh = () => {
        console.log("刷新页面");
        //加载列表
        this._getDataList();
    }

    _getDataList(){
        HtmlAnalysis.getChapter(this.book).then((data)=> {
            // alert("asdf:"+JSON.stringify(data));
            if(data != undefined && data != null){
                this.setState({
                    dataList: data,
                    datasource: ds.cloneWithRows(data)
                })
            }
        }).then((err) => {
            console.log(err);
        });
    }

    _clickItem(book){
        alert(JSON.stringify(book));
        // this.props.navigator.push({
        //     name: 'readPlatform',
        //     component: ReadPlatform,
        //     params: {
        //         sourceId: sourceId
        //     }
        // })
    }

    renderBookSource(data) {
        if (data == undefined) {
            return null
        }
        return (
            <TouchableOpacity activeOpacity={0.5} onPress={() => this._clickItem(data)}>
                <View style={styles.item}>
                    <View style={styles.itemBody}>
                        <Text style={styles.itemTitle}>{data.webName}</Text>
                        <Text style={styles.itemDesc}>{'最近更新：'+data.newChapter}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    _back() {
        this.props.navigator.pop()
    }

    render() {
        return (
            <View style={styles.container}>
                <ToolBar leftClick={this._back.bind(this)} title={'选择来源'}/>

                {this.state.dataList && this.state.dataList.length > 0 ?
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
                    <CommonText text='没有找到合适的来源~~'/>
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