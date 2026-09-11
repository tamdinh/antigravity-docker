'use strict';

const { ENABLE_IDE, ENABLE_TERMINAL, getAuthPassword } = require('./config');

// SVG icons used in the injected sidebar buttons
const SIDECAR_ICON_SVG = `<svg class="agy-injected-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
const IDE_ICON_SVG = `<svg class="agy-injected-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
const TERMINAL_ICON_SVG = `<svg class="agy-injected-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;
const LOGOUT_ICON_SVG = `<svg class="agy-injected-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`;
const EXTERNAL_ICON_SVG = `<svg class="agy-injected-external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
const DOCK_ICON_SVG = `<svg class="agy-floating-trigger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;

// Injected CSS Styles for Antigravity UI buttons
const INJECTED_UI_STYLES = `
/* Google Antigravity Injected Tools Navigation & Floating Dock */
.agy-injected-tools-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 8px 12px;
    padding: 8px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.agy-injected-tools-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: rgba(255, 255, 255, 0.4);
    padding: 2px 8px 4px 8px;
    user-select: none;
}

.agy-injected-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 8px;
    color: #e2e8f0;
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    user-select: none;
    cursor: pointer;
}

.agy-injected-btn:hover {
    background: rgba(66, 133, 244, 0.12);
    border-color: rgba(66, 133, 244, 0.35);
    color: #ffffff;
    transform: translateX(2px);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.agy-injected-btn-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: #38bdf8;
    transition: transform 0.2s ease;
}

.agy-injected-btn:hover .agy-injected-btn-icon {
    transform: scale(1.1);
    color: #60a5fa;
}

.agy-injected-btn-sidecars .agy-injected-btn-icon {
    color: #a78bfa;
}

.agy-injected-btn-sidecars:hover .agy-injected-btn-icon {
    color: #c4b5fd;
}

.agy-injected-btn-terminal .agy-injected-btn-icon {
    color: #4ade80;
}

.agy-injected-btn-terminal:hover .agy-injected-btn-icon {
    color: #86efac;
}

.agy-injected-btn-logout .agy-injected-btn-icon {
    color: #f87171;
}

.agy-injected-btn-logout:hover {
    background: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.35);
}

.agy-injected-btn-logout:hover .agy-injected-btn-icon {
    color: #fca5a5;
}

.agy-injected-badge-warn {
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

.agy-injected-btn-text {
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.agy-injected-external-icon {
    width: 12px;
    height: 12px;
    opacity: 0.4;
    flex-shrink: 0;
    transition: opacity 0.2s ease;
}

.agy-injected-btn:hover .agy-injected-external-icon {
    opacity: 0.9;
}

/* Hide injected workspace tools on mobile layouts (sidebar container) */
@media (max-width: 768px) {
    .agy-injected-tools-group {
        display: none !important;
    }
}

/* Floating Quick Launcher Dock (Always available when sidebar is hidden/collapsed) */
#agy-floating-tools-dock {
    position: fixed;
    bottom: 24px;
    left: 20px;
    z-index: 999999;
    font-family: "Google Sans Flex", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-start;
    gap: 10px;
    pointer-events: auto;
    user-select: none;
}

.agy-floating-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(14, 18, 27, 0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(66, 133, 244, 0.45);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45), 0 0 16px rgba(66, 133, 244, 0.3);
    color: #38bdf8;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    outline: none;
    padding: 0;
}

.agy-floating-trigger:hover {
    background: rgba(26, 115, 232, 0.3);
    border-color: rgba(66, 133, 244, 0.8);
    transform: scale(1.08);
    box-shadow: 0 6px 28px rgba(26, 115, 232, 0.5);
    color: #ffffff;
}

.agy-floating-trigger-icon {
    width: 20px;
    height: 20px;
    transition: transform 0.25s ease;
}

#agy-floating-tools-dock.open .agy-floating-trigger-icon {
    transform: rotate(45deg);
}

.agy-floating-menu {
    display: none;
    flex-direction: column;
    gap: 6px;
    padding: 10px;
    background: rgba(10, 14, 22, 0.96);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75), 0 0 24px rgba(66, 133, 244, 0.2);
    min-width: 205px;
    animation: agyFadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

#agy-floating-tools-dock.open .agy-floating-menu {
    display: flex;
}

.agy-floating-menu-header {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: rgba(255, 255, 255, 0.45);
    padding: 4px 8px 6px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 4px;
}

@keyframes agyFadeInUp {
    from { opacity: 0; transform: translateY(8px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}
`;

