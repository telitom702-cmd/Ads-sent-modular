// Order 90: Multi-step countdown + ads page
// UI: Verify -> Read -> Get link -> Original Link Page
// Backend flow, timers, signatures and admin ad settings remain unchanged.

const config = require("../lib/config");

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));

const settings = [
  {
    key: "steps",
    label: "Number of steps (1-3)",
    type: "number",
    default: 3
  },
  {
    key: "siteName",
    label: "Site name (shown at the top)",
    type: "text",
    default: "DreamLinkerin"
  }
];

for (const n of [1, 2, 3]) {
  settings.push({
    key: `wait${n}`,
    label: `Step ${n}: wait seconds`,
    type: "number",
    default: 10
  });

  for (const p of ["head", "top", "bottom"]) {
    settings.push({
      key: `ad${n}_${p}`,
      label: `Step ${n}: ad code (${p})`,
      type: "textarea",
      default: ""
    });
  }
}

const wait = (c, n) =>
  Math.max(0, Number(c[`wait${n}`]) || 0);

const ad = (c, n, p) =>
  c[`ad${n}_${p}`] ||
  (n === 1 ? config[`AD_${p.toUpperCase()}`] || "" : "");

const brandLogo = (siteName) => `
<div class="brand">

  <div class="brand-logo">
    <svg viewBox="0 0 24 24">
      <path d="M13 2L4 13h7l-1 9 10-13h-7z"/>
    </svg>
  </div>

  <span>${esc(siteName)}</span>

</div>
`;

function renderOriginalPage(ctx, c) {

  const siteName =
    c.siteName || "DreamLinkerin";

  const originalUrl =
    ctx.link.url;

  return `<!doctype html>
<html lang="en">

<head>

<meta charset="utf-8">

<meta name="viewport"
      content="width=device-width,
      initial-scale=1,
      maximum-scale=1">

<meta name="robots" content="noindex">

<title>${esc(siteName)} - Link Ready</title>

${ad(c, 3, "head")}

<style>

:root{
  --bg:#f7f6fb;
  --card:#ffffff;
  --text:#17142d;
  --muted:#777487;
  --accent:#6252d9;
  --accent-light:#f0edff;
  --line:#e4e1ed;
}

*{
  box-sizing:border-box;
}

html,body{
  margin:0;
  padding:0;
}

body{
  min-height:100vh;

  background:
    linear-gradient(
      180deg,
      #faf9fd 0%,
      #f4f2fa 100%
    );

  color:var(--text);

  font-family:
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    Arial,
    sans-serif;

  display:flex;
  flex-direction:column;
  align-items:center;

  padding:22px 15px 30px;

  -webkit-font-smoothing:antialiased;
}

/* BRAND */

.brand{
  width:100%;
  max-width:460px;

  display:flex;
  align-items:center;
  justify-content:center;

  gap:10px;

  margin-bottom:15px;

  font-size:17px;
  font-weight:800;
}

.brand-logo{
  width:36px;
  height:36px;

  border-radius:11px;

  background:var(--accent-light);

  display:flex;
  align-items:center;
  justify-content:center;

  color:var(--accent);
}

.brand-logo svg{
  width:20px;
  height:20px;

  stroke:currentColor;
  fill:none;

  stroke-width:2.2;

  stroke-linecap:round;
  stroke-linejoin:round;
}

/* CARD */

.card{
  width:100%;
  max-width:460px;

  background:#fff;

  border:1px solid rgba(35,25,70,.07);

  border-radius:22px;

  padding:27px 20px 24px;

  text-align:center;

  box-shadow:
    0 10px 35px rgba(47,38,91,.06);
}

/* STATUS */

.status{
  display:inline-flex;

  align-items:center;

  gap:8px;

  padding:8px 14px;

  border-radius:999px;

  background:#f0edff;

  color:#6252d9;

  font-size:12px;

  font-weight:800;

  margin-bottom:18px;
}

.status-dot{
  width:8px;
  height:8px;

  border-radius:50%;

  background:#6252d9;
}

/* ICON */

.ready-icon{
  width:76px;
  height:76px;

  margin:0 auto 17px;

  border-radius:23px;

  background:#f0edff;

  display:flex;
  align-items:center;
  justify-content:center;

  color:#6252d9;
}

.ready-icon svg{
  width:40px;
  height:40px;

  fill:none;

  stroke:currentColor;

  stroke-width:1.9;

  stroke-linecap:round;

  stroke-linejoin:round;
}

/* TITLE */

h1{
  margin:0;

  font-size:29px;

  line-height:1.15;

  font-weight:800;

  letter-spacing:-.5px;
}

.description{
  margin:10px auto 23px;

  max-width:350px;

  color:var(--muted);

  font-size:14px;

  line-height:1.55;
}

/* LINK BUTTON */

.download-btn{
  display:flex;

  align-items:center;
  justify-content:center;

  width:100%;

  min-height:55px;

  border-radius:13px;

  background:#6252d9;

  color:#fff;

  text-decoration:none;

  font-size:15px;

  font-weight:800;

  letter-spacing:.2px;

  box-shadow:
    0 8px 20px rgba(98,82,217,.20);

  transition:
    transform .15s ease,
    opacity .15s ease;
}

.download-btn:active{
  transform:scale(.985);
}

.download-btn svg{
  width:19px;
  height:19px;

  margin-right:8px;

  fill:none;

  stroke:currentColor;

  stroke-width:2;

  stroke-linecap:round;

  stroke-linejoin:round;
}

/* AD */

.ad{
  width:100%;

  text-align:center;

  overflow:hidden;

  margin:22px auto 5px;
}

.ad-label{
  display:block;

  font-size:10px;

  color:#aaa6b4;

  margin-bottom:7px;

  letter-spacing:.3px;
}

/* FOOTER */

.footer{
  width:100%;

  max-width:460px;

  text-align:center;

  margin-top:18px;

  color:#9995a5;

  font-size:11px;

  line-height:1.5;
}

/* MOBILE */

@media(max-width:380px){

  body{
    padding:15px 10px 25px;
  }

  .card{
    padding:23px 15px 21px;
    border-radius:19px;
  }

  h1{
    font-size:26px;
  }

}

</style>

</head>

<body>

${brandLogo(siteName)}

<div class="card">

  <div class="status">
    <span class="status-dot"></span>
    LINK IS READY
  </div>

  <div class="ready-icon">

    <svg viewBox="0 0 24 24">

      <path d="M12 3l7 3v5c0 4.8-3 8-7 10
               -4-2-7-5.2-7-10V6l7-3z"/>

      <path d="M9 12l2 2 4-4"/>

    </svg>

  </div>

  <h1>
    Your link is ready
  </h1>

  <p class="description">
    Your destination is ready.
    Click the button below to continue.
  </p>

  <a
    class="download-btn"
    href="${esc(originalUrl)}">

    <svg viewBox="0 0 24 24">

      <path d="M12 3v12"/>

      <path d="M7 10l5 5 5-5"/>

      <path d="M5 21h14"/>

    </svg>

    DOWNLOAD / VISIT LINK

  </a>

  <div class="ad">

    <span class="ad-label">
      Advertisement
    </span>

    ${ad(c, 3, "bottom")}

  </div>

</div>

<div class="footer">
  © 2026 ${esc(siteName)} • All Rights Reserved
</div>

</body>

</html>`;
}


