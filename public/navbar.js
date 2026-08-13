function initNavigation() {
  const currentPath = window.location.pathname.replace(/\/$/, '');
  const userId = localStorage.getItem('zoelys_user_id');

  let rightNavHTML = `
    <li><a href="/join" style="background: #D97757; color: white; padding: 0.65rem 1.4rem; border-radius: 2rem; font-weight: 600; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase;">MEMBER PORTAL</a></li>
  `;

  if (userId) {
    rightNavHTML = `
      <li><a href="/dashboard" style="color: #D97757; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">MY PORTAL 👤</a></li>
      <li><a href="#" onclick="logoutSession(event)" style="color: #8E8883; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">LOG OUT</a></li>
    `;
  }

  const navbarHTML = `
    <header class="master-navbar" style="width: 100%; height: 80px; background: #FAF6F0; padding: 0 4rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #EFEAE3; position: sticky; top: 0; z-index: 1000; box-sizing: border-box;">
      <a href="/" class="brand-logo" style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.8rem; letter-spacing: 0.25em; text-transform: uppercase; font-weight: 500; color: #1C1613; text-decoration: none;">ZOÉLYS</a>
      
      <ul class="nav-center" style="display: flex; gap: 2rem; list-style: none; align-items: center; margin: 0; padding: 0;">
        <li><a href="/get-matched" style="color: ${currentPath.includes('get-matched') ? '#D97757' : '#1C1613'}; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">FIND A SITTER</a></li>
        <li><a href="/how-it-works" style="color: ${currentPath.includes('how-it-works') ? '#D97757' : '#1C1613'}; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">HOW IT WORKS</a></li>
        <li><a href="/journal" style="color: ${currentPath.includes('journal') ? '#D97757' : '#1C1613'}; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">JOURNAL</a></li>
        <li><a href="/map" style="color: ${currentPath.includes('map') ? '#D97757' : '#1C1613'}; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">MAP</a></li>
        <li><a href="/events" style="color: ${currentPath.includes('events') ? '#D97757' : '#1C1613'}; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">EVENTS</a></li>
        <li><a href="/partners" style="color: ${currentPath.includes('partners') ? '#D97757' : '#1C1613'}; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">PARTNERS</a></li>
      </ul>

      <ul class="nav-right" style="display: flex; gap: 1.5rem; align-items: center; list-style: none; margin: 0; padding: 0;">
        ${rightNavHTML}
      </ul>
    </header>
  `;

  const existingHeader = document.querySelector('header');
  if (existingHeader) {
    existingHeader.outerHTML = navbarHTML;
  } else {
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
  }
}

function logoutSession(e) {
  if (e) e.preventDefault();
  localStorage.removeItem('zoelys_user_id');
  window.location.href = '/join';
}

document.addEventListener('DOMContentLoaded', initNavigation);
