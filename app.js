"use strict";

const STORAGE_KEY = "wechat-md-draft";
const THEME_KEY = "wechat-md-theme";
const CODE_THEME_KEY = "wechat-md-code-theme";
const CUSTOM_THEME_KEY = "wechat-md-custom-theme";
const IMAGE_SETTINGS_KEY = "wechat-md-image-settings";
const PREVIEW_ZOOM_KEY = "wechat-md-preview-zoom";
const CUSTOM_TEMPLATES_KEY = "wechat-md-custom-templates";
const DRAFTS_KEY = "wechat-md-drafts";
const LAST_LIGHT_THEME_KEY = "wechat-md-last-light-theme";

const markdownInput = document.querySelector("#markdownInput");
const markdownEditorHost = document.querySelector("#markdownEditor");
const phoneFrame = document.querySelector(".phone-frame");
const toast = document.querySelector("#toast");
const preview = document.querySelector("#preview");
const workspace = document.querySelector(".workspace");
const appHeader = document.querySelector(".app-header");
const settingsBtn = document.querySelector("#settingsBtn");
const settingsDropdown = document.querySelector("#settingsDropdown");
const templateCategorySelect = document.querySelector("#templateCategorySelect");
const saveTemplateBtn = document.querySelector("#saveTemplateBtn");
const templateSelect = document.querySelector("#templateSelect");
const insertTemplateBtn = document.querySelector("#insertTemplateBtn");
const themeSelect = document.querySelector("#themeSelect");
const codeThemeSelect = document.querySelector("#codeThemeSelect");
const themeToggleBtn = document.querySelector("#themeToggleBtn");
const smartFormatBtn = document.querySelector("#smartFormatBtn");
const shareBtn = document.querySelector("#shareBtn");
const draftBtn = document.querySelector("#draftBtn");
const draftModal = document.querySelector("#draftModal");
const closeDraftBtn = document.querySelector("#closeDraftBtn");
const newDraftBtn = document.querySelector("#newDraftBtn");
const saveCurrentDraftBtn = document.querySelector("#saveCurrentDraftBtn");
const draftList = document.querySelector("#draftList");
const copyBtn = document.querySelector("#copyBtn");
const exportBtn = document.querySelector("#exportBtn");
const loadSampleBtn = document.querySelector("#loadSampleBtn");
const saveState = document.querySelector("#saveState");
const copyState = document.querySelector("#copyState");
const stats = document.querySelector("#stats");
const warnings = document.querySelector("#warnings");
const themeCards = document.querySelector("#themeCards");
const preflightModal = document.querySelector("#preflightModal");
const preflightSummary = document.querySelector("#preflightSummary");
const preflightList = document.querySelector("#preflightList");
const closePreflightBtn = document.querySelector("#closePreflightBtn");
const cancelPreflightBtn = document.querySelector("#cancelPreflightBtn");
const confirmCopyBtn = document.querySelector("#confirmCopyBtn");
const openThemeEditorBtn = document.querySelector("#openThemeEditorBtn");
const themeEditorModal = document.querySelector("#themeEditorModal");
const closeThemeEditorBtn = document.querySelector("#closeThemeEditorBtn");
const customAccentInput = document.querySelector("#customAccentInput");
const customTextInput = document.querySelector("#customTextInput");
const customBgInput = document.querySelector("#customBgInput");
const customQuoteInput = document.querySelector("#customQuoteInput");
const customCodeBgInput = document.querySelector("#customCodeBgInput");
const customBorderInput = document.querySelector("#customBorderInput");
const customHeadingModeSelect = document.querySelector("#customHeadingModeSelect");
const customFontSizeInput = document.querySelector("#customFontSizeInput");
const customLineHeightInput = document.querySelector("#customLineHeightInput");
const customWidthInput = document.querySelector("#customWidthInput");
const fontSizeValue = document.querySelector("#fontSizeValue");
const lineHeightValue = document.querySelector("#lineHeightValue");
const widthValue = document.querySelector("#widthValue");
const saveThemeBtn = document.querySelector("#saveThemeBtn");
const resetThemeBtn = document.querySelector("#resetThemeBtn");
const exportThemeBtn = document.querySelector("#exportThemeBtn");
const themePreview = document.querySelector("#themePreview");
const imageWidthSelect = document.querySelector("#imageWidthSelect");
const imageRadiusInput = document.querySelector("#imageRadiusInput");
const imageCaptionToggle = document.querySelector("#imageCaptionToggle");
const previewZoomSelect = document.querySelector("#previewZoomSelect");
const toggleFocusBtn = document.querySelector("#toggleFocusBtn");

