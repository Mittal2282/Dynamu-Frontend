import { Link } from 'react-router-dom';
import { BRAND, CALENDLY_URL, CONTACT_MAILTO } from './content';

export default function Footer() {
  return (
    <footer className="dyn-site-footer">
      <div className="dyn-site-footer-top">
        <div className="dyn-footer-col">
          <p className="dyn-footer-col-title dyn-mono">Navigation</p>
          <a href="#how-it-works">How It Works</a>
          <a href="#book-demo">Get Started</a>
          <Link to="/login">Restaurant Login</Link>
        </div>

        <div className="dyn-footer-col dyn-footer-col-center">
          <p className="dyn-footer-col-title dyn-mono">Say Hello</p>
          <p className="dyn-footer-say-hi">Interested in bringing an AI waiter to your tables?</p>
          <a className="dyn-btn dyn-btn-brass" href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
            Let&apos;s Talk
          </a>
        </div>

        <div className="dyn-footer-col dyn-footer-col-right">
          <p className="dyn-footer-col-title dyn-mono">Contact</p>
          <a href={CONTACT_MAILTO}>founder@dynamu.ai</a>
          <p className="dyn-footer-meta dyn-mono">© {new Date().getFullYear()} Dynamu AI</p>
          <p className="dyn-footer-meta dyn-mono">Vertical AI · HoReCa · Bharat First</p>
        </div>
      </div>

      <div className="dyn-site-footer-wordmark" aria-hidden="true">
        <span>{BRAND}</span>
      </div>
    </footer>
  );
}
