// Builds the "Modules" panel automatically from each module's settings. No edits needed per module.
(function () {
  var box = document.createElement("section");
  box.className = "card";
  box.innerHTML = '<h2>Modules</h2><div id="mods" class="muted">Loading...</div>';
  document.getElementById("app").insertBefore(box, document.getElementById("msg"));

  var prevLoad = window.load;
  window.load = async function () { await prevLoad(); loadMods(); };

  async function loadMods() {
    try { render((await api("/api/admin?action=mod-list")).modules); }
    catch (e) { document.getElementById("mods").textContent = e.message; }
  }

  function field(m, s, v) {
    var id = "f_" + m.name + "_" + s.key, k = ' data-k="' + esc(s.key) + '" id="' + id + '"';
    var label = '<label for="' + id + '" class="stat">' + esc(s.label) + "</label>";
    if (s.type === "checkbox")
      return '<div class="row"><input type="checkbox" style="width:auto;margin:6px 0"' + k + (v ? " checked" : "") + ">" + label + "</div>";
    if (s.type === "textarea")
      return label + "<textarea" + k + ' rows="3" style="width:100%;padding:10px;border:1px solid #d9dee8;border-radius:9px;margin:6px 0 10px;font-family:monospace">' + esc(v) + "</textarea>";
    if (s.type === "select")
      return label + "<select" + k + ' style="width:100%;padding:12px;border:1px solid #d9dee8;border-radius:9px;margin:6px 0 10px">' +
        s.options.map(function (o) { return "<option" + (o === v ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") + "</select>";
    return label + "<input" + k + ' type="' + (s.type === "number" ? "number" : "text") + '" value="' + esc(v) + '">';
  }

  function render(list) {
    var el = document.getElementById("mods");
    if (!list.length) { el.textContent = "No modules found"; return; }
    el.className = "";
    el.innerHTML = list.map(function (m) {
      return '<div class="item" data-m="' + esc(m.name) + '"><strong>' + esc(m.title) + "</strong>" +
        '<div class="stat">' + esc(m.description) + "</div>" +
        '<div class="row"><input type="checkbox" style="width:auto;margin:6px 0" data-enabled' + (m.enabled ? " checked" : "") + '><span class="stat">Enabled</span></div>' +
        m.settings.map(function (s) { return field(m, s, m.values[s.key]); }).join("") +
        '<button data-save="' + esc(m.name) + '">Save</button></div>';
    }).join("");
  }

  document.addEventListener("click", async function (e) {
    var b = e.target.closest("button[data-save]");
    if (!b) return;
    var item = b.closest(".item"), values = {};
    item.querySelectorAll("[data-k]").forEach(function (i) {
      values[i.dataset.k] = i.type === "checkbox" ? i.checked : i.value;
    });
    try {
      await api("/api/admin?action=mod-save&m=" + encodeURIComponent(b.dataset.save), {
        method: "POST",
        body: JSON.stringify({ enabled: item.querySelector("[data-enabled]").checked, values: values })
      });
      toast("Saved");
    } catch (err) { toast(err.message, true); }
  });

  if (typeof token === "string" && token) loadMods();
})();
