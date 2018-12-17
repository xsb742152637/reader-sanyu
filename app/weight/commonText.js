/*
 * description: loading
 * author: 神编小码
 * time: 2018年04月23日13:04:37
 */


import React, { Component } from 'react'
import {
  View,
  Text
} from 'react-native'
import config from '../common/config'

export default class CommonText extends Component {

  static propTypes = {
    text: React.PropTypes.string
  }

  render() {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text >{this.props.text}</Text>
      </View>
    )
  }
}
