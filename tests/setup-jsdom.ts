/**
 * jsdom polyfills for HTML APIs not fully implemented in jsdom
 */

if (typeof window !== "undefined" && window.HTMLDialogElement) {
  if (!window.HTMLDialogElement.prototype.showModal) {
    window.HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
      this.setAttribute("data-modal-open", "");
    };
  }

  if (!window.HTMLDialogElement.prototype.close) {
    window.HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
      this.removeAttribute("data-modal-open");
    };
  }
}

// jsdom does not implement matchMedia; provide a desktop-default no-op so
// hooks like useIsMobile work in every test. Tests that need a specific
// viewport (e.g. mobile-desktop-toggle.test.tsx) reassign window.matchMedia
// inline — that still overrides this default.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
