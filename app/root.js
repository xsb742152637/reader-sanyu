/*
 * description: 入口,添加redux
 * author: 神编小码
 * time: 2018年03月18日14:35:39
 */

import React, {Component} from 'react'
import {Provider} from 'react-redux'
import configureStore from './store/store'

import App from './app'

class rootApp extends Component {
  render() {
    return (
      <Provider store={configureStore}>
        <App />
      </Provider>
    )
  }
}

export default rootApp