/*
 * description: 综合讨论区详情
 * author: 神编小码
 * time: 2018年04月13日11:45:56
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
import { connect } from 'react-redux'

import config from '../../common/config'
import Dimen from '../../utils/dimensionsUtil'
import {dateFormat} from '../../utils/formatUtil'
import api from '../../common/api'
import {bookDiscussionDetail, 
  bookDiscussionDetailCommentBest, 
  bookDiscussionDetailCommentList
} from '../../actions/bookDiscussionAction'
import Loading from '../../weight/loading'
import LoadingMore from '../../weight/loadingMore'
import ToolBar from '../../weight/toolBar'

var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

class BookDiscussionDetail extends Component {

  constructor(props) {
    super(props)
    this.state = {
      id: ''
    }
  }

  componentDidMount() {
    const {dispatch} = this.props
    const _id = this.props.bookDiscussionId
    this.setState({id: _id})
    InteractionManager.runAfterInteractions(()=>{
      dispatch(bookDiscussionDetail(_id))
      dispatch(bookDiscussionDetailCommentBest(_id))
      dispatch(bookDiscussionDetailCommentList(_id, {start: 0, limit: 30}, true, []))
    })
  }

  _back() {
    this.props.navigator.pop()
  }

  _showMoreItem() {
    const {bookDiscussion, dispatch, _id} = this.props
    if(bookDiscussion.bookDiscussionCommentList.length === 0 
      || bookDiscussion.isLoadingBookDiscussionCommentList 
      || bookDiscussion.isLoadingBookDiscussionCommentListMore 
      || bookDiscussion.bookDiscussionCommentList.length >= bookDiscussion.totalComment){
      return
    }
    dispatch(bookDiscussionDetailCommentList(this.state.id, {start: bookDiscussion.bookDiscussionCommentList.length, limit: 30}, false, bookDiscussion.bookDiscussionCommentList))
  }

  renderBookDiscussionCommentBest(rowData) {
    return (
      <View style={styles.item}>
        <Image 
          style={styles.itemImage}
          source={rowData.author.avatar 
            ? {uri: (api.IMG_BASE_URL + rowData.author.avatar)} 
            : require('../../imgs/splash.jpg')}
          />
        <View style={styles.itemBody}>
          <View style={{flexDirection: 'row', marginTop: 10}}>
            <Text style={styles.itemDesc}>{rowData.floor + '楼'}</Text>
            <Text style={styles.itemAuthor}>{rowData.author.nickname + ' lv.' + rowData.author.lv}</Text>
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-end', marginRight: 14}}>
              <Icon 
                name='ios-heart-outline'
                size={15}
                color={config.css.fontColor.desc}>
              </Icon>
              <Text style={styles.itemDesc}>{rowData.likeCount + '次同感'}</Text>
            </View>
          </View>
          <Text style={styles.itemTitle}>{rowData.content}</Text>
        </View>
      </View>
    )
  }

  renderBookDiscussionComment(rowData) {
    return (
      <View style={styles.item}>
        <Image 
          style={styles.itemImage}
          source={rowData.author.avatar 
            ? {uri: (api.IMG_BASE_URL + rowData.author.avatar)} 
            : require('../../imgs/splash.jpg')}
          />
        <View style={styles.itemBody}>
          <View style={{flexDirection: 'row', marginTop: 10}}>
            <Text style={styles.itemDesc}>{rowData.floor + '楼'}</Text>
            <Text style={styles.itemAuthor}>{rowData.author.nickname + ' lv.' + rowData.author.lv}</Text>
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-end', marginRight: 14}}>
              <Text style={styles.itemDesc}>{dateFormat(rowData.created)}</Text>
            </View>
          </View>
          <Text style={styles.itemTitle}>{rowData.content}</Text>
        </View>
      </View>
    )
  }

  renderHeader() {
    const {bookDiscussion} = this.props
    return (
      <View>
        {bookDiscussion.bookDiscussionDetail ?
          <View>
            <View style={{paddingTop: 10, flexDirection: 'row', alignItems: 'center'}}>
              <Image 
                style={styles.authorImage}
                source={bookDiscussion.bookDiscussionDetail.author.avatar 
                  ? {uri: (api.IMG_BASE_URL + bookDiscussion.bookDiscussionDetail.author.avatar)} 
                  : require('../../imgs/splash.jpg')}
                />
              <View style={styles.authorBody}>
                <Text style={styles.authorTitle}>{bookDiscussion.bookDiscussionDetail.author.nickname}</Text>
                <Text style={styles.authorCreateTime}>{dateFormat(bookDiscussion.bookDiscussionDetail.created)}</Text>
              </View>
            </View>
            <Text style={styles.detailTitle}>{bookDiscussion.bookDiscussionDetail.title}</Text>
            <Text style={styles.detailContent}>{bookDiscussion.bookDiscussionDetail.content}</Text>
            {bookDiscussion.bookDiscussionDetailCommentBest.length !== 0 ?
                <View>
                  <Text style={styles.listHeader}>仰望神评论</Text>
                  <ListView
                    enableEmptySections={true}
                    dataSource={ds.cloneWithRows(bookDiscussion.bookDiscussionDetailCommentBest)}
                    renderRow={this.renderBookDiscussionCommentBest.bind(this)}/>
                </View>
              : 
                null
            }
            <Text style={styles.listHeader}>
              {'共' + bookDiscussion.totalComment + '条评论'}
            </Text>
          </View>
          : 
          null
        }
      </View>
    )
  }

  renderFooter() {
    const {bookDiscussion} = this.props
    if (bookDiscussion.bookDiscussionCommentList.length === 0 || bookDiscussion.isLoadingBookDiscussionCommentList) {
      return null
    }
    if (bookDiscussion.bookDiscussionCommentList.length < bookDiscussion.totalComment) {
      return (
        <LoadingMore hasMore={true} />
      )
    } else {
      return (
        <LoadingMore hasMore={false} />
      )
    }
  }

  render() {
    const {bookDiscussion} = this.props
    return (
      <View style={styles.container}>
        <ToolBar 
          leftClick={this._back.bind(this)}
          title='详情'/>
        {bookDiscussion.isLoadingBookDiscussionCommentList ? 
            <Loading />
          :
            <ListView
              enableEmptySections={true}
              dataSource={ds.cloneWithRows(bookDiscussion.bookDiscussionCommentList)}
              onEndReached={this._showMoreItem.bind(this)}
              onEndReachedThreshold={30}
              renderRow={this.renderBookDiscussionComment.bind(this)}
              renderHeader={this.renderHeader.bind(this)}
              renderFooter={this.renderFooter.bind(this)}/>
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
  authorImage: {
    marginLeft: 14,
    marginRight: 14,
    width: 40,
    height: 40,
    borderRadius: 20
  },
  authorBody: {
    flex: 1,
    justifyContent: 'space-around'
  },
  authorTitle: {
    fontSize: config.css.fontSize.desc, 
    color: config.css.fontColor.author,
  },
  authorCreateTime: {
    fontSize: config.css.fontSize.desc, 
    color: config.css.fontColor.desc,
  },
  detailTitle: {
    fontSize: config.css.fontSize.title, 
    color: config.css.fontColor.title,
    marginTop: 20,
    marginLeft: 14,
    marginRight: 14
  },
  detailContent: {
    fontSize: config.css.fontSize.desc, 
    color: config.css.fontColor.desc,
    margin: 14
  },
  listHeader: {
    paddingTop: 10, 
    paddingBottom: 10, 
    paddingLeft: 14, 
    backgroundColor: config.css.color.line
  },
  item: {
    flexDirection: 'row',
    width: Dimen.window.width,
    borderTopWidth: 1,
    borderTopColor: config.css.color.line
  },
  itemImage: {
    marginLeft: 14,
    marginRight: 14,
    marginTop: 10,
    width: 40,
    height: 40,
    borderRadius: 20
  },
  itemBody: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  itemAuthor: {
    fontSize: config.css.fontSize.desc, 
    color: config.css.fontColor.author,
    marginLeft: 5
  },
  itemTime: {
    fontSize: config.css.fontSize.desc,
    color: config.css.fontColor.desc,
    marginRight: 14,
  },
  itemTitle: {
    fontSize: config.css.fontSize.desc,
    color: config.css.fontColor.title,
    marginRight: 14,
    marginTop: 5,
    marginBottom: 10
  },
  itemDesc: {
    fontSize: config.css.fontSize.desc,
    color: config.css.fontColor.desc,
  },
})

function mapStateToProps(store) {
  const { bookDiscussion } = store
  return {
    bookDiscussion
  }
}

export default connect(mapStateToProps)(BookDiscussionDetail)
