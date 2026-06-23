let projects = [];
window.rowAnimators = []; // Global reference to cancel animation frames
window.isDraggingRow = false; // Flag to stop accidental clicks while dragging

// Initialize
async function loadProjects() {
    try {
        const response = await fetch("projects.json");
        projects = await response.json();
        buildProjectGrid(projects, "all"); // Default to ALL category
    } catch (error) {
        console.error("Failed to load projects:", error);
    }
}

loadProjects();

/* --- FIREBALL CURSOR & PARTICLE SYSTEM --- */
const cursor = document.getElementById('cursor');
const particleContainer = document.getElementById('particle-container');
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let cursorX = mouseX;
let cursorY = mouseY;
let isHovering = false;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function spawnParticle(x, y) {
    if (Math.random() > 0.6) return; 

    const particle = document.createElement('div');
    particle.className = 'cursor-particle';
    
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    const isGold = Math.random() > 0.5;
    particle.style.backgroundColor = isGold ? 'var(--gold)' : 'var(--red)';
    if (isGold) particle.style.boxShadow = '0 0 5px var(--gold)';
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 30 + 10;
    particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);

    particleContainer.appendChild(particle);

    setTimeout(() => {
        particle.remove();
    }, 600);
}

function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.2; 
    cursorY += (mouseY - cursorY) * 0.2;
    
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
    
    if (Math.abs(mouseX - cursorX) > 1 || Math.abs(mouseY - cursorY) > 1) {
        spawnParticle(cursorX, cursorY);
    }

    requestAnimationFrame(animateCursor);
}
requestAnimationFrame(animateCursor);

function initCursorHoverEffects() {
    const hoverTargets = document.querySelectorAll('.hover-target, .project-card, a');
    
    hoverTargets.forEach(target => {
        target.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
        target.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
    });
}

/* --- FILTERING LOGIC --- */
const buttons = document.querySelectorAll(".nav-btn[data-category]");

buttons.forEach(button => {
    button.addEventListener("click", () => {
        buttons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        const category = button.dataset.category;
        const filteredProjects = category === "all" 
            ? projects 
            : projects.filter(p => p.category === category);
        
        // TRIGGER THE TYPEWRITER EFFECT HERE
        changeHeadline(category); 
        
        const grid = document.getElementById("project-grid");
        grid.style.opacity = '0'; // Smooth fade out
        
        setTimeout(() => {
            buildProjectGrid(filteredProjects, category);
            grid.style.opacity = '1'; // Fade back in
        }, 400);
        
        if(window.innerWidth < 1100) {
            document.getElementById("sidebar").classList.remove("open");
        }
    });
});

/* --- SIDEBAR TOGGLE --- */
const navToggle = document.getElementById("navToggle");
const sidebar = document.getElementById("sidebar");

if (navToggle && sidebar) {
    navToggle.addEventListener("click", (e) => {
        e.stopPropagation(); 
        sidebar.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
        if (sidebar.classList.contains("open") && !sidebar.contains(e.target)) {
            sidebar.classList.remove("open");
        }
    });
}

