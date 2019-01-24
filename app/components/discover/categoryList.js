/*
 * description: 分类页面
 * author: 神编小码
 * time: 2018年04月05日16:10:56
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
import ScrollableTabView, {ScrollableTabBar} from 'react-native-scrollable-tab-view'
import Icon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import CategoryDetail from './categoryDetail'
import config from '../../common/config'
import Dimen from '../../utils/dimensionsUtil'
import api from '../../common/api'
import {categoryListBasic, categoryListV2} from '../../actions/categoryListAction'
import Loading from '../../weight/loading'
import ToolBar from '../../weight/toolBar'


let category_list_v2 =
{
    male: [{major: '玄幻', mins: ['东方玄幻', '异界大陆', '异界争霸', '远古神话']},
        {major: '奇幻', mins: ['西方奇幻', '领主贵族', '亡灵异族', '魔法校园']},
        {major: '武侠', mins: ['传统武侠', '新派武侠', '国术武侠']},
        {major: '仙侠', mins: ['古典仙侠', '幻想修仙', '现代修仙', '洪荒封神']},
        {
            major: '都市',
            mins: ['都市生活', '爱情婚姻', '异术超能', '恩怨情仇', '青春校园', '现实百态']
        },
        {major: '职场', mins: ['娱乐明星', '官场沉浮', '商场职场']},
        {major: '历史', mins: ['穿越历史', '架空历史', '历史传记']},
        {
            major: '军事',
            mins: ['军事战争', '战争幻想', '谍战特工', '军旅生涯', '抗战烽火']
        },
        {major: '游戏', mins: ['游戏生涯', '电子竞技', '虚拟网游', '游戏异界']},
        {major: '竞技', mins: ['体育竞技', '篮球运动', '足球运动', '棋牌桌游']},
        {
            major: '科幻',
            mins: ['星际战争', '时空穿梭', '未来世界', '古武机甲', '超级科技', '进化变异', '末世危机']
        },
        {major: '灵异', mins: ['推理侦探', '恐怖惊悚', '悬疑探险', '灵异奇谈']},
        {
            major: '同人',
            mins: ['武侠同人', '影视同人', '动漫同人', '游戏同人', '小说同人']
        },
        {major: '轻小说', mins: []}],
    female: [{
        major: '古代言情',
        mins: ['穿越时空', '古代历史', '古典架空', '宫闱宅斗', '经商种田']
    },
        {
            major: '现代言情',
            mins: ['豪门总裁', '都市生活', '婚恋情感', '商战职场', '异术超能']
        },
        {major: '青春校园', mins: []},
        {major: '纯爱', mins: ['古代纯爱', '现代纯爱']},
        {major: '玄幻奇幻', mins: ['玄幻异世', '奇幻魔法']},
        {major: '武侠仙侠', mins: ['武侠', '仙侠']},
        {major: '科幻', mins: []},
        {major: '游戏竞技', mins: []},
        {major: '悬疑灵异', mins: ['悬疑', '灵异']},
        {
            major: '同人',
            mins: ['小说同人', '动漫同人', '影视同人', '游戏同人', '耽美同人']
        },
        {major: '女尊', mins: []},
        {major: '莉莉', mins: []}
    ]
};

class CategoryList extends Component {
    constructor(props) {
        super(props)
        this.state = {
            gender: 'male',
            major: '玄幻',
            minor: '东方玄幻'
        }
        this.currentTab = null
        this.current_mins = []
        this.major_tab = null
        this.minor_tab = null
    }

    componentDidMount() {
        const {dispatch} = this.props
        InteractionManager.runAfterInteractions(()=> {
            dispatch(categoryListBasic())
            dispatch(categoryListV2())
        })
    }

    _changeGender() {
        console.log('_changeGender: ' + this.state.gender)

        if (this.state.gender == 'male') {
            let major = category_list_v2.female[0].major
            let minors = this._get_minors(this.state.gender, major);
            let minor = minors.length > 0 ? minors[0] : '';

            this.setState({
                major: major,
                minor: minor
            });

            this.setState({
                gender: 'female',
                major: major,
                minor: minor
            })
        } else {
            let major = category_list_v2.male[0].major
            let minors = this._get_minors(this.state.gender, major);
            let minor = minors.length > 0 ? minors[0] : '';

            this.setState({
                major: major,
                minor: minor
            });

            this.setState({
                gender: 'male',
                major: major,
                minor: minor
            })

        }

        this._init_major_tab()
        this._init_minor_tab()
    }

    _onChangeTab(obj) {
        const {categoryList} = this.props

        this.currentTab = obj

        let test = (this.state.gender == 'male') ? categoryList.maleList : categoryList.femaleList

        if (Array.prototype.isPrototypeOf(test) && test.length === 0) {
            return
        }

        let major = test[obj.i].name
        let minors = this._get_minors(this.state.gender, major)
        let minor = minors.length > 0 ? minors[0] : '';
        this.setState({
            major: major,
            minor: minor
        });

        this._init_minor_tab()
    }

    _init_minor_tab() {
        if (this.minor_tab != null) setTimeout(() => {
            InteractionManager.runAfterInteractions(() => {
                try {
                    this.minor_tab.goToPage(0, false);
                }catch (e) {

                }
            });
        }, 0);
    }

    _init_major_tab() {
        if (this.major_tab != null) setTimeout(() => {
            InteractionManager.runAfterInteractions(() => {
                try {
                    this.major_tab.goToPage(0, false);
                }catch (e) {

                }
            });
        }, 0);
    }
    _onChangeMinor(obj) {
        let test = this.current_mins
        if (Array.prototype.isPrototypeOf(test) && test.length === 0) {
            return
        }
        let minor = this.current_mins[obj.i]
        console.log('_onChangeMinor, minor=' + minor)
        this.setState({
            minor: minor
        })
    }

    _get_minors(gender, major) {
        if (gender == 'male') {
            for (let i = 0; i < category_list_v2.male.length; ++i) {
                let current_major = category_list_v2.male[i];
                if (current_major.major == major) {
                    return current_major.mins
                }
            }
        } else {
            for (let i = 0; i < category_list_v2.female.length; ++i) {
                let current_major = category_list_v2.female[i];
                if (current_major.major == major) {
                    return current_major.mins
                }
            }
        }
        return []
    }

    render() {
        const {categoryList} = this.props
        let mins = this._get_minors(this.state.gender, this.state.major);
        this.current_mins = mins;


        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={[styles.headerLeftText, {flex:1}]}>
                        {this.state.gender == 'male' ? '男生' : '女生'}分类
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
                    ref={(major_tab) => { this.major_tab = major_tab; }}
                    tabBarUnderlineStyle={{backgroundColor: '#FF0000', height: 0}}
                    tabBarActiveTextColor={'#00FF00'}
                    renderTabBar={() => <ScrollableTabBar style={{height: 40}}/>}
                    onChangeTab={(obj)=>{this._onChangeTab(obj)}}
                >
                    {
                        this.state.gender == 'male' ?
                            categoryList.maleList.map((item, index)=> {
                                return (<Text tabLabel={item.name}/>)
                            })
                            :
                            categoryList.femaleList.map((item, index)=> {
                                return (<Text tabLabel={item.name}/>)
                            })

                    }
                </ScrollableTabView>

                {
                    mins.length > 0 ? <ScrollableTabView
                        ref={(minor_tab) => { this.minor_tab = minor_tab; }}
                        tabBarUnderlineStyle={{backgroundColor: '#FF0000', height: 0}}
                        tabBarActiveTextColor={'#00FF00'}
                        renderTabBar={() => <ScrollableTabBar style={{height: 40}}/>}
                        onChangeTab={(obj)=>{this._onChangeMinor(obj)}}
                    >
                        {
                            mins.map((item, index)=> {
                                return (<Text tabLabel={item}/>)
                            })

                        }
                    </ScrollableTabView> : null
                }


                <CategoryDetail
                    style={{flex:1}}
                    gender={this.state.gender}
                    major={this.state.major}
                    minor={this.state.minor}
                    navigator={this.props.navigator}
                />

            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: config.css.color.appBackground,
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
    body: {
        flex: 1
    },
    listStyle: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: config.css.color.line
    },
    listHeader: {
        width: Dimen.window.width,
        margin: 14,
        fontSize: config.css.fontSize.appTitle,
        color: config.css.fontColor.title,
    },
    item: {
        width: Dimen.window.width / 3 - 1,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0.5,
        backgroundColor: config.css.color.white
    },
    itemTitle: {
        fontSize: config.css.fontSize.title,
        color: config.css.fontColor.title,
        alignSelf: 'center'
    },
    itemDesc: {
        fontSize: config.css.fontSize.desc,
        color: config.css.fontColor.desc,
        marginTop: 3,
        alignSelf: 'center'
    }
})

function mapStateToProps(store) {
    const { categoryList } = store
    return {
        categoryList
    }
}

export default connect(mapStateToProps)(CategoryList)