let editor = null;
let isApplyingEditorValue = false;
let saveDraftTimer = null;
let isSyncingScroll = false;

function showToast (message, type = "success") {
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3000);
}

function safeStorageSet (key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e.name === "QuotaExceededError" || e.code === 22) {
      showToast("存储空间不足，请清理草稿或模板", "error");
      return false;
    }
    throw e;
  }
}

function getMarkdownValue () {
  if (editor) return editor.getValue();
  return markdownInput.value;
}

function setMarkdownValue (value) {
  markdownInput.value = value;
  if (editor) {
    isApplyingEditorValue = true;
    editor.setValue(value);
    isApplyingEditorValue = false;
  }
}

function focusEditor () {
  if (editor) {
    editor.focus();
  } else {
    markdownInput.focus();
  }
}

function isUiDarkMode () {
  return document.body.classList.contains("dark-mode");
}

function stripMarkdown (markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[#>*_`~\-|[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countReadableWords (text) {
  const chinese = text.match(/[\u4e00-\u9fff]/g) || [];
  const latin = text
    .replace(/[\u4e00-\u9fff]/g, " ")
    .match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) || [];
  return chinese.length + latin.length;
}

function analyzeMarkdown (markdown) {
  const text = stripMarkdown(markdown);
  const wordCount = countReadableWords(text);
  const headings = markdown.match(/^#{1,4}\s+.+$/gm) || [];
  const images = markdown.match(/!\[[^\]]*]\([^)]+\)/g) || [];
  const links = markdown.match(/(?<!!)\[[^\]]+]\((https?:\/\/[^)]+)\)/gi) || [];
  const codeBlocks = markdown.match(/```[\s\S]*?```/g) || [];
  const tableRows = markdown.match(/^\s*\|.+\|\s*$/gm) || [];
  return {
    wordCount,
    readingMinutes: Math.max(1, Math.ceil(wordCount / 420)),
    headings: headings.length,
    images: images.length,
    links: links.length,
    codeBlocks: codeBlocks.length,
    tableRows: tableRows.length,
    paragraphs: markdown.split(/\n{2,}/).filter((item) => stripMarkdown(item)).length,
  };
}

function renderStats (markdown) {
  const summary = analyzeMarkdown(markdown);
  stats.innerHTML = [
    ["字数", summary.wordCount],
    ["阅读", `${summary.readingMinutes} 分钟`],
    ["标题", summary.headings],
    ["图片", summary.images],
  ]
    .map(
      ([label, value]) =>
        `<div class="stat-card"><strong>${value}</strong><span>${label}</span></div>`,
    )
    .join("");
}

