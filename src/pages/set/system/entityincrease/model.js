/* global window */
import modelExtend from 'dva-model-extend'
import { config } from '../../../../utils/index'
import * as entityIncreaseService from './services/entityIncrease'
import { pageModel } from '../../../../utils/model'

const { prefix } = config

export default modelExtend(pageModel, {
  namespace: 'entityIncrease',

  state: {
    currentItem: {},
    modalVisible: false,
    modalType: 'create',
    selectedRowKeys: [],
    isMotion: window.localStorage.getItem(`${prefix}entityIncreaseIsMotion`) === 'true',
  },

  subscriptions: {
    setup ({ dispatch, history }) {
      history.listen((location) => {
        if (location.pathname === '/set/system/entityIncrease') {
          const payload = {page:0,size:10,...location.query}
          dispatch({
            type: 'query',
            payload,
          })
        }
      })
    },
  },

  effects: {
    * query ({ payload = {} }, { call, put }) {
      const data = yield call(entityIncreaseService.queryParams, payload)
      if (data) {
        yield put({
          type: 'querySuccess',
          payload: {
            list: data.list,
            pagination: {
              current: Number(data.currentPage) || 1,
              pageSize: Number(data.pageSize) || 10,
              total: data.totalCount,
            },
          },
        })
      }
    },

    * queryCurrent ({payload = {}}, {call, put}) {
      const data = yield call(entityIncreaseService.query,payload)
      if (data) {
        yield put({
          type: 'updateState',
          payload: {
            currentItem: data,
          },
        })
      }
    },


    * delete ({ payload }, { call, put, select }) {
      const data = yield call(entityIncreaseService.remove, { id: payload })
      const { selectedRowKeys } = yield select(_ => _.entityIncrease)
      if (data.success) {
        yield put({ type: 'updateState', payload: { selectedRowKeys: selectedRowKeys.filter(_ => _ !== payload) } })
      } else {
        throw data
      }
    },

    * multiDelete ({ payload }, { call, put }) {
      const data = yield call(entityIncreaseService.removeBatch, payload)
      if (data.success) {
        yield put({ type: 'updateState', payload: { selectedRowKeys: [] } })
      } else {
        throw data
      }
    },

    * create ({ payload }, { call, put }) {
      const data = yield call(entityIncreaseService.create, payload)
      if (data.success) {
        yield put({ type: 'hideModal' })
      } else {
        throw data
      }
    },

    * update ({ payload }, { select, call, put }) {
      const id = yield select(({ entityIncrease }) => entityIncrease.currentItem.id)
      const newEntityIncrease = { ...payload, id }
      const data = yield call(entityIncreaseService.update, newEntityIncrease)
      if (data.success) {
        yield put({ type: 'hideModal' })
      } else {
        throw data
      }
    },

  },

  reducers: {
    showModal (state, { payload }) {
      return { ...state, ...payload, modalVisible: true }
    },

    hideModal (state) {
      return { ...state, modalVisible: false }
    },

    switchIsMotion (state) {
      window.localStorage.setItem(`${prefix}entityIncreaseIsMotion`, !state.isMotion)
      return { ...state, isMotion: !state.isMotion }
    },

  },
})