/* --- DYNAMIC GRID & ROW BUILDER --- */
function buildProjectGrid(projectsToRender, category) {
    const grid = document.getElementById("project-grid");
    
    // 1. Clear any running animation loops from the "ALL" view
    if (window.rowAnimators) {
        window.rowAnimators.forEach(req => cancelAnimationFrame(req));
        window.rowAnimators = [];
    }

    if (category === "all") {
        grid.className = "project-grid is-rows";

        // Extract featured projects into their own array
        const featuredProjects = projectsToRender.filter(p => p.isFeatured);
        let featuredIndex = 0;

        const itemsPerRow = Math.ceil(projectsToRender.length / 3); 
        let rows = [];
        for (let i = 0; i < projectsToRender.length; i += itemsPerRow) {
            rows.push(projectsToRender.slice(i, i + itemsPerRow));
        }

        const gridHTML = rows.map((rowProjects, rowIndex) => {
            const buildCards = (projs) => projs.map(project => `
                <article class="project-card hover-target" data-id="${project.id}">
                    <div class="project-image">
                        <img src="${project.thumbnail}" alt="${project.title} thumbnail">
                    </div>
                    <div class="project-info">
                        <h3>${project.title}</h3>
                        <p>${project.role}</p>
                    </div>
                </article>
            `).join('');

            const rowCards = buildCards(rowProjects);
            const delay = 3.5 + (rowIndex * 0.8);
            
            // Base row HTML
            let rowHTML = `
            <div class="row-container intro-fade-row" data-index="${rowIndex}" style="animation-delay: ${delay}s; opacity: 0;">
                <div class="row-track">
                    <div class="row-set">${rowCards}</div>
                    <div class="row-set">${rowCards}</div>
                    <div class="row-set">${rowCards}</div>
                </div>
            </div>
            `;

            // INJECT FEATURED BANNER: Only after row 0 (1st) and row 1 (2nd)
            if ((rowIndex === 0 || rowIndex === 1) && featuredIndex < featuredProjects.length) {
                const featProj = featuredProjects[featuredIndex];
                const bannerDelay = delay + 0.1; // Fades in right after the row above it
                
                rowHTML += `
                <div class="featured-banner intro-fade-row hover-target" data-id="${featProj.id}" style="animation-delay: ${bannerDelay}s; opacity: 0;">
                    <div class="featured-content">
                        <div class="featured-text">
                            <h5>FEATURED [${String(featuredIndex + 1).padStart(2, '0')}]</h5>
                            <h2>${featProj.title}</h2>
                            <p>${featProj.featuredDesc}</p>
                            <span class="view-case">VIEW CASE STUDY ↗</span>
                        </div>
                        <div class="featured-image">
                            <img src="${featProj.thumbnail}" alt="${featProj.title}">
                        </div>
                    </div>
                </div>
                `;
                featuredIndex++;
            }

            return rowHTML;
        }).join('');

        grid.innerHTML = gridHTML;
        initRowAnimationsAndDrag();

    } else {
        // Subpage Layout remains untouched
        grid.className = "project-grid is-grid";
        const gridHTML = projectsToRender.map((project, index) => {
            const delay = index * 0.1;
            return `
            <article class="project-card fade-in-up hover-target" 
                     style="animation-delay: ${delay}s; opacity: 0;" 
                     data-id="${project.id}">
                <div class="project-image">
                    <img src="${project.thumbnail}" alt="${project.title} thumbnail">
                </div>
                <div class="project-info">
                    <h3>${project.title}</h3>
                    <p>${project.role}</p>
                </div>
            </article>
            `;
        }).join('');
        grid.innerHTML = gridHTML;
        init3DTilt(); 
    }

    activateCards();
    initCursorHoverEffects();
}

/* --- INFINITE LOOP & DRAGGING LOGIC (For ALL View) --- */
function initRowAnimationsAndDrag() {
    const containers = document.querySelectorAll('.row-container');
    
    containers.forEach((container, index) => {
        const track = container.querySelector('.row-track');
        const singleSet = container.querySelector('.row-set');
        
        let isHovered = false;
        let isMouseDown = false;
        let startX = 0;
        let currentOffset = 0;
        let dragDistance = 0;
        
        // Alternating directions: row 0 right, row 1 left, row 2 right, etc.
        // direction: 1 means elements move left, -1 means elements move right
        const direction = index % 2 === 0 ? -1 : 1; 
        const speed = 0.5; // Adjust auto-scroll speed here
        
        // Initial offset to prevent blank spaces when moving right
        if (direction === -1) {
            currentOffset = singleSet.offsetWidth;
        }

        // The animation loop
        function animateRow() {
            if (!isHovered && !isMouseDown) {
                currentOffset += speed * direction;
            }

            const setWidth = singleSet.offsetWidth;

            // Infinite loop wrapping logic
            if (currentOffset >= setWidth) {
                currentOffset -= setWidth;
            } else if (currentOffset <= 0) {
                currentOffset += setWidth;
            }

            track.style.transform = `translateX(${-currentOffset}px)`;
            
            const req = requestAnimationFrame(animateRow);
            window.rowAnimators.push(req);
        }
        
        animateRow();

        // Mouse Events
        container.addEventListener('mouseenter', () => isHovered = true);
        container.addEventListener('mouseleave', () => {
            isHovered = false;
            isMouseDown = false;
        });

        container.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            startX = e.clientX;
            dragDistance = 0;
            window.isDraggingRow = false;
        });

        container.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            const dx = e.clientX - startX;
            dragDistance += Math.abs(dx);
            
            // If mouse moves more than 5px while down, it's a drag, not a click
            if (dragDistance > 5) {
                window.isDraggingRow = true;
            }
            
            currentOffset -= dx; // Apply drag to offset
            startX = e.clientX;
        });

        container.addEventListener('mouseup', () => {
            isMouseDown = false;
            // Short delay to prevent the 'click' event on cards from opening if we dragged
            setTimeout(() => {
                window.isDraggingRow = false;
            }, 50);
        });
    });
}

