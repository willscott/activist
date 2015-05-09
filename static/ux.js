window.addEventListener('load', function () {
  onePageScroll(".main", {
    sectionContainer: "section",
    loop: false,
    responsiveFallback: false
  });
  setupDemo();
}, true);

function setupDemo() {
  var ifere = document.getElementById('demo-button');
  var activ = document.getElementById('act-button');
  var rline = document.getElementsByClassName('right')[0];
  var bcontent = document.getElementById('browserinter');
  var ifering = false;
  var activing = false;
  var clickifere = function () {
    ifering = !ifering;
    ifere.className = ifering ? 'active' : '';
    rline.style.display = ifering ? 'none' : 'block';
    bcontent.style.display = ifering ? 'block' : 'none';
    bcontent.src = activing ? '/interference.png' : '/notfound.png';
  };

  activ.addEventListener('click', function () {
    activing = !activing;
    activ.className = activing ? 'active' : '';
    if (activing && ifering) {
      clickifere();
    }
  });
  ifere.addEventListener('click', clickifere, false);
};
