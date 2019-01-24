package com.axiamireader;

import android.app.Application;
import android.os.Environment;
import android.support.annotation.Nullable;

import com.facebook.react.ReactApplication;

import io.realm.react.RealmReactPackage;

import com.oblador.vectoricons.VectorIconsPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.umeng.analytics.MobclickAgent;
import com.umeng.commonsdk.UMConfigure;

import java.io.File;
import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            return Arrays.<ReactPackage>asList(
                    new MainReactPackage(),
                    new RealmReactPackage(),
                    new VectorIconsPackage(),
                    new DplusReactPackage(),
                    new MyReactPackage()
            );
        }

        @Nullable
        @Override
        protected String getJSBundleFile() {
            String jsBundle = Environment.DIRECTORY_DOWNLOADS + "/index.android.bundle";
            File file = new File(jsBundle);
            if(file != null && file.exists()) {
                return jsBundle;
            } else {
                return super.getJSBundleFile();
            }
        }
    };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);
        /**
         * 初始化common库
         * 参数1:上下文，不能为空
         * 参数2:【友盟+】 AppKey
         * 参数3:【友盟+】 Channel
         * 参数4:设备类型，UMConfigure.DEVICE_TYPE_PHONE为手机、UMConfigure.DEVICE_TYPE_BOX为盒子，默认为手机
         * 参数5:Push推送业务的secret
         */
        RNUMConfigure.init(this, "5ba24b39b465f5f01100039b", "huawei", UMConfigure.DEVICE_TYPE_PHONE, "");
        MobclickAgent.setSessionContinueMillis(1000);
        MobclickAgent.setScenarioType(this, MobclickAgent.EScenarioType.E_DUM_NORMAL);
    }
}
