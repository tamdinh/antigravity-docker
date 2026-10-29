'use strict';

const { ENABLE_IDE, ENABLE_TERMINAL, getAuthPassword } = require('./config');

// SVG icons used in the injected sidebar buttons and floating tools dock
const SIDECAR_ICON_SVG = `<svg class="agy-injected-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
const MODELS_ICON_SVG = `<svg class="agy-injected-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z"></path><path d="M18 14v1a6 6 0 0 1-12 0v-1"></path><path d="M12 18v4"></path><path d="M8 22h8"></path></svg>`;
const IDE_ICON_SVG = `<svg class="agy-injected-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
const TERMINAL_ICON_SVG = `<svg class="agy-injected-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;
const LOGOUT_ICON_SVG = `<svg class="agy-injected-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`;
const DOCK_ICON_SVG = `<svg class="agy-floating-trigger-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;

// Injected CSS Styles for Antigravity UI buttons
const INJECTED_UI_STYLES = `
/* Google Antigravity Injected Tools Navigation */
.agy-injected-tools-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0;
    border: none;
    width: 100%;
}

.agy-injected-tools-label {
    display: none !important;
}

.agy-injected-btn {
    display: inline-flex;
    align-items: center;
    width: 100%;
    height: 32px;
    padding: 4px 8px;
    gap: 6px;
    border-radius: 8px;
    color: var(--secondary-foreground, #9d9d9d);
    text-decoration: none;
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    transition: background-color 150ms ease, color 150ms ease;
    background: transparent;
    border: none;
    user-select: none;
    cursor: pointer;
    box-sizing: border-box;
}

.agy-injected-btn:hover {
    background: var(--sidebar-muted, rgba(255, 255, 255, 0.05));
    color: var(--foreground, #ffffff);
    transform: none;
    box-shadow: none;
    border-color: transparent;
}

.agy-injected-btn:active {
    background: var(--sidebar-secondary, rgba(255, 255, 255, 0.08));
}

.agy-injected-btn-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: currentColor;
    stroke: currentColor;
    transition: none;
}

.agy-injected-btn:hover .agy-injected-btn-icon {
    color: currentColor;
    stroke: currentColor;
    transform: none;
}

.agy-injected-btn-sidecars .agy-injected-btn-icon,
.agy-injected-btn-models .agy-injected-btn-icon,
.agy-injected-btn-ide .agy-injected-btn-icon,
.agy-injected-btn-terminal .agy-injected-btn-icon {
    color: currentColor;
    stroke: currentColor;
}

.agy-injected-btn-text {
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    font-weight: 400;
}

/* Hide injected sidebar workspace tools on narrow folded mobile layouts */
@media (max-width: 768px) {
    :root:not(.agy-unfolded) .agy-injected-tools-group {
        display: none !important;
    }
}

/* Draggable Floating Workspace Tools Dock */
#agy-floating-tools-dock {
    position: fixed;
    z-index: 2147483647;
    font-family: "Google Sans Flex", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
}

#agy-floating-tools-dock.dock-bottom {
    flex-direction: column-reverse;
}

#agy-floating-tools-dock.dock-right {
    align-items: flex-end;
}

.agy-floating-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(14, 18, 27, 0.92);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1.5px solid rgba(66, 133, 244, 0.5);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(66, 133, 244, 0.35);
    color: #38bdf8;
    cursor: grab;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    outline: none;
    padding: 0;
}

.agy-floating-trigger:hover {
    background: rgba(26, 115, 232, 0.35);
    border-color: rgba(66, 133, 244, 0.9);
    box-shadow: 0 10px 28px rgba(26, 115, 232, 0.5), 0 0 20px rgba(66, 133, 244, 0.5);
    color: #ffffff;
}

#agy-floating-tools-dock.dragging .agy-floating-trigger {
    cursor: grabbing;
    transform: scale(1.12);
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.65), 0 0 25px rgba(66, 133, 244, 0.6);
}

.agy-floating-trigger-icon {
    width: 20px;
    height: 20px;
    transition: transform 0.25s ease;
    pointer-events: none;
}

#agy-floating-tools-dock.open .agy-floating-trigger-icon {
    transform: rotate(45deg);
}

.agy-floating-menu {
    display: none;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
    margin: 10px 0;
    background: rgba(10, 14, 22, 0.96);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 16px;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.8), 0 0 28px rgba(66, 133, 244, 0.25);
    min-width: 220px;
    animation: agyDockMenuIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

#agy-floating-tools-dock.open .agy-floating-menu {
    display: flex;
}

.agy-floating-menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    color: rgba(255, 255, 255, 0.5);
    padding: 2px 8px 8px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 4px;
}

.agy-floating-menu-hint {
    font-size: 9px;
    text-transform: none;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.35);
}

.agy-floating-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 9px;
    color: #e2e8f0;
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    user-select: none;
    cursor: pointer;
}

.agy-floating-btn:hover {
    background: rgba(66, 133, 244, 0.16);
    border-color: rgba(66, 133, 244, 0.4);
    color: #ffffff;
    transform: translateX(2px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
}

.agy-floating-btn .agy-injected-btn-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
}

