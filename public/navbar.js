function renderMasterNavbar() {
  const currentPath = window.location.pathname;

  const header = document.createElement('header');
  header.className = 'master-navbar';
  header.style.cssText = `
    width: 100%;
    background: #FAF6F0;
    padding: 1.5rem 3rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #EFEAE3;
    position: sticky;
    top: 0;
    z-index: 1000;
  `;

  header.innerHTML = `
    <a href="/" style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.6rem; letter-spacing: 0.25em; text-transform: uppercase; font-weight: 500; color: #1C1613; text-decoration: none;">ZOÉLYS</a>
    <ul style="display: flex; gap: 2rem; list-style: none; align-items: center; margin: 0; padding: 0;">
      <li><a href="/get-matched" style="color: ${currentPath.includes('get-matched') ? '#D97757' : '#1C1613'}; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">FIND A SITTER</a></li>
      <li><a href="/#how-it-works" style="color: #1C1613; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">HOW IT WORKS</a></li>
      <li><a href="/#journal" style="color: #1C1613; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">JOURNAL</a></li>
      <li><a href="/#map" style="color: #1C1613; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">MAP</a></li>
      <li><a href="/events" style="color: ${currentPath.includes('events') ? '#D97757' : '#1C1613'}; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">EVENTS</a></li>
      <li><a href="/partners" style="color: ${currentPath.includes('partners') ? '#D97757' : '#1C1613'}; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">PARTNERS</a></li>
    </ul>
    <ul style="display: flex; gap: 1.5rem; align-items: center; list-style: none; margin: 0; padding: 0;">
      <li><a href="/dashboard" style="color: ${currentPath.includes('dashboard') ? '#D97757' : '#1C1613'}; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">SIGN IN</a></li>
      <li><a href="/get-matched" style="background: #D97757; color: white; padding: 0.6rem 1.4rem; border-radius: 2rem; font-weight: 600; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase;">JOIN ZOÉLYS</a></li>
    </ul>
  `;

  document.body.insertBefore(header, document.body.firstChild);
}

document.addEventListener('DOMContentLoaded', renderMasterNavbar);
