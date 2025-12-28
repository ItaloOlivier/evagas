// EVAGas - Modern Interactive Website
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking a link
    const navLinksItems = document.querySelectorAll('.nav-link');
    navLinksItems.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Active nav link on scroll
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-link');

    function setActiveNav() {
        const scrollY = window.pageYOffset;
        const headerHeight = document.querySelector('.header').offsetHeight;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - headerHeight - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${sectionId}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', setActiveNav);

    // Header background on scroll
    const header = document.querySelector('.header');

    function updateHeader() {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
        }
    }

    window.addEventListener('scroll', updateHeader);

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll(
        '.feature-card, .service-card, .about-content, .about-visual, .contact-info, .contact-form-wrapper'
    );

    animateElements.forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });

    // Stats counter animation
    const stats = document.querySelectorAll('.stat-number');
    let statsAnimated = false;

    function animateStats() {
        if (statsAnimated) return;

        const heroStats = document.querySelector('.hero-stats');
        if (!heroStats) return;

        const rect = heroStats.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            statsAnimated = true;
            stats.forEach(stat => {
                const text = stat.textContent;
                if (text.includes('%') || text.includes('+') || text === 'SA' || text === '24/7') {
                    // These are already formatted, just add a pop effect
                    stat.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        stat.style.transform = 'scale(1)';
                    }, 300);
                }
            });
        }
    }

    window.addEventListener('scroll', animateStats);
    animateStats(); // Check on load

    // Form handling
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;

            // Show loading state
            submitBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
                    <circle cx="12" cy="12" r="10"/>
                </svg>
                Sending...
            `;
            submitBtn.disabled = true;

            // Simulate form submission (replace with actual form submission logic)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Show success message
            submitBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Message Sent!
            `;
            submitBtn.style.background = '#10b981';
            submitBtn.style.borderColor = '#10b981';

            // Reset form
            contactForm.reset();

            // Reset button after delay
            setTimeout(() => {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.style.background = '';
                submitBtn.style.borderColor = '';
                submitBtn.disabled = false;
            }, 3000);
        });
    }

    // Add CSS for spin animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .spin {
            animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);

    // Parallax effect for hero
    const heroVisual = document.querySelector('.hero-visual');

    if (heroVisual && window.innerWidth > 768) {
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const heroSection = document.querySelector('.hero');
            const heroHeight = heroSection.offsetHeight;

            if (scrollY < heroHeight) {
                const translateY = scrollY * 0.3;
                heroVisual.style.transform = `translateY(${translateY}px)`;
            }
        });
    }

    // Flame animation enhancement
    const flames = document.querySelectorAll('.flame');

    flames.forEach((flame, index) => {
        setInterval(() => {
            const randomScale = 0.9 + Math.random() * 0.3;
            const randomRotate = -5 + Math.random() * 10;
            flame.style.transform = `translateX(-50%) scale(${randomScale}) rotate(${randomRotate}deg)`;
        }, 100 + index * 50);
    });

    // Typing effect for hero title (optional enhancement)
    const titleHighlight = document.querySelector('.title-highlight');
    if (titleHighlight) {
        const text = titleHighlight.textContent;
        titleHighlight.textContent = '';
        titleHighlight.style.borderRight = '2px solid var(--primary)';

        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                titleHighlight.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 80);
            } else {
                // Remove cursor after typing is complete
                setTimeout(() => {
                    titleHighlight.style.borderRight = 'none';
                }, 500);
            }
        };

        // Start typing after a short delay
        setTimeout(typeWriter, 500);
    }

    // Add hover effect for service cards
    const serviceCards = document.querySelectorAll('.service-card');

    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.querySelector('.service-number').style.color = 'var(--primary)';
        });

        card.addEventListener('mouseleave', function() {
            this.querySelector('.service-number').style.color = '';
        });
    });

    // Initialize - trigger initial checks
    setActiveNav();
    updateHeader();
});

// Preloader (optional)
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// ===== Login Modal =====
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const loginModal = document.getElementById('loginModal');
    const closeModal = document.getElementById('closeModal');
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('login-password');
    const signupLink = document.getElementById('signupLink');

    // Function to open login modal
    function openLoginModal() {
        // Close mobile menu if open
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.classList.remove('active');
            navLinks.classList.remove('active');
        }

        loginModal.classList.add('active');
        loginModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        // Focus first input
        setTimeout(() => {
            document.getElementById('login-email').focus();
        }, 100);
    }

    // Open modal from desktop button
    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', openLoginModal);
    }

    // Open modal from mobile button
    if (mobileLoginBtn && loginModal) {
        mobileLoginBtn.addEventListener('click', openLoginModal);
    }

    // Close modal
    function closeLoginModal() {
        if (loginModal) {
            loginModal.classList.remove('active');
            loginModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    if (closeModal) {
        closeModal.addEventListener('click', closeLoginModal);
    }

    // Close on overlay click
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                closeLoginModal();
            }
        });
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && loginModal && loginModal.classList.contains('active')) {
            closeLoginModal();
        }
    });

    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Toggle icons
            const eyeOpen = togglePassword.querySelector('.eye-open');
            const eyeClosed = togglePassword.querySelector('.eye-closed');
            if (eyeOpen && eyeClosed) {
                if (type === 'password') {
                    eyeOpen.style.display = 'block';
                    eyeClosed.style.display = 'none';
                } else {
                    eyeOpen.style.display = 'none';
                    eyeClosed.style.display = 'block';
                }
            }
        });
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const remember = document.getElementById('remember').checked;

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;

            // Show loading state
            submitBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
                    <circle cx="12" cy="12" r="10"/>
                </svg>
                Logging in...
            `;
            submitBtn.disabled = true;

            // Simulate login (replace with actual API call to EVADMS)
            try {
                await new Promise(resolve => setTimeout(resolve, 1500));

                // For demo: show success and redirect
                // In production, this would call the EVADMS API
                submitBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Success!
                `;
                submitBtn.style.background = '#10b981';
                submitBtn.style.borderColor = '#10b981';

                // Close modal after success
                setTimeout(() => {
                    // Close the modal and show a message
                    // In production, this would redirect to the deployed EVADMS dashboard
                    closeLoginModal();
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.style.background = '';
                    submitBtn.style.borderColor = '';
                    submitBtn.disabled = false;
                    loginForm.reset();

                    // Show coming soon message (replace with actual redirect when EVADMS is deployed)
                    alert('Login successful! The EVA DMS dashboard is coming soon.');
                }, 1000);
            } catch (error) {
                // Show error
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                alert('Login failed. Please check your credentials and try again.');
            }
        });
    }

    // Close modal and scroll to contact when clicking signup link
    if (signupLink) {
        signupLink.addEventListener('click', (e) => {
            closeLoginModal();
        });
    }
});
