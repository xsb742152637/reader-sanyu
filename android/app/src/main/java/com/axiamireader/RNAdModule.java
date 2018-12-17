package com.axiamireader;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;


import com.qq.e.ads.banner.ADSize;
import com.qq.e.ads.banner.AbstractBannerADListener;
import com.qq.e.ads.banner.BannerView;
import com.qq.e.comm.util.AdError;

import com.qq.e.ads.interstitial.AbstractInterstitialADListener;
import com.qq.e.ads.interstitial.InterstitialAD;
import com.qq.e.comm.util.AdError;

/**
 * Created by bingo on 2018/10/16.
 */

public class RNAdModule extends ReactContextBaseJavaModule {
    public RNAdModule(final ReactApplicationContext reactContext) {
        super(reactContext);
    }

    InterstitialAD iad;

    @Override
    public String getName() {
        return "RNAdModule";
    }

    @ReactMethod
    public void showAd(String name) {
        try {
            Activity currentActivity = getCurrentActivity();
            if (null == currentActivity) return;

            if (name.startsWith("banner")) {
                showIADAsPopup();
            } else {

                Class aimActivity = Class.forName(name);
                Intent intent = new Intent(currentActivity, aimActivity);

                Bundle bundle = new Bundle();
                bundle.putString("display_type", new String("react"));
                intent.putExtras(bundle);

                currentActivity.startActivity(intent);
                currentActivity.overridePendingTransition(0, 0);
            }
        } catch (Exception e) {
            throw new JSApplicationIllegalArgumentException(
                    "无法打开activity页面: " + e.getMessage());
        }
    }


    private InterstitialAD getInterIAD() {
        if (iad != null) {
            iad.closePopupWindow();
            iad.destroy();
            iad = null;
        }
        Activity currentActivity = getCurrentActivity();
        iad = new InterstitialAD(currentActivity, Constants.APPID, Constants.InterteristalPosID);
        return iad;
    }

    private void showIADAsPopup() {
        getInterIAD().setADListener(new AbstractInterstitialADListener() {
            @Override
            public void onNoAD(AdError error) {
                Log.i(
                        "AD_DEMO",
                        String.format("LoadInterstitialAd Fail, error code: %d, error msg: %s",
                                error.getErrorCode(), error.getErrorMsg()));
            }

            @Override
            public void onADReceive() {
//                iad.showAsPopupWindow();
                iad.show();
            }
        });
        iad.loadAD();
    }

    private void closeAsPopup() {
        if (iad != null) {
            iad.closePopupWindow();
        }
    }
}
