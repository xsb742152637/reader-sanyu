/*
 * description: 分类详情
 * author: 神编小码
 * time: 2018年04月10日22:36:39
 */

/*
 * description: 书单详情页面
 * author: 神编小码
 * time: 2018年04月08日10:47:38
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
    Modal
} from 'react-native'

import Icon from 'react-native-vector-icons/Ionicons'
import ScrollableTabView, {DefaultTabBar} from 'react-native-scrollable-tab-view'

import TabBarOnlyText from '../../weight/TabBarOnlyText'
import BookDetail from '../bookDetail'
import config from '../../common/config'
import Dimen from '../../utils/dimensionsUtil'
import api from '../../common/api'
import request from '../../utils/httpUtil'
import Toast from '../../weight/toast'
import CategoryDetailTab from './categoryDetailTab'
import ToolBar from '../../weight/toolBar'

var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
var tabNames = ["新书", "热门", "口碑", "完结"]

export default class CategoryDetail extends Component {

    constructor(props) {
        super(props)
        this.state = {
            categoryList: [],
            gender: this.props.gender,
            major: this.props.major,
            minor: this.props.minor,
            toShow: false
        }
    }

    componentDidMount() {
        if (this.props.categoryListSelected == []) {
            return
        }
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            gender: nextProps.gender,
            major: nextProps.major,
            minor: nextProps.minor,
        })

    }

    render() {
        return (
            <View style={styles.container}>
                <ScrollableTabView
                    scrollWithoutAnimation={true}
                    tabBarPosition={'top'}
                    renderTabBar={() => <TabBarOnlyText tabNames={tabNames}/>}>
                    <CategoryDetailTab
                        gender={this.state.gender}
                        type='new'
                        major={this.state.major}
                        minor={this.state.minor}
                        tabLabel="新书"
                        navigator={this.props.navigator}/>
                    <CategoryDetailTab
                        gender={this.state.gender}
                        type='hot'
                        major={this.state.major}
                        minor={this.state.minor}
                        tabLabel='热门'
                        navigator={this.props.navigator}/>
                    <CategoryDetailTab
                        gender={this.state.gender}
                        type='reputation'
                        major={this.state.major}
                        minor={this.state.minor}
                        tabLabel='口碑'
                        navigator={this.props.navigator}/>
                    <CategoryDetailTab
                        gender={this.state.gender}
                        type='over'
                        major={this.state.major}
                        minor={this.state.minor}
                        tabLabel='完结'
                        navigator={this.props.navigator}/>
                </ScrollableTabView>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 10,
        backgroundColor: config.css.color.appBackground,
    },
    modal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    listView: {
        backgroundColor: config.css.color.white,
        marginTop: config.css.headerHeight + 30,
        marginLeft: Dimen.window.width / 2 + 60
    },
    chooseItem: {
        width: Dimen.window.width / 2 - 60,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 10,
        backgroundColor: config.css.color.appBackground,
        borderColor: config.css.color.line,
        borderWidth: 1
    },
})