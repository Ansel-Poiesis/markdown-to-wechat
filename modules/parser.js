function escapeHtml (value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function styleText (style) {
  return Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${value}`)
    .join(";");
}

function inline (tag, content, style = {}, attrs = {}) {
  const attrText = Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => ` ${key}="${escapeHtml(String(value))}"`)
    .join("");
  const styleAttr = Object.keys(style).length ? ` style="${styleText(style)}"` : "";
  return `<${tag}${styleAttr}${attrText}>${content}</${tag}>`;
}

function selfClosing (tag, style = {}, attrs = {}) {
  const attrText = Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => ` ${key}="${escapeHtml(String(value))}"`)
    .join("");
  const styleAttr = Object.keys(style).length ? ` style="${styleText(style)}"` : "";
  return `<${tag}${styleAttr}${attrText}>`;
}

function loadImageSettings () {
  const fallback = { width: "100%", radius: 6, caption: true };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(IMAGE_SETTINGS_KEY) || "{}") };
  } catch {
    return fallback;
  }
}

function saveImageSettings () {
  localStorage.setItem(
    IMAGE_SETTINGS_KEY,
    JSON.stringify({
      width: imageWidthSelect.value,
      radius: Number(imageRadiusInput.value),
      caption: imageCaptionToggle.checked,
    }),
  );
}

function imageHtml (alt, src, settings = loadImageSettings()) {
  const image = selfClosing(
    "img",
    {
      display: "block",
      width: settings.width,
      maxWidth: "100%",
      height: "auto",
      margin: "18px auto 8px",
      borderRadius: `${settings.radius}px`,
    },
    { src, alt },
  );
  if (!settings.caption || !alt) return image;
  return inline(
    "figure",
    image +
    inline("figcaption", escapeHtml(alt), {
      margin: "0 0 18px",
      color: "#8a8f98",
      fontSize: "13px",
      lineHeight: "1.6",
      textAlign: "center",
    }),
    { margin: "0 0 18px" },
  );
}

function highlightCode (code, lang, codeTheme) {
  const escaped = escapeHtml(code);
  const color = codeTheme.keyword || "#7c3aed";
  const stringColor = codeTheme.string || "#0f766e";
  const commentColor = codeTheme.comment || "#8a8f98";
  const numberColor = codeTheme.number || "#b45309";
  const keywordSets = {
    js: "await break case catch class const continue default delete do else export extends finally for function if import in instanceof let new return switch throw try typeof var void while yield async",
    ts: "await break case catch class const continue default delete do else export extends finally for function if import in instanceof let new return switch throw try typeof var void while yield async interface type enum implements private public readonly",
    css: "display position color background margin padding border grid flex width height font transform transition",
    html: "section article div span p h1 h2 h3 img a table tr td th",
  };
  const normalized = (lang || "js").toLowerCase();
  const keywords = keywordSets[normalized] || keywordSets.js;
  return escaped
    .replace(/(&lt;!--[\s\S]*?--&gt;|\/\/.*$|\/\*[\s\S]*?\*\/)/gm, (match) =>
      inline("span", match, { color: commentColor }),
    )
    .replace(/(&quot;.*?&quot;|'.*?'|`.*?`)/g, (match) =>
      inline("span", match, { color: stringColor }),
    )
    .replace(/\b(\d+(?:\.\d+)?)\b/g, (match) => inline("span", match, { color: numberColor }))
    .replace(new RegExp(`\\b(${keywords.split(" ").join("|")})\\b`, "g"), (match) =>
      inline("span", match, { color, fontWeight: "700" }),
    );
}

function safeUrl (url) {
  if (!url) return "";
  const allowed = ["http:", "https:", "data:", "mailto:"];
  try {
    const parsed = new URL(url, window.location.href);
    if (allowed.includes(parsed.protocol)) return url;
    return "";
  } catch {
    if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) return url;
    return "";
  }
}

function parseInline (text, links) {
  let value = escapeHtml(text);

  value = value.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, alt, src) => {
    const safeSrc = safeUrl(src);
    if (!safeSrc) return escapeHtml(`![${alt}](${src})`);
    return imageHtml(alt, safeSrc);
  });

  value = value.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, href) => {
    const safeHref = safeUrl(href);
    if (!safeHref) return escapeHtml(`[${label}](${href})`);
    const id = links.findIndex((item) => item.href === safeHref);
    const index = id >= 0 ? id + 1 : links.push({ label, href: safeHref });
    return `${label}<sup style="color:#888;font-size:12px;">[${index}]</sup>`;
  });

  value = value.replace(/`([^`]+)`/g, (_, code) =>
    inline(
      "code",
      code,
      {
        padding: "2px 5px",
        borderRadius: "4px",
        background: "#f0f2f4",
        color: "#c43d3d",
        fontFamily: "Menlo, Monaco, Consolas, monospace",
        fontSize: "0.92em",
      },
    ),
  );
  value = value.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  value = value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  value = value.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return value;
}

function isTableStart (lines, index) {
  return (
    index + 1 < lines.length &&
    /\|/.test(lines[index]) &&
    /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1])
  );
}

