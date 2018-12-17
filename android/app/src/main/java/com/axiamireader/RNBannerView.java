package com.axiamireader;
import android.app.Activity;
import android.util.Log;

import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.qq.e.ads.banner.ADSize;
import com.qq.e.ads.banner.AbstractBannerADListener;
import com.qq.e.ads.banner.BannerView;
import com.qq.e.comm.util.AdError;

/**
 * Created by bingo on 2018/11/7.
 */

public class RNBannerView extends SimpleViewManager<BannerView> {
    BannerView banner;
    @Override
    public String getName() {//组件名称
        return "TencentBannerView";
    }

    @Override
    protected BannerView createViewInstance(ThemedReactContext reactContext){
        Activity currentActivity = reactContext.getCurrentActivity();
        banner = new BannerView(currentActivity, ADSize.BANNER, Constants.APPID, Constants.BannerPosID);
        banner.setADListener(new AbstractBannerADListener() {
            @Override
            public void onNoAD(AdError error) {
                Log.i("AD_DEMO", "BannerNoAD，eCode=" + error.getErrorCode());
            }

            @Override
            public void onADReceiv() {
                Log.i("AD_DEMO", "ONBannerReceive");
            }
        });
        return banner;
    }

    @ReactMethod
    public void loadAd() {
        banner.loadAD();
    }
}
