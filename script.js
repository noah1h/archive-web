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

  tl.fromTo(".animate-down", 
    { 
      opacity: 0, 
      y: -30
    }, 
    { 
      opacity: 1, 
      scaleX: 1,
      y:0,
      duration: 0.8,
      ease: "power2.inOut",
      onStart: () => {
        const trigger = document.querySelector('.animate-right');
        if(trigger) trigger.dispatchEvent(new Event('mouseenter'));
      }
    }
  );
  tl.fromTo(".animate-up", 
    { 
      opacity: 0, 
      y: 30
    }, 
    { 
      opacity: 1, 
      scaleX: 1,
      y:0,
      duration: 0.5,
      ease: "power2.inOut",
      onStart: () => {
        const trigger = document.querySelector('.animate-right');
        if(trigger) trigger.dispatchEvent(new Event('mouseenter'));
      }
    }
  );
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
  tl.fromTo(".continue-text", 
    { 
      opacity: 0, 
      y: 30
    }, 
    { 
      opacity: 1, 
      delay: 1,
      y:0,
      duration: 0.8,
      ease: "power2.inOut",
      onStart: () => {
        const trigger = document.querySelector('.animate-right');
        if(trigger) trigger.dispatchEvent(new Event('mouseenter'));
      }
    }
  );

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
  