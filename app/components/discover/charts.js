/*
 * description: 排行榜
 * author: 神编小码
 * time: 2018年04月05日16:09:39
 */

import React, { Component } from 'react'
import {
    Image,
    Text,
    StyleSheet,
    TouchableOpacity,
    View,
    ScrollView,
    ListView,
    InteractionManager
} from 'react-native'

import Icon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'
import ScrollableTabView, {ScrollableTabBar} from 'react-native-scrollable-tab-view'
import ChartsDetail from './chartsDetail'
import ChartsDetailOther from './chartsDetailOther'
import config from '../../common/config'
import Dimen from '../../utils/dimensionsUtil'
import api from '../../common/api'
import {charts} from '../../actions/chartsAction'
import Loading from '../../weight/loading'
import ToolBar from '../../weight/toolBar'

var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

class Charts extends Component {

    constructor(props) {

        super(props)
        this.state = {
            gender: 'male',
            ranking: {
                "chartsItem": {
                    "_id": "54d42d92321052167dfb75e3",
                    "title": "杩戒功鏈€鐑 Top100",
                    "cover": "/ranking-cover/142319144267827",
                    "collapse": false,
                    "monthRank": "564d820bc319238a644fb408",
                    "totalRank": "564d8494fe996c25652644d2",
                    "shortTitle": "鏈€鐑"
                }
            },
        }

        this.currentTab = null
    }

    componentDidMount() {
        const {dispatch} = this.props
        InteractionManager.runAfterInteractions(()=> {
            dispatch(charts())
        })

        setTimeout(()=> {
            this._onChangeTab({i: 0})
        }, 500)
    }

    _back() {
        this.props.navigator.pop()
    }


    _changeGender() {
        console.log('_changeGender: ' + this.state.gender)
        const {charts} = this.props

        let test = null
        if (this.state.gender == 'male') {
            this.setState({gender: 'female'})
            test = charts.female
        } else {
            this.setState({gender: 'male'})
            test = charts.male
        }

        if (Array.prototype.isPrototypeOf(test) && test.length === 0) {
            return
        }

        if (this.currentTab == null) {
            return
        }
        let ranking = test[this.currentTab.i]
        this.setState({
            ranking: ranking
        })
    }

    _onChangeTab(obj) {
        const {charts} = this.props

        this.currentTab = obj

        let test = (this.state.gender == 'male') ? charts.male : charts.female

        if (Array.prototype.isPrototypeOf(test) && test.length === 0) {
            return
        }

        let ranking = test[obj.i]

        this.setState({
            ranking: ranking
        })
    }


    render() {
        const {charts} = this.props

        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={[styles.headerLeftText, {flex:1}]}>
                        {this.state.gender == 'male' ? '男生' : '女生'}排行榜
                    </Text>
                    <TouchableOpacity style={{width: 60}} onPress={()=>{this._changeGender()}}>
                        <Icon
                            name={this.state.gender == 'male' ?  'ios-arrow-dropdown-circle': 'ios-arrow-dropdown-circle'}
                            style={styles.headerIcon}
                            size={25}
                            color={config.css.fontColor.white}/>
                    </TouchableOpacity>
                </View>
                <ScrollableTabView
                    tabBarUnderlineStyle={{backgroundColor: '#FF0000'}}
                    tabBarActiveTextColor={'#FF0000'}
                    renderTabBar={() => <ScrollableTabBar/>}
                    onChangeTab={(obj)=>{this._onChangeTab(obj)}}
                >
                    {
                        this.state.gender == 'male' ?
                            charts.male.map((item, index)=> {
                                return (<Text tabLabel={item.shortTitle}/>)
                            })
                            :
                            charts.female.map((item, index)=> {
                                return (<Text tabLabel={item.shortTitle}/>)
                            })

                    }
                </ScrollableTabView>

                {charts.isLoading ?
                    <Loading />
                    :

                    <ChartsDetail
                        chartsItem={this.state.ranking}
                        navigator={this.props.navigator}
                    />

                }
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: config.css.color.appBackground
    },
    body: {
        flex: 1
    },
    header: {
        height: config.css.headerHeight,
        backgroundColor: config.css.color.appMainColor,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomColor: config.css.color.line,
        borderBottomWidth: 1,
        paddingTop:8
    },
    headerLeftText: {
        flex: 1,
        color: config.css.fontColor.white,
        marginLeft: 14,
        fontSize: config.css.fontSize.appTitle,
        fontWeight: 'bold',
        alignItems: 'center',
        paddingTop: 15
    },
    headerIcon: {
        marginLeft: 14,
        marginRight: 14,
        paddingTop: 15
    },
    listStyle: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    listHeader: {
        width: Dimen.window.width,
        margin: 14,
        fontSize: config.css.fontSize.appTitle,
        color: config.css.fontColor.title,
    },
    item: {
        margin: 0.3,
        flexDirection: 'row',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        width: Dimen.window.width / 3 - 1,
        backgroundColor: config.css.color.white
    },
    itemImage: {
        marginLeft: 14,
        marginRight: 14,
        alignSelf: 'center',
        width: 30,
        height: 30
    },
    itemTitle: {
        fontSize: config.css.fontSize.title,
        color: config.css.fontColor.title,
        marginBottom: 3
    },
    itemOtherTitle: {
        marginLeft: 40,
        height: 30
    }
})

function mapStateToProps(store) {
    const { charts } = store
    return {
        charts
    }
}

export default connect(mapStateToProps)(Charts)