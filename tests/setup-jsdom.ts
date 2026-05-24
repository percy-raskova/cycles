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