function splitTableRow (line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function paragraphStyle (theme) {
  return {
    margin: "0 0 16px",
    color: theme.color,
    fontSize: `${theme.fontSize || 16}px`,
    lineHeight: themeLineHeight(theme, 1.85),
    letterSpacing: "0",
  };
}

function themeFontSize (theme, delta = 0) {
  return `${(theme.fontSize || 16) + delta}px`;
}

function themeLineHeight (theme, fallback = 1.85) {
  return String(theme.lineHeight || fallback);
}

function h1Style (theme) {
  const baseSize = theme.fontSize || 16;
  const base = {
    margin: "0 0 24px",
    color: theme.color,
    fontSize: `${baseSize + 8}px`,
    lineHeight: "1.36",
    fontWeight: "700",
    letterSpacing: "0",
  };

  if (theme.h1Mode === "center") {
    return {
      ...base,
      textAlign: "center",
      padding: "8px 0 18px",
      borderBottom: `1px solid ${theme.border}`,
    };
  }

  if (theme.h1Mode === "panel") {
    return {
      ...base,
      padding: "18px 18px",
      border: `1px solid ${theme.border}`,
      borderRadius: "8px",
      background: theme.bgSoft,
    };
  }

  if (theme.h1Mode === "plain") {
    return {
      ...base,
      padding: "0 0 4px",
    };
  }

  return {
    ...base,
    padding: "0 0 12px",
    borderBottom: `2px solid ${theme.accent}`,
  };
}

function headingContent (content, theme) {
  if (theme.headingMode === "chip") {
    return inline("span", content, {
      display: "inline-block",
      padding: "5px 10px",
      borderRadius: "6px",
      background: theme.bgSoft,
      color: theme.accent,
    });
  }

  if (theme.headingMode === "plain") {
    return inline("span", content, {
      display: "inline-block",
      paddingBottom: "3px",
      borderBottom: `1px solid ${theme.accent}`,
    });
  }

  return inline("span", content, {
    display: "inline-block",
    paddingLeft: "10px",
    borderLeft: `4px solid ${theme.accent}`,
  });
}

function quoteStyle (theme) {
  const base = {
    margin: "0 0 18px",
    color: theme.muted,
    fontSize: themeFontSize(theme, -1),
    lineHeight: themeLineHeight(theme, 1.8),
  };

  if (theme.quoteMode === "panel") {
    return {
      ...base,
      padding: "14px 15px",
      border: `1px solid ${theme.border}`,
      borderRadius: "8px",
      background: theme.quoteBg,
    };
  }

  if (theme.quoteMode === "soft") {
    return {
      ...base,
      padding: "13px 15px",
      borderRadius: "8px",
      background: theme.quoteBg,
    };
  }

  return {
    ...base,
    padding: "12px 14px",
    borderLeft: `4px solid ${theme.accent}`,
    background: theme.quoteBg,
  };
}

function renderMarkdown (markdown, theme, codeTheme) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const links = [];
  let html = "";
  let paragraph = [];
  let inCode = false;
  let codeLang = "";
  let codeBuffer = [];
  let listStack = []; // [{ type: 'ul'|'ol', indent: number, items: [{ text, childrenHtml }] }]

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html += inline("p", parseInline(paragraph.join(" "), links), paragraphStyle(theme));
    paragraph = [];
  };

  function getListIndent (line) {
    const m = line.match(/^(\s*)/);
    return m ? m[1].length : 0;
  }

  function renderListNode (list) {
    const tag = list.type;
    const items = list.items.map((item) => {
      const content = parseInline(item.text, links) + (item.childrenHtml || "");
      return inline("li", content, {
        margin: "0 0 7px",
        paddingLeft: "2px",
        color: theme.color,
        fontSize: themeFontSize(theme),
        lineHeight: themeLineHeight(theme, 1.8),
      });
    }).join("");
    return inline(tag, items, {
      margin: "0 0 18px 22px",
      padding: "0",
      color: theme.color,
    });
  }

  function flushListsAbove (indent) {
    while (listStack.length && listStack[listStack.length - 1].indent > indent) {
      const list = listStack.pop();
      const listHtml = renderListNode(list);
      if (listStack.length) {
        const parent = listStack[listStack.length - 1];
        parent.items[parent.items.length - 1].childrenHtml =
          (parent.items[parent.items.length - 1].childrenHtml || "") + listHtml;
      } else {
        html += listHtml;
      }
    }
  }

  function flushAllLists () {
    flushListsAbove(-1);
  }

  const flushCode = () => {
    const label = codeLang
      ? inline(
        "span",
        escapeHtml(codeLang),
        {
          display: "block",
          marginBottom: "8px",
          color: codeTheme.color,
          opacity: "0.64",
          fontSize: "12px",
          fontFamily: "Menlo, Monaco, Consolas, monospace",
        },
      )
      : "";
    html += inline(
      "pre",
      label + inline("code", highlightCode(codeBuffer.join("\n"), codeLang, codeTheme), {
        fontFamily: "Menlo, Monaco, Consolas, 'Courier New', monospace",
        fontSize: "13px",
        lineHeight: "1.7",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }),
      {
        margin: "0 0 20px",
        padding: "14px 15px",
        borderRadius: "6px",
        border: `1px solid ${codeTheme.border}`,
        background: codeTheme.background,
        color: codeTheme.color,
        overflowX: "auto",
      },
    );
    codeBuffer = [];
    codeLang = "";
  };

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();

    if (/^```/.test(line)) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        flushParagraph();
        flushAllLists();
        inCode = true;
        codeLang = line.replace(/^```/, "").trim();
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(raw);
      continue;
    }

    if (!line) {
      flushParagraph();
      flushAllLists();
      continue;
    }

    const imageOnly = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/.exec(line);
    if (imageOnly) {
      flushParagraph();
      flushAllLists();
      html += imageHtml(imageOnly[1], imageOnly[2]);
      continue;
    }

    if (isTableStart(lines, i)) {
      flushParagraph();
      flushAllLists();
      const headers = splitTableRow(lines[i]);
      i += 2;
      const rows = [];
      while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim()) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      i -= 1;
      const ths = headers
        .map((cell) =>
          inline("th", parseInline(cell, links), {
            padding: "9px 8px",
            border: `1px solid ${theme.border}`,
            background: theme.bgSoft,
            color: theme.color,
            fontWeight: "700",
            fontSize: "14px",
            lineHeight: "1.5",
            textAlign: "left",
          }),
        )
        .join("");
      const trs = rows
        .map((row) =>
          inline(
            "tr",
            row
              .map((cell) =>
                inline("td", parseInline(cell, links), {
                  padding: "9px 8px",
                  border: `1px solid ${theme.border}`,
                  color: theme.color,
                  fontSize: "14px",
                  lineHeight: "1.55",
                }),
              )
              .join(""),
          ),
        )
        .join("");
      html += inline(
        "section",
        inline(
          "table",
          inline("thead", inline("tr", ths)) + inline("tbody", trs),
          {
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          },
        ),
        {
          margin: "0 0 20px",
          overflowX: "auto",
        },
      );
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushAllLists();
      const level = heading[1].length;
      const baseSize = theme.fontSize || 16;
      const size = [0, baseSize + 8, baseSize + 4, baseSize + 2, baseSize][level];
      const marginTop = level === 1 ? "0" : "28px";
      const content = parseInline(heading[2], links);
      if (level === 1) {
        html += inline("h1", content, h1Style(theme));
      } else {
        html += inline(
          `h${level}`,
          headingContent(content, theme),
          {
            margin: `${marginTop} 0 14px`,
            color: theme.color,
            fontSize: `${size}px`,
            lineHeight: level === 4 ? themeLineHeight(theme, 1.45) : "1.45",
            fontWeight: "700",
          },
        );
      }
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushParagraph();
      flushAllLists();
      html += inline("blockquote", parseInline(line.replace(/^>\s?/, ""), links), quoteStyle(theme));
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line)) {
      flushParagraph();
      flushAllLists();
      html += selfClosing("hr", {
        height: "1px",
        border: "0",
        background: theme.border,
        margin: "26px 0",
      });
      continue;
    }

    const task = /^(\s*)[-*+]\s+\[([ xX])]\s+(.+)$/.exec(raw);
    const unordered = /^(\s*)[-*+]\s+(.+)$/.exec(raw);
    const ordered = /^(\s*)\d+\.\s+(.+)$/.exec(raw);
    if (task || unordered || ordered) {
      flushParagraph();
      const indent = getListIndent(raw);
      const currentType = ordered ? "ol" : "ul";
      let content;
      if (task) {
        const checked = /x/i.test(task[2]);
        content = `${checked ? "☑" : "☐"} ${task[3]}`;
      } else {
        content = (unordered || ordered)[2];
      }

      flushListsAbove(indent);

      if (!listStack.length) {
        listStack.push({ type: currentType, indent, items: [{ text: content, childrenHtml: "" }] });
      } else {
        const top = listStack[listStack.length - 1];
        if (top.indent === indent) {
          if (top.type === currentType) {
            top.items.push({ text: content, childrenHtml: "" });
          } else {
            const list = listStack.pop();
            const listHtml = renderListNode(list);
            if (listStack.length) {
              listStack[listStack.length - 1].items[listStack[listStack.length - 1].items.length - 1].childrenHtml =
                (listStack[listStack.length - 1].items[listStack[listStack.length - 1].items.length - 1].childrenHtml || "") + listHtml;
            } else {
              html += listHtml;
            }
            listStack.push({ type: currentType, indent, items: [{ text: content, childrenHtml: "" }] });
          }
        } else if (top.indent < indent) {
          listStack.push({ type: currentType, indent, items: [{ text: content, childrenHtml: "" }] });
        } else {
          flushAllLists();
          listStack.push({ type: currentType, indent, items: [{ text: content, childrenHtml: "" }] });
        }
      }
      continue;
    }

    flushAllLists();
    paragraph.push(line);
  }

  if (inCode) flushCode();
  flushParagraph();
  flushAllLists();

  if (links.length) {
    const linkItems = links
      .map((item, index) =>
        inline(
          "p",
          `[${index + 1}] ${escapeHtml(item.label)}：${escapeHtml(item.href)}`,
          {
            margin: "0 0 7px",
            color: theme.muted,
            fontSize: "13px",
            lineHeight: "1.6",
            wordBreak: "break-all",
          },
        ),
      )
      .join("");
    html += inline(
      "section",
      inline("p", "参考链接", {
        margin: "0 0 9px",
        color: theme.color,
        fontSize: "14px",
        fontWeight: "700",
      }) + linkItems,
      {
        margin: "28px 0 0",
        padding: "12px 0 0",
        borderTop: `1px solid ${theme.border}`,
      },
    );
  }

  return inline(
    "section",
    html || inline("p", "开始输入 Markdown，右侧会实时预览。", paragraphStyle(theme)),
    {
      color: theme.color,
      fontFamily: theme.fontFamily,
      background: theme.canvas,
      padding: theme.canvas ? "18px" : undefined,
      borderRadius: theme.canvas ? "8px" : undefined,
      fontSize: `${theme.fontSize || 16}px`,
      lineHeight: themeLineHeight(theme, 1.8),
      letterSpacing: "0",
    },
  );
}

