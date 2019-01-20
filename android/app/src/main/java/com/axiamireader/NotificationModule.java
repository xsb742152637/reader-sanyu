package com.axiamireader;

import android.content.Intent;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

class NotificationModule extends ReactContextBaseJavaModule {

    public NotificationModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "Notification";
    }

    @ReactMethod
    public void showContentView() {
        getCurrentActivity().sendBroadcast(new Intent("com.axiamireader.show"));
    }
}