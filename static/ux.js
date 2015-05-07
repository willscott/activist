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
  var rline = document.getElementsByClassName('right')[0];
  var bcontent = document.getElementById('browserinter');
  ifere.addEventListener('click', function () {
    rline.style.display = 'none';
    bcontent.style.display = 'block';
  }, false);
};
