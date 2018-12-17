/*
 * description: the actions for bookDetail
 * author: 神编小码
 * time: 2018年03月18日14:02:11
 */

'use strict'

import * as types from '../common/actionType'
import request from '../utils/httpUtil'
import api from '../common/api'

export let bookDetail = (id) => {
  return dispatch => {
    dispatch(loadingBookDetail())
    return request.get(api.BOOK_DETAIL(id), null,
      (data) => {dispatch(getBookDetailSuccess(data))},
      (error) => {dispatch(getBookDetailSuccess(null))})
  }
}

export let hotReview = (id) => {
  return dispatch => {
    return request.get(api.BOOK_HOT_REVIEW, {book: id},
      (data) => {data.ok ? dispatch(getHotReviewSuccess(data.reviews)) : dispatch(getHotReviewSuccess([]))},
      (error) => {dispatch(getHotReviewSuccess([]))})
  }
}

export let recommendBookList = (id, limit) => {
  return dispatch => {
    return request.get(api.BOOK_RECOMMEND_BOOK_LIST(id), {limit: limit},
      (data) => {data.ok ? dispatch(getRecommendBookListSuccess(data.booklists)) : dispatch(getRecommendBookListSuccess([]))},
      (error) => {dispatch(getRecommendBookListSuccess([]))})
  }
}

let getBookDetailSuccess = (data) => {
  return {
    type: types.BOOK_DETAIL,
    isLoading: false,
    data: data
  }
}

let loadingBookDetail = () => {
  return {
    type: types.BOOK_DETAIL_LOADING,
    isLoading: true
  }
}

let getHotReviewSuccess = (data) => {
  return {
    type: types.BOOK_HOT_REVIEW,
    hotReview: data
  }
}

let getRecommendBookListSuccess = (data) => {
  return {
    type: types.BOOK_RECOMMEND_BOOK_LIST,
    recommendBookList: data
  }
}