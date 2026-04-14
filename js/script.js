// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mobile navigation toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');
const navRoot = document.querySelector('nav');

if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.setAttribute('aria-expanded', 'false');

    mobileMenuBtn.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('nav-open');
        mobileMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 968) {
                navLinks.classList.remove('nav-open');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
        });
    });

    document.addEventListener('click', (event) => {
        if (window.innerWidth <= 968 && navRoot && !navRoot.contains(event.target)) {
            navLinks.classList.remove('nav-open');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 968) {
            navLinks.classList.remove('nav-open');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
    });
}

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
    } else {
        header.style.boxShadow = 'none';
    }
});

// Animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card, .case-card, .stat-box').forEach(el => {
    observer.observe(el);
});

// CTA hover estilo extra (simplificado)
const ctaButton = document.querySelector('.cta .btn-white');
if (ctaButton) {
    ctaButton.addEventListener('mouseenter', () => {
        ctaButton.classList.add('active-hover');
    });

    ctaButton.addEventListener('mouseleave', () => {
        ctaButton.classList.remove('active-hover');
    });
}

// Logo load handling
const logoWrap = document.querySelector('.logo-wrap');
const logoImg = document.querySelector('.logo-img');
const logoText = document.querySelector('.logo-text');

const revealLogo = () => {
    if (logoWrap) logoWrap.classList.add('visible');
    if (logoImg) logoImg.classList.add('visible');
    if (logoText) logoText.classList.add('visible');
};

if (logoImg) {
    logoImg.addEventListener('load', revealLogo);
    logoImg.addEventListener('error', () => {
        logoImg.style.display = 'none';
        revealLogo();
    });
    if (logoImg.complete && logoImg.naturalWidth !== 0) {
        revealLogo();
    }
} else {
    revealLogo();
}