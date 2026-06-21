document.querySelectorAll('.scramble-hover').forEach(element => {
    // Store the original text securely inside a custom attribute
    if (!element.getAttribute('data-original-text')) {
      element.setAttribute('data-original-text', element.innerText);
    }
  
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_@#$*%&+';
    let animationInterval = null;
  
    element.addEventListener('mouseenter', () => {
      const originalText = element.getAttribute('data-original-text');
      let iterations = 0;
      
      clearInterval(animationInterval);
      
      animationInterval = setInterval(() => {
        element.innerText = originalText
          .split("")
          .map((letter, index) => {
            // If the letter is a space, don't scramble it
            if (letter === " ") return " ";
            
            // Gradually reveal the correct letters from left to right
            if (index < iterations) {
              return originalText[index];
            }
            
            // Return a random glyph for the remaining letters
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");
        
        // Stop the interval once the entire word is revealed
        if (iterations >= originalText.length) {
          clearInterval(animationInterval);
        }
        
        // Control speed: reveals roughly 1 true letter every 3 frames
        iterations += 1 / 3; 
      }, 30); // Frame tick interval in milliseconds
    });
  
    // Instantly restore original clean text when the mouse leaves
    element.addEventListener('mouseleave', () => {
      clearInterval(animationInterval);
      element.innerText = element.getAttribute('data-original-text');
    });
  });

  

  // JSAP
  gsap.set(".header-text", { opacity: 1 });

  const tl = gsap.timeline();
  tl.fromTo(".animate-right", 
    { 
      opacity: 0, 
      x: -30
    }, 
    { 
      opacity: 1, 
      scaleX: 1,
      x: 0,
      duration: 0.8,
      ease: "power2.inOut",
      onStart: () => {
        const trigger = document.querySelector('.animate-right');
        if(trigger) trigger.dispatchEvent(new Event('mouseenter'));
      }
    }
  );
  tl.from(".highlight", 
    {
      y: 100,            
      opacity: 0,        
      filter: "blur(20px)",    
      duration: 1.2,
      ease: "power3.out",
      stagger: 0.1
    }, 
    "<" 
  );
  
  tl.fromTo(".header-animate", 
    { 
      opacity: 0, 
      y: 30,
      filter: "blur(5px)"
    }, 
    { 
      opacity: 1, 
      scaleX: 1,
      y:0,
      filter: "blur(0px)",
      duration: 0.8,
      stagger:0.2,
      ease: "power2.inOut",
      onStart: () => {
        const trigger = document.querySelector('.animate-right');
        if(trigger) trigger.dispatchEvent(new Event('mouseenter'));
      }
    }
  );

  tl.fromTo(".continue-text", 
    { 
      opacity: 0, 
      y: 30
    }, 
    { 
      opacity: 1, 
      delay: 0.2,
      y:0,
      duration: 0.8,
      ease: "power2.inOut",
      onStart: () => {
        const trigger = document.querySelector('.animate-right');
        if(trigger) trigger.dispatchEvent(new Event('mouseenter'));
      }
    }
  );
  
    window.addEventListener('scroll', function fadeOutScrollText() {
      // Animate the text out cleanly
      gsap.to(".continue-text", {
        opacity: 0,
        y: 20,                // Slides downward out of frame
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          // Optional: completely hide the display node so it doesn't intercept clicks
          const el = document.querySelector(".continue-text");
          if (el) el.style.display = "none";
        }
      });

      // Remove the listener immediately so the animation doesn't keep firing as they scroll further
      window.removeEventListener('scroll', fadeOutScrollText);
    });

  function updateLiveClock() {
    const clockElement = document.getElementById("live-clock");
    if (!clockElement) return;
  
    const now = new Date();
    
    // Directly pull raw numeric values straight from your computer system clock
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    
    // Format to standard 12-hour layout (AM/PM) manually
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // Converts hour '0' to '12'
    const formattedHours = String(hours).padStart(2, "0");
  
    const timeString = `${formattedHours}:${minutes} ${ampm}`;
  
    // Sync with your hover scramble script asset memory safely
    const parent = clockElement.closest('.scramble-hover');
    if (parent) {
      const staticString = `[ ${timeString} // STATUS: ONLINE ]`;
      
      if (!parent.matches(':hover')) {
        parent.setAttribute('data-original-text', staticString);
        clockElement.innerText = timeString;
      } else {
        parent.setAttribute('data-original-text', staticString);
      }
    } else {
      clockElement.innerText = timeString;
    }
  }
  
  
  // Keep the clock looping cleanly every second
  updateLiveClock();
  setInterval(updateLiveClock, 1000);
  
  
  // Initialize clock loop instantly on page load
  updateLiveClock();
  setInterval(updateLiveClock, 1000);
  


  function updateArtifactDisplay(id, title) {
    const fileIdText = document.querySelector(".active-file-id");
    const fileStatusText = document.querySelector(".active-file-status");
    if (!fileIdText || !fileStatusText) return;
  
    // 1. Instantly update the alphanumeric index strings
    fileIdText.innerText = `[ AR_00${id} ]`;
    fileStatusText.innerText = `INDEXED // ${title}`;
  
    // 2. Add the active class to ignite the crimson glow styling rule
    fileIdText.classList.add("active");
  
    // Optional micro-log line insertion simulator
    const footerLog = document.querySelector(".terminal-footer-pane");
    if(footerLog) {
      const newLine = document.createElement("div");
      newLine.className = "terminal-log-line";
      newLine.innerText = `> MOUNTED_CORE_NODE_0${id}_SUCCESS`;
      footerLog.appendChild(newLine);
      if(footerLog.children.length > 4) footerLog.children[0].remove(); // Keep line count limited
    }
  }
  

gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.create({
  trigger: "#projects",       
  start: "top top-=200",       
  end: "bottom bottom",       
  pin: ".artifact-sticky-box", 
  pinSpacing: false,         
  scrub: true,              
  invalidateOnRefresh: true 
});

// Register your plugins safely
gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 1. FIXED DASHBOARD REVEAL (Runs ONLY ONCE)
// ==========================================
// Move this OUTSIDE of any loops so it fades in cleanly from the right
gsap.from(".artifact-sticky-box", {
  scrollTrigger: {
    trigger: "#projects",         // Fires when the entire Chapter 2 section arrives
    start: "top bottom-=250",     // Starts when the section moves into view
    toggleActions: "play none none reverse", // Plays forward on scroll down, reverses on scroll up
  },
  x: 100,                         // Smoothly glides in from the right edge
  opacity: 0,                     // Fades in from hidden
  filter: "blur(8px)",            // Soft cinematic system blur
  duration: 1.2,
  ease: "power2.out"
});
// This handles the individual slide-ins for your 3 scrolling cards
gsap.utils.toArray(".project-dossier").forEach((card) => {
  gsap.from(card, {
    scrollTrigger: {
      trigger: card,              // Tracks each card independently
      start: "top bottom-=50",    // Fires right before the card enters the screen bottom
      toggleActions: "play none none reverse",
    },
    x: -100,                      // Slides in from the left
    opacity: 0,
    filter: "blur(8px)",
    duration: 1.2,
    ease: "power2.out"
  });
});
gsap.utils.toArray(".title-container").forEach((title) => {
  gsap.from(title, {
    scrollTrigger: {
      trigger: title,   
      start: "top bottom-=150",  
      toggleActions: "play none none reverse",
    },
    y: -100,         
    opacity: 0,
    filter: "blur(8px)",
    duration: 1.2,
    ease: "power2.out"
  });
});
gsap.utils.toArray(".animate-right-2").forEach((content) => {
  gsap.from(content, {
    scrollTrigger: {
      trigger: content,   
      start: "top bottom-=150",  
      toggleActions: "play none none reverse",
    },
    x: -100,         
    opacity: 0,
    filter: "blur(8px)",
    duration: 1.2,
    ease: "power2.out"
  });
});
gsap.utils.toArray(".animate-left").forEach((content) => {
  gsap.from(content, {
    scrollTrigger: {
      trigger: content,   
      start: "top bottom-=150",  
      toggleActions: "play none none reverse",
    },
    x: 100,         
    opacity: 0,
    filter: "blur(8px)",
    duration: 1.2,
    ease: "power2.out"
  });
});


// ======================
// Moving vertical segment
// ======================

const redSegment = document.querySelector(".moving-red-segment");
const wrapper = document.querySelector(".center-line-wrapper");

if (redSegment && wrapper) {
  const updateSegment = () => {
    const moveDistance =
      wrapper.offsetHeight - redSegment.offsetHeight;


      gsap.to(".moving-red-segment", {
        height: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: ".evolution-parent",
          start: "top center",
          end: "bottom center",
          scrub: true
        }
      });
  };

  updateSegment();

  window.addEventListener("resize", () => {
    ScrollTrigger.refresh();
  });
}

