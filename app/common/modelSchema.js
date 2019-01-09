/*
 * description: the model schema for realm
 * author: 神编小码
 * time: 2018年04月04日14:44:45
 */
//小说章节目录
const BookChapterListSchema = {
    name: 'BookChapterList',
    primaryKey: 'listId',
    properties: {
        listId: 'string',//格式：key_bookName_orderNum
        listKey: 'string',//格式：key+bookName
        bookName:'string',
        link: 'string',//章节连接
        title: 'string',//章节标题
        num: 'int',//章节数
        orderNum: 'int'//章节序号
    }
}

// 小说章节明细,跟BookChapterListSchema的listId有联系
const BookChapterDetailSchema = {
  name: 'BookChapterDetail',
  primaryKey: 'bcdId',
  properties: {
    bcdId: 'string',//小说编号
    listId: 'string',//章节编号
    bookName:'string',
    content: 'string',//小说内容
    orderNum: 'int'//小说序号
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
    bookUrlNew: {type: 'string',default: ''},
    lastChapterTitle: 'string',
    lastChapterTime: 'string',
    historyChapterTitle: {type: 'string',default: ''},//最后一次阅读的章节名称
    historyChapterNum: 'int',//最后一次阅读的章节序号
    historyChapterPage: 'int',
    saveTime: 'date',
    sortNum: 'int',
    isToShow: 'int', // 0: 不显示 1: 书架 2: 养肥区
    hasNewChapter: 'int',
    sourceKey: {type: 'string',default: ''}//选中的当前源
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

const schemaArray = [BookChapterListSchema,BookChapterDetailSchema,HistoryBookSchema, MyCollectionBookListsSchema, ReaderConfigSchema];

module.exports = schemaArray;