<!DOCTYPE html>
<html>
<head>
    <title>Welcome to Delta Web Map</title>
    <?php include "/var/www/delta/site_assets/head.php"; ?>
    <link rel="stylesheet" href="/assets/frontpage/landing/landing_v2.css">
</head>
<body>
    <div class="landing_blue_top">
        <div class="landing_top_title">
            <div class="landing_top_title_big">SUPERCHARGE YOUR ARK TRIBE</div>
            <div class="landing_top_title_sub">Delta Web Map is a PVP-safe tool to manage your ARK: Survival Evolved tribe, right from your web browser.</div>
        </div>
        <div class="landing_top_btn_container">
            <div class="landing_top_btn landing_top_btn_full" onclick="OnClickStartBtn();">Join as Player</div>
            <div class="landing_top_btn" onclick="window.location = '/app/#dwm-demo-frontpage-src';">Add Your Server</div>
        </div>
    </div>
    <div class="landing_top_img_container">
        <img src="/assets/frontpage/landing/img/big.png" class="landing_top_img">
        <div class="landing_top_img_container_bg"></div>
    </div>

    <script src="/assets/frontpage/landing/landing.js"></script>
</body>
</html>