function render(ctx, c, n, steps) {

  const ts = Date.now();

  const sig =
    ctx.sign(
      ctx.code,
      n,
      ts
    );

  const W = wait(c, n);

  const last =
    n >= steps;

  const stepLabels =
    ["Verify", "Read", "Get link"];

  const indicators =
    Array.from(
      { length: steps },
      (_, i) => {

        const stepNumber =
          i + 1;

        let state =
          "upcoming";

        if(stepNumber < n){
          state = "done";
        }
        else if(stepNumber === n){
          state = "active";
        }

        return `
        <div class="step-item ${state}">

          <div class="step-circle">
            ${
              state === "done"
                ? "✓"
                : stepNumber
            }
          </div>

          <div class="step-label">
            ${esc(
              stepLabels[i] ||
              `Step ${stepNumber}`
            )}
          </div>

        </div>

        ${
          stepNumber < steps
            ? `<div class="step-line"></div>`
            : ""
        }

        `;

      }
    ).join("");


  const title =
    n === 1
      ? "Check you're human"
      : n === steps
        ? "Almost done"
        : "Please continue";


  const description =
    n === 1
      ? "Wait for the timer, then continue."
      : last
        ? "Almost done. Wait for the timer."
        : "Wait for the timer, then continue.";


  const buttonText =
    last
      ? "GET LINK"
      : "CONTINUE";


  return `<!doctype html>

<html lang="en">

<head>

<meta charset="utf-8">

<meta name="viewport"
      content="width=device-width,
      initial-scale=1,
      maximum-scale=1">

<meta name="robots"
      content="noindex">

<title>${esc(c.siteName)}</title>

${ad(c, n, "head")}

<style>

:root{
  --bg:#f7f6fb;
  --card:#ffffff;
  --text:#17142d;
  --muted:#777487;
  --accent:#6252d9;
  --accent-light:#f0edff;
  --line:#ddd9ea;
}

*{
  box-sizing:border-box;
}

html,body{
  margin:0;
  padding:0;
  min-height:100%;
}

body{
  min-height:100vh;

  background:
    linear-gradient(
      180deg,
      #faf9fd 0%,
      #f5f3fa 100%
    );

  color:var(--text);

  font-family:
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    Arial,
    sans-serif;

  display:flex;
  flex-direction:column;
  align-items:center;

  padding:22px 15px 35px;

  -webkit-font-smoothing:antialiased;
}

/* BRAND */

.brand{
  width:100%;
  max-width:460px;

  display:flex;
  align-items:center;
  justify-content:center;

  gap:10px;

  font-size:17px;
  font-weight:800;

  margin-bottom:14px;
}

.brand-logo{
  width:36px;
  height:36px;

  border-radius:11px;

  background:var(--accent-light);

  display:flex;
  align-items:center;
  justify-content:center;

  color:var(--accent);
}

.brand-logo svg{
  width:20px;
  height:20px;

  stroke:currentColor;
  fill:none;

  stroke-width:2.2;

  stroke-linecap:round;
  stroke-linejoin:round;
}

/* CARD */

.card{
  width:100%;
  max-width:460px;

  background:var(--card);

  border:1px solid rgba(35,25,70,.07);

  border-radius:22px;

  padding:26px 20px 24px;

  text-align:center;

  box-shadow:
    0 10px 35px rgba(47,38,91,.06);
}

/* STEPS */

.steps{
  width:100%;

  display:flex;

  align-items:flex-start;

  justify-content:center;

  margin-bottom:25px;

  overflow:hidden;
}

.step-item{
  min-width:58px;

  display:flex;

  flex-direction:column;

  align-items:center;

  position:relative;

  z-index:2;
}

.step-circle{
  width:30px;
  height:30px;

  border-radius:50%;

  display:flex;

  align-items:center;

  justify-content:center;

  font-size:13px;

  font-weight:800;

  background:#f0eef5;

  color:#8d899b;
}

.step-label{
  margin-top:7px;

  font-size:12px;

  font-weight:600;

  white-space:nowrap;

  color:#9b97a7;
}

.step-item.active .step-circle{
  background:var(--accent);

  color:#fff;

  box-shadow:
    0 0 0 5px rgba(98,82,217,.10);
}

.step-item.active .step-label{
  color:var(--accent);

  font-weight:800;
}

.step-item.done .step-circle{
  background:var(--accent);

  color:#fff;
}

.step-item.done .step-label{
  color:var(--text);
}

.step-line{
  height:2px;

  width:44px;

  margin-top:14px;

  background:var(--line);
}

.step-item.done + .step-line{
  background:var(--accent);
}

/* SCROLL NOTICE */

.scroll-note{
  margin:0 auto 24px;

  padding:11px 13px;

  border-radius:11px;

  background:#faf9fd;

  border:1px solid #ebe8f2;

  color:#777487;

  font-size:12px;

  line-height:1.45;

  font-weight:600;
}

/* HERO */

.hero-icon{
  width:74px;
  height:74px;

  margin:0 auto 17px;

  border-radius:22px;

  background:var(--accent-light);

  display:flex;

  align-items:center;

  justify-content:center;

  color:var(--accent);
}

.hero-icon svg{
  width:38px;
  height:38px;

  stroke:currentColor;

  fill:none;

  stroke-width:1.8;

  stroke-linecap:round;

  stroke-linejoin:round;
}

/* TITLE */

h1{
  margin:0;

  font-size:30px;

  line-height:1.15;

  letter-spacing:-.5px;

  font-weight:800;
}

.description{
  margin:10px auto 0;

  max-width:350px;

  color:var(--muted);

  font-size:14px;

  line-height:1.55;
}

/* TIMER */

.timer{
  margin:23px 0 18px;
}

#count{
  font-size:58px;

  line-height:1;

  font-weight:800;

  letter-spacing:-2px;

  color:var(--text);
}

/* AD */

.ad{
  width:100%;

  max-width:460px;

  text-align:center;

  overflow:hidden;

  margin:17px auto;

  min-height:0;
}

.ad-label{
  display:block;

  font-size:10px;

  color:#aaa6b4;

  margin-bottom:6px;

  letter-spacing:.3px;
}

/* BUTTON */

button{
  width:100%;

  min-height:54px;

  border:0;

  border-radius:13px;

  padding:15px 18px;

  font-size:15px;

  font-weight:800;

  letter-spacing:.2px;

  color:#fff;

  background:var(--accent);

  cursor:pointer;

  transition:
    transform .15s ease,
    opacity .15s ease;
}

button:not(:disabled):active{
  transform:scale(.985);
}

button:disabled{
  background:#dddce5;

  color:#aaa8b2;

  cursor:not-allowed;
}

/* NOTE */

.note{
  margin-top:16px;

  color:#8b8797;

  font-size:12px;

  line-height:1.5;
}

/* FOOTER */

.footer{
  width:100%;

  max-width:460px;

  text-align:center;

  margin-top:18px;

  color:#9995a5;

  font-size:11px;
}

@media(max-width:380px){

  body{
    padding:15px 10px 28px;
  }

  .card{
    padding:22px 15px;

    border-radius:19px;
  }

  h1{
    font-size:26px;
  }

  #count{
    font-size:52px;
  }

  .step-line{
    width:28px;
  }

  .step-item{
    min-width:52px;
  }

  .step-label{
    font-size:11px;
  }

}

</style>

</head>

<body>

${brandLogo(c.siteName || "DreamLinkerin")}

<div class="card">

  <!-- STEP INDICATOR -->

  <div class="steps">
    ${indicators}
  </div>


  <!-- SCROLL MESSAGE -->

  <div class="scroll-note">
    📌 Please scroll down to find the page below.
  </div>


  <!-- HERO ICON -->

  <div class="hero-icon">

    <svg viewBox="0 0 24 24">

      <path d="M12 3l7 3v5c0 4.8-3 8-7 10
               -4-2-7-5.2-7-10V6l7-3z"/>

      <path d="M9 12l2 2 4-4"/>

    </svg>

  </div>


  <h1>
    ${esc(title)}
  </h1>


  <p class="description">
    ${esc(description)}
  </p>


  <!-- COUNTDOWN -->

  <div class="timer">

    <div id="count">
      ${W}
    </div>

  </div>


  <!-- BUTTON AD -->

  <div class="ad">

    ${ad(c, n, "top")}

  </div>


  <!-- SYSTEM BUTTON -->

  <button id="go" disabled>
    Please wait...
  </button>


  <div class="note">

    ${
      last
        ? "Your link will be ready when the timer finishes."
        : "Please wait until the timer finishes to continue."
    }

  </div>


  <!-- BOTTOM AD -->

  <div class="ad">

    ${ad(c, n, "bottom")}

  </div>

</div>


<div class="footer">

  © 2026 ${esc(
    c.siteName || "DreamLinkerin"
  )} • All Rights Reserved

</div>


<script>

(function(){

  var left = ${W};

  var c =
    document.getElementById("count");

  var b =
    document.getElementById("go");

  var href =
    '/api/go?code=${ctx.code}&n=${n}&t=${ts}&s=${sig}';


  function ready(){

    c.textContent = "0";

    b.disabled = false;

    b.textContent =
      "${buttonText}";

  }


  if(left <= 0){

    ready();

  }


  var timer =
    setInterval(function(){

      /*
       * Pause countdown when
       * page is not visible.
       */

      if(
        document.visibilityState !==
        "visible"
      ){

        return;

      }


      left--;


      if(left <= 0){

        clearInterval(timer);

        ready();

      }
      else{

        c.textContent =
          left;

      }

    },1000);


  b.addEventListener(
    "click",
    function(){

      if(!b.disabled){

        location.href = href;

      }

    }
  );

})();

</script>

</body>

</html>`;
}


