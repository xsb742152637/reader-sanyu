/*
 * description: 社区tab
 * author: 神编小码
 * time: 2018年04月05日15:46:36
 */

import React, { Component } from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native'

import CommonItemForTab from '../../weight/commonItemForTab'
import BookDiscussion from '../community/bookDiscussion'
import BookReview from '../community/bookReview'
import BookHelp from '../community/bookHelp'
import config from '../../common/config'

export default class Community extends Component {

  constructor(props) {
    super(props)
  }

  componentDidMount() {
  }

  /**
   * 跳转综合讨论区/原创区/女生区
   * @param {string} block ramble:综合讨论区  original：原创区  girl: 女生区
   */
  _goToBookDiscussion(block) {
    this.props.navigator.push({
      name: 'bookDiscussion',
      component: BookDiscussion,
      params: {
        block: block
      }
    })
  }

  /**
   * 跳转书评区
   */
  _goToBookReview() {
    this.props.navigator.push({
      name: 'bookReview',
      component: BookReview
    })
  }

  /**
   * 跳转书荒互助区
   */
  _goToBookHelp() {
    this.props.navigator.push({
      name: 'bookHelp',
      component: BookHelp
    })
  }

  /**
   * 跳转女生区
   */
  _goToGirlBookDiscussion() {
    this.props.navigator.push({
      name: 'girlBookDiscussion',
      component: GirlBookDiscussion
    })
  }

  render() {
    return (
      <View style={styles.body}>
        <CommonItemForTab title={'综合讨论区'} image={require('../../imgs/icon_discussion.png')} clickItem={() => this._goToBookDiscussion('ramble')}/>
        <View style={styles.line}/>
        <CommonItemForTab title={'书评区'} image={require('../../imgs/icon_review.png')} clickItem={() => this._goToBookReview()}/>
        <View style={styles.line}/>
        <CommonItemForTab title={'书荒互助区'} image={require('../../imgs/icon_help.png')} clickItem={() => this._goToBookHelp()}/>
        <View style={styles.line}/>
        <CommonItemForTab title={'女生区'} image={require('../../imgs/icon_girl.png')} clickItem={() => this._goToBookDiscussion('girl')}/>
        <View style={styles.line}/>
        <CommonItemForTab title={'原创区'} image={require('../../imgs/icon_original.png')} clickItem={() => this._goToBookDiscussion('original')}/>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  body: {
    flex: 1
  },
  line: {
    height: 1, 
    backgroundColor: config.css.color.line, 
  },
})