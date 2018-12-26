/*
 * description: the model schema for realm
 * author: 神编小码
 * time: 2018年04月04日14:44:45
 */

// 小说源
const BookSourceSchema = {
  name: 'BookSource',
  primaryKey: 'sourceId',
  properties: {
    sourceId: 'string',//源编号
    sourceName: 'string',//源名称
    sourceUrl: 'string',//网址
    searchUrl: 'string',//搜索网址
    sortNum: 'int'
  }
}

// 书架
const HistoryBookSchema = {
  name: 'HistoryBook',
  primaryKey: 'bookId',
  properties: {
    bookId: 'string',
    bookName: 'string',
    bookUrl: 'string',
    lastChapterTitle: 'string',
    lastChapterTime: 'string',
    historyChapterNum: 'int',
    historyChapterPage: 'int',
    saveTime: 'date',
    sortNum: 'int',
    isToShow: 'int', // 0: 不显示 1: 书架 2: 养肥区
    hasNewChapter: 'int',
    sourceKey: 'string'//选中的当前源
  }
}

// 我的书单
const MyCollectionBookListsSchema = {
  name: 'MyCollectionBookLists',
  primaryKey: 'id',
  properties: {
    id: 'string',
    author: 'string',
    bookCount: 'int',
    collectorCount: 'int',
    cover: 'string',
    desc: 'string',
    title: 'string',
    gender: 'string',
    collectionTime: 'date',
    isToShow: 'bool'
  }
}

const ReaderConfigSchema = {
  name: 'ReaderConfig',
  primaryKey: 'configId',
  properties: {
    configId: 'string',
    background: 'string',
    fontSize: 'int',
    lineHeight: 'int',
    dayNight: 'string',
    isFirstOpen: 'int'
  }
}

const schemaArray = [BookSourceSchema,HistoryBookSchema, MyCollectionBookListsSchema, ReaderConfigSchema]

module.exports = schemaArray