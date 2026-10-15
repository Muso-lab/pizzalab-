# ProGuard / R8 Configuration for PizzaLab Scientifico

# 1. JavaScript Interface & WebView Bridge (FONDAMENTALE)
# Preserva l'annotazione @JavascriptInterface e tutti i metodi esposti alla WebApp
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.pizzalab.scientifico.MainActivity$WebAppInterface {
    public *;
}

# 2. WebView e WebKit Components
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String);
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
}
-keep class androidx.webkit.** { *; }

# 3. Google Mobile Ads (AdMob) SDK
# L'SDK include già consumer-rules, ma queste regole garantiscono stabilità assoluta
-keep public class com.google.android.gms.ads.** {
    public *;
}
-keep public class com.google.ads.** {
    public *;
}
-dontwarn com.google.android.gms.ads.**

# 4. Preserva LineNumberTable e SourceFile per de-offuscamento e crash report su Play Console
-keepattributes SourceFile,LineNumberTable
