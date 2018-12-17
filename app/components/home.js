/*
 * description: app首页
 * author: 神编小码
 * time: 2018年03月12日15:44:18
 */

import React, { Component } from 'react'
import {
    View,
    Image,
    Text,
    StatusBar,
    StyleSheet,
    Platform,
    TouchableOpacity
} from 'react-native'
import ScrollableTabView, {DefaultTabBar} from 'react-native-scrollable-tab-view'
import Icon from 'react-native-vector-icons/Ionicons'

import Bookshelves from './home/bookshelves'
import Discover from './home/discover'
import Community from './home/community'
import Mine from './home/mine'
import TabBar from '../weight/TabBar'

import config from '../common/config'
import Charts from './discover/charts'
import CategoryList from './discover/categoryList'

var tabIcons = ['ios-book-outline', 'ios-compass-outline', 'ios-chatboxes-outline', 'ios-contact-outline']
var tabNames = ["书架", "分类", "排行"]

export default class Home extends Component {
    render() {
        return (
            <View style={styles.container}>

                <ScrollableTabView
                    locked={true}
                    scrollWithoutAnimation={true}
                    tabBarPosition={'bottom'}
                    renderTabBar={() => <TabBar tabIcons={tabIcons} tabNames={tabNames}/>}>
                    <Bookshelves tabLabel="书架" navigator={this.props.navigator}/>
                    <CategoryList tabLabel='分类' navigator={this.props.navigator}/>
                    <Charts tabLabel='排行' navigator={this.props.navigator}/>

                </ScrollableTabView>
            </View>
        )
    }



    /**
     * 显示其他menu
     */
    _other() {

    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: config.css.color.appBackground,
        paddingTop: config.css.headerPaddingTop
    },

})