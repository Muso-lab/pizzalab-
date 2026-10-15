package com.pizzalab.scientifico;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "PizzaLabAdMob";
    // Banner ID di test ufficiale Google AdMob per fallback garantito su dispositivi di collaudo
    private static final String GOOGLE_TEST_BANNER_ID = "ca-app-pub-3940256099942544/6300978111";

    private WebView webView;
    private AdView adView;
    private FrameLayout adBannerFrame;
    private InterstitialAd mInterstitialAd;
    private long lastInterstitialTime = 0;
    // Intervallo minimo tra annunci a schermo intero: 3 minuti (180s)
    private static final long INTERSTITIAL_COOLDOWN_MS = 180_000;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Applica padding per evitare sovrapposizione con la barra di stato/notch in alto
        // e sollevare il banner AdMob sopra la barra di navigazione di sistema / gesture bar di Android in basso
        View root = findViewById(R.id.rootLayout);
        if (root != null) {
            ViewCompat.setOnApplyWindowInsetsListener(root, (v, windowInsets) -> {
                Insets insets = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
                );
                // Applichiamo SOLO insets.bottom per sollevare il banner AdMob sopra la barra gesti/navigazione di sistema.
                // NON applichiamo insets.top a rootLayout perché il tema NoActionBar gestisce già nativamente
                // la barra di stato, ed applicarlo creerebbe un'enorme voragine vuota di 140px sopra l'header.
                v.setPadding(0, 0, 0, insets.bottom);
                return windowInsets;
            });
            ViewCompat.requestApplyInsets(root);
        }

        // Assicura icone chiare (bianche) sulla barra di stato con sfondo scuro (#0f141c)
        WindowInsetsControllerCompat insetsController =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (insetsController != null) {
            insetsController.setAppearanceLightStatusBars(false);
        }

        webView = findViewById(R.id.webView);
        adBannerFrame = findViewById(R.id.adBannerFrame);
        adView = findViewById(R.id.adView);

        // Inizializzazione SDK Google Mobile Ads (AdMob) su UI thread
        MobileAds.initialize(this, initializationStatus -> {
            runOnUiThread(() -> {
                loadBannerAd();
                loadInterstitialAd();
            });
        });

        // Configurazione WebView
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        // Bridge JavaScript per permettere alla webapp di comunicare con AdMob
        webView.addJavascriptInterface(new WebAppInterface(this), "PizzaLabNative");
        webView.setWebViewClient(new WebViewClient());

        // Caricamento dell'applicazione dagli asset locali (100% offline ready)
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    /**
     * Carica il banner pubblicitario AdMob a fondo pagina.
     * Tenta prima con l'Ad Unit reale; se l'account non è ancora approvato da Google
     * (errore 3 No-Fill tipico degli APK di test sideloaded), carica il banner di test
     * ufficiale così che sia GARANTITO e sempre visibile.
     */
    private void loadBannerAd() {
        if (adView == null) return;
        AdRequest adRequest = new AdRequest.Builder().build();
        adView.setAdListener(new AdListener() {
            @Override
            public void onAdLoaded() {
                super.onAdLoaded();
                adView.setVisibility(View.VISIBLE);
                Log.d(TAG, "AdMob Banner primario caricato con successo!");
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                super.onAdFailedToLoad(loadAdError);
                Log.w(TAG, "AdMob Banner primario non disponibile (code " + loadAdError.getCode() + "): " + loadAdError.getMessage());
                // Fallback automatico sul banner di test ufficiale di Google per garantire la presenza visiva
                runOnUiThread(() -> loadFallbackTestBanner());
            }
        });
        adView.loadAd(adRequest);
    }

    private void loadFallbackTestBanner() {
        if (isFinishing() || isDestroyed()) return;
        if (adBannerFrame == null) return;

        try {
            AdView testAdView = new AdView(this);
            testAdView.setAdUnitId(GOOGLE_TEST_BANNER_ID);
            testAdView.setAdSize(AdSize.BANNER);
            FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER
            );
            testAdView.setLayoutParams(lp);

            testAdView.setAdListener(new AdListener() {
                @Override
                public void onAdLoaded() {
                    super.onAdLoaded();
                    adBannerFrame.removeAllViews();
                    adBannerFrame.addView(testAdView);
                    adView = testAdView;
                    Log.d(TAG, "Google Test Banner caricato con successo!");
                }

                @Override
                public void onAdFailedToLoad(@NonNull LoadAdError err) {
                    super.onAdFailedToLoad(err);
                    Log.e(TAG, "Fallback banner fallito: " + err.getMessage());
                }
            });

            AdRequest testRequest = new AdRequest.Builder().build();
            testAdView.loadAd(testRequest);
        } catch (Exception e) {
            Log.e(TAG, "Eccezione caricamento banner di fallback:", e);
        }
    }

    /**
     * Precarica l'annuncio interstiziale a schermo intero
     */
    private void loadInterstitialAd() {
        AdRequest adRequest = new AdRequest.Builder().build();
        InterstitialAd.load(this, getString(R.string.admob_interstitial_ad_unit_id), adRequest,
            new InterstitialAdLoadCallback() {
                @Override
                public void onAdLoaded(@NonNull InterstitialAd interstitialAd) {
                    mInterstitialAd = interstitialAd;
                    mInterstitialAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                        @Override
                        public void onAdDismissedFullScreenContent() {
                            mInterstitialAd = null;
                            loadInterstitialAd(); // Ricarica per la prossima volta
                        }

                        @Override
                        public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                            mInterstitialAd = null;
                        }
                    });
                }

                @Override
                public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                    mInterstitialAd = null;
                }
            });
    }

    /**
     * Mostra l'annuncio interstiziale rispettando il cooldown
     */
    public void showInterstitialAd() {
        long now = System.currentTimeMillis();
        if (now - lastInterstitialTime >= INTERSTITIAL_COOLDOWN_MS) {
            if (mInterstitialAd != null) {
                lastInterstitialTime = now;
                mInterstitialAd.show(this);
            }
        }
    }

    /**
     * Interfaccia JavaScript esposta alla WebApp
     */
    public static class WebAppInterface {
        private final MainActivity activity;

        public WebAppInterface(MainActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void triggerInterstitial() {
            activity.runOnUiThread(activity::showInterstitialAd);
        }

        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (adView != null) adView.resume();
    }

    @Override
    protected void onPause() {
        if (adView != null) adView.pause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (adView != null) adView.destroy();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
