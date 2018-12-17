/*
 * description: 界面的toolbar
 * author: 神编小码
 * time: 
 */


import React, { Component } from 'react'
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import config from '../common/config'

export default class ToolBar extends Component {

    static propTypes = {
        leftClick: React.PropTypes.func,
        leftIcon: React.PropTypes.string,
        title: React.PropTypes.string,
        rightClick: React.PropTypes.func,
        rightIcon: React.PropTypes.string,
    }

    render() {
        return (
            <View style={styles.header}>
                <TouchableOpacity style={{width: 60}}
                                  onPress={this.props.leftClick}>
                    <Icon
                        name={this.props.leftIcon === undefined ? 'ios-arrow-back-outline' : this.props.leftIcon}
                        style={styles.headerIcon}
                        size={25}
                        color={config.css.color.white}
                        onPress={this.props.leftClick}/>
                </TouchableOpacity>
                <Text style={styles.headerText}>{this.props.title}</Text>
                <Icon
                    name={this.props.rightIcon === undefined ? 'ios-arrow-forward-outline' : this.props.rightIcon}
                    style={styles.headerIcon}
                    size={25}
                    color={this.props.rightIcon === undefined ? config.css.color.appMainColor : config.css.color.white}
                    onPress={this.props.rightClick}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    header: {
        height: config.css.headerHeight,
        backgroundColor: config.css.color.appMainColor,
        flexDirection: 'row',
        alignItems: 'center'
    },
    headerIcon: {
        marginLeft: 14,
        marginRight: 14
    },
    headerText: {
        flex: 1,
        textAlign: 'center',
        color: config.css.fontColor.white,
        fontSize: config.css.fontSize.appTitle
    },
})