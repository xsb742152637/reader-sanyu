/*
 * description: the reducer for charts
 * author: 神编小码
 * time: 2018年04月05日21:08:24
 */

'use strict'

import * as types from '../common/actionType'

const initialState = {
  isLoading: true,
  isLoadingDetail: true,
  male: [],
  female: [],
  maleOther: [],
  femaleOther: [],
  chartsDetail: null,
  chartsDetailBooks: []
}

export default function charts(state = initialState, action) {
  switch (action.type) {
    case types.DISCOVER_CHARTS_LOADING:
      return Object.assign({}, state, {
        isLoading: action.isLoading
      })
    case types.DISCOVER_CHARTS:
      return Object.assign({}, state, {
        isLoading: action.isLoading,
        male: action.male,
        maleOther: action.maleOther,
        female: action.female,
        femaleOther: action.femaleOther
      })
    case types.DISCOVER_CHARTS_DETAIL_LOADING:
      return Object.assign({}, state, {
        isLoadingDetail: action.isLoadingDetail
      })
    case types.DISCOVER_CHARTS_DETAIL:
      return Object.assign({}, state, {
        isLoadingDetail: action.isLoadingDetail,
        chartsDetail: action.chartsDetail,
        chartsDetailBooks: action.chartsDetail.books
      })
    default:
      return state
  }
}