function getEmailFromUrl(requestUrl) {
  const url = new URL(requestUrl);

  // 支持：https://example.com/unsubscribe?=xxxxx@yahoo.co.jp
  if (url.search.startsWith("?=")) {
    return decodeURIComponent(url.search.slice(2));
  }

  // 备用支持：
  // https://example.com/unsubscribe?email=xxxxx@yahoo.co.jp
  return (
    url.searchParams.get("email") ||
    url.searchParams.get("mail") ||
    url.searchParams.get("e") ||
    ""
  );
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function onRequestGet(context) {
  const email = getEmailFromUrl(context.request.url);
  const safeEmail = escapeHtml(email);
  const valid = isValidEmail(email);

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>メール配信停止</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background: #f2f2f2;
      font-family: Arial, "Helvetica Neue", "Hiragino Kaku Gothic ProN",
        "Yu Gothic", Meiryo, sans-serif;
      color: #000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .page {
      width: 100%;
      max-width: 720px;
      padding: 40px 24px;
      text-align: center;
    }

    .logo {
      width: 420px;
      max-width: 82vw;
      height: auto;
      margin-bottom: 26px;
    }

    h1 {
      margin: 0 0 12px;
      font-size: 30px;
      font-weight: 700;
      line-height: 1.2;
    }

    .sub {
      margin: 0 0 10px;
      font-size: 16px;
      color: #777;
    }

    .email {
      margin-bottom: 14px;
      font-size: 15px;
      color: #333;
      word-break: break-all;
    }

    .button {
      width: 385px;
      max-width: 88vw;
      height: 36px;
      border: none;
      border-radius: 10px;
      background: #6bb5ff;
      color: #000;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.18s ease, opacity 0.18s ease;
    }

    .button:hover {
      transform: translateY(-1px);
      opacity: 0.92;
    }

    .button:active {
      transform: translateY(0);
    }

    .button:disabled {
      opacity: 0.55;
      cursor: default;
      transform: none;
    }

    .hidden {
      display: none;
    }

    .success-title {
      margin-top: 22px;
      font-size: 30px;
      font-weight: 700;
      line-height: 1.25;
    }

    .check-wrap {
      width: 76px;
      height: 76px;
      margin: 18px auto 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: softPop 0.55s cubic-bezier(.18, 1.35, .35, 1) both;
    }

    .check-svg {
      width: 68px;
      height: 68px;
    }

    .check-circle {
      fill: none;
      stroke: #18b957;
      stroke-width: 4;
      stroke-dasharray: 160;
      stroke-dashoffset: 160;
      animation: circleDraw 1.25s ease forwards;
    }

    .check-mark {
      fill: none;
      stroke: #18b957;
      stroke-width: 5;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      animation: checkDraw 0.48s 0.38s cubic-bezier(.2, .95, .25, 1) forwards;
    }

    .fade-in {
      animation: fadeIn 0.45s ease both;
    }

    @keyframes circleDraw {
      to {
        stroke-dashoffset: 0;
      }
    }

    @keyframes checkDraw {
      to {
        stroke-dashoffset: 0;
      }
    }

    @keyframes softPop {
      0% {
        transform: scale(0.72);
        opacity: 0;
      }
      60% {
        transform: scale(1.08);
        opacity: 1;
      }
      100% {
        transform: scale(1);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 480px) {
      h1,
      .success-title {
        font-size: 25px;
      }

      .logo {
        width: 340px;
      }
    }
  </style>
</head>

<body>
  <main class="page">
    <img class="logo" src="/unsubscribe/Hikari-TV_logo.png" alt="Logo" />

    <section id="formView" class="fade-in">
      <h1>メール配信を停止しますか？</h1>

      <p class="sub">メール配信設定をご確認ください：</p>

      <div class="email">
        ${valid ? safeEmail : "メールアドレスが確認できません"}
      </div>

      <button id="unsubscribeBtn" class="button" ${valid ? "" : "disabled"}>
        配信停止
      </button>
    </section>

    <section id="successView" class="hidden">
      <div class="check-wrap">
        <svg class="check-svg" viewBox="0 0 60 60">
          <circle class="check-circle" cx="30" cy="30" r="25"></circle>
          <path class="check-mark" d="M18 31.5 L27 40 L43 22"></path>
        </svg>
      </div>

      <div class="success-title">
        メール配信設定が更新されました。
      </div>
    </section>
  </main>

  <script>
    const btn = document.getElementById("unsubscribeBtn");

    if (btn) {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        btn.textContent = "更新中...";

        try {
          await fetch(window.location.href, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "List-Unsubscribe=One-Click"
          });

          document.getElementById("formView").classList.add("hidden");

          const success = document.getElementById("successView");
          success.classList.remove("hidden");
          success.classList.add("fade-in");
        } catch (error) {
          btn.disabled = false;
          btn.textContent = "配信停止";
          alert("更新できませんでした。しばらくしてからもう一度お試しください。");
        }
      });
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestPost(context) {
  const email = getEmailFromUrl(context.request.url);

  // 测试用：这里只打印，不写数据库
  console.log("One-click unsubscribe:", email);

  // 一键退订测试只需要正常响应即可
  return new Response("", {
    status: 200,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestOptions() {
  return new Response("", {
    status: 204,
    headers: {
      "Allow": "GET, POST, OPTIONS",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequest() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      "Allow": "GET, POST, OPTIONS"
    }
  });
}