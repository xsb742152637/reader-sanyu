/*
 * description: the action for bookReview/bookReviewDetail
 * author: 神编小码
 * time: 2018年04月14日15:40:51
 */

'use strict'

import * as types from '../common/actionType'
import request from '../utils/httpUtil'
import api from '../common/api'

export let bookReviewList = (params, isFirst, oldList) => {
  return dispatch => {
    dispatch(loadingBookReviewList(isFirst))
    return request.get(api.COMMUNITY_BOOK_REVIEW_LIST, params,
      (data) => {data.ok ? dispatch(getBookReviewListSuccess(data.reviews, oldList)) : dispatch(getBookReviewListSuccess([], oldList))},
      (error) => {dispatch(getBookReviewListSuccess([], oldList))})
  }
}

export let bookReviewDetail = (id) => {
  return dispatch => {
    dispatch(loadingBookReviewDetail())
    return request.get(api.COMMUNITY_BOOK_REVIEW_DETAIL(id), null,
      (data) => {data.ok ? dispatch(getBookReviewDetailSuccess(data.review)) : dispatch(getBookReviewDetailSuccess(null))},
      (error) => {dispatch(getBookReviewDetailSuccess(null))})
  }
}

export let bookReviewDetailCommentList = (id, params, isFirst, oldList) => {
  return dispatch => {
    dispatch(loadingBookReviewComment(isFirst))
    return request.get(api.COMMUNITY_BOOK_REVIEW_COMMENT_LIST(id), params,
      (data) => {data.ok ? dispatch(getBookReviewCommentListSuccess(data.comments, oldList)) : dispatch(getBookReviewCommentListSuccess(null))},
      (error) => {dispatch(getBookReviewCommentListSuccess(null))})
  }
}

export let bookReviewDetailCommentBest = (id) => {
  return dispatch => {
    return request.get(api.COMMUNITY_BOOK_COMMENT_BEST(id), null,
      (data) => {data.ok ? dispatch(getBookReviewCommentBestSuccess(data.comments)) : dispatch(getBookReviewCommentBestSuccess([]))},
      (error) => {dispatch(getBookReviewCommentBestSuccess([]))})
  }
}

let getBookReviewListSuccess = (data, oldList) => {
  return {
    type: types.COMMUNITY_BOOK_REVIEW_LIST,
    isLoadingBookReviewList: false,
    isLoadingBookReviewListMore: false,
    bookReviewList: oldList.concat(data)
  }
}

let loadingBookReviewList = (isFirst) => {
  if (isFirst) {
    return {
      type: types.COMMUNITY_BOOK_REVIEW_LIST_LOADING,
      isLoadingBookReviewList: true,
    }
  } else {
    return {
      type: types.COMMUNITY_BOOK_REVIEW_LIST_LOADING,
      isLoadingBookReviewListMore: true,
    }
  }
}

let loadingBookReviewDetail = () => {
  return {
    type: types.COMMUNITY_BOOK_REVIEW_DETAIL_LOADING,
    isLoadingDetail: true,
  }
}

let getBookReviewDetailSuccess = (data) => {
  return {
    type: types.COMMUNITY_BOOK_REVIEW_DETAIL,
    isLoadingDetail: false,
    bookReviewDetail: data,
    totalComment: data.commentCount
  }
}

let getBookReviewCommentBestSuccess = (data) => {
  return {
    type: types.COMMUNITY_BOOK_REVIEW_DETAIL_COMMENT_BEST,
    bookReviewDetailCommentBest: data
  }
}

let loadingBookReviewComment = (isFirst) => {
  if (isFirst) {
    return {
      type: types.COMMUNITY_BOOK_REVIEW_DETAIL_COMMENT_LIST_LOADING,
      isLoadingBookReviewCommentList: true,
    }
  } else {
    return {
      type: types.COMMUNITY_BOOK_REVIEW_DETAIL_COMMENT_LIST_LOADING,
      isLoadingBookReviewCommentListMore: true,
    }
  }
}

let getBookReviewCommentListSuccess = (data, oldList) => {
  return {
    type: types.COMMUNITY_BOOK_REVIEW_DETAIL_COMMENT_LIST,
    isLoadingBookReviewCommentList: false,
    isLoadingBookReviewCommentListMore: false,
    bookReviewCommentList: oldList.concat(data)
  }
}
