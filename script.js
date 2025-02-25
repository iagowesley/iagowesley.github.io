document.addEventListener('DOMContentLoaded', function() {
    // Menu Mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    menuToggle?.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Header Scroll
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Scroll Animation
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    animateElements.forEach(element => observer.observe(element));

    // Counter Animation
    const startCounters = () => {
        const counters = document.querySelectorAll('.number');
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const count = +counter.innerText;
            const increment = target / 200;

            if (count < target) {
                counter.innerText = Math.ceil(count + increment);
                setTimeout(startCounters, 1);
            } else {
                counter.innerText = target;
            }
        });
    };

    // Start counters when section is visible
    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                startCounters();
            }
        });
        statsObserver.observe(statsSection);
    }

    // Scroll to Top
    const scrollTop = document.querySelector('.scroll-to-top');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollTop.classList.add('active');
        } else {
            scrollTop.classList.remove('active');
        }
    });

    scrollTop?.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Form Validation
    const form = document.querySelector('.contato-form');
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        // Add your form validation and submission logic here
        alert('Mensagem enviada com sucesso!');
        form.reset();
    });

    // Smooth Scroll for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
                // Close mobile menu if open
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });

    // Scroll Indicator
    document.querySelector('.scroll-indicator')?.addEventListener('click', () => {
        const sobreSection = document.querySelector('#sobre');
        if (sobreSection) {
            sobreSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
}); 