// Build dynamically injected script for Navigation Tools & Fallback Floating Dock
function buildInjectedScript() {
    const sidecarButtonHtml = `
            <a href="/sidecars" target="_blank" rel="noopener noreferrer" class="agy-injected-btn agy-injected-btn-sidecars" title="Open Sidecar Manager in a new tab">
                ${SIDECAR_ICON_SVG}
                <span class="agy-injected-btn-text">Sidecar Manager</span>
                ${EXTERNAL_ICON_SVG}
            </a>`;

    const ideButtonHtml = ENABLE_IDE ? `
            <a href="/ide/" target="_blank" rel="noopener noreferrer" class="agy-injected-btn agy-injected-btn-ide" title="Open VS Code Web IDE in a new tab">
                ${IDE_ICON_SVG}
                <span class="agy-injected-btn-text">Web IDE</span>
                ${EXTERNAL_ICON_SVG}
            </a>` : '';

    const termButtonHtml = ENABLE_TERMINAL ? `
            <a href="/terminal/" target="_blank" rel="noopener noreferrer" class="agy-injected-btn agy-injected-btn-terminal" title="Open Host Terminal in a new tab">
                ${TERMINAL_ICON_SVG}
                <span class="agy-injected-btn-text">Host Terminal</span>
                ${EXTERNAL_ICON_SVG}
            </a>` : '';

    const hasAuth = !!getAuthPassword();
    const authButtonHtml = hasAuth ? `
            <a href="/logout" class="agy-injected-btn agy-injected-btn-logout" title="Sign out of Antigravity">
                ${LOGOUT_ICON_SVG}
                <span class="agy-injected-btn-text">Sign Out</span>
            </a>` : `
            <div class="agy-injected-badge-warn" title="Warning: No AUTH_PASSWORD configured. Anyone on the internet can access this instance. Set AUTH_PASSWORD or run set-password to secure it.">
                <span>⚠️ Unprotected</span>
            </div>`;

    const toolsContentHtml = `${sidecarButtonHtml}${ideButtonHtml}${termButtonHtml}${authButtonHtml}`;

    return `
(function initAntigravityCustomTools() {
    const SIDECAR_ICON_SVG = '<svg class="agy-injected-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>';
    const IDE_ICON_SVG = '<svg class="agy-injected-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>';
    const TERMINAL_ICON_SVG = '<svg class="agy-injected-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>';
    const EXTERNAL_ICON_SVG = '<svg class="agy-injected-external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
    const DOCK_ICON_SVG = '<svg class="agy-floating-trigger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>';

    function createToolsElement() {
        const container = document.createElement('div');
        container.id = 'agy-injected-tools-group';
        container.className = 'agy-injected-tools-group';
        container.innerHTML = '<div class="agy-injected-tools-label">Workspace Tools</div>' + \`${toolsContentHtml}\`;
        return container;
    }

    function createFloatingDock() {
        const dock = document.createElement('div');
        dock.id = 'agy-floating-tools-dock';
        dock.className = 'agy-floating-tools-dock';
        dock.innerHTML = \`
            <div class="agy-floating-menu">
                <div class="agy-floating-menu-header">Workspace Tools</div>
                ${toolsContentHtml}
            </div>
            <button type="button" class="agy-floating-trigger" title="Workspace Tools (Sidecar Manager, Web IDE, Terminal)">
                \${DOCK_ICON_SVG}
            </button>
        \`;

        const trigger = dock.querySelector('.agy-floating-trigger');
        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                dock.classList.toggle('open');
            });
        }

        document.addEventListener('click', (e) => {
            if (!dock.contains(e.target)) {
                dock.classList.remove('open');
            }
        });

        return dock;
    }

    function ensureFloatingDock() {
        if (!document.body) return;
        if (!document.getElementById('agy-floating-tools-dock')) {
            const dock = createFloatingDock();
            document.body.appendChild(dock);
        }
        updateToolsVisibility();
    }

    function updateToolsVisibility() {
        const sidebarGroup = document.getElementById('agy-injected-tools-group');
        const floatingDock = document.getElementById('agy-floating-tools-dock');
        if (!floatingDock) return;

        // Check if sidebar group is attached, not display:none, and visible with actual width
        const isSidebarVisible = sidebarGroup &&
            sidebarGroup.offsetParent !== null &&
            sidebarGroup.getBoundingClientRect().width > 0 &&
            sidebarGroup.getBoundingClientRect().height > 0 &&
            window.innerWidth > 768;

        if (isSidebarVisible) {
            floatingDock.style.display = 'none';
        } else {
            floatingDock.style.display = 'flex';
        }
    }

    function tryInjectSidebar() {
        if (document.getElementById('agy-injected-tools-group')) {
            updateToolsVisibility();
            return;
        }

        const keywords = [
            'conversation history', 'history', 'recents', 'recent', 'all chats', 'chats',
            'new conversation', 'new chat', 'start chat', 'new prompt',
            'lịch sử', 'trò chuyện mới', 'cuộc trò chuyện mới'
        ];

        const allElements = document.querySelectorAll('button, a, div[role="button"], li, nav, aside, div[class*="item"], div[class*="entry"]');
        let targetElement = null;

        for (const el of allElements) {
            const text = (el.textContent || '').trim().toLowerCase();
            const aria = (el.getAttribute('aria-label') || '').toLowerCase();
            const title = (el.getAttribute('title') || '').toLowerCase();

            for (const kw of keywords) {
                if (text.includes(kw) || aria.includes(kw) || title.includes(kw)) {
                    targetElement = el;
                    break;
                }
            }
            if (targetElement) break;
        }

        if (targetElement) {
            const parent = targetElement.closest('ul, ol, nav, aside, div[class*="sidebar"], div[class*="nav"], div[class*="drawer"]') || targetElement.parentElement;
            if (parent) {
                const toolsEl = createToolsElement();
                if (targetElement.nextSibling) {
                    targetElement.parentNode.insertBefore(toolsEl, targetElement.nextSibling);
                } else {
                    targetElement.parentNode.appendChild(toolsEl);
                }
                updateToolsVisibility();
                return;
            }
        }

        // Fallback: If no keyword element matched, try inserting into the first existing navigation container
        const navContainers = document.querySelectorAll('aside, nav, [role="navigation"], div[class*="sidebar"], div[class*="sidenav"]');
        for (const container of navContainers) {
            if (container.offsetWidth > 40 || container.offsetHeight > 100) {
                const toolsEl = createToolsElement();
                container.appendChild(toolsEl);
                updateToolsVisibility();
                return;
            }
        }

        updateToolsVisibility();
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
        tryInjectSidebar();
        ensureFloatingDock();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runInjection);
    } else {
        runInjection();
    }

    window.addEventListener('resize', updateToolsVisibility);

    const observer = new MutationObserver(() => {
        enforceFavicon();
        if (!document.getElementById('agy-injected-tools-group')) {
            tryInjectSidebar();
        }
        ensureFloatingDock();
        updateToolsVisibility();
    });

    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }
    if (document.head) {
        observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
    }
})();
`;
}

module.exports = {
    INJECTED_UI_STYLES,
    buildInjectedScript,
};
