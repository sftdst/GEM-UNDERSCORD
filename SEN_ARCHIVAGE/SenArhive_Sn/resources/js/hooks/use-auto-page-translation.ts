import { useEffect } from 'react';
import i18n, { getRuntimeTranslationMap } from '@/i18n';

const translatableAttributes = ['placeholder', 'title', 'aria-label'];

const originalTextNodes = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

function translateValue(raw: string, language: string, dictionary: Map<string, string>): string {
    if (!raw) return raw;
    if (language === 'fr') return raw;

    const leading = raw.match(/^\s*/)?.[0] ?? '';
    const trailing = raw.match(/\s*$/)?.[0] ?? '';
    const core = raw.trim();
    if (!core) return raw;

    const translated = dictionary.get(core);
    if (!translated) return raw;
    return `${leading}${translated}${trailing}`;
}

function processTextNode(node: Text, language: string, dictionary: Map<string, string>) {
    const parentTag = node.parentElement?.tagName;
    if (parentTag && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parentTag)) return;

    if (!originalTextNodes.has(node)) {
        originalTextNodes.set(node, node.textContent ?? '');
    }

    const original = originalTextNodes.get(node) ?? '';
    const next = translateValue(original, language, dictionary);
    if (node.textContent !== next) {
        node.textContent = next;
    }
}

function processAttributes(element: Element, language: string, dictionary: Map<string, string>) {
    let elementOriginals = originalAttributes.get(element);
    if (!elementOriginals) {
        elementOriginals = new Map<string, string>();
        originalAttributes.set(element, elementOriginals);
    }

    translatableAttributes.forEach((attr) => {
        const current = element.getAttribute(attr);
        if (current === null) return;

        if (!elementOriginals!.has(attr)) {
            elementOriginals!.set(attr, current);
        }

        const original = elementOriginals!.get(attr) ?? current;
        const next = translateValue(original, language, dictionary);

        if (current !== next) {
            element.setAttribute(attr, next);
        }
    });
}

function walkAndTranslate(root: Node, language: string, dictionary: Map<string, string>) {
    if (root.nodeType === Node.TEXT_NODE) {
        processTextNode(root as Text, language, dictionary);
        return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) {
        return;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let current = walker.currentNode;

    while (current) {
        if (current.nodeType === Node.TEXT_NODE) {
            processTextNode(current as Text, language, dictionary);
        } else if (current.nodeType === Node.ELEMENT_NODE) {
            processAttributes(current as Element, language, dictionary);
        }

        current = walker.nextNode();
    }
}

export function useAutoPageTranslation() {
    useEffect(() => {
        const applyTranslation = () => {
            const language = i18n.language || 'fr';
            const dictionary = getRuntimeTranslationMap(language);
            walkAndTranslate(document.body, language, dictionary);
        };

        applyTranslation();

        const onLanguageChanged = () => applyTranslation();
        i18n.on('languageChanged', onLanguageChanged);

        const observer = new MutationObserver((mutations) => {
            const language = i18n.language || 'fr';
            const dictionary = getRuntimeTranslationMap(language);

            mutations.forEach((mutation) => {
                if (mutation.type === 'characterData') {
                    processTextNode(mutation.target as Text, language, dictionary);
                }

                if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
                    processAttributes(mutation.target as Element, language, dictionary);
                }

                mutation.addedNodes.forEach((node) => {
                    walkAndTranslate(node, language, dictionary);
                });
            });
        });

        observer.observe(document.body, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: translatableAttributes,
        });

        return () => {
            observer.disconnect();
            i18n.off('languageChanged', onLanguageChanged);
        };
    }, []);
}
