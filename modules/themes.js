const themes = {
  classic: {
    name: "经典微信",
    description: "稳妥通用，适合大多数公众号正文。",
    base: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      color: "#2f3033",
      accent: "#07c160",
      muted: "#7d858c",
      border: "#e7e7e7",
      bgSoft: "#f7fbf8",
      quoteBg: "#f5f7f6",
      h1Mode: "underline",
      headingMode: "bar",
      quoteMode: "bar",
    },
  },
  minimal: {
    name: "极简阅读",
    description: "留白克制，适合观点和长文。",
    base: {
      fontFamily:
        "'Optima', 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#252525",
      accent: "#111111",
      muted: "#777777",
      border: "#e5e2dc",
      bgSoft: "#faf9f6",
      quoteBg: "#f4f2ed",
      h1Mode: "plain",
      headingMode: "plain",
      quoteMode: "soft",
    },
  },
  tech: {
    name: "技术博客",
    description: "清晰理性，代码和表格更突出。",
    base: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      color: "#263238",
      accent: "#006d77",
      muted: "#5f6b70",
      border: "#c9dadd",
      bgSoft: "#eef8f8",
      quoteBg: "#edf6f7",
      h1Mode: "panel",
      headingMode: "chip",
      quoteMode: "panel",
    },
  },
  business: {
    name: "商务蓝",
    description: "专业干净，适合报告和方案。",
    base: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
      color: "#243042",
      accent: "#2468a2",
      muted: "#637083",
      border: "#d4e0ea",
      bgSoft: "#f0f6fb",
      quoteBg: "#eef5fb",
      h1Mode: "underline",
      headingMode: "bar",
      quoteMode: "soft",
    },
  },
  magazine: {
    name: "暖色杂志",
    description: "温和有层次，适合叙事和访谈。",
    base: {
      fontFamily:
        "'Songti SC', 'STSong', 'Noto Serif CJK SC', 'SimSun', serif",
      color: "#332b24",
      accent: "#b14f2a",
      muted: "#806f61",
      border: "#ead8c7",
      bgSoft: "#fff6ee",
      quoteBg: "#fff3e9",
      h1Mode: "center",
      headingMode: "plain",
      quoteMode: "soft",
    },
  },
  atelier: {
    name: "现代留白",
    description: "轻盈高级，标题和引用更舒展。",
    base: {
      fontFamily:
        "'Avenir Next', 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#202426",
      accent: "#2f6f73",
      muted: "#6d7678",
      border: "#dfe7e6",
      bgSoft: "#f6faf9",
      quoteBg: "#f2f7f6",
      h1Mode: "plain",
      headingMode: "chip",
      quoteMode: "panel",
    },
  },
  ink: {
    name: "墨韵东方",
    description: "沉静雅致，适合文化和随笔。",
    base: {
      fontFamily:
        "'Songti SC', 'STSong', 'Noto Serif CJK SC', 'SimSun', serif",
      color: "#23211d",
      accent: "#3b4b3a",
      muted: "#706b61",
      border: "#ddd7cc",
      bgSoft: "#fbfaf6",
      quoteBg: "#f4f1ea",
      h1Mode: "center",
      headingMode: "plain",
      quoteMode: "bar",
    },
  },
  finance: {
    name: "金融刊物",
    description: "稳重大气，适合分析和洞察。",
    base: {
      fontFamily:
        "'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#1d2733",
      accent: "#9a6a21",
      muted: "#68717d",
      border: "#e2d6bd",
      bgSoft: "#fbf7ee",
      quoteBg: "#f7f1e4",
      h1Mode: "panel",
      headingMode: "bar",
      quoteMode: "soft",
    },
  },
  product: {
    name: "产品简报",
    description: "结构明确，适合更新和复盘。",
    base: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      color: "#22272f",
      accent: "#4f6f52",
      muted: "#6f7782",
      border: "#dce4d8",
      bgSoft: "#f5f8f2",
      quoteBg: "#f1f6ee",
      h1Mode: "panel",
      headingMode: "chip",
      quoteMode: "panel",
    },
  },
  night: {
    name: "夜读深灰",
    description: "深色沉浸，适合夜读和专题。",
    base: {
      fontFamily:
        "'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#e8ecef",
      accent: "#8ab4a6",
      muted: "#b5bec5",
      border: "#3b454c",
      bgSoft: "#273038",
      quoteBg: "#2b343b",
      canvas: "#1f262c",
      h1Mode: "underline",
      headingMode: "chip",
      quoteMode: "panel",
    },
  },
  column: {
    name: "松弛专栏",
    description: "温暖自然，适合个人品牌表达。",
    base: {
      fontFamily:
        "'Hiragino Sans GB', 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#2a2c2b",
      accent: "#9b5f45",
      muted: "#766f6a",
      border: "#eadfd8",
      bgSoft: "#fff8f3",
      quoteBg: "#fbefe7",
      h1Mode: "plain",
      headingMode: "bar",
      quoteMode: "soft",
    },
  },
};

