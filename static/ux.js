function advance() {
  console.log('advancing');
};

window.addEventListener('load', function () {
  document.getElementById('theresmore').addEventListener('click', advance, true);
}, true);