.agy-floating-btn-sidecars .agy-injected-btn-icon { color: #a78bfa; }
.agy-floating-btn-models .agy-injected-btn-icon { color: #f59e0b; }
.agy-floating-btn-ide .agy-injected-btn-icon { color: #38bdf8; }
.agy-floating-btn-terminal .agy-injected-btn-icon { color: #4ade80; }
.agy-floating-btn-logout .agy-injected-btn-icon { color: #f87171; }

.agy-floating-btn-logout:hover {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.4);
}

.agy-floating-badge-warn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 6px;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #fca5a5;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 4px;
    cursor: default;
    user-select: none;
}

@keyframes agyDockMenuIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}
`;

// Build pre-init script executed in <head> before main.js boots
function buildPreInitScript() {
    return `
(function initAntigravityPreInit() {
    function isFoldableUnfolded() {
        if (typeof window === 'undefined') return false;
        var w = window.innerWidth;
        var h = window.innerHeight;
        var hasTouch = typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));
        var isSquarish = (w / h) >= 0.65 && (w / h) <= 1.5;
        if (w >= 480 && w <= 1050 && isSquarish) return true;
        if (hasTouch && w >= 480 && w <= 1150 && (w / h) >= 0.65) return true;
        return false;
    }

    try {
        var currentSw = Number(localStorage.getItem('sidebarWidth'));
        if (currentSw > 450) {
            localStorage.removeItem('sidebarWidth');
        }
    } catch (e) {}

    try {
        var realUA = navigator.userAgent;
        Object.defineProperty(navigator, 'userAgent', {
            get: function() {
                if (isFoldableUnfolded()) {
                    return realUA.replace(/Android[^;)]*/i, 'Linux x86_64').replace(/Mobile\\s*/i, '');
                }
                return realUA;
            },
            configurable: true
        });
    } catch (e) {}

    function updateFoldState() {
        var unfolded = isFoldableUnfolded();
        if (document.documentElement) {
            document.documentElement.classList.toggle('agy-unfolded', unfolded);
        }
    }
    updateFoldState();

    function updateVisualViewport() {
        if (!window.visualViewport) return;
        var h = window.visualViewport.height;
        if (document.documentElement) {
            document.documentElement.style.setProperty('--visual-viewport-height', h + 'px');
        }
    }

    function updateDynamicBottomPadding() {
        if (typeof window === 'undefined') return;

        // 1. Probe W3C env(safe-area-inset-bottom)
        var probe = document.createElement('div');
        probe.style.cssText = 'position:fixed;bottom:0;left:0;height:env(safe-area-inset-bottom,0px);pointer-events:none;visibility:hidden;z-index:-9999;';
        (document.body || document.documentElement).appendChild(probe);
        var inset = probe.getBoundingClientRect().height || 0;
        probe.remove();

        // 2. Fallback check for mobile touch devices with a system navigation bar
        if (inset === 0) {
            var hasTouch = typeof navigator !== 'undefined' && (
                navigator.maxTouchPoints > 0 ||
                (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
            );
            var isKeyboardOpen = window.visualViewport && window.visualViewport.height < window.innerHeight * 0.75;
            if (hasTouch && !isKeyboardOpen && window.screen && window.screen.height && window.screen.availHeight) {
                var diff = window.screen.height - window.screen.availHeight;
                if (diff >= 12 && diff <= 72) {
                    inset = diff;
                }
            }
        }

        var padVal = inset > 0 ? (inset + 'px') : '0px';
        if (document.documentElement) {
            document.documentElement.style.setProperty('--safe-area-bottom', padVal);
        }
        var layoutContainer = document.querySelector('.h-screen.w-screen') || document.getElementById('root');
        if (layoutContainer) {
            layoutContainer.style.setProperty('--safe-area-bottom', padVal);
        }
    }

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', function() {
            updateVisualViewport();
            updateDynamicBottomPadding();
        });
        window.visualViewport.addEventListener('scroll', function() {
            updateVisualViewport();
            updateDynamicBottomPadding();
        });
        updateVisualViewport();
    }
    updateDynamicBottomPadding();

    var lastUnfoldedState = isFoldableUnfolded();
    window.addEventListener('resize', function() {
        updateFoldState();
        updateVisualViewport();
        updateDynamicBottomPadding();
        var currentUnfolded = isFoldableUnfolded();
        if (currentUnfolded !== lastUnfoldedState) {
            lastUnfoldedState = currentUnfolded;
            window.location.reload();
        }
    });
    window.addEventListener('orientationchange', function() {
        setTimeout(updateDynamicBottomPadding, 100);
    });
    window.addEventListener('focusin', function() {
        setTimeout(updateDynamicBottomPadding, 150);
    });
    window.addEventListener('focusout', function() {
        setTimeout(updateDynamicBottomPadding, 150);
    });

    // 6. Smooth scroll to prompt box when virtual keyboard opens
    document.addEventListener('focusin', function(e) {
        if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.isContentEditable)) {
            setTimeout(function() {
                try {
                    e.target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
                } catch (err) {}
            }, 150);
            setTimeout(function() {
                try {
                    e.target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
                } catch (err) {}
            }, 350);
        }
    });

    // 7. Enforce sentence case capitalization and Android typo autocorrect on message boxes
    function isMessageOrTextInput(el) {
        if (!el || typeof el.getAttribute !== 'function') return false;
        if (el.tagName === 'CODE' || el.tagName === 'PRE') return false;
        if (el.tagName === 'INPUT') {
            var type = (el.getAttribute('type') || '').toLowerCase();
            if (type === 'password' || type === 'email' || type === 'url' || type === 'number' || type === 'search' || type === 'hidden') return false;
        }
        if (el.closest && el.closest('.monaco-editor, .terminal, .xterm')) return false;
        var ce = el.getAttribute('contenteditable');
        var role = el.getAttribute('role');
        return ce === 'true' || ce === '' || el.contentEditable === 'true' || role === 'textbox' || role === 'combobox' || el.tagName === 'TEXTAREA' || (el.getAttribute('aria-label') || '').toLowerCase().includes('message');
    }

    var origSetAttr = HTMLElement.prototype.setAttribute;
    var origRemAttr = HTMLElement.prototype.removeAttribute;

    function enforceInputTypingAttributes(el) {
        if (!isMessageOrTextInput(el)) return;
        if (el.getAttribute('autocapitalize') !== 'sentences') {
            origSetAttr.call(el, 'autocapitalize', 'sentences');
        }
        if (el.getAttribute('autocorrect') !== 'on') {
            origSetAttr.call(el, 'autocorrect', 'on');
        }
        if (el.getAttribute('spellcheck') !== 'true') {
            origSetAttr.call(el, 'spellcheck', 'true');
        }
        if (el.getAttribute('autocomplete') !== 'on') {
            origSetAttr.call(el, 'autocomplete', 'on');
        }
    }

    try {
        HTMLElement.prototype.setAttribute = function(name, value) {
            if (typeof name === 'string') {
                var lower = name.toLowerCase();
                var strVal = String(value).toLowerCase();
                if (lower === 'autocapitalize' && (strVal === 'off' || strVal === 'none')) {
                    if (isMessageOrTextInput(this)) {
                        return origSetAttr.call(this, name, 'sentences');
                    }
                }
                if (lower === 'autocorrect' && (strVal === 'off' || strVal === 'false' || strVal === 'none')) {
                    if (isMessageOrTextInput(this)) {
                        return origSetAttr.call(this, name, 'on');
                    }
                }
                if (lower === 'spellcheck' && (strVal === 'false' || strVal === 'off')) {
                    if (isMessageOrTextInput(this)) {
                        return origSetAttr.call(this, name, 'true');
                    }
                }
                if (lower === 'autocomplete' && (strVal === 'off' || strVal === 'none')) {
                    if (isMessageOrTextInput(this)) {
                        return origSetAttr.call(this, name, 'on');
                    }
                }
            }
            var res = origSetAttr.call(this, name, value);
            if (typeof name === 'string') {
                var l = name.toLowerCase();
                if (l === 'contenteditable' || l === 'role' || l === 'aria-label') {
                    enforceInputTypingAttributes(this);
                }
            }
            return res;
        };

        HTMLElement.prototype.removeAttribute = function(name) {
            if (typeof name === 'string') {
                var lower = name.toLowerCase();
                if (lower === 'autocapitalize' && isMessageOrTextInput(this)) {
                    return origSetAttr.call(this, name, 'sentences');
                }
                if (lower === 'autocorrect' && isMessageOrTextInput(this)) {
                    return origSetAttr.call(this, name, 'on');
                }
                if (lower === 'spellcheck' && isMessageOrTextInput(this)) {
                    return origSetAttr.call(this, name, 'true');
                }
                if (lower === 'autocomplete' && isMessageOrTextInput(this)) {
                    return origSetAttr.call(this, name, 'on');
                }
            }
            return origRemAttr.call(this, name);
        };

        var ceDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'contentEditable');
        if (ceDesc && ceDesc.set) {
            Object.defineProperty(HTMLElement.prototype, 'contentEditable', {
                get: function() { return ceDesc.get.call(this); },
                set: function(val) {
                    var r = ceDesc.set.call(this, val);
                    if (val === 'true' || val === true || val === '') {
                        enforceInputTypingAttributes(this);
                    }
                    return r;
                },
                configurable: true
            });
        }

        var scDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'spellcheck');
        if (scDesc && scDesc.set) {
            Object.defineProperty(HTMLElement.prototype, 'spellcheck', {
                get: function() { return scDesc.get.call(this); },
                set: function(val) {
                    if (!val && isMessageOrTextInput(this)) {
                        return scDesc.set.call(this, true);
                    }
                    return scDesc.set.call(this, val);
                },
                configurable: true
            });
        }
    } catch (e) {}

    function applySentenceCapitalization(target) {
        if (!target) return;
        var editables = target.querySelectorAll ? target.querySelectorAll('[contenteditable="true"], [role="textbox"], [role="combobox"], [aria-label*="Message"], [aria-label*="message"], textarea') : [];
        for (var i = 0; i < editables.length; i++) {
            enforceInputTypingAttributes(editables[i]);
        }
    }

    document.addEventListener('pointerdown', function(e) {
        if (!e.target) return;
        var host = e.target.closest ? (e.target.closest('[contenteditable="true"], [role="textbox"], [role="combobox"], textarea, input') || e.target) : e.target;
        enforceInputTypingAttributes(host);
    }, true);

    document.addEventListener('focusin', function(e) {
        if (!e.target) return;
        var host = e.target.closest ? (e.target.closest('[contenteditable="true"], [role="textbox"], [role="combobox"], textarea, input') || e.target) : e.target;
        enforceInputTypingAttributes(host);
    }, true);

    // 8. Sanitize product name and window title (remove trailing 'CLI')
    try {
        if (window.__APP_CONFIG__) {
            window.__APP_CONFIG__.productName = 'antigravity';
        }
        var appConfigVal = window.__APP_CONFIG__;
        Object.defineProperty(window, '__APP_CONFIG__', {
            get: function() { return appConfigVal; },
            set: function(val) {
                if (val && typeof val === 'object' && val.productName) {
                    val.productName = val.productName.replace(/-cli$/i, '');
                }
                appConfigVal = val;
            },
            configurable: true
        });
    } catch (e) {}

    function sanitizeDocumentTitle() {
        if (typeof document !== 'undefined' && document.title && /antigravity\s+cli/i.test(document.title)) {
            document.title = document.title.replace(/\s+cli\b/gi, '');
        }
    }
    sanitizeDocumentTitle();

    try {
        var origTitleDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'title') ||
                            Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'title');
        if (origTitleDesc && origTitleDesc.set) {
            var origSetTitle = origTitleDesc.set;
            Object.defineProperty(document, 'title', {
                get: function() { return origTitleDesc.get.call(this); },
                set: function(val) {
                    if (typeof val === 'string') {
                        val = val.replace(/\s+cli\b/gi, '');
                    }
                    return origSetTitle.call(this, val);
                },
                configurable: true
            });
        }
    } catch (e) {}

    function sanitizeTitleTextNodes() {
        sanitizeDocumentTitle();
        var headings = document.querySelectorAll('h1, h2, h3, span, a, div');
        for (var i = 0; i < headings.length; i++) {
            var node = headings[i];
            if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3 && node.textContent.trim() === 'Antigravity CLI') {
                node.textContent = 'Antigravity';
            }
        }
    }

    // 9. Sync sidebar width to CSS custom property --sidebar-width via ResizeObserver
    function syncSidebarWidth() {
        var sidebar = document.querySelector('[role="navigation"][aria-label="Sidebar"]');
        var sidebarPane = sidebar
            ? (sidebar.parentElement?.closest('div[style*="container-type"] > div:first-child') || sidebar.parentElement)
            : null;
        var isUnfolded = isFoldableUnfolded();

        if (sidebar && sidebarPane && isUnfolded) {
            var parent = sidebar.parentElement;
            if (parent && parent !== sidebarPane) {
                parent.style.setProperty('width', '100%', 'important');
                parent.style.setProperty('max-width', '100%', 'important');
                parent.style.setProperty('min-width', '100%', 'important');
                parent.style.setProperty('left', '0px', 'important');
                parent.style.setProperty('right', '0px', 'important');
                parent.style.setProperty('position', 'relative', 'important');
            }
            var halfW = Math.round(window.innerWidth / 2);
            if (document.documentElement) {
                document.documentElement.style.setProperty('--sidebar-width', halfW + 'px');
            }
            var layoutContainer = document.querySelector('.h-screen.w-screen') || document.getElementById('root');
            if (layoutContainer) {
                layoutContainer.style.setProperty('--sidebar-width', halfW + 'px');
            }
        }

        if (sidebarPane && window.ResizeObserver && !sidebarPane.__hasResizeObserver) {
            sidebarPane.__hasResizeObserver = true;
            new ResizeObserver(function(entries) {
                for (var i = 0; i < entries.length; i++) {
                    var w = entries[i].contentRect ? entries[i].contentRect.width : entries[i].target.getBoundingClientRect().width;
                    if (isFoldableUnfolded()) {
                        w = Math.round(window.innerWidth / 2);
                    }
                    if (w > 50 && document.documentElement) {
                        document.documentElement.style.setProperty('--sidebar-width', w + 'px');
                        var lc = document.querySelector('.h-screen.w-screen') || document.getElementById('root');
                        if (lc) lc.style.setProperty('--sidebar-width', w + 'px');
                    } else if (document.documentElement && !isFoldableUnfolded()) {
                        document.documentElement.style.removeProperty('--sidebar-width');
                    }
                }
            }).observe(sidebarPane);
        } else if (sidebarPane && document.documentElement && !isUnfolded) {
            var rect = sidebarPane.getBoundingClientRect();
            if (rect.width > 50) {
                document.documentElement.style.setProperty('--sidebar-width', rect.width + 'px');
            } else {
                document.documentElement.style.removeProperty('--sidebar-width');
            }
        }
    }
    window.addEventListener('resize', syncSidebarWidth);

    // 10. Disable drag-and-drop project/conversation reordering in unfolded mode or touch scrolling
    function shouldDisableSidebarDnd(e) {
        if (e && e.pointerType === 'touch') return true;
        if (isFoldableUnfolded()) return true;
        if (document.documentElement && document.documentElement.classList.contains('agy-unfolded')) return true;
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches && (!e || e.pointerType !== 'mouse')) return true;
        return false;
    }

    function isInsideSidebarScrollArea(target) {
        var el = (target && target.nodeType === 3) ? target.parentElement : target;
        if (!el || typeof el.closest !== 'function') return null;

        // Allow inline rename inputs and explicit [data-no-drag] / popover menu buttons (do NOT exempt [aria-haspopup] because mE ContextMenu wraps every project-header with aria-haspopup="menu")
        if (el.closest('input, textarea, [contenteditable="true"], [data-no-drag], .popover-trigger-element, [role="menuitem"], [role="menu"]')) {
            return null;
        }

        var directItem = el.closest('[data-project-card], [data-testid="project-header"], [data-sidebar-row-id], [data-testid^="conversation-row-"], [data-testid="conversation-group-header"], [data-sidebar-scroll-container], [data-testid="conversation-list-sidebar"]');
        if (directItem) return el;

        var sidebar = el.closest('[role="navigation"][aria-label="Sidebar"], div.bg-sidebar');
        if (!sidebar) return null;

        var scrollContainer = el.closest('.overflow-y-auto, [data-sidebar-scroll-container]');
        if (scrollContainer && sidebar.contains(scrollContainer)) {
            return el;
        }
        return null;
    }

    var activeSidebarTouchScroll = false;

    function handleSidebarPointerDownCapture(e) {
        if (!shouldDisableSidebarDnd(e)) {
            activeSidebarTouchScroll = false;
            return;
        }
        var el = isInsideSidebarScrollArea(e.target);
        if (!el) {
            activeSidebarTouchScroll = false;
            return;
        }

        activeSidebarTouchScroll = true;
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
        }
    }

    function handleSidebarPointerMoveCapture(e) {
        if (!shouldDisableSidebarDnd(e)) return;
        if (activeSidebarTouchScroll || isInsideSidebarScrollArea(e.target)) {
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
        }
    }

    function handleSidebarPointerEndCapture() {
        activeSidebarTouchScroll = false;
    }

    window.addEventListener('pointerdown', handleSidebarPointerDownCapture, true);
    document.addEventListener('pointerdown', handleSidebarPointerDownCapture, true);
    window.addEventListener('pointermove', handleSidebarPointerMoveCapture, true);
    document.addEventListener('pointermove', handleSidebarPointerMoveCapture, true);
    window.addEventListener('pointerup', handleSidebarPointerEndCapture, true);
    window.addEventListener('pointercancel', handleSidebarPointerEndCapture, true);

    document.addEventListener('dragstart', function(e) {
        if (!shouldDisableSidebarDnd(e)) return;
        if (isInsideSidebarScrollArea(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
        }
    }, true);

    // 11. Make Enter insert a line break instead of sending the message in 50/50 split (unfolded) mode and on Android keyboards
    function isUnfoldedSplitMode() {
        if (isFoldableUnfolded()) return true;
        if (typeof document !== 'undefined' && document.documentElement && document.documentElement.classList && document.documentElement.classList.contains('agy-unfolded')) {
            return true;
        }
        if (typeof realUA === 'string' && /Android/i.test(realUA)) return true;
        return false;
    }

    function isTypeaheadMenuOpen(host) {
        if (host && typeof host.getAttribute === 'function' && host.getAttribute('aria-expanded') === 'true') {
            return true;
        }
        if (typeof document !== 'undefined') {
            if (typeof document.querySelector === 'function' && document.querySelector('[data-mention-menu], .typeahead-popover')) {
                return true;
            }
            if (typeof document.querySelectorAll === 'function') {
                var menus = document.querySelectorAll('[aria-label="Typeahead menu"][role="listbox"]');
                for (var i = 0; i < menus.length; i++) {
                    var m = menus[i];
                    if ((m.children && m.children.length > 0) || (m.childNodes && m.childNodes.length > 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function handleUnfoldedEnterKeyDownCapture(e) {
        if (!e || e.key !== 'Enter') return;
        if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
        if (!isUnfoldedSplitMode()) return;

        var rawTarget = (e.target && e.target.nodeType === 3) ? e.target.parentElement : e.target;
        var host = (rawTarget && typeof rawTarget.closest === 'function')
            ? (rawTarget.closest('[contenteditable="true"], [role="textbox"], [role="combobox"], textarea, input') || rawTarget)
            : rawTarget;
        if (!host || host.tagName === 'INPUT') return;
        if (!isMessageOrTextInput(host)) return;

        // Allow Enter to select an item when the slash-command / mention typeahead menu is actually open
        if (isTypeaheadMenuOpen(host)) return;

        // Because navigator.userAgent is spoofed to Linux x86_64 in unfolded mode, Lexical's IS_ANDROID_CHROME
        // flag is false and _compositionKey may remain set when Gboard presses Return after a word.
        if (host.__lexicalEditor && host.__lexicalEditor._compositionKey != null) {
            host.__lexicalEditor._compositionKey = null;
        }

        try {
            Object.defineProperty(e, 'shiftKey', {
                get: function() { return true; },
                configurable: true
            });
        } catch (err) {}
    }

    window.addEventListener('keydown', handleUnfoldedEnterKeyDownCapture, true);
    document.addEventListener('keydown', handleUnfoldedEnterKeyDownCapture, true);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            applySentenceCapitalization(document.body);
            sanitizeTitleTextNodes();
            syncSidebarWidth();
        });
    } else {
        applySentenceCapitalization(document.body);
        sanitizeTitleTextNodes();
        syncSidebarWidth();
    }
    window.addEventListener('load', function() {
        sanitizeTitleTextNodes();
        syncSidebarWidth();
    });
})();
`;
}

// Build dynamically injected script for Left-hand Navigation Tools
function buildInjectedScript() {
    const sidecarButtonHtml = `
            <a href="/sidecars" target="_blank" rel="noopener noreferrer" class="agy-injected-btn agy-injected-btn-sidecars inline-flex items-center transition-colors select-none outline-none cursor-pointer flex-grow w-full justify-start font-normal h-8 min-w-0 gap-1.5 px-2 py-1 rounded-lg bg-transparent text-secondary-foreground hover:bg-sidebar-muted hover:text-foreground" title="Sidecar Manager">
                <span class="shrink-0 flex items-center">${SIDECAR_ICON_SVG}</span>
                <span class="truncate text-sm agy-injected-btn-text">Sidecar Manager</span>
            </a>`;

    const modelsButtonHtml = `
            <a href="/models" target="_blank" rel="noopener noreferrer" class="agy-injected-btn agy-injected-btn-models inline-flex items-center transition-colors select-none outline-none cursor-pointer flex-grow w-full justify-start font-normal h-8 min-w-0 gap-1.5 px-2 py-1 rounded-lg bg-transparent text-secondary-foreground hover:bg-sidebar-muted hover:text-foreground" title="Custom Models">
                <span class="shrink-0 flex items-center">${MODELS_ICON_SVG}</span>
                <span class="truncate text-sm agy-injected-btn-text">Custom Models</span>
            </a>`;

    const ideButtonHtml = ENABLE_IDE ? `
            <a href="/ide/" target="_blank" rel="noopener noreferrer" class="agy-injected-btn agy-injected-btn-ide inline-flex items-center transition-colors select-none outline-none cursor-pointer flex-grow w-full justify-start font-normal h-8 min-w-0 gap-1.5 px-2 py-1 rounded-lg bg-transparent text-secondary-foreground hover:bg-sidebar-muted hover:text-foreground" title="Web IDE">
                <span class="shrink-0 flex items-center">${IDE_ICON_SVG}</span>
                <span class="truncate text-sm agy-injected-btn-text">Web IDE</span>
            </a>` : '';

    const termButtonHtml = ENABLE_TERMINAL ? `
            <a href="/terminal/" target="_blank" rel="noopener noreferrer" class="agy-injected-btn agy-injected-btn-terminal inline-flex items-center transition-colors select-none outline-none cursor-pointer flex-grow w-full justify-start font-normal h-8 min-w-0 gap-1.5 px-2 py-1 rounded-lg bg-transparent text-secondary-foreground hover:bg-sidebar-muted hover:text-foreground" title="Host Terminal">
                <span class="shrink-0 flex items-center">${TERMINAL_ICON_SVG}</span>
                <span class="truncate text-sm agy-injected-btn-text">Host Terminal</span>
            </a>` : '';

    const hasAuth = !!getAuthPassword();
    const authButtonHtml = hasAuth ? `
            <a href="/logout" class="agy-floating-btn agy-floating-btn-logout" title="Sign out of Antigravity">
                ${LOGOUT_ICON_SVG}
                <span class="agy-injected-btn-text">Sign Out</span>
            </a>` : `
            <div class="agy-floating-badge-warn" title="No AUTH_PASSWORD configured.">
                <span>⚠️ Unprotected</span>
            </div>`;

    const floatingSidecarHtml = `
            <a href="/sidecars" target="_blank" rel="noopener noreferrer" class="agy-floating-btn agy-floating-btn-sidecars" title="Sidecar Manager">
                ${SIDECAR_ICON_SVG}
                <span class="agy-injected-btn-text">Sidecar Manager</span>
            </a>`;

    const floatingModelsHtml = `
            <a href="/models" target="_blank" rel="noopener noreferrer" class="agy-floating-btn agy-floating-btn-models" title="Custom Models">
                ${MODELS_ICON_SVG}
                <span class="agy-injected-btn-text">Custom Models</span>
            </a>`;

    const floatingIdeHtml = ENABLE_IDE ? `
            <a href="/ide/" target="_blank" rel="noopener noreferrer" class="agy-floating-btn agy-floating-btn-ide" title="Web IDE">
                ${IDE_ICON_SVG}
                <span class="agy-injected-btn-text">Web IDE</span>
            </a>` : '';

    const floatingTermHtml = ENABLE_TERMINAL ? `
            <a href="/terminal/" target="_blank" rel="noopener noreferrer" class="agy-floating-btn agy-floating-btn-terminal" title="Host Terminal">
                ${TERMINAL_ICON_SVG}
                <span class="agy-injected-btn-text">Host Terminal</span>
            </a>` : '';

    const floatingDockContentHtml = `${floatingSidecarHtml}${floatingModelsHtml}${floatingIdeHtml}${floatingTermHtml}${authButtonHtml}`;

    return `
(function initAntigravityCustomTools() {
    const DOCK_ID = 'agy-floating-tools-dock';

    function updateMenuPlacement(dock, top, left) {
        const isTopHalf = top < (window.innerHeight / 2);
        const isLeftHalf = left < (window.innerWidth / 2);
        dock.classList.toggle('dock-top', isTopHalf);
        dock.classList.toggle('dock-bottom', !isTopHalf);
        dock.classList.toggle('dock-left', isLeftHalf);
        dock.classList.toggle('dock-right', !isLeftHalf);
    }

    function createFloatingDock() {
        const dock = document.createElement('div');
        dock.id = DOCK_ID;
        dock.className = 'agy-floating-tools-dock dock-bottom dock-left';
        dock.innerHTML = \`
            <div class="agy-floating-menu">
                <div class="agy-floating-menu-header">
                    <span>Workspace Tools</span>
                    <span class="agy-floating-menu-hint">Drag icon to move</span>
                </div>
                ${floatingDockContentHtml}
            </div>
            <button type="button" class="agy-floating-trigger" title="Workspace Tools & Terminal (Drag to move)">
                ${DOCK_ICON_SVG}
            </button>
        \`;

        function restorePosition() {
            try {
                const saved = JSON.parse(localStorage.getItem('agy_dock_pos'));
                if (saved && typeof saved.left === 'number' && typeof saved.top === 'number') {
                    const maxLeft = window.innerWidth - 56;
                    const maxTop = window.innerHeight - 56;
                    const left = Math.max(10, Math.min(saved.left, maxLeft));
                    const top = Math.max(10, Math.min(saved.top, maxTop));
                    dock.style.left = left + 'px';
                    dock.style.top = top + 'px';
                    dock.style.bottom = 'auto';
                    dock.style.right = 'auto';
                    updateMenuPlacement(dock, top, left);
                    return;
                }
            } catch (_) {}

            dock.style.left = '20px';
            dock.style.bottom = '24px';
            dock.style.top = 'auto';
            dock.style.right = 'auto';
            dock.classList.add('dock-bottom', 'dock-left');
        }

        restorePosition();

        let isDragging = false;
        let hasDragged = false;
        let startX = 0, startY = 0;
        let initialLeft = 0, initialTop = 0;
        const trigger = dock.querySelector('.agy-floating-trigger');

        function onPointerDown(e) {
            if (e.target.closest('.agy-floating-menu')) return;
            isDragging = true;
            hasDragged = false;
            const pt = e.touches ? e.touches[0] : e;
            startX = pt.clientX;
            startY = pt.clientY;

            const rect = dock.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            const moveHandler = e.touches ? 'touchmove' : 'mousemove';
            const upHandler = e.touches ? 'touchend' : 'mouseup';

            function onPointerMove(ev) {
                if (!isDragging) return;
                const mPt = ev.touches ? ev.touches[0] : ev;
                const dx = mPt.clientX - startX;
                const dy = mPt.clientY - startY;

                if (!hasDragged && Math.hypot(dx, dy) > 4) {
                    hasDragged = true;
                    dock.classList.add('dragging');
                }

                if (hasDragged) {
                    if (ev.cancelable) ev.preventDefault();
                    let newLeft = initialLeft + dx;
                    let newTop = initialTop + dy;

                    const maxLeft = window.innerWidth - 52;
                    const maxTop = window.innerHeight - 52;
                    newLeft = Math.max(8, Math.min(newLeft, maxLeft));
                    newTop = Math.max(8, Math.min(newTop, maxTop));

                    dock.style.left = newLeft + 'px';
                    dock.style.top = newTop + 'px';
                    dock.style.bottom = 'auto';
                    dock.style.right = 'auto';
                    updateMenuPlacement(dock, newTop, newLeft);
                }
            }

            function onPointerUp() {
                if (!isDragging) return;
                isDragging = false;
                dock.classList.remove('dragging');

                document.removeEventListener('mousemove', onPointerMove);
                document.removeEventListener('mouseup', onPointerUp);
                document.removeEventListener('touchmove', onPointerMove);
                document.removeEventListener('touchend', onPointerUp);

                if (hasDragged) {
                    const rect = dock.getBoundingClientRect();
                    try {
                        localStorage.setItem('agy_dock_pos', JSON.stringify({
                            left: rect.left,
                            top: rect.top
                        }));
                    } catch (_) {}
                }
            }

            document.addEventListener(moveHandler, onPointerMove, { passive: false });
            document.addEventListener(upHandler, onPointerUp);
        }

        if (trigger) {
            trigger.addEventListener('mousedown', onPointerDown);
            trigger.addEventListener('touchstart', onPointerDown, { passive: true });

            trigger.addEventListener('click', (e) => {
                if (hasDragged) {
                    e.stopPropagation();
                    e.preventDefault();
                    hasDragged = false;
                    return;
                }
                dock.classList.toggle('open');
            });
        }

        document.addEventListener('click', (e) => {
            if (!dock.contains(e.target)) {
                dock.classList.remove('open');
            }
        });

        window.addEventListener('resize', () => {
            const rect = dock.getBoundingClientRect();
            if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
                restorePosition();
            }
        });

        return dock;
    }

    function ensureFloatingDock() {
        if (!document.body) return;
        if (!document.getElementById(DOCK_ID)) {
            const dock = createFloatingDock();
            document.body.appendChild(dock);
        }
    }

    function createToolsElement() {
        const container = document.createElement('div');
        container.id = 'agy-injected-tools-group';
        container.className = 'agy-injected-tools-group';
        container.innerHTML = \`${sidecarButtonHtml}${modelsButtonHtml}${ideButtonHtml}${termButtonHtml}\`;
        return container;
    }

    function tryInjectSidebar() {
        const sidebar = document.querySelector('[role="navigation"][aria-label="Sidebar"], div.bg-sidebar');
        if (!sidebar) return;

        let toolsEl = document.getElementById('agy-injected-tools-group');
        if (!toolsEl) {
            toolsEl = createToolsElement();
        }

        // Look for Customizations entry in the sidebar navigation
        let customizationsEl = null;
        const candidates = sidebar.querySelectorAll('button, a, div[role="button"]');
        for (let i = 0; i < candidates.length; i++) {
            const el = candidates[i];
            const text = (el.textContent || '').trim();
            const href = el.getAttribute('href') || '';
            const testid = el.getAttribute('data-testid') || '';
            if (
                text === 'Customizations' ||
                href.includes('/customizations') ||
                testid.includes('customization') ||
                (text.startsWith('Customizations') && text.length < 30)
            ) {
                customizationsEl = el;
                break;
            }
        }

        if (customizationsEl) {
            const target = (customizationsEl.parentElement && customizationsEl.parentElement.classList.contains('flex-col'))
                ? customizationsEl
                : (customizationsEl.closest('li, div.flex-grow') || customizationsEl);
            if (toolsEl.previousElementSibling !== target) {
                if (target.nextSibling) {
                    target.parentNode.insertBefore(toolsEl, target.nextSibling);
                } else {
                    target.parentNode.appendChild(toolsEl);
                }
            }
            return;
        }

        // Fallback: settings button or footer section if customizations button not rendered yet
        if (!document.getElementById('agy-injected-tools-group')) {
            const settingsBtn = sidebar.querySelector('button[data-testid="settings-button"]');
            if (settingsBtn && settingsBtn.parentElement) {
                settingsBtn.parentElement.insertBefore(toolsEl, settingsBtn);
            } else {
                const footerSection = sidebar.querySelector('div.flex.flex-col.gap-px.pt-2.px-2') || sidebar.lastElementChild;
                if (footerSection && footerSection !== sidebar) {
                    sidebar.insertBefore(toolsEl, footerSection);
                } else {
                    sidebar.appendChild(toolsEl);
                }
            }
        }
    }

    function enforceFavicon() {
        const icons = document.querySelectorAll("link[rel*='icon']");
        if (icons.length === 0) {
            const icon = document.createElement('link');
            icon.rel = 'icon';
            icon.type = 'image/svg+xml';
            icon.href = '/favicon.svg';
            document.head.appendChild(icon);
        } else {
            for (const icon of icons) {
                if (icon.getAttribute('href') !== '/favicon.svg') {
                    icon.setAttribute('type', 'image/svg+xml');
                    icon.setAttribute('href', '/favicon.svg');
                }
            }
        }
    }

    function runInjection() {
        enforceFavicon();
        ensureFloatingDock();
        tryInjectSidebar();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runInjection);
    } else {
        runInjection();
    }

    const observer = new MutationObserver(() => {
        enforceFavicon();
        ensureFloatingDock();
        tryInjectSidebar();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    if (document.head) {
        observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
    }
})();
`;
}

module.exports = {
    INJECTED_UI_STYLES,
    buildPreInitScript,
    buildInjectedScript,
};
