package com.axiamireader;

import android.util.Log;

import com.facebook.react.ReactActivity;
import com.umeng.analytics.MobclickAgent;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "simplereader";
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.i("AD_DEMO", "MainActivity-------------onResume");
        MobclickAgent.onResume(this);
    }

    @Override
    public void onPause() {
        super.onPause();
        Log.i("AD_DEMO", "MainActivity-------------onPause");
        MobclickAgent.onPause(this);
    }
}