module.exports = {

  name: "ad-flow",

  title: "Ad flow",

  description:
    "Countdown pages with ads. Each step has its own timer and ad code.",

  order: 90,

  settings,

  async handle(ctx, c) {

    const steps =
      Math.min(
        3,
        Math.max(
          1,
          Math.round(
            Number(c.steps) || 1
          )
        )
      );


    const q =
      ctx.query;


    let step = 1;


    /*
     * FINAL ORIGINAL LINK PAGE
     *
     * After the last signed step
     * is completed, show the
     * Original Link Page instead
     * of redirecting immediately.
     */

    if(q.s){

      const done =
        Number(q.n);

      const ts =
        Number(q.t);

      const age =
        (Date.now() - ts) / 1000;


      const valid =
        Number.isInteger(done) &&
        done >= 1 &&
        done <= steps &&
        Number.isFinite(ts) &&

        ctx.safeEq(
          ctx.sign(
            ctx.code,
            done,
            ts
          ),
          String(q.s)
        ) &&

        age >=
          Math.max(
            0,
            wait(c, done) - 1
          ) &&

        age <= 900;


      if(!valid){

        return ctx.redirect(
          `/${ctx.code}`
        );

      }


      if(done >= steps){

        await ctx.inc("clicks");

        await ctx.emit("complete");

        /*
         * Show Original Link Page.
         */
        return ctx.html(
          renderOriginalPage(
            ctx,
            c
          )
        );

      }


      step =
        done + 1;

    }


    return ctx.html(
      render(
        ctx,
        c,
        step,
        steps
      )
    );

  }

};
