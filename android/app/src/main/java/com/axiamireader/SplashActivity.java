package com.axiamireader;

import android.Manifest;
import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.qq.e.ads.splash.SplashAD;
import com.qq.e.ads.splash.SplashADListener;
import com.qq.e.comm.util.AdError;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

/**
 * 这是demo工程的入口Activity，在这里会首次调用广点通的SDK。
 * <p>
 * 在调用SDK之前，如果您的App的targetSDKVersion >= 23，那么一定要把"READ_PHONE_STATE"、"WRITE_EXTERNAL_STORAGE"、"ACCESS_FINE_LOCATION"这几个权限申请到，否则SDK将不会工作。
 */
public class SplashActivity extends Activity implements SplashADListener {

    private SplashAD splashAD;
    private ViewGroup container;
    private TextView skipView;
    private ImageView splashHolder;
    private static final String SKIP_TEXT = "跳过%d";

    public boolean canJump = false;

    /**
     * 为防止无广告时造成视觉上类似于"闪退"的情况，设定无广告时页面跳转根据需要延迟一定时间，demo
     * 给出的延时逻辑是从拉取广告开始算开屏最少持续多久，仅供参考，开发者可自定义延时逻辑，如果开发者采用demo
     * 中给出的延时逻辑，也建议开发者考虑自定义minSplashTimeWhenNoAD的值（单位ms）
     **/
    private int minSplashTimeWhenNoAD = 2000;
    /**
     * 记录拉取广告的时间
     */
    private long fetchSplashADTime = 0;
    private Handler handler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.splash_activity_ly);
        container = (ViewGroup) this.findViewById(R.id.splash_container);
        skipView = (TextView) findViewById(R.id.skip_view);
        splashHolder = (ImageView) findViewById(R.id.splash_holder);

        sendRequestWithHttpClient();
    }

    private void sendRequestWithHttpClient() {
        new Thread(new Runnable() {

            @Override
            public void run() {
                try {
                    URL url = new URL("http://www.docket.com.cn/258reader/latest.json");//放网站
                    HttpURLConnection httpURLConnection = (HttpURLConnection) url.openConnection();
                    int status = httpURLConnection.getResponseCode();
                    Log.i("AD_DEMO", "SplashADPresent:"  + status);
                    if (status == 200) {
                        startReader();
                    }else{
                        showSplahAd();
                    }

                } catch (Exception e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                    startReader();
                }

            }
        }).start();//这个start()方法不要忘记了

    }

    private void showSplahAd() {
        if (Build.VERSION.SDK_INT >= 23) {
            checkAndRequestPermission();
        } else {
            // 如果是Android6.0以下的机器，默认在安装时获得了所有权限，可以直接调用SDK
            fetchSplashAD(this, container, skipView, Constants.APPID, getPosId(), this, 0);
        }
    }

    private String getPosId() {
        String posId = getIntent().getStringExtra("pos_id");
        return TextUtils.isEmpty(posId) ? Constants.SplashPosID : posId;
    }

    /**
     * ----------非常重要----------
     * <p>
     * Android6.0以上的权限适配简单示例：
     * <p>
     * 如果targetSDKVersion >= 23，那么必须要申请到所需要的权限，再调用广点通SDK，否则广点通SDK不会工作。
     * <p>
     * Demo代码里是一个基本的权限申请示例，请开发者根据自己的场景合理地编写这部分代码来实现权限申请。
     * 注意：下面的`checkSelfPermission`和`requestPermissions`方法都是在Android6.0的SDK中增加的API，如果您的App还没有适配到Android6.0以上，则不需要调用这些方法，直接调用广点通SDK即可。
     */
    @TargetApi(Build.VERSION_CODES.M)
    private void checkAndRequestPermission() {
        List<String> lackedPermission = new ArrayList<String>();
        if (!(checkSelfPermission(Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED)) {
            lackedPermission.add(Manifest.permission.READ_PHONE_STATE);
        }

        if (!(checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED)) {
            lackedPermission.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
        }

        if (!(checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED)) {
            lackedPermission.add(Manifest.permission.ACCESS_FINE_LOCATION);
        }

        // 权限都已经有了，那么直接调用SDK
        if (lackedPermission.size() == 0) {
            fetchSplashAD(this, container, skipView, Constants.APPID, getPosId(), this, 0);
        } else {
            // 请求所缺少的权限，在onRequestPermissionsResult中再看是否获得权限，如果获得权限就可以调用SDK，否则不要调用SDK。
            String[] requestPermissions = new String[lackedPermission.size()];
            lackedPermission.toArray(requestPermissions);
            requestPermissions(requestPermissions, 1024);
        }
    }

    private boolean hasAllPermissionsGranted(int[] grantResults) {
        for (int grantResult : grantResults) {
            if (grantResult == PackageManager.PERMISSION_DENIED) {
                return false;
            }
        }
        return true;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 1024 && hasAllPermissionsGranted(grantResults)) {
            fetchSplashAD(this, container, skipView, Constants.APPID, getPosId(), this, 0);
        } else {
            // 如果用户没有授权，那么应该说明意图，引导用户去设置里面授权。
            Toast.makeText(this, "应用缺少必要的权限！请点击\"权限\"，打开所需要的权限。", Toast.LENGTH_LONG).show();
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + getPackageName()));
            startActivity(intent);
            finish();
        }
    }

    /**
     * 拉取开屏广告，开屏广告的构造方法有3种，详细说明请参考开发者文档。
     *
     * @param activity      展示广告的activity
     * @param adContainer   展示广告的大容器
     * @param skipContainer 自定义的跳过按钮：传入该view给SDK后，SDK会自动给它绑定点击跳过事件。SkipView的样式可以由开发者自由定制，其尺寸限制请参考activity_splash.xml或者接入文档中的说明。
     * @param appId         应用ID
     * @param posId         广告位ID
     * @param adListener    广告状态监听器
     * @param fetchDelay    拉取广告的超时时长：取值范围[3000, 5000]，设为0表示使用广点通SDK默认的超时时长。
     */
    private void fetchSplashAD(Activity activity, ViewGroup adContainer, View skipContainer,
                               String appId, String posId, SplashADListener adListener, int fetchDelay) {
        fetchSplashADTime = System.currentTimeMillis();
        splashAD = new SplashAD(activity, adContainer, skipContainer, appId, posId, adListener, fetchDelay);
    }

    @Override
    public void onADPresent() {
        Log.i("AD_DEMO", "SplashADPresent");
        splashHolder.setVisibility(View.INVISIBLE); // 广告展示后一定要把预设的开屏图片隐藏起来
    }

    @Override
    public void onADClicked() {
        Log.i("AD_DEMO", "SplashADClicked");
    }

    /**
     * 倒计时回调，返回广告还将被展示的剩余时间。
     * 通过这个接口，开发者可以自行决定是否显示倒计时提示，或者还剩几秒的时候显示倒计时
     *
     * @param millisUntilFinished 剩余毫秒数
     */
    @Override
    public void onADTick(long millisUntilFinished) {
        Log.i("AD_DEMO", "SplashADTick " + millisUntilFinished + "ms");
        skipView.setText(String.format(SKIP_TEXT, Math.round(millisUntilFinished / 1000f)));
    }

    @Override
    public void onADExposure() {
        Log.i("AD_DEMO", "SplashADExposure");
    }

    @Override
    public void onADDismissed() {
        Log.i("AD_DEMO", "SplashADDismissed");
        next();
    }

    @Override
    public void onNoAD(AdError error) {
        Log.i(
                "AD_DEMO",
                String.format("LoadSplashADFail, eCode=%d, errorMsg=%s", error.getErrorCode(),
                        error.getErrorMsg()));
        /**
         * 为防止无广告时造成视觉上类似于"闪退"的情况，设定无广告时页面跳转根据需要延迟一定时间，demo
         * 给出的延时逻辑是从拉取广告开始算开屏最少持续多久，仅供参考，开发者可自定义延时逻辑，如果开发者采用demo
         * 中给出的延时逻辑，也建议开发者考虑自定义minSplashTimeWhenNoAD的值
         **/
        long alreadyDelayMills = System.currentTimeMillis() - fetchSplashADTime;//从拉广告开始到onNoAD已经消耗了多少时间
        long shouldDelayMills = alreadyDelayMills > minSplashTimeWhenNoAD ? 0 : minSplashTimeWhenNoAD
                - alreadyDelayMills;//为防止加载广告失败后立刻跳离开屏可能造成的视觉上类似于"闪退"的情况，根据设置的minSplashTimeWhenNoAD
        // 计算出还需要延时多久
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                SplashActivity.this.startActivity(new Intent(SplashActivity.this, MainActivity.class));
                SplashActivity.this.finish();
            }
        }, shouldDelayMills);
    }

    public void startReader() {
        try {

            Bundle myBundelForGetName = this.getIntent().getExtras();
            String name = myBundelForGetName.getString("display_type");

            Log.e("afanna", "display type = " + name);

            if (name.equals("react")) {
                Log.e("afanna", "display type is react");
                return;
            } else {
                Log.e("afanna", "display type is not react, start reader");
                Intent intent = new Intent();
                intent.setClass(SplashActivity.this, MainActivity.class);
                SplashActivity.this.startActivity(intent);
                SplashActivity.this.overridePendingTransition(0, 0);
            }
        } catch (NullPointerException ex) {
            Log.e("afanna", ex.getMessage());
            Intent intent = new Intent();
            intent.setClass(SplashActivity.this, MainActivity.class);
            SplashActivity.this.startActivity(intent);
            SplashActivity.this.overridePendingTransition(0, 0);
        }

    }

    /**
     * 设置一个变量来控制当前开屏页面是否可以跳转，当开屏广告为普链类广告时，点击会打开一个广告落地页，此时开发者还不能打开自己的App主页。当从广告落地页返回以后，
     * 才可以跳转到开发者自己的App主页；当开屏广告是App类广告时只会下载App。
     */
    private void next() {
        if (canJump) {
            startReader();
//            this.startActivity(new Intent(this, MainActivity.class));
            this.finish();
        } else {
            canJump = true;
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        canJump = false;
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (canJump) {
            next();
        }
        canJump = true;
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        handler.removeCallbacksAndMessages(null);
    }

    /**
     * 开屏页一定要禁止用户对返回按钮的控制，否则将可能导致用户手动退出了App而广告无法正常曝光和计费
     */
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK || keyCode == KeyEvent.KEYCODE_HOME) {
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

}


