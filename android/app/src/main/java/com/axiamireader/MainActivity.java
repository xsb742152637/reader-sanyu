package com.axiamireader;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.KeyEvent;
import android.widget.Toast;

import com.facebook.react.ReactActivity;
import com.umeng.analytics.MobclickAgent;

public class MainActivity extends ReactActivity {
    private long exitTime = 0;
    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "simplereader";
    }
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i("AD_DEMO", "MainActivity-------------onCreate");
        if(!isTaskRoot()){
            Intent i=getIntent();
            String action=i.getAction();
            if(i.hasCategory(Intent.CATEGORY_APP_CALENDAR) && !TextUtils.isEmpty(action) && action.equals(Intent.ACTION_MAIN)){
//                Toast.makeText(getApplicationContext(), "程序已经启动过了~",Toast.LENGTH_SHORT).show();
                finish();
                System.exit(0);
                return;
            }
        }
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
    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.i("AD_DEMO", "MainActivity-------------onDestroy");
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
//        if (keyCode == KeyEvent.KEYCODE_BACK) {
//            exit();
//            return false;
//        }
        return super.onKeyDown(keyCode, event);
    }

    public void exit() {
        if ((System.currentTimeMillis() - exitTime) > 1000) {
            Toast.makeText(getApplicationContext(), "再按一次退出程序~~~",Toast.LENGTH_SHORT).show();
            exitTime = System.currentTimeMillis();
        } else {
            Toast.makeText(getApplicationContext(), "退出程序~~~",Toast.LENGTH_SHORT).show();
//            ActivityManager manager = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
//            manager.killBackgroundProcesses(getPackageName());
//
//            android.os.Process.killProcess(android.os.Process.myPid());
            finish();
            System.exit(0);
        }
    }
}
