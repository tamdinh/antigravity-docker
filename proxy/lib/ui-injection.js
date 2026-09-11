'use strict';

const { ENABLE_IDE, ENABLE_TERMINAL, getAuthPassword } = require('./config');

// SVG icons used in the injected floating buttons
const SIDECAR_ICON_SVG = `<svg class="agy-injected-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
const IDE_ICON_SVG = `<svg class="agy-injected-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
const TERMINAL_ICON_SVG = `<svg class="agy-injected-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;
const LOGOUT_ICON_SVG = `<svg class="agy-injected-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`;
const EXTERNAL_ICON_SVG = `<svg class="agy-injected-external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
const DOCK_ICON_SVG = `<svg class="agy-floating-trigger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;

// Injected CSS Styles for Antigravity Floating Tools Dock
const INJECTED_UI_STYLES = `
/* Kept for test compatibility and sidebar styles if needed */
.agy-injected-tools-group {
    display: none;
}

@media (max-width: 768px) {
    .agy-injected-tools-group {
        display: none !important;
    }
}

/* Draggable Floating Workspace Tools Dock */
#agy-floating-tools-dock {
    position: fixed;
    z-index: 2147483647; /* Maximum priority to stay above all Antigravity UI layers */
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
    width: 46px;
    height: 46px;
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
    width: 22px;
    height: 22px;
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

.agy-injected-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
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

.agy-injected-btn:hover {
    background: rgba(66, 133, 244, 0.16);
    border-color: rgba(66, 133, 244, 0.4);
    color: #ffffff;
    transform: translateX(2px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
}

.agy-injected-btn-icon {
    width: 17px;
    height: 17px;
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
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.4);
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

@keyframes agyDockMenuIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}
`;

// Build dynamically injected script for Draggable Floating Dock
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
(function initAntigravityFloatingTools() {
    const DOCK_ID = 'agy-floating-tools-dock';
    const DOCK_ICON_SVG = '<svg class="agy-floating-trigger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>';

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
                ${toolsContentHtml}
            </div>
            <button type="button" class="agy-floating-trigger" title="Workspace Tools (Drag to move anywhere)">
                \${DOCK_ICON_SVG}
            </button>
        \`;

        // Restore position from localStorage or default to bottom-left
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

            // Default placement: bottom-left
            dock.style.left = '20px';
            dock.style.bottom = '24px';
            dock.style.top = 'auto';
            dock.style.right = 'auto';
            dock.classList.add('dock-bottom', 'dock-left');
        }

        restorePosition();

        // Draggable Mechanics (Mouse & Touch)
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

    function ensureDock() {
        if (!document.body) return;
        if (!document.getElementById(DOCK_ID)) {
            const dock = createFloatingDock();
            document.body.appendChild(dock);
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

    function run() {
        enforceFavicon();
        ensureDock();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }

    const observer = new MutationObserver(() => {
        enforceFavicon();
        ensureDock();
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
