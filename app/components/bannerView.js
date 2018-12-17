/**
 * Created by bingo on 2018/11/7.
 */


import React, { Component } from "react";
import PropTypes from "prop-types";
import { View, requireNativeComponent } from "react-native";

//requireNativeComponent函数中的第一个参数就是刚刚CircleManager.getName返回的值。
const TencentBannerView = requireNativeComponent("TencentBannerView");


module .exports = TencentBannerView;