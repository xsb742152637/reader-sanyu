/*
 * description: 我的收藏书单页面
 * author: 神编小码
 * time: 2018年04月10日10:47:58
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
import { connect } from 'react-redux'
import ScrollableTabView, {DefaultTabBar} from 'react-native-scrollable-tab-view'

import BookListDetail from '../discover/bookListDetail'
import config from '../../common/config'
import Dimen from '../../utils/dimensionsUtil'
import api from '../../common/api'
import Toast from '../../weight/toast'
import CommonText from '../../weight/commonText'
import ToolBar from '../../weight/toolBar'

var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

export default class MyBookList extends Component {

  constructor(props) {
    super(props)
    this.state = {
      myBookList: []
    }
  }

  componentDidMount() {
    this._getMyBookList()
  }

  _back() {
    this.props.navigator.pop()
  }

  _getMyBookList() {
    var bookList = realm.objects('MyCollectionBookLists').filtered('isToShow = true').sorted('collectionTime', true)
    this.setState({myBookList: bookList})
  }

  _goToBookListDetail(bookListId) {
    this.props.navigator.push({
      name: 'bookListDetail',
      component: BookListDetail,
      params: {
        bookListId: bookListId
      }
    })
  }

  renderBookList(rowData) {
    return (
      <TouchableOpacity 
        activeOpacity={0.5}
        onPress={() => this._goToBookListDetail(rowData.id)}>
        <View style={styles.item}>
          <Image 
            style={styles.itemImage}
            source={rowData.cover 
              ? {uri: (api.IMG_BASE_URL + rowData.cover)} 
              : require('../../imgs/splash.jpg')}
            />
          <View style={styles.itemBody}>
            <Text style={styles.itemTitle}>{rowData.title}</Text>
            <Text style={styles.itemDesc}>{rowData.author}</Text>
            <Text style={styles.itemDesc} numberOfLines={1}>{rowData.desc}</Text>
            <Text style={styles.itemDesc}>{'共' + rowData.bookCount + '本书 | ' + rowData.collectorCount + '人收藏'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  render() {
    return (
      <View style={styles.container}>
        <ToolBar 
          leftClick={this._back.bind(this)}
          title='我的书单'/>
        {this.state.myBookList ?
            <ListView
              style={styles.body}
              enableEmptySections={true}
              dataSource={ds.cloneWithRows(this.state.myBookList)}
              renderRow={this.renderBookList.bind(this)}/>
          : 
            <CommonText text='你还没有保存过书单~~~'/>
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
  body: {
    flex: 1
  },
  item: {
    flexDirection: 'row',
    backgroundColor: config.css.color.white,
    height: 100,
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
    fontSize: config.css.fontSize.desc,
    color: config.css.fontColor.desc,
    marginTop: 3
  }
})