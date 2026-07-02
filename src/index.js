const slider = document.querySelector('.slider');
const track = document.querySelector('.slider__track');
const dotsContainer = document.querySelector('.dots');
const autoplayButton = document.querySelector('.slider__autoplay');
console.log("hello")

const AUTOPLAY_DELAY = 7000;
const SWIPE_THRESHOLD = 48;

let virtualIndex = 0;
let autoplayId;
let isAutoplayEnabled = true;
let slides = [];
let realSlides = [];
let slideStep = 0;
let pointerStartX = 0;
let didSwipe = false;

const measureSlideStep = () => {
  if (slides.length > 1) {
    slideStep = slides[1].offsetLeft - slides[0].offsetLeft;
    return;
  }

  if (slides.length === 1) {
    slideStep = slides[0].offsetWidth;
  }
};

const getOffsetForIndex = (index) => {
  const sliderCenter = slider.offsetWidth / 2;
  const slideWidth = slides[index].offsetWidth;

  return sliderCenter - (index * slideStep + slideWidth / 2);
};

const applyTrackPosition = (instant = false) => {
  const offset = Math.round(getOffsetForIndex(virtualIndex));

  if (instant) {
    track.classList.add('slider__track--instant');
  } else {
    track.classList.remove('slider__track--instant');
  }

  track.style.transform = `translate3d(${offset}px, 0, 0)`;

  if (instant) {
    track.getBoundingClientRect();
    track.classList.remove('slider__track--instant');
  }
};

const getRealIndex = (index = virtualIndex) => (
  (index % realSlides.length + realSlides.length) % realSlides.length
);

const getSlideRealIndex = (slideIndex) => {
  const count = realSlides.length;

  if (slideIndex >= count && slideIndex < count * 2) {
    return slideIndex - count;
  }

  return slideIndex % count;
};

const updateDots = (activeIndex = getRealIndex()) => {
  [...dotsContainer.children].forEach((dot, index) => {
    const isActive = index === activeIndex;

    dot.classList.toggle('active', isActive);
    dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    dot.setAttribute('tabindex', isActive ? '0' : '-1');
  });
};

const updateActiveState = () => {
  slides.forEach((slide, index) => {
    const isActive = index === virtualIndex;

    slide.classList.toggle('active', isActive);
    slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
  });

  updateDots();
};

const setActiveSlide = (index, isManual = false) => {
  const count = realSlides.length;
  const activeIndex = getRealIndex();
  const nextIndex = (index + count) % count;
  const forwardDistance = (nextIndex - activeIndex + count) % count;
  const backwardDistance = (activeIndex - nextIndex + count) % count;

  track.classList.toggle('manual-switch', isManual);

  if (backwardDistance < forwardDistance) {
    virtualIndex -= backwardDistance;
  } else {
    virtualIndex += forwardDistance;
  }

  updateActiveState();
  applyTrackPosition(false);
};

const updateAutoplayButton = () => {
  if (!autoplayButton) {
    return;
  }

  autoplayButton.classList.toggle('playing', isAutoplayEnabled);
  autoplayButton.classList.toggle('paused', !isAutoplayEnabled);
  autoplayButton.setAttribute(
    'aria-label',
    isAutoplayEnabled
      ? 'зупиніть перегляд галереї Apple TV'
      : 'почніть перегляд галереї Apple TV',
  );
};


const stopAutoplay = () => {
  window.clearInterval(autoplayId);
  autoplayId = null;
};

const startAutoplay = () => {
  if (!isAutoplayEnabled) {
    return;
  }

  stopAutoplay();
  autoplayId = window.setInterval(() => {
    setActiveSlide(getRealIndex() + 1);
  }, AUTOPLAY_DELAY);
};

const restartAutoplay = () => {
  stopAutoplay();
  startAutoplay();
};

const goToNext = (isManual = true) => {
  setActiveSlide(getRealIndex() + 1, isManual);
  restartAutoplay();
};

