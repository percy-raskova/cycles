export function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-left">
        <a
          href="https://codeberg.org/percy-raskova/cycles"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
          aria-label="View source code on Codeberg"
        >
          Source Code
        </a>
        <span className="footer-separator">|</span>
        <span className="footer-credit">
          Made with 💜 by{" "}
          <a
            href="https://codeberg.org/percy-raskova"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Percy Raskova
          </a>
        </span>
      </div>

      <div className="footer-right">
        <span className="footer-donate-label">Support development:</span>
        <a
          href="https://liberapay.com/percy-raskova/donate"
          target="_blank"
          rel="noopener noreferrer"
          className="liberapay-btn"
          aria-label="Donate via Liberapay"
        >
          <span className="liberapay-heart">♥</span>
          <span className="liberapay-text">Donate</span>
        </a>
      </div>
    </footer>
  );
}
