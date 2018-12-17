/*
 * description: store
 * author: 神编小码
 * time: 2018年03月18日14:31:13
 */

import {createStore, applyMiddleware, compose} from 'redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'
import rootReducer from '../reducers/indexReducer'

const logger = createLogger()

let store = createStore(
  rootReducer, 
  {}, 
  compose(applyMiddleware(thunkMiddleware, logger),
  window.devToolsExtension ? window.devToolsExtension() : f => f
))

export default store