/*
 * description: 分类详情的tab页面
 * author: 神编小码
 * time: 2018年04月11日11:38:04
 */

import React, { Component } from 'react'
import {
    Image,
    Text,
    StyleSheet,
    TouchableOpacity,
    View,
    ScrollView,
    ListView,
    InteractionManager
} from 'react-native'

import Icon from 'react-native-vector-icons/Ionicons'

import request from '../../utils/httpUtil'
import BookDetail from '../bookDetail'
import config from '../../common/config'
import Dimen from '../../utils/dimensionsUtil'
import api from '../../common/api'
import Loading from '../../weight/loading'
import LoadingMore from '../../weight/loadingMore'

var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

export default class CategoryDetailTab extends Component {

    static propTypes = {
        gender: React.PropTypes.string,
        type: React.PropTypes.string,
        major: React.PropTypes.string,
        minor: React.PropTypes.string
    }

    constructor(props) {
        super(props)
        this.state = {
            isLoading: false,
            isLoadingMore: false,
            bookList: [],
            total: 0
        }
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(()=> {
            let params = this._setTabParams(this.props.gender, this.props.type, this.props.major, this.props.minor, 0)
            this._getCategoryTabDetail(params)
        })
    }

    componentWillReceiveProps(nextProps) {
        this.setState({bookList: [], total: 0})
        let params = this._setTabParams(nextProps.gender, nextProps.type, nextProps.major, nextProps.minor, 0)
        this._getCategoryTabDetail(params)
    }

    _getCategoryTabDetail(params) {
        if (this.state.bookList.length === 0) {
            this.setState({isLoading: true})
        } else {
            this.setState({isLoadingMore: true})
        }
        request.get(api.DISCOVER_CATEGORY_BOOKS, params,
            (data) => {
                if (data.ok) {
                    if (this.state.bookList.length === 0) {
                        this.setState({
                            isLoading: false,
                            bookList: data.books,
                            total: data.total
                        })
                    } else {
                        this.setState({
                            isLoadingMore: false,
                            bookList: this.state.bookList.concat(data.books),
                            total: data.total
                        })
                    }

                } else {
                    this.setState({
                        isLoading: false,
                        isLoadingMore: false,
                    })
                }
            },
            (error) => {
                this.setState({
                    isLoading: false,
                    isLoadingMore: false,
                })
            })
    }

    _setTabParams(gender, type, major, minor, start) {
        return {gender: gender, type: type, major: major, start: start, minor: minor, limit: 20}
    }

    _back() {
        this.props.navigator.pop()
    }

    _showMoreItem() {
        if (this.state.bookList.length === 0 || this.state.isLoading || this.state.isLoadingMore || this.state.bookList.length === this.state.total) {
            return
        }
        let params = this._setTabParams(this.props.gender, this.props.type, this.props.major, this.props.minor, this.state.bookList.length)
        this._getCategoryTabDetail(params)
    }

    /**
     * 跳转书的介绍页面
     * @param {string} id 书的信息
     */
    _goToBookDetail(id) {
        this.props.navigator.push({
            name: 'bookDetail',
            component: BookDetail,
            params: {
                bookId: id
            }
        })
    }

    renderBookList(rowData) {
        return (
            <TouchableOpacity
                activeOpacity={0.5}
                onPress={() => this._goToBookDetail(rowData._id)}>
                <View style={styles.item}>
                    <Image
                        style={styles.itemImage}
                        source={rowData.cover
              ? {uri: (api.IMG_BASE_URL + rowData.cover)} 
              : require('../../imgs/splash.jpg')}
                    />
                    <View style={styles.itemBody}>
                        <Text style={styles.itemTitle}>{rowData.title}</Text>
                        <Text style={styles.itemDesc}>{rowData.author + ' | ' + rowData.majorCate + ' | ' + rowData.minorCate}</Text>
                        <Text style={styles.itemDesc} numberOfLines={1}>{rowData.shortIntro}</Text>
                        <Text
                            style={styles.itemDesc}>{rowData.latelyFollower + '在追 | ' + rowData.retentionRatio + '%人留存'}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    renderFooter() {
        if (this.state.bookList.length === 0 || this.state.isLoading) {
            return null
        }
        if (this.state.bookList.length < this.state.total) {
            return (
                <LoadingMore hasMore={true}/>
            )
        } else {
            return (
                <LoadingMore hasMore={false}/>
            )
        }
    }

    render() {
        return (
            <View style={styles.container}>
                {this.state.isLoading ?
                    <Loading />
                    :
                    <ListView
                        enableEmptySections={true}
                        dataSource={ds.cloneWithRows(this.state.bookList)}
                        onEndReached={this._showMoreItem.bind(this)}
                        onEndReachedThreshold={30}
                        renderRow={this.renderBookList.bind(this)}
                        renderFooter={this.renderFooter.bind(this)}/>
                }
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: config.css.color.appBackground,
        alignItems: 'stretch'
    },
    body: {
        flex: 1
    },
    item: {
        paddingTop: 10,
        paddingBottom: 10,
        flexDirection: 'row',
        width: Dimen.window.width,
        borderTopWidth: 1,
        borderTopColor: config.css.color.line
    },
    itemImage: {
        marginLeft: 14,
        marginRight: 14,
        alignSelf: 'center',
        width: 45,
        height: 60
    },
    itemBody: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center'
    },
    itemTitle: {
        fontSize: config.css.fontSize.title,
        color: config.css.fontColor.title,
        marginBottom: 3
    },
    itemDesc: {
        fontSize: 12,
        color: config.css.fontColor.desc,
        marginTop: 3,
        marginRight: 14
    },
})
