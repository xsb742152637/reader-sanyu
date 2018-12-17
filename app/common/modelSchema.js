/*
 * description: the model schema for realm
 * author: 神编小码
 * time: 2018年04月04日14:44:45
 */

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
    hasNewChapter: 'int'
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

const schemaArray = [HistoryBookSchema, MyCollectionBookListsSchema, ReaderConfigSchema]

module.exports = schemaArray