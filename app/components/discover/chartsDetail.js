/*
 * description: 单个榜单详情(自家)
 * author: 神编小码
 * time: 2018年04月06日11:56:52
 */

import React, { Component } from 'react'
import {
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  ListView
} from 'react-native'

import Icon from 'react-native-vector-icons/Ionicons'
import ScrollableTabView, {DefaultTabBar} from 'react-native-scrollable-tab-view'

import TabBarOnlyText from '../../weight/TabBarOnlyText'
import config from '../../common/config'
import Dimen from '../../utils/dimensionsUtil'
import api from '../../common/api'
import BookDetail from '../bookDetail'
import ChartsDetailTab from './chartsDetailTab'
import ToolBar from '../../weight/toolBar'

var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
var tabNames = ['周榜', '月榜', '总榜']

export default class ChartsDetail extends Component {

  constructor(props) {
    super(props)
    this.state = {
      chartsItem: this.props.chartsItem
    }
  }

  componentDidMount() {
  }

  componentWillReceiveProps(nextProps) {
    console.log('this.state.chartsItem=' + nextProps.chartsItem)
    if (nextProps.chartsItem == undefined){
      return
    }
        this.setState({
            chartsItem: nextProps.chartsItem
        })
    }

  _back() {
    this.props.navigator.pop()
  }
 
  render() {

    return (
      <View style={styles.container}>
        <ScrollView
          scrollWithoutAnimation={true}>
          <ChartsDetailTab 
            chartsId={this.state.chartsItem._id}
            tabLabel="周榜"
            navigator={this.props.navigator} />
        </ScrollView>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 10,
    backgroundColor: config.css.color.appBackground,
    paddingTop: config.css.headerPaddingTop
  },
})
