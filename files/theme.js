/* Theme preference and optional top-bar toggle. */
(function () {
  var THEME_STORAGE_KEY = 'jb-theme';
  var savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  // Apply the saved theme as early as possible to avoid a flash on load.
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light');
    if (document.body) document.body.classList.add('light');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var body = document.body;

    // The body may not have existed when the saved theme was first applied.
    if (localStorage.getItem(THEME_STORAGE_KEY) === 'light') {
      body.classList.add('light');
    }

    // Pages that provide their own toggle should not receive a duplicate.
    if (document.getElementById('theme-toggle')) return;

    var button = document.createElement('span');
    button.id = 'theme-toggle';
    button.textContent = body.classList.contains('light') ? '\u263E DARK' : '\u2600 LIGHT';
    button.addEventListener('click', function () {
      body.classList.toggle('light');
      document.documentElement.classList.toggle('light');

      var isLight = body.classList.contains('light');
      button.textContent = isLight ? '\u263E DARK' : '\u2600 LIGHT';
      localStorage.setItem(THEME_STORAGE_KEY, isLight ? 'light' : 'dark');
    });

    // Prefer the standard top-bar actions area and place the toggle first.
    var topBarActions = document.querySelector('.tb-right, #topbar .tb-right');
    if (topBarActions) {
      var firstLink = topBarActions.querySelector('a');
      if (firstLink) {
        topBarActions.insertBefore(button, firstLink);
      } else {
        topBarActions.appendChild(button);
      }
      return;
    }

    // Article pages keep their back link at the start of the top bar.
    var backLink = document.querySelector('.topbar .tp-back');
    if (backLink) {
      backLink.parentNode.insertBefore(button, backLink);
      return;
    }

    // Other pages can place the toggle at the end of their top bar.
    var topBar = document.querySelector('#topbar, .topbar');
    if (topBar) topBar.appendChild(button);
  });
})();
