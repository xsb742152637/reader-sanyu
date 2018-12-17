/*
 * description: 书籍详情社区页面
 * author: 神编小码
 * time: 2018年04月19日14:54:45
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
  Modal,
  Platform
} from 'react-native'

import Icon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'
import ScrollableTabView, {DefaultTabBar} from 'react-native-scrollable-tab-view'

import TabBarOnlyText from '../../weight/TabBarOnlyText'
import TagsGroup from '../../weight/tagsGroup'
import ToolBar from '../../weight/toolBar'
import config from '../../common/config'
import Dimen from '../../utils/dimensionsUtil'
import api from '../../common/api'
import BookDiscussionTab from './bookDiscussionTab'
import BookReviewTab from './bookReviewTab'
import request from '../../utils/httpUtil'

var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
var tabNames = ['讨论', '书评']

export default class BookCommunity extends Component {

  constructor(props) {
    super(props)
    this.state = {
      sort: 'updated',
      toShow: false
    }
  }

  componentDidMount() {
    this.tabView.goToPage(this.props.page)
  }

  _back() {
    this.props.navigator.pop()
  }

  _showTags() {
    this.setState({toShow: true})
  }

  _changeTag(sort) {
    console.log('sort', sort)
    this.setState({sort: sort, toShow: false})
  }

  _closeModal() {
    this.setState({toShow: false})
  }

  renderList(array) {
    var items = []
    if (array) {
      for (var i = 0; i < array.length; i++) {
        let element = array[i]
        let iconName = element.sort === this.state.sort ? 'ios-checkmark-circle' : 'ios-checkmark-circle-outline'
        items.push(
          <TouchableOpacity 
            key={i}
            style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'}}
            activeOpacity={0.5}
            onPress={() => this._changeTag(element.sort)}>
            <Icon 
              name= {iconName}
              style= {styles.icon}
              size={25}
              color={config.css.color.appBlack}/>
            <Text style={styles.itemTitle}>{element.name}</Text>
          </TouchableOpacity>
        )
      }
    }
    return items
  }

  render() {
    return (
      <View style={styles.container}>
        <ToolBar 
          leftClick={this._back.bind(this)}
          title='主题书单'
          rightIcon='ios-stats-outline'
          rightClick={this._showTags.bind(this)}/>
        <ScrollableTabView
          scrollWithoutAnimation={true}
          tabBarPosition={'top'}
          ref={(tabView) => { this.tabView = tabView; }}
          renderTabBar={() => <TabBarOnlyText tabNames={tabNames}/>}>
          <BookDiscussionTab 
            bookId={this.props.bookId}
            sort={this.state.sort}
            tabLabel='讨论' 
            navigator={this.props.navigator} />
          <BookReviewTab 
            bookId={this.props.bookId}
            sort={this.state.sort}
            tabLabel='书评' 
            navigator={this.props.navigator} />
        </ScrollableTabView>
        <Modal
          visible={this.state.toShow}
          animationType = {'slide'}
          transparent = {true}>
          <TouchableOpacity 
            style={styles.modal} 
            activeOpacity={1}
            onPress={() => this._closeModal()}>
            <View style={styles.listView} >
              {this.renderList(config.discussionSort).map((item, i) => {
                return item
              })}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: config.css.color.appBackground
  },
  icon: {
    marginLeft: 14,
    marginRight: 14
  },
  modal: {
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: config.css.headerHeight - (Platform.OS === 'ios' ? 0 : 20)
  },
  listView: {
    backgroundColor: config.css.color.white,
  },
  itemTitle: {
    marginTop: 10,
    marginBottom: 10,
    color: config.css.fontColor.title,
    fontSize: config.css.fontSize.title
  }
})

