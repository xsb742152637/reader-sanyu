package com.axiamireader;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.widget.Toast;

import com.umeng.analytics.MobclickAgent;

public class MainActivity extends ReactActivity2 {
    private View mRootView;
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
        //初始化rnrootview
        super.onCreate(savedInstanceState);
        //获取rnrootview
        mRootView = getRootView();
        //模拟loadding图片
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                mRootView.setVisibility(View.INVISIBLE);
                setContentView(mRootView);
            }
        },2000);
        registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                mRootView.setVisibility(View.VISIBLE);
                //Toast.makeText(MainActivity.this, "显示页面了", Toast.LENGTH_SHORT).show();
            }
        }, new IntentFilter("com.axiamireader.show"));

    }

    @Override
    public void onResume() {
        super.onResume();
        MobclickAgent.onResume(this);
    }

    @Override
    public void onPause() {
        super.onPause();
        MobclickAgent.onPause(this);
    }
}
