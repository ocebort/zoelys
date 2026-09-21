function ensureZoelysStyles() {
  if (!document.querySelector('link[href="/style.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/style.css';
    document.head.appendChild(link);
  }
}

function initNavigation() {
  ensureZoelysStyles();

  const currentPath = window.location.pathname.replace(/\/$/, '');
  const userId = localStorage.getItem('zoelys_user_id');

  const linkList = [
    ['/get-matched', 'get-matched', 'Find a Sitter'],
    ['/how-it-works', 'how-it-works', 'How It Works'],
    ['/trust', 'trust', 'Trust & Safety'],
    ['/journal', 'journal', 'Journal']
  ];
  if (userId) linkList.push(['/sitters', 'sitters', 'The Roster']);

  const links = linkList;

  const centerLinks = links
    .map(
      ([href, key, label]) =>
        `<li><a href="${href}" class="${currentPath.includes(key) ? 'active-link' : ''}">${label}</a></li>`
    )
    .join('');

  let rightNavHTML;
  if (userId) {
    rightNavHTML = `
      <li><a href="/dashboard" class="nav-link-accent">My Portal</a></li>
      <li><a href="#" onclick="logoutSession(event)" class="nav-logout">Log Out</a></li>
    `;
  } else {
    rightNavHTML = `<li><a href="/join" class="btn-join-pill">Member Portal</a></li>`;
  }

  const navbarHTML = `
    <header class="master-navbar">
      <a href="/" class="brand-logo">
        <img class="brand-logo-img" src="/assets/logo-paw.png" alt="Zoélys">
        <span class="brand-word">ZOÉLYS</span>
      </a>
      <ul class="nav-center">${centerLinks}</ul>
      <ul class="nav-right">${rightNavHTML}</ul>
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