/* --- CARD ACTIVATION (With Drag Prevention) --- */
function activateCards() {
    // ADDED '.featured-banner' to the query selector
    const cards = document.querySelectorAll(".project-card, .featured-banner");
    
    cards.forEach(card => {
        card.addEventListener("click", (e) => {
            if (window.isDraggingRow) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            openProject(card.dataset.id);
        });
    });
}

/* --- 3D MAGNETIC TILT EFFECT (Subpages Only) --- */
function init3DTilt() {
    const cards = document.querySelectorAll(".project-card");
    
    if (window.innerWidth > 1100) {
        cards.forEach(card => {
            let rect; 
            
            card.addEventListener("mouseenter", () => {
                rect = card.getBoundingClientRect();
                card.style.transition = `none`;
            });

            card.addEventListener("mousemove", (e) => {
                if (!rect) return;
                
                requestAnimationFrame(() => {
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = ((y - centerY) / centerY) * -10;
                    const rotateY = ((x - centerX) / centerX) * 10;
                    
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                });
            });
            
            card.addEventListener("mouseleave", () => {
                card.style.transform = ''; 
                card.style.transition = `transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)`;
                rect = null; 
            });
        });
    }
}

/* --- SLIDESHOW GLOBALS --- */
let slideInterval;
let currentSlide = 0;

/* --- OVERLAY MANAGEMENT (UPDATED) --- */
function openProject(id) {
    const project = projects.find(p => String(p.id) === String(id));
    if (!project) return;

    // 1. Reset any running slideshows before opening a new project
    clearInterval(slideInterval);
    currentSlide = 0;

    const container = document.getElementById("project-content");
    
    // 2. Build the Web Link Capsule (Only for 'web' category)
    let webLinkHTML = "";
    if (project.category === "web") {
        // Fallback to "#" if you haven't added a "link" field to the json yet
        const projectUrl = project.link || "#"; 
        webLinkHTML = `
            <div style="margin-top: 1.5rem;">
                <a href="${projectUrl}" target="_blank" class="web-capsule hover-target">
                    VISIT WEBSITE ↗
                </a>
            </div>
        `;
    }

    // 3. Build the Slides and Dotted Timeline
    let slidesHTML = project.gallery.map((img, index) => `
        <div class="slide" style="display: ${index === 0 ? 'block' : 'none'}; width: 100%;">
            <img src="${img}" class="hover-target" alt="Gallery Image" onclick="openFullscreen('${img}')" style="width: 100%; max-height: 70vh; object-fit: contain; border: 1px solid rgba(233, 29, 37, 0.3); cursor: pointer;">
        </div>
    `).join("");

    let dotsHTML = project.gallery.map((_, index) => `
        <div class="slide-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>
    `).join("");

    // 4. Assemble the Slideshow Container (Only if there are images)
    let slideshowHTML = "";
    if (project.gallery.length > 0) {
        slideshowHTML = `
            <div class="slideshow-container" style="position: relative; width: 100%; margin-top: 2rem;">
                <div class="slides" style="position: relative; width: 100%;">
                    ${slidesHTML}
                </div>
                
                ${project.gallery.length > 1 ? `
                    <div class="slide-arrow left hover-target" onclick="changeSlide(-1)" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-size: 2.5rem; color: var(--gold); cursor: pointer; text-shadow: 0 2px 10px rgba(0,0,0,0.8); user-select: none;">❮</div>
                    <div class="slide-arrow right hover-target" onclick="changeSlide(1)" style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); font-size: 2.5rem; color: var(--gold); cursor: pointer; text-shadow: 0 2px 10px rgba(0,0,0,0.8); user-select: none;">❯</div>
                ` : ''}

                ${project.gallery.length > 1 ? `
                    <div class="slide-timeline" style="display: flex; justify-content: center; gap: 12px; margin-top: 1.5rem;">
                        ${dotsHTML}
                    </div>
                ` : ''}
            </div>
        `;
    }

