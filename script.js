// Lightbox album logic with keyboard support, captions, and multi-album
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
// const lightboxCaption = document.getElementById('lightbox-caption');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

let currentAlbum = [];
let currentIndex = 0;

// Organize images into albums
const albumMap = {};
const allImages = document.querySelectorAll('.grid img');
allImages.forEach((img, i) => {
  const album = img.dataset.album || 'default';
  const albumIndex = parseInt(img.dataset.index, 10);

  if (!albumMap[album]) albumMap[album] = [];
  albumMap[album][albumIndex] = img;

  img.addEventListener('click', () => {
    currentAlbum = albumMap[album];
    currentIndex = albumIndex;
    openLightbox(currentAlbum[currentIndex]);
  });
});

let scrollPosition = 0;

function openLightbox(imgElement) {
  scrollPosition = window.scrollY || window.pageYOffset;
  document.body.style.top = `-${scrollPosition}px`;
  document.body.classList.add('no-scroll');

  lightboxImage.src = imgElement.src;
//  lightboxCaption.textContent = imgElement.dataset.caption || '';
  lightbox.classList.add('active');
}

function closeLightbox() {
  document.body.classList.remove('no-scroll');
  document.body.style.top = '';
  window.scrollTo(0, scrollPosition);

  lightbox.classList.remove('active');
}


function showPrev() {
  currentIndex = (currentIndex - 1 + currentAlbum.length) % currentAlbum.length;
  openLightbox(currentAlbum[currentIndex]);
}

function showNext() {
  currentIndex = (currentIndex + 1) % currentAlbum.length;
  openLightbox(currentAlbum[currentIndex]);
}

prevBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  showPrev();
});

nextBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  showNext();
});

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) {
    closeLightbox();
  }
});

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'ArrowLeft') {
    showPrev();
  } else if (e.key === 'ArrowRight') {
    showNext();
  } else if (e.key === 'Escape') {
    closeLightbox();
  }
});

const albums = {};
document.querySelectorAll('.grid img').forEach(img => {
  const album = img.dataset.album;
  if (!albums[album]) {
    albums[album] = true; // mark the first one
  } else {
    img.classList.add('hidden'); // hide the rest
  }
});

const imageContainer = document.getElementById('lightbox-image').parentElement;
imageContainer.style.setProperty('--lightbox-img-y', '175px'); // adjusts the height of the lightbox image
imageContainer.style.setProperty('--lightbox-img-x', '200px'); // adjusts the left/right position of the lightbox image for customary use and shit.

// const caption = document.getElementById('lightbox-caption');
// caption.style.setProperty('--lightbox-caption-x', '1100px'); // adjusts the height of the lightbox captions
// caption.style.setProperty('--lightbox-caption-y', '175px');  // adjusts the left/right position of the lightbox captions for customary use and shit.


document.querySelectorAll('.grid-item').forEach(item => {
  const captionText = item.getAttribute('data-caption');
  if (captionText) {
    const captionDiv = document.createElement('div');
    captionDiv.className = 'grid-caption';
    captionDiv.textContent = captionText;
    item.appendChild(captionDiv);
  }
});

caption.innerHTML = captionText.replace(/\n\n/g, "<br><br>");


//window.addEventListener('DOMContentLoaded', () => {
  //document.body.classList.add('page-fade-in');
//});