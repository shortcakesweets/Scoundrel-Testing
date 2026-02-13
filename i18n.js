const TRANSLATION_PATH = "translation.csv";
const LOCALE_KEY = "scoundrel.locale";

let translations = null;
let translationPromise = null;

const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                field += ch;
            }
            continue;
        }

        if (ch === '"') {
            inQuotes = true;
            continue;
        }

        if (ch === ",") {
            row.push(field);
            field = "";
            continue;
        }

        if (ch === "\n" || ch === "\r") {
            if (ch === "\r" && text[i + 1] === "\n") {
                i += 1;
            }
            row.push(field);
            field = "";
            if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
                rows.push(row);
            }
            row = [];
            continue;
        }

        field += ch;
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    return rows;
};

const buildTranslations = (rows) => {
    if (!rows.length) {
        return {};
    }

    const headers = rows[0].map((header, index) => {
        if (index === 0 && header.charCodeAt(0) === 0xfeff) {
            return header.slice(1);
        }
        return header;
    });

    const map = {};
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const key = row[0];
        if (!key) {
            continue;
        }
        for (let j = 1; j < headers.length; j++) {
            const locale = headers[j];
            if (!locale) {
                continue;
            }
            if (!map[locale]) {
                map[locale] = {};
            }
            map[locale][key] = row[j] ?? "";
        }
    }

    return map;
};

export const ensureTranslations = async () => {
    if (translations) {
        return translations;
    }
    if (!translationPromise) {
        translationPromise = fetch(TRANSLATION_PATH, { cache: "no-store" })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${TRANSLATION_PATH}: ${response.status}`);
                }
                return response.text();
            })
            .then((text) => {
                translations = buildTranslations(parseCsv(text));
                return translations;
            })
            .catch((error) => {
                console.error(error);
                translations = {};
                return translations;
            });
    }
    return translationPromise;
};

export const getLocale = () => {
    const stored = localStorage.getItem(LOCALE_KEY);
    return stored || "en";
};

export const setLocale = (locale) => {
    if (!locale) {
        return;
    }
    localStorage.setItem(LOCALE_KEY, locale);
    document.dispatchEvent(new CustomEvent("i18n:change", { detail: { locale } }));
};

export const t = (key, params = {}) => {
    if (!key) {
        return "";
    }
    const locale = getLocale();
    const value = translations?.[locale]?.[key]
        ?? translations?.en?.[key]
        ?? key;

    return value.replace(/\{(\w+)\}/g, (match, name) => {
        if (Object.prototype.hasOwnProperty.call(params, name)) {
            return String(params[name]);
        }
        return match;
    });
};

export const applyTranslations = (root = document) => {
    if (!root) {
        return;
    }
    const textNodes = root.querySelectorAll("[data-i18n]");
    textNodes.forEach((node) => {
        const key = node.dataset.i18n;
        node.textContent = t(key);
    });

    const htmlNodes = root.querySelectorAll("[data-i18n-html]");
    htmlNodes.forEach((node) => {
        const key = node.dataset.i18nHtml;
        node.innerHTML = t(key);
    });
};