const goToPrev = (isManual = true) => {
  setActiveSlide(getRealIndex() - 1, isManual);
  restartAutoplay();
};

const toggleAutoplay = () => {
  isAutoplayEnabled = !isAutoplayEnabled;
  updateAutoplayButton();

  if (isAutoplayEnabled) {
    startAutoplay();
  } else {
    stopAutoplay();
  }
};

const normalizeInfinitePosition = () => {
  const count = realSlides.length;
  const isInSafeZone = virtualIndex >= count && virtualIndex < count * 2;

  if (isInSafeZone) {
    return;
  }

  virtualIndex = count + getRealIndex();
  applyTrackPosition(true);
  updateActiveState();
};

const handleSlideActivate = (index, isManual = true) => {
  if (didSwipe) {
    return;
  }

  setActiveSlide(index, isManual);
  restartAutoplay();
};

if (slider && track && dotsContainer) {
  realSlides = [...track.querySelectorAll('.slide')];

  if (realSlides.length) {
    const previousSlides = realSlides.map((slide) => slide.cloneNode(true));
    const nextSlides = realSlides.map((slide) => slide.cloneNode(true));

    [...previousSlides].reverse().forEach((slide) => {
      slide.classList.remove('active');
      slide.setAttribute('aria-hidden', 'true');
      track.prepend(slide);
    });

    nextSlides.forEach((slide) => {
      slide.classList.remove('active');
      slide.setAttribute('aria-hidden', 'true');
      track.append(slide);
    });

    slides = [...track.querySelectorAll('.slide')];
    virtualIndex = realSlides.length;
    measureSlideStep();
  }

  realSlides.forEach((slide, index) => {
    const dot = document.createElement('button');

    dot.className = 'dot';
    dot.type = 'button';
    dot.role = 'tab';
    dot.id = `slider-tab-${index}`;
    dot.setAttribute('aria-controls', `slider-panel-${index}`);
    dot.setAttribute('aria-label', `елемент ${index + 1}`);

    dot.addEventListener('click', () => handleSlideActivate(index));

    dotsContainer.append(dot);

    slide.id = `slider-panel-${index}`;
    slide.setAttribute('role', 'tabpanel');
    slide.setAttribute('aria-labelledby', dot.id);
  });

  slides.forEach((slide, index) => {
    slide.addEventListener('click', (event) => {
      if (didSwipe) {
        event.preventDefault();
        return;
      }

      const targetIndex = getSlideRealIndex(index);

      event.preventDefault();

      if (getRealIndex() !== targetIndex) {
        handleSlideActivate(targetIndex);
      }
    });
  });

  autoplayButton?.addEventListener('click', toggleAutoplay);

  slider.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToNext();
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToPrev();
    }
  });

  window.addEventListener('resize', () => {
    measureSlideStep();
    applyTrackPosition(true);
  });

  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  track.addEventListener('transitionend', (event) => {
    if (event.target !== track || event.propertyName !== 'transform') {
      return;
    }

    track.classList.remove('manual-switch');
    normalizeInfinitePosition();
  });

  track.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    pointerStartX = event.clientX;
    didSwipe = false;
  });

  track.addEventListener('pointerup', (event) => {
    if (Math.abs(event.clientX - pointerStartX) < SWIPE_THRESHOLD) {
      return;
    }

    didSwipe = true;

    if (event.clientX < pointerStartX) {
      goToNext();
    } else {
      goToPrev();
    }

    window.setTimeout(() => {
      didSwipe = false;
    }, 0);
  });

  updateActiveState();
  updateAutoplayButton();
  applyTrackPosition(true);
  startAutoplay();
}

const initFooterAccordion = () => {
  const accordions = document.querySelectorAll('.footer__accordion');
  if (!accordions.length) {
    return;
  }

  const mq = window.matchMedia('(min-width: 735px)');

  const sync = () => {
    const open = mq.matches;
    accordions.forEach((details) => {
      details.open = open;
    });
  };

  sync();

  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', sync);
  } else {
    mq.addListener(sync);
  }
};

initFooterAccordion();