// 4.5 Assemble the Video Player (Only if there is a video)
    let videoHTML = "";
    if (project.video) {
        videoHTML = `
            <div class="custom-video-container" style="margin-top: 4rem; margin-bottom: 2rem; animation: fadeInUp 0.8s forwards cubic-bezier(0.25, 1, 0.5, 1); opacity: 0;">
                <h3 style="font-family: 'Orbitron', sans-serif; color: var(--gold); margin-bottom: 1rem; font-size: 0.9rem; letter-spacing: 3px;">[ PROJECT RECORDING ]</h3>
                
                <div class="video-wrapper" style="position: relative;">
                    <div id="vid-center-play" class="vid-center-btn hover-target">▶</div>
                    
                    <video id="custom-video" src="${project.video}" preload="metadata"></video>
                    
                    <div class="vid-timeline-container">
                        <input type="range" id="vid-progress-slider" class="vid-slider vid-progress hover-target" min="0" max="100" step="0.1" value="0">
                    </div>

                    <div class="video-controls">
                        <button id="vid-play-btn" class="vid-btn hover-target">PLAY</button>
                        <div class="vid-right-controls">
                            <span id="vid-time-display" style="color: var(--gold); font-family: 'Orbitron', sans-serif; font-size: 0.8rem; letter-spacing: 1px;">0:00 / 0:00</span>
                            
                            <button id="vid-speed-btn" class="vid-btn hover-target">1.0x</button>
                            <button id="vid-mute-btn" class="vid-btn hover-target">MUTE</button>
                            <input type="range" id="vid-vol-slider" class="vid-slider hover-target" min="0" max="1" step="0.1" value="1">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 5. Inject into the DOM
    container.innerHTML = `
        <div class="project-page" style="max-width: 1200px; margin: auto;">
            <div class="project-header" style="margin-bottom: 3rem;">
                <h1 class="project-title" style="font-size: 4rem; color: var(--white); font-family: Orbitron;">
                    ${project.title}
                </h1>
                <div class="project-meta" style="color: var(--gold); margin-bottom: 1rem; font-family: Orbitron;">
                    [ ${project.role} ] • [ ${project.year} ]
                </div>
                ${webLinkHTML}
            </div>
            <div class="project-description" style="max-width: 800px; line-height: 1.8; margin-bottom: 3rem; font-size: 1.1rem; color: #ccc;">
                ${project.description}
            </div>
            ${slideshowHTML}
            ${videoHTML} 
        </div>
    `;

    // 6. Start the 2-second interval if there are multiple images
    if (project.gallery.length > 1) {
        startSlideShow();
    }

    // 6. Start the 2-second interval if there are multiple images
    if (project.gallery.length > 1) {
        startSlideShow();
    }

    // Initialize custom video player if it exists
    if (project.video) {
        initVideoPlayer();
    }

    openOverlay("project-view");
    initCursorHoverEffects(); // Re-bind hover logic so the cursor reacts to the new arrows/capsule
}

/* --- SLIDESHOW LOGIC --- */
function startSlideShow() {
    clearInterval(slideInterval); // Clear any existing timers to prevent speeding up
    slideInterval = setInterval(() => {
        changeSlide(1);
    }, 5000);
}

function changeSlide(direction) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slide-dot');
    if (slides.length === 0) return;

    clearInterval(slideInterval); // Reset timer when user manually clicks an arrow

    // Hide current
    slides[currentSlide].style.display = 'none';
    dots[currentSlide].style.background = 'transparent';

    // Move index
    currentSlide += direction;
    
    // Loop bounds
    if (currentSlide >= slides.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = slides.length - 1;

    // Show new
    slides[currentSlide].style.display = 'block';
    dots[currentSlide].style.background = 'var(--gold)';

    startSlideShow(); // Restart timer
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slide-dot');
    if (slides.length === 0) return;

    clearInterval(slideInterval);

    slides[currentSlide].style.display = 'none';
    dots[currentSlide].style.background = 'transparent';

    currentSlide = index;

    slides[currentSlide].style.display = 'block';
    dots[currentSlide].style.background = 'var(--gold)';

    startSlideShow();
}

/* --- FULLSCREEN VIEWER LOGIC --- */
function openFullscreen(imgSrc) {
    const fsView = document.getElementById('fullscreen-view');
    const fsImg = document.getElementById('fullscreen-img');
    if (!fsView || !fsImg) return;

    fsImg.src = imgSrc;
    fsView.style.display = 'flex';
    
    // Slight delay to allow the CSS opacity transition to trigger
    setTimeout(() => fsView.classList.add('active'), 10); 
}

function closeFullscreen() {
    const fsView = document.getElementById('fullscreen-view');
    if (fsView) {
        fsView.classList.remove('active');
        // Wait for fade out to finish before hiding the display
        setTimeout(() => fsView.style.display = 'none', 300); 
    }
}

// Ensure clicking the background or the 'X' closes the fullscreen view
document.addEventListener("DOMContentLoaded", () => {
    const fsView = document.getElementById('fullscreen-view');
    const fsClose = document.getElementById('fullscreen-close');
    
    if (fsView) {
        fsView.addEventListener('click', (e) => {
            // Only trigger close if the user clicked the dark background OR the X button
            // Clicking the image itself does nothing
            if (e.target === fsView || e.target === fsClose) {
                closeFullscreen();
            }
        });
    }
});

function openOverlay(overlayId) {
    const view = document.getElementById(overlayId);
    if(view) {
        view.classList.add("active");
        document.body.style.overflow = "hidden";
        if(cursor) cursor.classList.remove('hovering');
    }
}

function closeOverlay(overlayId) {
    document.getElementById(overlayId).classList.remove("active");
    setTimeout(() => {
        if(!document.querySelectorAll('.overlay-view.active').length) {
            document.body.style.overflow = "auto";
        }
    }, 700);
}

document.getElementById("aboutBtn")?.addEventListener("click", () => {
    openOverlay("about-view");
    if(window.innerWidth < 1100) document.getElementById("sidebar").classList.remove("open");
});

document.getElementById("back-btn")?.addEventListener("click", () => closeOverlay("project-view"));
document.getElementById("about-back-btn")?.addEventListener("click", () => closeOverlay("about-view"));

/* --- TYPEWRITER HEADER LOGIC --- */
const heroHeadline = document.getElementById("hero-headline");

// Dictionary of your category headlines
const headlineTexts = {
    "all": "Orchestrating visual systems, <span>motion experiences,</span> and digital identities.",
    "design": "GRAPHIC DESIGN WORK",
    "web": "WEB PROGRAMMING",
    "editorial": "EDITORIALS / BOOKS",
    "motion": "MOTION GRAPHICS",
    "experiments": "MISCELLANEOUS PROJECTS"
};

// Utility to pause execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let currentHeadlineText = headlineTexts["all"];
let typeQueue = Promise.resolve(); // Queue ensures animations don't overlap

// Types out text, respecting HTML tags like <span>
async function typewriteHTML(element, text, speed = 35) {
    let i = 0;
    while (i <= text.length) {
        element.innerHTML = text.slice(0, i);
        // If we hit an HTML tag, skip the counter to the end of the tag
        if (text[i] === '<') {
            while (text[i] !== '>' && i < text.length) i++;
        }
        i++;
        await sleep(speed);
    }
}

// Deletes text, respecting HTML tags
async function backspaceHTML(element, textToBackspace, speed = 15) {
    let i = textToBackspace.length;
    while (i >= 0) {
        // If we hit the end of an HTML tag, skip the counter backward to the start of the tag
        if (textToBackspace[i - 1] === '>') {
            while (textToBackspace[i - 1] !== '<' && i > 0) i--;
            i--; // step over the '<'
        }
        element.innerHTML = textToBackspace.slice(0, i);
        i--;
        await sleep(speed);
    }
}

// The main function to trigger category changes
function changeHeadline(category) {
    if (!heroHeadline) return;
    
    // Fallback to "all" if category isn't found in the dictionary
    const newText = headlineTexts[category] || headlineTexts["all"];
    if (newText === currentHeadlineText) return; 

    const oldText = currentHeadlineText;
    currentHeadlineText = newText;

    // Add to the animation queue: Backspace -> Pause -> Typewriter
    typeQueue = typeQueue.then(async () => {
        await backspaceHTML(heroHeadline, oldText);
        await sleep(200); 
        await typewriteHTML(heroHeadline, newText);
    });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    if (heroHeadline) {
        heroHeadline.innerHTML = ""; // Clear the hardcoded HTML
        typeQueue = typeQueue.then(async () => {
            await sleep(600); // Wait a brief moment after load for dramatic effect
            await typewriteHTML(heroHeadline, headlineTexts["all"]);
        });
    }
});

/* --- CUSTOM VIDEO PLAYER CONTROLS --- */
function initVideoPlayer() {
    const video = document.getElementById('custom-video');
    const playBtn = document.getElementById('vid-play-btn');
    const centerPlayBtn = document.getElementById('vid-center-play');
    const speedBtn = document.getElementById('vid-speed-btn');
    const muteBtn = document.getElementById('vid-mute-btn');
    const volSlider = document.getElementById('vid-vol-slider');
    const progressSlider = document.getElementById('vid-progress-slider');
    const timeDisplay = document.getElementById('vid-time-display');

    if (!video) return;

    // Helper to format raw seconds into M:SS
    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Play & Pause Logic
    const togglePlay = () => {
        if (video.paused) {
            video.play();
            playBtn.innerText = 'PAUSE';
            playBtn.classList.add('active');
            
            // Hide center button while playing
            centerPlayBtn.style.opacity = '0';
            centerPlayBtn.style.pointerEvents = 'none';
        } else {
            video.pause();
            playBtn.innerText = 'PLAY';
            playBtn.classList.remove('active');
            
            // Show center button as 'Paused' state
            centerPlayBtn.innerHTML = '▶'; 
            centerPlayBtn.style.opacity = '1';
            centerPlayBtn.style.pointerEvents = 'auto';
        }
    };

    playBtn.addEventListener('click', togglePlay);
    centerPlayBtn.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay); 

    // --- NEW: Timeline & Scrubbing Logic ---
    
    // 1. Ensure duration shows immediately when the video data loads
    video.addEventListener('loadedmetadata', () => {
        timeDisplay.innerText = `0:00 / ${formatTime(video.duration)}`;
    });

    // 2. Move the slider automatically as the video plays
    video.addEventListener('timeupdate', () => {
        if (!isNaN(video.duration)) {
            const progress = (video.currentTime / video.duration) * 100;
            progressSlider.value = progress;
            timeDisplay.innerText = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
        }
    });

    // 3. Allow user to drag the slider to seek to a new time
    progressSlider.addEventListener('input', (e) => {
        const newTime = (e.target.value / 100) * video.duration;
        video.currentTime = newTime;
    });

    // Speed Modifier Logic
    const speeds = [0.5, 1.0, 1.5, 2.0];
    let speedIndex = 1; 
    speedBtn.addEventListener('click', () => {
        speedIndex = (speedIndex + 1) % speeds.length;
        video.playbackRate = speeds[speedIndex];
        speedBtn.innerText = speeds[speedIndex].toFixed(1) + 'x';
    });

    // Mute Logic
    muteBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        muteBtn.innerText = video.muted ? 'UNMUTE' : 'MUTE';
        muteBtn.classList.toggle('active', video.muted);
        volSlider.value = video.muted ? 0 : (video.volume || 1);
    });

    // Volume Slider Logic
    volSlider.addEventListener('input', (e) => {
        video.volume = e.target.value;
        if (video.volume > 0) {
            video.muted = false;
            muteBtn.innerText = 'MUTE';
            muteBtn.classList.remove('active');
        } else {
            video.muted = true;
            muteBtn.innerText = 'UNMUTE';
            muteBtn.classList.add('active');
        }
    });
    
    // Reset HUD when video finishes
    video.addEventListener('ended', () => {
        playBtn.innerText = 'PLAY';
        playBtn.classList.remove('active');
        
        // Turn center button into a Replay icon
        centerPlayBtn.innerHTML = '↺';
        centerPlayBtn.style.opacity = '1';
        centerPlayBtn.style.pointerEvents = 'auto';
    });
}