function buildWarnings (markdown) {
  const result = [];
  const localImages = markdown.match(/!\[[^\]]*]\((?!https?:\/\/)[^)]+\)/gi) || [];
  const links = markdown.match(/\[[^\]]+]\((https?:\/\/[^)]+)\)/gi) || [];
  const tables = markdown.match(/^\s*\|.+\|\s*$/gm) || [];
  const longLines = markdown.split("\n").filter((line) => line.length > 120);
  const emptyLinks = markdown.match(/\[[^\]]*]\(\s*\)/g) || [];
  const headings = markdown.match(/^#{1,6}\s+.*$/gm) || [];
  const h1Count = markdown.match(/^#\s+.+$/gm)?.length || 0;
  const h5Plus = markdown.match(/^#{5,6}\s+.+$/gm) || [];
  const codeBlocks = markdown.match(/```[\s\S]*?```/g) || [];
  const unclosedCodeFenceCount = (markdown.match(/```/g) || []).length;
  const veryLongCodeBlocks = codeBlocks.filter((block) => block.split("\n").length > 28);
  const summary = analyzeMarkdown(markdown);

  if (localImages.length) {
    result.push({
      level: "danger",
      text: "检测到本地或相对路径图片。公众号后台通常需要可访问的线上图片地址。",
    });
  }
  if (emptyLinks.length) {
    result.push({
      level: "danger",
      text: "存在空链接，请补全 URL 或删除链接标记。",
    });
  }
  if (unclosedCodeFenceCount % 2 !== 0) {
    result.push({
      level: "danger",
      text: "代码块围栏数量不成对，后续内容可能都会被当成代码。",
    });
  }
  if (h1Count > 1) {
    result.push({
      level: "warn",
      text: "检测到多个一级标题。公众号正文通常保留一个主标题更稳。",
    });
  }
  if (h5Plus.length) {
    result.push({
      level: "warn",
      text: "检测到五级或六级标题，微信正文里层级可能不明显，建议合并到四级以内。",
    });
  }
  if (links.length) {
    result.push({
      level: "info",
      text: `检测到 ${links.length} 个外链，复制时会自动转成文末脚注。`,
    });
  }
  if (tables.length > 4) {
    result.push({
      level: "warn",
      text: "表格内容较多，粘贴到公众号后建议检查手机端宽度。",
    });
  }
  if (longLines.length) {
    result.push({
      level: "warn",
      text: "存在较长单行内容，代码块或表格可能在微信里换行。",
    });
  }
  if (veryLongCodeBlocks.length) {
    result.push({
      level: "warn",
      text: "存在较长代码块，公众号阅读体验可能偏重，建议拆分或折叙。",
    });
  }
  if (summary.wordCount > 2800 && summary.headings < 3) {
    result.push({
      level: "info",
      text: "文章较长但标题层级较少，可以增加小标题帮助读者扫读。",
    });
  }
  if (!headings.length && summary.wordCount > 600) {
    result.push({
      level: "info",
      text: "正文超过 600 字但没有标题，建议增加小标题提升结构感。",
    });
  }
  return result;
}

function renderWarnings (markdown) {
  const items = buildWarnings(markdown);
  if (!items.length) {
    warnings.innerHTML = `<div class="warning ok">当前内容没有明显的公众号兼容性风险。</div>`;
    return;
  }
  warnings.innerHTML = items
    .map((item) => `<div class="warning ${item.level}">${item.text}</div>`)
    .join("");
}

function renderThemeCards () {
  themeCards.innerHTML = Object.entries(themes)
    .map(([key, theme]) => {
      const token = theme.base;
      return `
        <button class="theme-card ${themeSelect.value === key ? "active" : ""}" type="button" data-theme="${key}">
          <span class="theme-swatch" style="background:${token.canvas || token.bgSoft};">
            <span class="theme-swatch-line" style="background:${token.accent};"></span>
            <span class="theme-swatch-line" style="width:18px;background:${token.border};"></span>
          </span>
          <span>
            <strong>${theme.name}</strong>
            <span>${theme.description}</span>
          </span>
        </button>
      `;
    })
    .join("");
}


function render () {
  const themeKey = themeSelect.value;
  const theme = themes[themeKey].base;
  const markdown = getMarkdownValue();
  const codeTheme = { ...codeThemes[codeThemeSelect.value] };
  if (themeKey === "custom") {
    const custom = getCustomThemeSettings();
    if (custom.codeBg) codeTheme.background = custom.codeBg;
    if (custom.borderColor) codeTheme.border = custom.borderColor;
  }
  const html = renderMarkdown(markdown, theme, codeTheme);
  preview.innerHTML = html;
  preview.style.width = "100%";
  preview.style.maxWidth = `${theme.width || 420}px`;
  preview.style.margin = "0 auto";
  renderStats(markdown);
  renderWarnings(markdown);
  renderThemeCards();
}

function readCustomTemplates () {
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (stored) return JSON.parse(stored || "{}");
    const legacy = localStorage.getItem("customTemplates");
    if (!legacy) return {};
    const parsed = JSON.parse(legacy);
    const migrated = Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [
        key,
        { name: String(value.name || "未命名模板"), content: String(value.content || "") },
      ]),
    );
    safeStorageSet(CUSTOM_TEMPLATES_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return {};
  }
}

function writeCustomTemplates (items) {
  safeStorageSet(CUSTOM_TEMPLATES_KEY, JSON.stringify(items));
}

function getTemplateKeysByCategory (category) {
  const keys = Object.keys(templates);
  if (!category || category === "all") return keys;
  return keys.filter((key) => templates[key]?.category === category || !templates[key]?.category);
}

function populateSelects () {
  const category = templateCategorySelect ? templateCategorySelect.value : "all";
  const allowedTemplateKeys = getTemplateKeysByCategory(category);
  const currentTemplate = templateSelect.value;
  templateSelect.innerHTML = allowedTemplateKeys
    .map((key) => `<option value="${key}">${templates[key].name}</option>`)
    .join("");

  if (currentTemplate && allowedTemplateKeys.includes(currentTemplate)) {
    templateSelect.value = currentTemplate;
  } else if (allowedTemplateKeys.length) {
    templateSelect.value = allowedTemplateKeys[0];
  }

  themeSelect.innerHTML = Object.entries(themes)
    .map(([key, theme]) => `<option value="${key}">${theme.name}</option>`)
    .join("");
  codeThemeSelect.innerHTML = Object.entries(codeThemes)
    .map(([key, theme]) => `<option value="${key}">${theme.name}</option>`)
    .join("");

  const storedTheme = localStorage.getItem(THEME_KEY) || "classic";
  themeSelect.value = themes[storedTheme] ? storedTheme : "classic";
  codeThemeSelect.value = localStorage.getItem(CODE_THEME_KEY) || "light";
}

function plainTextFromHtml (html) {
  const node = document.createElement("div");
  node.innerHTML = html;
  return node.innerText;
}

function getRenderedDocumentHtml () {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>微信公众号排版导出</title>
  </head>
  <body>
    ${preview.innerHTML}
  </body>
</html>`;
}

function getPreflightCounts (items) {
  return {
    danger: items.filter((item) => item.level === "danger").length,
    warn: items.filter((item) => item.level === "warn").length,
    info: items.filter((item) => item.level === "info").length,
  };
}

function openPreflightModal () {
  const items = buildWarnings(getMarkdownValue());
  const counts = getPreflightCounts(items);
  preflightSummary.innerHTML = [
    ["严重", counts.danger],
    ["提醒", counts.warn],
    ["信息", counts.info],
  ]
    .map(
      ([label, value]) =>
        `<div class="preflight-pill"><strong>${value}</strong><span>${label}</span></div>`,
    )
    .join("");
  preflightList.innerHTML = items.length
    ? items.map((item) => `<div class="warning ${item.level}">${item.text}</div>`).join("")
    : `<div class="warning ok">预检通过，当前内容没有明显的公众号兼容性风险。</div>`;
  confirmCopyBtn.textContent = counts.danger ? "仍然复制" : "继续复制";
  preflightModal.hidden = false;
  document.body.classList.add("modal-open");
  confirmCopyBtn.focus();
}

function closePreflightModal () {
  preflightModal.hidden = true;
  if (themeEditorModal.hidden) document.body.classList.remove("modal-open");
}

async function copyRenderedHtml () {
  const html = preview.innerHTML;
  const fullHtml = getRenderedDocumentHtml();
  const plain = plainTextFromHtml(html);
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([fullHtml], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
      const copyHost = document.createElement("div");
      copyHost.setAttribute("contenteditable", "true");
      copyHost.style.position = "fixed";
      copyHost.style.left = "-9999px";
      copyHost.style.top = "0";
      copyHost.innerHTML = html;
      document.body.appendChild(copyHost);
      const range = document.createRange();
      range.selectNodeContents(copyHost);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("copy");
      selection.removeAllRanges();
      copyHost.remove();
    } else {
      await navigator.clipboard.writeText(plain);
    }
    copyState.textContent = "已复制，可粘贴到公众号后台";
    copyBtn.textContent = "已复制";
  } catch (error) {
    copyState.textContent = "复制失败，请在浏览器权限中允许剪贴板";
    copyBtn.textContent = "复制失败";
  } finally {
    window.setTimeout(() => {
      copyBtn.textContent = "复制到公众号";
      copyState.textContent = "复制时会包含内联样式";
    }, 2400);
  }
}

function exportRenderedHtml () {
  const html = getRenderedDocumentHtml();
  const stamp = new Date()
    .toISOString()
    .slice(0, 16)
    .replace("T", "-")
    .replace(":", "");
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `wechat-article-${stamp}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function insertTemplate () {
  const selected = templates[templateSelect.value];
  if (!selected) return;
  const current = getMarkdownValue().trim();
  const next = current.length ? `${current}\n\n---\n\n${selected.content}` : selected.content;
  setMarkdownValue(next);
  saveDraft();
  render();
  focusEditor();
}

function restoreControls () {
  const imageSettings = loadImageSettings();
  imageWidthSelect.value = imageSettings.width;
  imageRadiusInput.value = String(imageSettings.radius);
  imageCaptionToggle.checked = Boolean(imageSettings.caption);
  previewZoomSelect.value = localStorage.getItem(PREVIEW_ZOOM_KEY) || "1";
  applyPreviewZoom();
}

function applyPreviewZoom () {
  const zoom = Number(previewZoomSelect.value);
  preview.style.transform = `scale(${zoom})`;
  preview.style.marginBottom = zoom < 1 ? "0" : `${Math.round((zoom - 1) * 460)}px`;
}

function updatePreviewZoom () {
  localStorage.setItem(PREVIEW_ZOOM_KEY, previewZoomSelect.value);
  applyPreviewZoom();
}

function updateImageControls () {
  saveImageSettings();
  render();
}

function togglePreviewFocus () {
  workspace.classList.toggle("focus-preview");
  toggleFocusBtn.textContent = workspace.classList.contains("focus-preview") ? "退出专注" : "专注预览";
  if (editor) editor.refresh();
}

function saveDraft () {
  safeStorageSet(STORAGE_KEY, getMarkdownValue());
  saveState.textContent = "已自动保存";
}

function init () {
  const syncLayout = () => {
    if (appHeader) {
      document.documentElement.style.setProperty("--app-header-height", `${appHeader.offsetHeight}px`);
    }
    if (editor) editor.refresh();
  };

  const legacyDraft = localStorage.getItem("markdownDraft");
  const storedDraft = localStorage.getItem(STORAGE_KEY);
  const initialMarkdown = storedDraft || legacyDraft || sampleMarkdown;
  if (!storedDraft && legacyDraft) safeStorageSet(STORAGE_KEY, legacyDraft);

  const customTemplates = readCustomTemplates();
  Object.entries(customTemplates).forEach(([key, value]) => {
    if (!value || typeof value !== "object") return;
    const name = String(value.name || "未命名模板");
    const content = String(value.content || "");
    templates[key] = { name, content };
  });

  applyCustomThemeSettings();
  populateSelects();
  setMarkdownValue(initialMarkdown);
  restoreControls();
  syncLayout();

  if (themeSelect.value === "night") {
    document.body.classList.add("dark-mode");
  }

  if (window.CodeMirror && markdownEditorHost) {
    editor = window.CodeMirror(markdownEditorHost, {
      value: initialMarkdown,
      mode: "markdown",
      theme: isUiDarkMode() ? "monokai" : "one-dark",
      lineNumbers: true,
      lineWrapping: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      styleActiveLine: true,
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false,
    });

    window.requestAnimationFrame(() => {
      syncLayout();
    });

    editor.on("change", () => {
      if (isApplyingEditorValue) return;
      markdownInput.value = editor.getValue();
      saveState.textContent = "保存中...";
      render();
      window.clearTimeout(saveDraftTimer);
      saveDraftTimer = window.setTimeout(saveDraft, 250);
    });

    if (phoneFrame) {
      editor.on("scroll", () => {
        if (isSyncingScroll) return;
        isSyncingScroll = true;
        const topLine = editor.lineAtHeight(editor.getScrollInfo().top, "local");
        const totalLines = Math.max(1, editor.lineCount() - 1);
        const linePercent = topLine / totalLines;
        phoneFrame.scrollTop = linePercent * (phoneFrame.scrollHeight - phoneFrame.clientHeight);
        window.setTimeout(() => {
          isSyncingScroll = false;
        }, 80);
      });

      phoneFrame.addEventListener("scroll", () => {
        if (isSyncingScroll) return;
        isSyncingScroll = true;
        const denominator = phoneFrame.scrollHeight - phoneFrame.clientHeight;
        const percent = denominator > 0 ? phoneFrame.scrollTop / denominator : 0;
        const totalLines = Math.max(1, editor.lineCount() - 1);
        const targetLine = Math.round(percent * totalLines);
        const targetY = editor.heightAtLine(targetLine, "local");
        editor.scrollTo(null, targetY);
        window.setTimeout(() => {
          isSyncingScroll = false;
        }, 80);
      });
    }
  }

  render();

  window.addEventListener("resize", () => {
    syncLayout();
  });

  if (settingsBtn && settingsDropdown) {
    settingsBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      settingsDropdown.hidden = !settingsDropdown.hidden;
      if (!settingsDropdown.hidden) {
        const rect = settingsBtn.getBoundingClientRect();
        settingsDropdown.style.top = `${rect.bottom + 8}px`;
        settingsDropdown.style.right = `${window.innerWidth - rect.right}px`;
      }
    });

    document.addEventListener("click", (event) => {
      if (!settingsDropdown.contains(event.target) && event.target !== settingsBtn) {
        settingsDropdown.hidden = true;
      }
    });
  }

  if (templateCategorySelect) {
    templateCategorySelect.addEventListener("change", () => {
      populateSelects();
    });
  }

  if (saveTemplateBtn) {
    saveTemplateBtn.addEventListener("click", () => {
      const name = window.prompt("请输入模板名称：");
      if (!name) return;
      const key = `custom-${Date.now()}`;
      const items = readCustomTemplates();
      items[key] = { name: String(name), content: getMarkdownValue() };
      writeCustomTemplates(items);
      templates[key] = { name: String(name), content: getMarkdownValue() };
      populateSelects();
      templateSelect.value = key;
      if (settingsDropdown) settingsDropdown.hidden = true;
      showToast("模板已保存");
    });
  }

  function toggleNightMode () {
    const current = themeSelect.value;
    if (current === "night") {
      const last = localStorage.getItem(LAST_LIGHT_THEME_KEY) || "classic";
      themeSelect.value = themes[last] ? last : "classic";
      document.body.classList.remove("dark-mode");
    } else {
      localStorage.setItem(LAST_LIGHT_THEME_KEY, current);
      themeSelect.value = "night";
      document.body.classList.add("dark-mode");
    }
    localStorage.setItem(THEME_KEY, themeSelect.value);
    if (editor) editor.setOption("theme", isUiDarkMode() ? "monokai" : "one-dark");
    render();
    if (themeToggleBtn) themeToggleBtn.textContent = themeSelect.value === "night" ? "☀️" : "🌙";
  }

  if (themeToggleBtn) {
    themeToggleBtn.textContent = themeSelect.value === "night" ? "☀️" : "🌙";
    themeToggleBtn.addEventListener("click", toggleNightMode);
  }

  if (smartFormatBtn) {
    smartFormatBtn.addEventListener("click", () => {
      const original = getMarkdownValue();
      const formatted = original
        .replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, "$1 $2")
        .replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, "$1 $2")
        .replace(/([\u4e00-\u9fa5])([0-9])/g, "$1 $2")
        .replace(/([0-9])([\u4e00-\u9fa5])/g, "$1 $2")
        .replace(/--/g, "——")
        .replace(/\.\.\./g, "…")
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        .replace(/^(#{1,6})([^\s#])/gm, "$1 $2")
        .replace(/^([-*+])([^\s])/gm, "$1 $2")
        .replace(/^(\d+\.)([^\s])/gm, "$1 $2");
      if (formatted === original) return;
      setMarkdownValue(formatted);
      saveDraft();
      render();
      showToast("智能排版完成");
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const data = {
        content: getMarkdownValue(),
        title: "分享的 Markdown 文档",
        createdAt: new Date().toISOString(),
      };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      const shareUrl = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast("分享链接已复制");
      } catch {
        window.prompt("分享链接已生成，请复制：", shareUrl);
      }
    });
  }

  if (window.location.hash.startsWith("#share=")) {
    try {
      const payload = window.location.hash.slice(7);
      const json = decodeURIComponent(escape(atob(payload)));
      const data = JSON.parse(json);
      if (data && typeof data.content === "string") {
        setMarkdownValue(data.content);
        saveDraft();
        render();
        showToast("已加载分享的文档");
      }
      history.replaceState(null, "", window.location.pathname);
    } catch {
      showToast("分享链接无效", "error");
    }
  }

  function readDrafts () {
    try {
      return JSON.parse(localStorage.getItem(DRAFTS_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function writeDrafts (items) {
    safeStorageSet(DRAFTS_KEY, JSON.stringify(items));
  }

  function renderDraftList () {
    if (!draftList) return;
    const items = readDrafts();
    if (!items.length) {
      draftList.innerHTML =
        '<div style="padding: 32px; text-align: center; color: var(--muted);"><p>暂无草稿</p></div>';
      return;
    }
    draftList.innerHTML = items
      .map(
        (draft) => `
          <div style="padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 600; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(String(draft.name || "未命名草稿"))}</div>
              <div style="font-size: 12px; color: var(--muted);">更新于：${new Date(draft.updatedAt || draft.createdAt || Date.now()).toLocaleString("zh-CN")}</div>
            </div>
            <div style="display: flex; gap: 8px; flex: 0 0 auto;">
              <button type="button" data-load="${draft.id}" style="font-size: 12px; padding: 4px 8px; min-height: auto;">加载</button>
              <button type="button" data-delete="${draft.id}" style="font-size: 12px; padding: 4px 8px; min-height: auto; color: #e53e3e; border-color: #e53e3e;">删除</button>
            </div>
          </div>
        `,
      )
      .join("");

    draftList.querySelectorAll("[data-load]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = Number(button.getAttribute("data-load"));
        const draft = readDrafts().find((item) => Number(item.id) === id);
        if (!draft) return;
        setMarkdownValue(String(draft.content || ""));
        saveDraft();
        render();
        if (draftModal) draftModal.hidden = true;
        showToast("草稿已加载");
      });
    });

    draftList.querySelectorAll("[data-delete]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = Number(button.getAttribute("data-delete"));
        const items = readDrafts().filter((item) => Number(item.id) !== id);
        writeDrafts(items);
        renderDraftList();
        showToast("草稿已删除");
      });
    });
  }

  if (draftBtn && draftModal) {
    draftBtn.addEventListener("click", () => {
      draftModal.hidden = false;
      renderDraftList();
    });
  }

  if (closeDraftBtn && draftModal) {
    closeDraftBtn.addEventListener("click", () => {
      draftModal.hidden = true;
    });
  }

  if (draftModal) {
    draftModal.addEventListener("click", (event) => {
      if (event.target === draftModal) draftModal.hidden = true;
    });
  }

  if (newDraftBtn) {
    newDraftBtn.addEventListener("click", () => {
      const name = window.prompt("请输入草稿名称：", `草稿 ${new Date().toLocaleString("zh-CN")}`);
      if (!name) return;
      const items = readDrafts();
      const draft = {
        id: Date.now(),
        name: String(name),
        content: "# 新文档\n\n开始编写内容...",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      writeDrafts([draft, ...items]);
      setMarkdownValue(draft.content);
      saveDraft();
      render();
      renderDraftList();
      showToast("新建草稿成功");
    });
  }

  if (saveCurrentDraftBtn) {
    saveCurrentDraftBtn.addEventListener("click", () => {
      const name = window.prompt("请输入草稿名称：", `草稿 ${new Date().toLocaleString("zh-CN")}`);
      if (!name) return;
      const items = readDrafts();
      const draft = {
        id: Date.now(),
        name: String(name),
        content: getMarkdownValue(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      writeDrafts([draft, ...items]);
      renderDraftList();
      showToast("草稿已保存");
    });
  }

  function updateThemePreview () {
    if (!themePreview) return;
    const accent = customAccentInput ? customAccentInput.value : "#137565";
    const text = customTextInput ? customTextInput.value : "#1f2429";
    const bg = customBgInput ? customBgInput.value : "#ffffff";
    const quoteBg = customQuoteInput ? customQuoteInput.value : "#f5faf8";
    const codeBg = customCodeBgInput ? customCodeBgInput.value : "#f8fafc";
    const borderColor = customBorderInput ? customBorderInput.value : "#e4e8ee";
    const headingMode = customHeadingModeSelect ? customHeadingModeSelect.value : "bar";
    const fontSize = customFontSizeInput ? Number(customFontSizeInput.value) : 16;
    const lineHeight = customLineHeightInput ? Number(customLineHeightInput.value) / 100 : 1.85;
    const width = customWidthInput ? Number(customWidthInput.value) : 420;

    themePreview.style.background = bg;
    themePreview.style.maxWidth = `${width}px`;
    themePreview.style.margin = "0 auto";
    themePreview.style.borderColor = borderColor;

    if (fontSizeValue) fontSizeValue.textContent = `${fontSize}px`;
    if (lineHeightValue) lineHeightValue.textContent = String(lineHeight.toFixed(2)).replace(/0+$/, "").replace(/\.$/, "");
    if (widthValue) widthValue.textContent = `${width}px`;

    const h1 = themePreview.querySelector("h1");
    if (h1) {
      h1.style.color = text;
      h1.style.display = "block";
      h1.style.padding = "0";
      h1.style.border = "none";
      h1.style.borderLeft = "none";
      h1.style.borderBottom = "none";
      h1.style.borderRadius = "0";
      h1.style.background = "transparent";
      if (headingMode === "bar") {
        h1.style.paddingLeft = "12px";
        h1.style.borderLeft = `4px solid ${accent}`;
      } else if (headingMode === "chip") {
        h1.style.display = "inline-block";
        h1.style.padding = "4px 12px";
        h1.style.borderRadius = "6px";
        h1.style.background = accent;
        h1.style.color = "#ffffff";
      } else if (headingMode === "plain") {
        h1.style.paddingBottom = "8px";
        h1.style.borderBottom = `2px solid ${accent}`;
      }
    }

    themePreview.querySelectorAll("p, li").forEach((node) => {
      node.style.color = text;
      node.style.fontSize = `${fontSize}px`;
      node.style.lineHeight = String(lineHeight);
    });

    const quote = themePreview.querySelector("blockquote");
    if (quote) {
      quote.style.background = quoteBg;
      quote.style.borderLeftColor = accent;
      quote.style.color = text;
      quote.style.opacity = "0.85";
    }

    const pre = themePreview.querySelector("pre");
    if (pre) {
      pre.style.background = codeBg;
      pre.style.border = `1px solid ${borderColor}`;
    }
  }

  if (themeEditorModal) {
    themeEditorModal.addEventListener("input", updateThemePreview);
    themeEditorModal.addEventListener("change", updateThemePreview);
  }

  if (exportThemeBtn) {
    exportThemeBtn.addEventListener("click", () => {
      const data = getCustomThemeSettings();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "my-theme.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast("主题已导出");
    });
  }

  if (openThemeEditorBtn) openThemeEditorBtn.addEventListener("click", openThemeEditor);
  if (closeThemeEditorBtn) closeThemeEditorBtn.addEventListener("click", closeThemeEditor);
  if (saveThemeBtn) saveThemeBtn.addEventListener("click", saveCustomTheme);
  if (resetThemeBtn) resetThemeBtn.addEventListener("click", resetCustomTheme);
  if (themeEditorModal) {
    themeEditorModal.addEventListener("click", (event) => {
      if (event.target === themeEditorModal) closeThemeEditor();
    });
  }

  if (themeSelect) {
    themeSelect.addEventListener("change", () => {
      if (themeSelect.value !== "night") localStorage.setItem(LAST_LIGHT_THEME_KEY, themeSelect.value);
      localStorage.setItem(THEME_KEY, themeSelect.value);
      document.body.classList.toggle("dark-mode", themeSelect.value === "night");
      if (themeToggleBtn) themeToggleBtn.textContent = themeSelect.value === "night" ? "☀️" : "🌙";
      if (editor) editor.setOption("theme", isUiDarkMode() ? "monokai" : "one-dark");
      render();
    });
  }

  if (themeCards) {
    themeCards.addEventListener("click", (event) => {
      const card = event.target.closest("[data-theme]");
      if (!card) return;
      themeSelect.value = card.dataset.theme;
      themeSelect.dispatchEvent(new Event("change"));
    });
  }

  if (codeThemeSelect) {
    codeThemeSelect.addEventListener("change", () => {
      localStorage.setItem(CODE_THEME_KEY, codeThemeSelect.value);
      render();
    });
  }

  if (loadSampleBtn) {
    loadSampleBtn.addEventListener("click", () => {
      setMarkdownValue(sampleMarkdown);
      saveDraft();
      render();
      showToast("已加载示例内容");
    });
  }

  if (insertTemplateBtn) {
    insertTemplateBtn.addEventListener("click", () => {
      insertTemplate();
      if (settingsDropdown) settingsDropdown.hidden = true;
      showToast("模板已插入");
    });
  }

  if (exportBtn) exportBtn.addEventListener("click", exportRenderedHtml);
  if (copyBtn) copyBtn.addEventListener("click", openPreflightModal);
  if (confirmCopyBtn) {
    confirmCopyBtn.addEventListener("click", async () => {
      closePreflightModal();
      await copyRenderedHtml();
    });
  }
  if (closePreflightBtn) closePreflightBtn.addEventListener("click", closePreflightModal);
  if (cancelPreflightBtn) cancelPreflightBtn.addEventListener("click", closePreflightModal);
  if (preflightModal) {
    preflightModal.addEventListener("click", (event) => {
      if (event.target === preflightModal) closePreflightModal();
    });
  }

  if (imageWidthSelect) imageWidthSelect.addEventListener("change", updateImageControls);
  if (imageRadiusInput) imageRadiusInput.addEventListener("input", updateImageControls);
  if (imageCaptionToggle) imageCaptionToggle.addEventListener("change", updateImageControls);
  if (previewZoomSelect) previewZoomSelect.addEventListener("change", updatePreviewZoom);
  if (toggleFocusBtn) toggleFocusBtn.addEventListener("click", togglePreviewFocus);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!preflightModal.hidden) closePreflightModal();
      if (!themeEditorModal.hidden) closeThemeEditor();
      if (draftModal && !draftModal.hidden) draftModal.hidden = true;
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveDraft();
      showToast("已保存");
    }
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      openPreflightModal();
    }
  });
}

init();
