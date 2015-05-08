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
  ifere.addEventListener('click', function () {
    var checked = ifere.checked;
    rline.style.display = checked ? 'none' : 'block';
    bcontent.style.display = checked ? 'block' : 'none';
    bcontent.src = activ.checked ? '/interference.png' : '/notfound.png';
  }, false);
};
