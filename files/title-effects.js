(function () {
  var title = document.querySelector('#site-banner .banner-title');
  if (!title) return;

  var characters = Array.prototype.slice.call(title.querySelectorAll('.title-char'));
  var glitchCharacters = ['#', '/', '\\', '0', '1', '?', 'X'];
  var motionPreference = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)');

  function triggerGlitch() {
    if ((!motionPreference || !motionPreference.matches) && document.visibilityState === 'visible') {
      var count = Math.random() < 0.35 ? 2 : 1;
      var changed = [];

      while (changed.length < count) {
        var character = characters[Math.floor(Math.random() * characters.length)];
        if (changed.indexOf(character) === -1) changed.push(character);
      }

      changed.forEach(function (character) {
        character.dataset.original = character.textContent;
        character.textContent = glitchCharacters[Math.floor(Math.random() * glitchCharacters.length)];
      });
      title.classList.add('is-glitching');

      window.setTimeout(function () {
        changed.forEach(function (character) {
          character.textContent = character.dataset.original;
          delete character.dataset.original;
        });
        title.classList.remove('is-glitching');
      }, 360);
    }

    window.setTimeout(triggerGlitch, 5500 + Math.random() * 4500);
  }

  window.setTimeout(triggerGlitch, 1800 + Math.random() * 2500);
})();