const codeThemes = {
  light: {
    name: "浅色",
    background: "#f7f8fa",
    color: "#24292f",
    border: "#e6e8eb",
    keyword: "#8250df",
    string: "#116329",
    comment: "#6e7781",
    number: "#953800",
  },
  dark: {
    name: "深色",
    background: "#202733",
    color: "#f1f5f9",
    border: "#202733",
    keyword: "#c4b5fd",
    string: "#86efac",
    comment: "#94a3b8",
    number: "#fdba74",
  },
  paper: {
    name: "纸张",
    background: "#fbf5e9",
    color: "#4a3828",
    border: "#ead8c7",
    keyword: "#9a3412",
    string: "#4d7c0f",
    comment: "#8a7664",
    number: "#a16207",
  },
};

function getCustomThemeSettings () {
  const fallback = {
    accent: "#137565",
    color: "#1f2429",
    bg: "#ffffff",
    quoteBg: "#f5faf8",
    codeBg: "#f8fafc",
    borderColor: "#e4e8ee",
    headingMode: "bar",
    fontSize: 16,
    lineHeight: 1.85,
    width: 420,
  };
  try {
    const stored = localStorage.getItem(CUSTOM_THEME_KEY);
    if (stored) return { ...fallback, ...JSON.parse(stored || "{}") };
    const legacy = localStorage.getItem("customTheme");
    if (!legacy) return fallback;
    const parsed = JSON.parse(legacy);
    const migrated = {
      accent: parsed.accent || fallback.accent,
      color: parsed.textColor || parsed.text || parsed.color || fallback.color,
      bg: parsed.bgColor || parsed.bg || fallback.bg,
      quoteBg: parsed.quoteBg || parsed.bgSoft || fallback.quoteBg,
      codeBg: parsed.codeBg || fallback.codeBg,
      borderColor: parsed.borderColor || fallback.borderColor,
      headingMode: parsed.headingMode || fallback.headingMode,
      fontSize: Number(parsed.fontSize || fallback.fontSize),
      lineHeight: Number(parsed.lineHeight || fallback.lineHeight),
      width: Number(parsed.width || fallback.width),
    };
    localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(migrated));
    return { ...fallback, ...migrated };
  } catch {
    return fallback;
  }
}

function applyCustomThemeSettings () {
  const custom = getCustomThemeSettings();
  const canvas = custom.bg && custom.bg.toLowerCase() !== "#ffffff" ? custom.bg : undefined;
  themes.custom = {
    name: "我的主题",
    description: "根据你的配色、字号和行高保存。",
    base: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
      color: custom.color,
      accent: custom.accent,
      muted: "#68717d",
      border: custom.borderColor,
      bgSoft: custom.quoteBg,
      quoteBg: custom.quoteBg,
      canvas,
      h1Mode: "panel",
      headingMode: custom.headingMode,
      quoteMode: "soft",
      fontSize: Number(custom.fontSize),
      lineHeight: Number(custom.lineHeight),
      width: Number(custom.width),
    },
  };
}

function syncThemeEditor () {
  const custom = getCustomThemeSettings();
  customAccentInput.value = custom.accent;
  customTextInput.value = custom.color;
  if (customBgInput) customBgInput.value = custom.bg;
  if (customQuoteInput) customQuoteInput.value = custom.quoteBg;
  if (customCodeBgInput) customCodeBgInput.value = custom.codeBg;
  if (customBorderInput) customBorderInput.value = custom.borderColor;
  customHeadingModeSelect.value = custom.headingMode;
  customFontSizeInput.value = String(custom.fontSize);
  customLineHeightInput.value = String(Math.round(custom.lineHeight * 100));
  if (customWidthInput) customWidthInput.value = String(custom.width);
  if (fontSizeValue) fontSizeValue.textContent = `${custom.fontSize}px`;
  if (lineHeightValue) lineHeightValue.textContent = String(custom.lineHeight.toFixed(2)).replace(/0+$/, "").replace(/\.$/, "");
  if (widthValue) widthValue.textContent = `${custom.width}px`;
}

function saveCustomTheme () {
  const custom = {
    accent: customAccentInput.value,
    color: customTextInput.value,
    bg: customBgInput ? customBgInput.value : "#ffffff",
    quoteBg: customQuoteInput ? customQuoteInput.value : "#f5faf8",
    codeBg: customCodeBgInput ? customCodeBgInput.value : "#f8fafc",
    borderColor: customBorderInput ? customBorderInput.value : "#e4e8ee",
    headingMode: customHeadingModeSelect.value,
    fontSize: Number(customFontSizeInput.value),
    lineHeight: Number(customLineHeightInput.value) / 100,
    width: Number(customWidthInput ? customWidthInput.value : 420),
  };
  localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(custom));
  applyCustomThemeSettings();
  populateSelects();
  themeSelect.value = "custom";
  localStorage.setItem(THEME_KEY, "custom");
  closeThemeEditor();
  render();
}

function resetCustomTheme () {
  localStorage.removeItem(CUSTOM_THEME_KEY);
  applyCustomThemeSettings();
  syncThemeEditor();
  if (themeEditorModal) themeEditorModal.dispatchEvent(new Event("input"));
  render();
}

function openThemeEditor () {
  syncThemeEditor();
  if (themeEditorModal) themeEditorModal.dispatchEvent(new Event("input"));
  themeEditorModal.hidden = false;
  document.body.classList.add("modal-open");
  customAccentInput.focus();
}

function closeThemeEditor () {
  themeEditorModal.hidden = true;
  if (preflightModal.hidden) document.body.classList.remove("modal-open");
}
