import { Link } from 'react-router-dom';
import './Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header__container">
        <Link to="/" className="header__logo">
          <span className="header__logo-icon">&#9881;</span>
          <span className="header__logo-text">JobRad Compare</span>
        </Link>
        <nav className="header__nav">
          <Link to="/" className="header__link">
            Vergleichen
          </Link>
          <Link to="/about" className="header__link">
            Info
          </Link>
        </nav>
      </div>
    </header>
  );
}