//import android.view.KeyEvent;
//import android.view.View;
//import android.widget.FrameLayout;
//import android.widget.ImageView;
//import android.widget.TextView;
//import android.widget.Toast;
//
//import com.anzhi.sdk.ad.main.AzSplashAd;
//import com.anzhi.sdk.ad.manage.AnzhiAdCallBack;
//import com.axiamireader.AdIDs;
//import com.axiamireader.MainActivity;
//
//import java.util.ArrayList;
//import java.util.List;
//
//
//public class SplashActivity extends Activity {
//    private AzSplashAd splshAd;
//    TextView tx;
//    ImageView holder;
//    private boolean next;
//
//    private boolean isFront = false;//这个值表示页面是否在前台（true 表示在，false 表示不在前台）
//
//    private boolean isClosed = false;//该值表示广告是否关闭（isClosed 为 true 表示该广告关闭了，false 表示该广告没有关闭）
//
//
//    @Override
//    protected void onCreate(Bundle savedInstanceState) {
//        super.onCreate(savedInstanceState);
//        setContentView(R.layout.splash_activity_ly);
//        holder = (ImageView) findViewById(R.id.anzhi_splash_holder);
//        tx = (TextView) findViewById(R.id.anzhi_skip_view);
//
//        // 如果targetSDKVersion >= 23，就要申请好权限。如果您的App没有适配到Android6.0（即targetSDKVersion < 23）。
//        if (Build.VERSION.SDK_INT >= 23) {
//            checkAndRequestPermission();
//        } else {
//            // 如果是Android6.0以下的机器，默认在安装时获得了所有权限，可以直接调用SDK
//            loadAdSplash();
//        }
//    }
//
//    private void loadAdSplash() {
//        splshAd = new AzSplashAd(this, AdIDs.APPKEY, AdIDs.SPLASH_ID, new AnzhiAdCallBack() {
//            @Override
//            public void onShow() {
//                holder.setVisibility(View.INVISIBLE);
//                Log.e("","--闪屏广告展示---");
//            }
//
//            @Override
//            public void onReceiveAd() {
//            }
//
//            @Override
//            public void onLoadFailed(String result) {
//                Log.e("","--闪屏广告加载失败---原因----：" + result);
//                toNextActivity();
//            }
//
//            /*
//             *
//             * 关闭广告
//             */
//            @Override
//            public void onCloseAd() {
//                toNextActivity();
//                Log.e("","--闪屏广告关闭");
//            }
//
//            @Override
//            public void onAdExposure() {
//
//            }
//
//            @Override
//            public void onADTick(long millisUntilFinished) {
//                tx.setText(String.format("点击跳过 %d", Math.round(millisUntilFinished / 1000f)));
//            }
//
//            @Override
//            public void onAdClik() {
//                Log.e("","---闪屏广告被点击---");
//            }
//        }, (FrameLayout) findViewById(R.id.anzhi_splash_container), tx);
//        splshAd.setDelayTimes(5);
//        splshAd.loadAd();
//    }
//
//    /**
//     * 跳转到新的页面
//     */
//    private void toNextActivity() {
//        isClosed = true;
//        if (isFront) {
//            if (next) {
//                return;
//            }
//            next = true;
//            finish();
//
//            try{
//                Bundle myBundelForGetName=this.getIntent().getExtras();
//                String name = myBundelForGetName.getString("display_type");
//
//                Log.e("afanna","display type = " + name);
//
//                if (name.equals("react")) {
//                    Log.e("afanna","display type is react");
//                    return;
//                }else{
//                    Log.e("afanna","display type is not react, start reader");
//                    startReader();
//                }
//            }catch (NullPointerException ex) {
//                Log.e("afanna",ex.getMessage());
//                startReader();
//            }
//        }
//    }
//
//    public void startReader() {
//        Intent intent = new Intent();
//        intent.setClass(SplashActivity.this, MainActivity.class);
//        SplashActivity.this.startActivity(intent);
//        SplashActivity.this.overridePendingTransition(0, 0);
//    }
//
//    @Override
//    protected void onResume() {
//        super.onResume();
//        isFront = true;
//        if (isClosed) {
//            toNextActivity();
//        }
//        if (splshAd != null) {
//            splshAd.onResume();
//        }
//    }
//
//    @Override
//    protected void onDestroy() {
//        splshAd.onDestroy();
//        super.onDestroy();
//    }
//
//    @Override
//    protected void onPause() {
//        isFront = false;
//        super.onPause();
//    }
//
//    /**
//     * ----------非常重要----------
//     * <p>
//     * Android6.0以上的权限适配简单示例：
//     * <p>
//     * 如果targetSDKVersion >= 23，那么必须要申请到所需要的权限，再调用广点通SDK，否则广点通SDK不会工作。
//     * <p>
//     * Demo代码里是一个基本的权限申请示例，请开发者根据自己的场景合理地编写这部分代码来实现权限申请。
//     * 注意：下面的`checkSelfPermission`和`requestPermissions`方法都是在Android6.0的SDK中增加的API，如果您的App还没有适配到Android6.0以上，则不需要调用这些方法，直接调用广点通SDK即可。
//     */
//    @TargetApi(Build.VERSION_CODES.M)
//    private void checkAndRequestPermission() {
//        List<String> lackedPermission = new ArrayList<String>();
//        if (!(checkSelfPermission(Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED)) {
//            lackedPermission.add(Manifest.permission.READ_PHONE_STATE);
//        }
//
//        if (!(checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED)) {
//            lackedPermission.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
//        }
//
//        if (!(checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED)) {
//            lackedPermission.add(Manifest.permission.ACCESS_FINE_LOCATION);
//        }
//
//        // 权限都已经有了，那么直接调用SDK
//        if (lackedPermission.size() == 0) {
//            loadAdSplash();
//        } else {
//            // 请求所缺少的权限，在onRequestPermissionsResult中再看是否获得权限，如果获得权限就可以调用SDK，否则不要调用SDK。
//            String[] requestPermissions = new String[lackedPermission.size()];
//            lackedPermission.toArray(requestPermissions);
//            requestPermissions(requestPermissions, 1024);
//        }
//    }
//
//    private boolean hasAllPermissionsGranted(int[] grantResults) {
//        for (int grantResult : grantResults) {
//            if (grantResult == PackageManager.PERMISSION_DENIED) {
//                return false;
//            }
//        }
//        return true;
//    }
//
//    @Override
//    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
//        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
//        if (requestCode == 1024 && hasAllPermissionsGranted(grantResults)) {
//            loadAdSplash();
//        } else {
//            // 如果用户没有授权，那么应该说明意图，引导用户去设置里面授权。
//            Toast.makeText(this, "应用缺少必要的权限！请点击\"权限\"，打开所需要的权限。", Toast.LENGTH_LONG).show();
//            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
//            intent.setData(Uri.parse("package:" + getPackageName()));
//            startActivity(intent);
//            finish();
//        }
//    }
//
//    /**
//     * 防止用户返回键退出APP
//     */
//    @Override
//    public boolean onKeyDown(int keyCode, KeyEvent event) {
//        if (keyCode == KeyEvent.KEYCODE_BACK || keyCode == KeyEvent.KEYCODE_HOME) {
//            return true;
//        }
//        return super.onKeyDown(keyCode, event);
//    }
//}