// ======================
// Horizontal fills
// ======================

gsap.utils.toArray(".content-block").forEach((block) => {
  const fill = document.createElement("div");
  fill.classList.add("connector-fill");

  fill.style.position = "absolute";
  fill.style.bottom = "-2px";
  fill.style.height = "2px";
  fill.style.background = "red";
  fill.style.width = "0";

  if (block.closest(".connect-right")) {
    fill.style.right = "0";
  } else {
    fill.style.left = "0";
  }

  block.appendChild(fill);

  gsap.to(fill, {
    width: "100%",
    ease: "power3",
    scrollTrigger: {
      trigger: block,
      start: "top bottom-=800",
      end: "top center",
      toggleActions: "play none reverse reverse"
    }
  });
});

const contactForm = document.querySelector('.contact-form');

function startScramble(element, finalText = "Submitting") {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let frame = 0;

  const interval = setInterval(() => {
    element.textContent = finalText
      .split("")
      .map((char, index) => {
        if (char === " ") return " ";

        if (index < frame) {
          return finalText[index];
        }

        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join("");

    frame += 0.3;

    // Loop forever until stopped
    if (frame >= finalText.length) {
      frame = 0;
    }
  }, 40);

  return interval;
}

function stopScramble(interval, element, text = "Submit") {
  clearInterval(interval);
  element.textContent = text;
}

if (contactForm) {
  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const firstName = document.querySelector('.first-name-input');
    const lastName = document.querySelector('.last-name-input');
    const subject = document.querySelector('.subject-input');
    const email = document.querySelector('.email-input');
    const message = document.querySelector('textarea');

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function showError(input, message) {
      const errorDiv = input.parentElement.querySelector('.error-message');
      errorDiv.textContent = message;
      input.style.border = '2px solid red';
    }

    function clearError(input) {
      const errorDiv = input.parentElement.querySelector('.error-message');
      errorDiv.textContent = '';
      input.style.border = '';
    }

    function showMessage(message, type) {
      const existingAlert = document.querySelector('.form-message');
      if (existingAlert) existingAlert.remove();

      const alertDiv = document.createElement('div');
      alertDiv.className = 'form-message';
      alertDiv.style.marginTop = '20px';
      alertDiv.style.padding = '15px';
      alertDiv.style.borderRadius = '5px';
      alertDiv.style.backgroundColor =
        type === 'success' ? '#d4edda' : '#f8d7da';
      alertDiv.style.color =
        type === 'success' ? '#155724' : '#721c24';
      alertDiv.style.border =
        `1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'}`;

      alertDiv.textContent = message;

      contactForm.appendChild(alertDiv);

      if (type === 'success') {
        setTimeout(() => {
          if (alertDiv.parentNode) {
            alertDiv.remove();
          }
        }, 5000);
      }
    }

    let isValid = true;

    if (firstName.value.trim() === '') {
      showError(firstName, 'First name is required.');
      isValid = false;
    } else {
      clearError(firstName);
    }

    if (lastName.value.trim() === '') {
      showError(lastName, 'Last name is required.');
      isValid = false;
    } else {
      clearError(lastName);
    }

    if (subject.value.trim() === '') {
      showError(subject, 'Please enter a subject.');
      isValid = false;
    } else {
      clearError(subject);
    }

    if (!emailPattern.test(email.value.trim())) {
      showError(email, 'Please enter a valid email address.');
      isValid = false;
    } else {
      clearError(email);
    }

    if (message.value.trim() === '') {
      showError(message, 'Message cannot be empty.');
      isValid = false;
    } else {
      clearError(message);
    }

    if (isValid) {
      const submitBtn = document.querySelector('.form-submit');
      const btnText = submitBtn.querySelector('.submit-btn-text');

      const scramble = startScramble(btnText);

      submitBtn.style.filter = 'grayscale(100%)';
      submitBtn.disabled = true;

      const formData = {
        firstName: firstName.value.trim(),
        lastName: lastName.value.trim(),
        email: email.value.trim(),
        subject: subject.value.trim(),
        message: message.value.trim()
      };

      try {
        const response = await fetch('contact_handler.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
          contactForm.reset();

          stopScramble(scramble, btnText);

          showMessage(
            'Thank you! Your message has been sent successfully.',
            'success'
          );

          submitBtn.disabled = false;
          submitBtn.style.filter = 'grayscale(0)';
        } else {
          stopScramble(scramble, btnText);

          showMessage(
            result.message || 'Failed to send message. Please try again.',
            'error'
          );

          submitBtn.disabled = false;
          submitBtn.style.filter = 'grayscale(0)';
        }
      } catch (error) {
        console.error('Error:', error);

        stopScramble(scramble, btnText);

        showMessage(
          'Network error. Please check your connection and try again.',
          'error'
        );

        submitBtn.disabled = false;
        submitBtn.style.filter = 'grayscale(0)';
      }
    }
  });
}

