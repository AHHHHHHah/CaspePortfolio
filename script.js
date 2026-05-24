document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // ==========================================================================
    // 1. HIGH-PERFORMANCE INTERACTIVE CANVAS NETWORK SIMULATION
    // ==========================================================================
    const canvas = document.getElementById('networkCanvas');
    const ctx = canvas.getContext('2d');

    let particles = [];
    let animationFrameId = null;
    let mouse = { x: null, y: null, radius: 150 };

    // Handle viewport resize with throttling
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    }

    // Set particle density based on screen size
    function initParticles() {
        particles = [];
        const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 16000), 75);
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                radius: Math.random() * 2.5 + 1.5,
                // Packets currently traversing from this node
                activePackets: []
            });
        }
    }

    // Capture mouse coordinate only if on desktop
    window.addEventListener('mousemove', (e) => {
        if (window.innerWidth > 768) {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        }
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Particle and connection drawing loop
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Retrieve colors from CSS variables dynamically
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const copperColor = isDark ? '226, 135, 67' : '226, 135, 67';
        const signalColor = isDark ? '14, 165, 233' : '14, 165, 233';

        // Draw connections and move particles
        for (let i = 0; i < particles.length; i++) {
            let p1 = particles[i];
            
            // Move particle
            p1.x += p1.vx;
            p1.y += p1.vy;

            // Boundary collision
            if (p1.x < 0 || p1.x > canvas.width) p1.vx *= -1;
            if (p1.y < 0 || p1.y > canvas.height) p1.vy *= -1;

            // Draw particle core (glowing copper node)
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${copperColor}, 0.85)`;
            ctx.shadowBlur = 4;
            ctx.shadowColor = `rgba(${copperColor}, 0.5)`;
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow

            // Mouse interaction (gentle attraction)
            if (mouse.x !== null) {
                let dx = mouse.x - p1.x;
                let dy = mouse.y - p1.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius) {
                    p1.x += dx * 0.01;
                    p1.y += dy * 0.01;
                }
            }

            // Check neighbors for connection
            for (let j = i + 1; j < particles.length; j++) {
                let p2 = particles[j];
                let dx = p1.x - p2.x;
                let dy = p1.y - p2.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                const maxDist = 130;

                if (dist < maxDist) {
                    const alpha = (1 - dist / maxDist) * 0.18;
                    
                    // Draw connection path (link)
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(${copperColor}, ${alpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();

                    // Network packets simulation: periodically spawn packets traversing links
                    if (Math.random() < 0.0003 && p1.activePackets.length < 2) {
                        p1.activePackets.push({
                            target: p2,
                            progress: 0,
                            speed: Math.random() * 0.01 + 0.008
                        });
                    }
                }
            }

            // Animate and draw packets along active paths (ice-blue signals)
            for (let k = p1.activePackets.length - 1; k >= 0; k--) {
                let pkt = p1.activePackets[k];
                pkt.progress += pkt.speed;

                if (pkt.progress >= 1) {
                    // Packet arrived
                    p1.activePackets.splice(k, 1);
                } else {
                    // Calculate packet position on the line segment
                    let px = p1.x + (pkt.target.x - p1.x) * pkt.progress;
                    let py = p1.y + (pkt.target.y - p1.y) * pkt.progress;

                    ctx.beginPath();
                    ctx.arc(px, py, 2.2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${signalColor}, 0.9)`;
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = `rgba(${signalColor}, 0.8)`;
                    ctx.fill();
                    ctx.shadowBlur = 0; // Reset
                }
            }
        }

        animationFrameId = requestAnimationFrame(animateParticles);
    }

    // Initialize canvas
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animateParticles();


    // ==========================================================================
    // 2. THEME AND MOBILE NAV TOGGLING
    // ==========================================================================
    const themeToggle = document.getElementById('themeToggle');
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const navMenu = document.getElementById('navMenu');

    // Theme toggler logic
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
    });

    // Mobile nav toggle
    mobileNavToggle.addEventListener('click', () => {
        navMenu.classList.toggle('mobile-active');
        mobileNavToggle.classList.toggle('active');
        
        // Toggle icon states
        const openIcon = mobileNavToggle.querySelector('.open-icon');
        const closeIcon = mobileNavToggle.querySelector('.close-icon');
        
        if (navMenu.classList.contains('mobile-active')) {
            openIcon.style.display = 'none';
            closeIcon.style.display = 'block';
        } else {
            openIcon.style.display = 'block';
            closeIcon.style.display = 'none';
        }
    });

    // Close menu when clicking link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('mobile-active');
            const openIcon = mobileNavToggle.querySelector('.open-icon');
            const closeIcon = mobileNavToggle.querySelector('.close-icon');
            if (openIcon && closeIcon) {
                openIcon.style.display = 'block';
                closeIcon.style.display = 'none';
            }
        });
    });

    // Nav active link tracking on scroll
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });


    // ==========================================================================
    // 3. ABOUT SKILLS TAB SWITCHING SYSTEM
    // ==========================================================================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');

            // Remove active classes
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active classes
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });


    // ==========================================================================
    // 4. DYNAMIC PROJECTS FILTER GALLERY
    // ==========================================================================
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterValue = btn.getAttribute('data-filter');

            // Remove active state and add to current
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter project cards
            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filterValue === 'all' || category === filterValue) {
                    card.style.display = 'flex';
                    // Trigger reflow for CSS animation
                    card.style.animation = 'none';
                    card.offsetHeight; /* trigger reflow */
                    card.style.animation = 'fadeIn 0.4s ease forwards';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });


    // ==========================================================================
    // 4.5 DETAILED PROJECT SHOWCASE MODAL SYSTEM
    // ==========================================================================
    const projectModal = document.getElementById('projectModal');
    const modalImg = document.getElementById('modalImg');
    const modalBadge = document.getElementById('modalBadge');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalTech = document.getElementById('modalTech');
    const modalHighlights = document.getElementById('modalHighlights');
    const modalDemoLink = document.getElementById('modalDemoLink');
    const modalCodeLink = document.getElementById('modalCodeLink');
    const modalClose = document.getElementById('modalClose');

    projectCards.forEach(card => {
        card.addEventListener('click', () => {
            const badge = card.getAttribute('data-badge');
            const title = card.getAttribute('data-title');
            const desc = card.getAttribute('data-desc');
            const tech = card.getAttribute('data-tech').split(',');
            const img = card.getAttribute('data-img');
            const demo = card.getAttribute('data-demo');
            const code = card.getAttribute('data-code');
            const highlights = card.getAttribute('data-highlights').split(',');

            // Set simple text contents
            modalBadge.textContent = badge;
            modalTitle.textContent = title;
            modalDesc.textContent = desc;
            modalImg.src = img;
            modalImg.alt = title;

            // Set technologies span elements
            modalTech.innerHTML = '';
            tech.forEach(t => {
                const span = document.createElement('span');
                span.textContent = t.trim();
                modalTech.appendChild(span);
            });

            // Set highlights list item elements
            modalHighlights.innerHTML = '';
            highlights.forEach(h => {
                const li = document.createElement('li');
                li.textContent = h.trim();
                modalHighlights.appendChild(li);
            });

            // Set trial and repository links
            if (demo && demo !== '') {
                modalDemoLink.href = demo;
                modalDemoLink.style.display = 'inline-flex';
            } else {
                modalDemoLink.style.display = 'none';
            }

            if (code && code !== '') {
                modalCodeLink.href = code;
                modalCodeLink.style.display = 'inline-flex';
            } else {
                modalCodeLink.style.display = 'none';
            }

            // Open Modal
            projectModal.classList.add('active');
            
            // Re-render modal icons if any
            lucide.createIcons();
        });
    });

    // Close Modal Events
    function closeModal() {
        projectModal.classList.remove('active');
    }

    modalClose.addEventListener('click', closeModal);
    
    projectModal.addEventListener('click', (e) => {
        // If clicking on overlay black backdrop (outside the card body)
        if (e.target === projectModal) {
            closeModal();
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && projectModal.classList.contains('active')) {
            closeModal();
        }
    });


    // ==========================================================================
    // 5. CISCO CATALYST SWITCH VIRTUAL CLI TERM
    // ==========================================================================
    const terminalInput = document.getElementById('terminalInput');
    const terminalHistory = document.getElementById('terminalHistory');
    const terminalBody = document.getElementById('terminalBody');
    let cliPrompt = 'Switch_Chris#';
    let configMode = false;
    let configInterface = '';

    // Terminal Commands Parser
    function processCommand(rawInput) {
        const input = rawInput.trim();
        if (input === '') return '';

        const args = input.split(' ');
        const primaryCmd = args[0].toLowerCase();
        let output = '';

        if (configMode) {
            output = handleConfigMode(input, primaryCmd, args);
            return output;
        }

        switch (primaryCmd) {
            case 'help':
            case '?':
                output = `
<span class="text-amber">Available commands on this IOS switch console:</span>
  <span class="text-copper font-bold">show version</span>       - Displays switch version, uptime and student info.
  <span class="text-copper font-bold">show certificates</span>  - Lists official verified Cisco certificates.
  <span class="text-copper font-bold">show projects</span>      - Provides deep technical briefs on all portfolio projects.
  <span class="text-copper font-bold">ping [target]</span>        - Transmits packets to test connection (try: <span class="text-blue">ping ojt.cisco.com</span>).
  <span class="text-copper font-bold">configure terminal</span> - Enter global configuration terminal.
  <span class="text-copper font-bold">about</span>              - Displays a summary biography of developer Chris.
  <span class="text-copper font-bold">clear</span>              - Wipes the console logs.
`;
                break;

            case 'show':
            case 'sh':
                const subSec = args[1] ? args[1].toLowerCase() : '';
                if (subSec === 'version' || subSec === 'ver') {
                    output = `
Cisco IOS Software, C2960 Software (C2960-LANBASE-M), Version 12.2(25)SEE2
System image file is "flash:c2960-lanbase-mz.122-25.SEE2.bin"

<span class="text-amber">--- PROFILE INFORMATION ---</span>
Name:                 <span class="text-blue">Christian Daniel Caspe</span>
Course:               Bachelor of Science in Information Technology
Institution:          Pamantasan ng Lungsod ng Valenzuela (PLV)

Focus Areas:
 • Networking & Infrastructure
 • Web Development
 • AI-Assisted Systems

Cisco Credentials:   2 Verified Cisco Academy Certifications
Projects Completed:  6+ Academic, Client, and Research Projects
Current Status:      <span class="text-success font-bold">OPEN TO OJT OPPORTUNITIES</span>
`;
                } else if (subSec === 'certificates' || subSec === 'certs') {
                    output = `
<span class="text-amber">--- VERIFIED CREDENTIALS ---</span>

[1] Networking Devices and Initial Configuration
    Cisco Networking Academy
    Skills: Cisco IOS, Router Configuration, VLANs

[2] Networking Basics
    Cisco Networking Academy
    Skills: OSI Model, TCP/IP, Subnetting

<span class="text-amber">--- TECHNICAL SEMINARS ---</span>

• IT Developer Life Hacks
• Strategic Project Management
• Full Stack Web Development
• Cybersecurity & Network Operations
• AI and the Future of Web Development
• Game Testing Best Practices
• Multimedia Technologies
`;
                } else if (subSec === 'projects' || subSec === 'proj') {
                    output = `
<span class="text-amber">--- PROJECT DIRECTORY ---</span>

1. ARTA Web Portal
   [PHP, MySQL, JavaScript]
   Government complaint and management system.

2. Career Matching Engine
   [Gemini API, Node.js]
   AI-assisted career and OJT recommendation platform.

3. Student Academic Motivation Predictor
   [Python, Machine Learning, FastAPI]
   Predicts academic motivation using attendance and participation data.

4. AVC Murphy Bed Website
   [HTML, CSS, JavaScript]
   Production client website for a custom furniture business.

5. Retro Arcade Adventure Game
   [Java]
   Native 2D game with custom collision and state systems.

6. PLV VITS Inventory Management System
   [PHP, JavaScript, SQL]
   Asset tracking and inventory management platform.

7. Creative Design Portfolio
   [Adobe Photoshop]
   Digital design, branding, and visual media projects.
`;
                } else {
                    output = `% Invalid command parameter. Type "show version", "show certificates" or "show projects"`;
                }
                break;

            case 'ping':
                if (!args[1]) {
                    output = `% Please specify ping target. Example: <span class="text-copper">ping ojt.cisco.com</span>`;
                } else {
                    const target = args[1];
                    output = `
Sending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:
<span class="text-blue">!!!!.</span>
Success rate is 80 percent (4/5), round-trip min/avg/max = 14/19/28 ms
Connection state to [${target}] is <span class="text-success font-bold">STABLE</span>.
`;
                }
                break;

            case 'configure':
            case 'conf':
                if (args[1] && (args[1].toLowerCase() === 'terminal' || args[1].toLowerCase() === 't')) {
                    configMode = true;
                    cliPrompt = 'Switch_Chris(config)#';
                    output = `
Enter configuration commands, one per line. End with CNTL/Z or "exit".
`;
                } else {
                    output = `% Invalid parameters. Did you mean "configure terminal"?`;
                }
                break;

            case 'about':
                output = `
Hello, I'm <span class="text-copper font-bold">Christian Daniel Caspe</span>.

I'm interested in networking, software development, and emerging technologies.
My experience includes Cisco networking fundamentals, web application development,
database systems, machine learning projects, and AI-powered applications.

I enjoy building practical solutions that solve real-world problems and continuously
learning through hands-on projects, certifications, and technical challenges.
`;
                break;

            case 'clear':
                terminalHistory.innerHTML = '';
                return '';

            default:
                output = `% Ambiguous command: "${input}". Type "help" or "?" to show system instructions.`;
        }

        return output;
    }

    // Config Mode Commands
    function handleConfigMode(input, primaryCmd, args) {
        let output = '';

        if (primaryCmd === 'exit' || primaryCmd === 'end') {
            if (configInterface) {
                configInterface = '';
                cliPrompt = 'Switch_Chris(config)#';
                output = `Exit interface configuration.`;
            } else {
                configMode = false;
                cliPrompt = 'Switch_Chris#';
                output = `Exit global configuration mode.`;
            }
            return output;
        }

        if (primaryCmd === 'hostname') {
            if (args[1]) {
                const newHost = args[1];
                cliPrompt = `${newHost}(config)#`;
                output = `Hostname updated to ${newHost}.`;
            } else {
                output = `% Hostname command requires parameter.`;
            }
        } else if (primaryCmd === 'interface' || primaryCmd === 'int') {
            if (args[1]) {
                configInterface = args[1];
                cliPrompt = `Switch_Chris(config-if)#`;
                output = `Entering interface configuration mode for ${configInterface}.`;
            } else {
                output = `% Interface command requires parameter. Example: interface FastEthernet0/1`;
            }
        } else if (configInterface && primaryCmd === 'shutdown') {
            output = `Interface ${configInterface} set to administrative DOWN state. <span class="text-amber">[WARNING: Network segment disconnected]</span>`;
        } else if (configInterface && primaryCmd === 'no' && args[1] && args[1].toLowerCase() === 'shutdown') {
            output = `Interface ${configInterface} set to UP state. <span class="text-success">[LINK-UP: Protocol active]</span>`;
        } else {
            output = `
% Command not recognized in config mode. Available options:
  - <span class="text-copper">hostname [name]</span>
  - <span class="text-copper">interface [name]</span> (e.g. FastEthernet0/1)
  - <span class="text-copper">shutdown</span> / <span class="text-copper">no shutdown</span> (inside interface mode)
  - <span class="text-copper">exit</span> (to leave config mode)
`;
        }

        return output;
    }

    // Input submission listener
    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const inputVal = terminalInput.value;
            
            // Print command to log history
            const logLine = document.createElement('div');
            logLine.className = 'terminal-line';
            logLine.innerHTML = `<span class="terminal-prompt">${cliPrompt}</span> <span>${inputVal}</span>`;
            terminalHistory.appendChild(logLine);

            // Process command
            const result = processCommand(inputVal);
            
            if (result !== '') {
                const resultLine = document.createElement('div');
                resultLine.className = 'terminal-line';
                resultLine.innerHTML = result.replace(/\n/g, '<br>');
                terminalHistory.appendChild(resultLine);
            }

            // Clear input and scroll to bottom
            terminalInput.value = '';
            
            // Recalculate prompt label in DOM
            const promptSpan = document.querySelector('.terminal-input-line .terminal-prompt');
            promptSpan.textContent = cliPrompt;
            
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }
    });

    // Make clicking terminal focus input
    terminalBody.addEventListener('click', () => {
        terminalInput.focus();
    });


    // ==========================================================================
    // 6. CONTACT FORM SYSTEM
    // ==========================================================================
    const contactForm = document.getElementById('contactForm');
    const formFeedback = document.getElementById('formFeedback');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('.btn-submit');
        const origBtnText = submitBtn.innerHTML;
        const formData = new FormData(contactForm);
        const subject = formData.get('subject') || 'Portfolio Contact';
        const name = formData.get('name') || 'Portfolio Visitor';
        const email = formData.get('email') || '';
        const message = formData.get('message') || '';

        submitBtn.disabled = true;
        submitBtn.innerHTML = `Establishing Link... <i data-lucide="loader" class="spin"></i>`;
        lucide.createIcons();

        try {
            submitBtn.innerHTML = `Transmitting Packet... <i data-lucide="wifi"></i>`;
            lucide.createIcons();

            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: { Accept: 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Message service unavailable');
            }

            formFeedback.classList.remove('hidden', 'error');
            formFeedback.classList.add('success');
            formFeedback.innerHTML = `
                <i data-lucide="check-circle-2"></i> Packet delivered to Chris. Thanks for reaching out.
            `;
            contactForm.reset();
        } catch (error) {
            const mailtoBody = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
            window.location.href = `mailto:caspechristiandaniel@gmail.com?subject=${encodeURIComponent(subject)}&body=${mailtoBody}`;

            formFeedback.classList.remove('hidden', 'success');
            formFeedback.classList.add('error');
            formFeedback.innerHTML = `
                <i data-lucide="mail-warning"></i> Secure web transmit was blocked, so your email app was opened instead.
            `;
        } finally {
            lucide.createIcons();
            submitBtn.disabled = false;
            submitBtn.innerHTML = origBtnText;

            setTimeout(() => {
                formFeedback.classList.add('hidden');
            }, 7000);
        }
    });


    // ==========================================================================
    // 7. SCROLL-REVEAL OBSERVER SYSTEM
    // ==========================================================================
    const revealElements = document.querySelectorAll('.scroll-reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                
                // If it is a skill content container, animate skill bars
                if (entry.target.classList.contains('skills-showcase')) {
                    document.querySelectorAll('.skill-progress').forEach(bar => {
                        const width = bar.style.width;
                        bar.style.width = '0';
                        setTimeout(() => {
                            bar.style.width = width;
                        }, 100);
                    });
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });
});
