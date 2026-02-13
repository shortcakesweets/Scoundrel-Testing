import { applyTranslations, ensureTranslations, getLocale, setLocale, t } from "./i18n.js";

const OPTIONS_KEY = "scoundrel.options";

const DEFAULT_OPTIONS = {
    hintText: true,
    firstRoomWeapon: false,
};

const LOCALES = ["en", "ko", "ja"];

const loadOptions = () => {
    try {
        const stored = localStorage.getItem(OPTIONS_KEY);
        if (!stored) {
            return { ...DEFAULT_OPTIONS };
        }

        const parsed = JSON.parse(stored);
        return { ...DEFAULT_OPTIONS, ...parsed };
    } catch (error) {
        return { ...DEFAULT_OPTIONS };
    }
};

const saveOptions = (options) => {
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
};

const BACK_SRC = "cards/Back.png";

const renderOptions = (root, options, translate) => {
    const buttons = root.querySelectorAll("[data-option]");
    buttons.forEach((button) => {
        const key = button.dataset.option;
        const enabled = Boolean(options[key]);
        button.dataset.enabled = enabled ? "true" : "false";

        const img = button.querySelector("img");
        if (img) {
            const front = img.dataset.front || img.getAttribute("src");
            img.src = enabled ? front : BACK_SRC;
            img.alt = enabled ? img.alt : "Card back";
        }

        const state = button.querySelector("[data-option-state]");
        if (state) {
            state.textContent = enabled ? translate("options.on") : translate("options.off");
        }
    });

    const localeLabel = root.querySelector("[data-locale-state]");
    if (localeLabel) {
        localeLabel.textContent = getLocale().toUpperCase();
    }
};

export const initOptions = async (root = document) => {
    await ensureTranslations();
    applyTranslations(root);
    const options = loadOptions();
    renderOptions(root, options, t);
};

export const toggleOption = (root = document, key) => {
    if (!key) {
        return;
    }

    const options = loadOptions();
    options[key] = !options[key];
    saveOptions(options);
    renderOptions(root, options, t);
};

export const getOptions = () => loadOptions();

export const toggleLocale = (root = document) => {
    const current = getLocale();
    const index = LOCALES.indexOf(current);
    const next = LOCALES[(index + 1) % LOCALES.length];
    setLocale(next);
    applyTranslations(root);
    renderOptions(root, loadOptions(), t);
};
