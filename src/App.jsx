import { useState, useRef, useEffect } from 'react'
import './App.css'
import flexiImage from './assets/Flexi_ThumbsUp (1).png'
import flexiWoahImage from '/images/Flexi_Woah.png'
import flexiExcitedImage from '/images/Flexi_Excited.png'
import flexiIdeaImage from '/images/Flexi_Idea.png'
import flexiStarsImage from '/images/Flexi_Stars.png'
import flexiPointImage from '/images/Flexi_Point.png'

function App() {
  const containerRef = useRef(null)
  const lastBasketUpdateRef = useRef(null)
  const [basketCounts, setBasketCounts] = useState([0, 0, 0, 0])
  const [visibleBaskets, setVisibleBaskets] = useState([true, true, true, true])
  const [level, setLevel] = useState(5) // Start with blank page (5), then 4 baskets (4), etc.
  const messageTimeoutRef = useRef(null)
  const inactivityTimeoutRef = useRef(null)
  const hintTimeoutRef = useRef(null)
  const lastTimerSetRef = useRef(0)
  const isTimerActiveRef = useRef(false)
  const hasInteractedRef = useRef(false)
  const [highlightedAppleId, setHighlightedAppleId] = useState(null)
  const [hintPosition, setHintPosition] = useState({ x: 0, y: 0 })
  const [isShowingHint, setIsShowingHint] = useState(false)
  const [magneticAppleId, setMagneticAppleId] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationTimerRef = useRef(null)
  const animationCleanupRef = useRef(null)
  const [flexiMessage, setFlexiMessage] = useState("Welcome to Division by Zero! Let's learn about dividing apples into baskets. Ready to start? 🍎")
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [customAnswer, setCustomAnswer] = useState("")
  const [apples, setApples] = useState(() => {
    const GRID_COLS = 6
    const GRID_ROWS = 1
    const APPLE_SIZE = 64
    const GAP = 20

    return Array(6).fill('🍎').map((apple, index) => {
      const row = Math.floor(index / GRID_COLS)
      const col = index % GRID_COLS
      
      const x = col * (APPLE_SIZE + GAP) + GAP * 2
      const y = row * (APPLE_SIZE + GAP) + GAP * 6

      return {
        id: index,
        content: apple,
        x,
        y,
        originalX: x,
        originalY: y,
        isDragging: false,
        basketIndex: null
      }
    })
  })
  const [flexiResponse, setFlexiResponse] = useState("")
  const [selectedReaction, setSelectedReaction] = useState(null)
  const [showFollowUpMessage, setShowFollowUpMessage] = useState(false)
  const [followUpReaction, setFollowUpReaction] = useState(null)
  const [showFinalMessage, setShowFinalMessage] = useState(false)
  const [customAnswerError, setCustomAnswerError] = useState("")


  // Animation function to drop apples into baskets
  const animateApplesIntoBaskets = () => {
    if (isAnimating || level === 0 || level === 5) return;
    
    setIsAnimating(true);
    setFlexiMessage("Watch the apples find their baskets! ✨");
    
    const currentLevel = level; // Capture current level
    const numVisibleBaskets = visibleBaskets.filter(Boolean).length;
    const applesPerBasket = 6 / numVisibleBaskets;
    
    // Reset all apples to original positions first
    setApples(prevApples => 
      prevApples.map(apple => ({
        ...apple,
        x: apple.originalX,
        y: apple.originalY,
        basketIndex: null,
        isDragging: false
      }))
    );
    
    // Reset basket counts
    setBasketCounts(new Array(4).fill(0));
    
    // Store cleanup function
    let isCancelled = false;
    const timers = [];
    
    animationCleanupRef.current = () => {
      isCancelled = true;
      timers.forEach(timer => clearTimeout(timer));
      timers.length = 0;
      setIsAnimating(false);
    };
    
    // Pre-calculate basket positions to avoid DOM queries during animation
    const basketPositions = [];
    const positionTimer = setTimeout(() => {
      if (isCancelled || level !== currentLevel) return;
      
      const basketElements = document.querySelectorAll('.basket');
      const containerRect = containerRef.current?.getBoundingClientRect();
      
      if (!containerRect) {
        setIsAnimating(false);
        return;
      }
      
      // Map visible basket indices to their DOM positions
      let domIndex = 0;
      for (let i = 0; i < 4; i++) {
        if (visibleBaskets[i]) {
          const basketElement = basketElements[domIndex];
          if (basketElement) {
            const basketRect = basketElement.getBoundingClientRect();
            basketPositions[i] = {
              centerX: basketRect.left - containerRect.left + basketRect.width * 0.2 - 32,
              centerY: basketRect.top - containerRect.top + basketRect.height * 0.2 - 32
            };
          }
          domIndex++;
        }
      }
      
      // Start the animation with pre-calculated positions
      animateWithPositions();
    }, 100);
    
    timers.push(positionTimer);
    
    const animateWithPositions = () => {
      if (isCancelled || level !== currentLevel) return;
      
      let appleIndex = 0;
      
      const animateNextApple = () => {
        if (isCancelled || level !== currentLevel) return;
        
        if (appleIndex >= 6) {
          // Animation complete
          setIsAnimating(false);
          if (animationCleanupRef.current === animationCleanupRef.current) {
            animationCleanupRef.current = null;
          }
          const divisionMessages = {
            3: "Perfect! 6 ÷ 3 = 2 apples in each basket! 🌟",
            2: "Excellent! 6 ÷ 2 = 3 apples in each basket! ⭐",
            1: "Great job! 6 ÷ 1 = 6 apples in the basket! 🎉"
          };
          const messageTimer = setTimeout(() => {
            if (level === currentLevel) {
              setFlexiMessage(divisionMessages[currentLevel] || congratsMessages[0]);
            }
          }, 500);
          timers.push(messageTimer);
          return;
        }
        
        // Calculate which basket this apple should go to
        // Distribute apples evenly: first apple goes to basket 0, second to basket 1, etc.
        const currentBasketIndex = appleIndex % numVisibleBaskets;
        
        // Find the actual basket index (accounting for invisible baskets)
        let actualBasketIndex = 0;
        let visibleBasketCount = 0;
        for (let i = 0; i < 4; i++) {
          if (visibleBaskets[i]) {
            if (visibleBasketCount === currentBasketIndex) {
              actualBasketIndex = i;
              break;
            }
            visibleBasketCount++;
          }
        }
        
        // Get pre-calculated position
        const basketPos = basketPositions[actualBasketIndex];
        if (!basketPos) {
          setIsAnimating(false);
          return;
        }
        
        // Calculate apple position within the basket
        // Since we're distributing in rounds, calculate which round this apple is in
        const roundNumber = Math.floor(appleIndex / numVisibleBaskets);
        const applesInThisBasket = roundNumber;
        
        let jitterX, jitterY;
        if (applesInThisBasket === 0) {
          jitterX = 0; jitterY = 0;
        } else if (applesInThisBasket === 1) {
          jitterX = -20; jitterY = 0;
        } else if (applesInThisBasket === 2) {
          jitterX = 20; jitterY = 0;
        } else {
          const stackPosition = applesInThisBasket - 2;
          const stackRow = Math.floor(stackPosition / 3);
          const stackCol = stackPosition % 3;
          jitterX = stackCol === 0 ? -20 : stackCol === 1 ? 0 : 20;
          jitterY = -15 * (stackRow + 1);
        }
        
        const finalX = basketPos.centerX + jitterX;
        const finalY = basketPos.centerY + jitterY;
        
        // Store current apple index to avoid closure issues
        const currentAppleIndex = appleIndex;
        
        // Update apple position only if we're still on the same level
        if (level === currentLevel) {
          setApples(prevApples => 
            prevApples.map(apple => 
              apple.id === currentAppleIndex ? {
                ...apple,
                x: finalX,
                y: finalY,
                basketIndex: actualBasketIndex
              } : apple
            )
          );
          
          // Delay basket count update to match the CSS transition duration (0.5s)
          const countTimer = setTimeout(() => {
            if (level === currentLevel) {
              setBasketCounts(prev => {
                const newCounts = [...prev];
                newCounts[actualBasketIndex]++;
                return newCounts;
              });
            }
          }, 500);
          timers.push(countTimer);
        }
        
        appleIndex++;
        
        // Animate next apple after delay
        const nextTimer = setTimeout(animateNextApple, 600);
        timers.push(nextTimer);
      };
      
      // Start the animation
      animateNextApple();
    };
  };

  // Add this near the top with other state variables
  const inappropriateWords = [
    'fuck', 'shit', 'damn', 'ass', 'bitch', 'crap', 'piss', 'dick', 'cock', 'pussy', 'bastard',
    'hell', 'whore', 'slut', 'prick', 'cunt', 'asshole', 'fag', 'retard', 'nigger', 'nigga'
  ]

  const containsInappropriateWord = (text) => {
    const words = text.toLowerCase().split(/\s+/)
    return words.some(word => 
      inappropriateWords.some(badWord => 
        word.includes(badWord) || 
        // Check for common letter substitutions
        word.replace(/[1!|]/g, 'i')
           .replace(/[3]/g, 'e')
           .replace(/[4@]/g, 'a')
           .replace(/[5]/g, 's')
           .replace(/[0]/g, 'o')
           .replace(/[$]/g, 's')
           .includes(badWord)
      )
    )
  }

  // Get max apples per basket based on level
  const getMaxApplesPerBasket = () => {
    console.log('Getting max apples for level:', level)
    let maxApples;
    switch (level) {
      case 5: maxApples = 0; break;  // blank page: no apples
      case 3: maxApples = 2; break;  // 3 baskets: 2 apples each
      case 2: maxApples = 3; break;  // 2 baskets: 3 apples each
      case 1: maxApples = 6; break; // 1 basket: all 6 apples
      case 0: maxApples = 0; break;  // 0 baskets: no apples allowed
      default: maxApples = 2;
    }
    console.log('Max apples allowed:', maxApples)
    return maxApples;
  }

  const getWarningMessage = (maxApples) => {
    const messages = [
      `Wow! This basket is already full with ${maxApples} apples!`,
      `Oopsie! This basket can only hold ${maxApples} apples!`,
      `Let's try another basket - this one has all ${maxApples} apples it can hold!`,
      `This basket is happy with its ${maxApples} apples!`,
      `${maxApples} apples is just right for this basket!`,
      `This basket is giving you a high-five - it has all ${maxApples} apples it needs!`
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  const congratsMessages = [
    "Perfect division! You split 6 apples into equal groups! 🌟",
    "Great work! Division means splitting things into equal parts! ⭐", 
    "Excellent! You found how many apples go in each basket! 🎉",
    "Amazing! Division helps us share things fairly! 🌈",
    "Well done! You solved the division problem perfectly! 🎈"
  ]

  const getFlexiResponse = (answer, customText = "") => {
    switch(answer) {
      case 'circus':
        return "Wow, joining the circus? I bet they're great at balancing acts! 🎪 Maybe they'll teach the apples some juggling tricks! 🤹‍♂️"
      case 'hide-seek':
        return "Ooh, sneaky baskets! Should we count to 10 and go find them? Ready or not, here we come! 👀"
      case 'custom':
        if (!customText.trim()) return ""
        return `${customText}? That's such a creative idea! I never would have thought of that! 🌟`
      default:
        return ""
    }
  }

  // Check if apples are evenly distributed
  const checkEvenDistribution = () => {
    // Get the number of visible baskets
    const numVisibleBaskets = visibleBaskets.filter(Boolean).length
    console.log('Number of visible baskets:', numVisibleBaskets)
    
    // Calculate expected apples per basket
    const expectedApplesPerBasket = 6 / numVisibleBaskets
    console.log('Expected apples per basket:', expectedApplesPerBasket)
    
    // Check if all visible baskets have exactly the expected number of apples
    const isEven = visibleBaskets.every((isVisible, index) => 
      !isVisible || basketCounts[index] === expectedApplesPerBasket
    )
    console.log('Basket counts:', basketCounts)
    console.log('Is distribution even?', isEven)

    // Check total apples
    const totalApples = basketCounts.reduce((sum, count) => sum + count, 0)
    console.log('Total apples:', totalApples)
    
    return isEven && totalApples === 6
  }





  // Clear animation timers when level changes
  useEffect(() => {
    // Clear any existing animation timers
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    if (animationCleanupRef.current) {
      animationCleanupRef.current();
      animationCleanupRef.current = null;
    }
    setIsAnimating(false);
  }, [level]);



  // Auto-start animation when entering levels with baskets
  useEffect(() => {
    if (level >= 1 && level <= 3 && !isAnimating && basketCounts.every(count => count === 0)) {
      // Start animation after a short delay to let user see the initial state
      animationTimerRef.current = setTimeout(() => {
        if (level >= 1 && level <= 3) { // Double-check we're still on the right level
          animateApplesIntoBaskets();
        }
      }, 1500);
      
      return () => {
        if (animationTimerRef.current) {
          clearTimeout(animationTimerRef.current);
          animationTimerRef.current = null;
        }
      };
    }
  }, [level, visibleBaskets]);

  // Clear highlight and timers when level changes
  useEffect(() => {
    setHighlightedAppleId(null)
    setIsShowingHint(false)
    lastTimerSetRef.current = 0; // Reset timestamp
    isTimerActiveRef.current = false;
    hasInteractedRef.current = false; // No user interaction yet on new page

    // Clear any pending timers
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
    }
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current)
    }

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current)
      }
      isTimerActiveRef.current = false
    }
  }, [level])

  // Clear highlight when apples are placed in baskets
  useEffect(() => {
    if (basketCounts.some(count => count > 0)) {
      setHighlightedAppleId(null)
      setIsShowingHint(false)
      isTimerActiveRef.current = false;
      
      // Clear any pending timers
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current)
      }
    }
  }, [basketCounts])



  // Handle animated mode selection
  const handleAnimatedMode = () => {
    handleForward(); // Just go forward with default animated mode
  };

  // Handle restart button click
  const handleRestart = () => {
    // Clear any ongoing animations
    if (animationCleanupRef.current) {
      animationCleanupRef.current();
      animationCleanupRef.current = null;
    }
    
    // Reset all apples to original positions (keep current level)
    setApples(prevApples => 
      prevApples.map(apple => ({
        ...apple,
        x: apple.originalX,
        y: apple.originalY,
        basketIndex: null,
        isDragging: false
      }))
    );
    
    // Reset basket counts and animation state
    setBasketCounts(new Array(4).fill(0));
    setIsAnimating(false);
    
    // Reset answer states for division by zero page
    if (level === 0) {
      setSelectedAnswer(null);
      setCustomAnswer("");
      setFlexiResponse("");
      setSelectedReaction(null);
      setShowFollowUpMessage(false);
      setFollowUpReaction(null);
      setShowFinalMessage(false);
      setFlexiMessage("Oh no! Where did all the baskets go?");
    } else if (level === 5) {
      // Intro page - just show welcome message
      setFlexiMessage("Welcome to Division by Zero! Let's learn about dividing apples into baskets. Ready to start? 🍎");
    } else if (level >= 1 && level <= 3) {
      // Basket levels - reset and restart animation
      const basketMessages = {
        3: "Three baskets are ready! Watch as we divide 6 apples equally!",
        2: "Two baskets are waiting! Let's see how 6 apples split between them!",
        1: "One basket is here! All 6 apples will go in this one!"
      };
      setFlexiMessage(basketMessages[level] || "Let's try dividing these apples!");
      
      // Restart animation
      setTimeout(() => {
        if (level >= 1 && level <= 3) {
          animateApplesIntoBaskets();
        }
      }, 1800);
    }
  };

  // Handle forward button click
  const handleForward = () => {
    if (level <= 0) return
    
    // Clear any ongoing animations
    if (animationCleanupRef.current) {
      animationCleanupRef.current();
      animationCleanupRef.current = null;
    }
    
    setApples(prevApples => 
      prevApples.map(apple => ({
        ...apple,
        x: apple.originalX,
        y: apple.originalY,
        basketIndex: null,
        isDragging: false
      }))
    )
    
    // Skip level 4 (4 baskets) - go directly from 5 to 3
    let newLevel = level - 1
    if (newLevel === 4) {
      newLevel = 3
    }
    
    const newVisibleBaskets = Array(4).fill(false)
    // Only show baskets for levels 3-1
    if (newLevel >= 1 && newLevel <= 3) {
      for (let i = 0; i < newLevel; i++) {
        newVisibleBaskets[i] = true
      }
    }
    setVisibleBaskets(newVisibleBaskets)
    
    setBasketCounts(new Array(4).fill(0))
    setLevel(newLevel)
    
    // Reset answer states when navigating
    setSelectedAnswer(null)
    setCustomAnswer("")
    setFlexiResponse("")
    setSelectedReaction(null)
    setShowFollowUpMessage(false)
    setFollowUpReaction(null)
    setShowFinalMessage(false)
    
    // Predefined fun messages for each basket count
    const basketMessages = {
      3: "Three baskets are ready! Watch as we divide 6 apples equally!",
      2: "Two baskets are waiting! Let's see how 6 apples split between them!",
      1: "One basket is here! All 6 apples will go in this one!",
      0: "Oh no! Where did all the baskets go?"
    }

    // Set message based on the resulting number of baskets (newLevel)
    if (newLevel === 0) {
      setFlexiMessage(basketMessages[0])
    } else {
      setFlexiMessage(basketMessages[newLevel] || `Now try dividing the apples between ${newLevel} baskets!`)
    }
  }

  // Handle back button click
  const handleBack = () => {
    if (level >= 5) return
    
    // Clear any ongoing animations
    if (animationCleanupRef.current) {
      animationCleanupRef.current();
      animationCleanupRef.current = null;
    }
    
    // Reset apples to original positions
    setApples(prevApples => 
      prevApples.map(apple => ({
        ...apple,
        x: apple.originalX,
        y: apple.originalY,
        basketIndex: null,
        isDragging: false
      }))
    )
    
    // Skip level 4 (4 baskets) - go directly from 3 to 5
    let newLevel = level + 1
    if (newLevel === 4) {
      newLevel = 5
    }
    
    // Show baskets only for levels 1-3
    const newVisibleBaskets = Array(4).fill(false)
    if (newLevel >= 1 && newLevel <= 3) {
      for (let i = 0; i < newLevel; i++) {
        newVisibleBaskets[i] = true
      }
    }
    setVisibleBaskets(newVisibleBaskets)
    
    // Reset basket counts
    setBasketCounts(new Array(4).fill(0))
    
    // Update level and message
    setLevel(newLevel)
    
    // Reset answer states when navigating
    setSelectedAnswer(null)
    setCustomAnswer("")
    setFlexiResponse("")
    setSelectedReaction(null)
    setShowFollowUpMessage(false)
    setFollowUpReaction(null)
    setShowFinalMessage(false)
    
    // Predefined fun messages for each basket count
    const basketMessages = {
      3: "Three baskets are ready! Watch as we divide 6 apples equally!",
      2: "Two baskets are waiting! Let's see how 6 apples split between them!",
      1: "One basket is here! All 6 apples will go in this one!"
    }

    // Set appropriate messages for each level transition
    if (level === 0) {  // Moving back to 1 basket
      setFlexiMessage("Phew! We got a basket back. Now we can divide again!")
    } else if (newLevel === 5) {  // Moving back to blank page
      setFlexiMessage("Time to grab some apples! How should we split them? Try 3, 2, or 1 basket...but be careful with 0!")
    } else {
      // Use varied message based on the new basket count
      setFlexiMessage(basketMessages[newLevel] || `Let's try dividing the apples between ${newLevel} baskets!`)
    }
  }

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer)
    if (answer !== 'custom') {
      setCustomAnswer("") // Clear custom answer when selecting a preset option
      setFlexiResponse(getFlexiResponse(answer))
    }
  }

  const handleCustomAnswerChange = (e) => {
    const text = e.target.value
    setCustomAnswer(text)
    // Clear error when user starts typing again
    setCustomAnswerError("")
  }

  const handleCustomAnswerSubmit = () => {
    if (customAnswer.trim()) {
      if (containsInappropriateWord(customAnswer)) {
        setCustomAnswerError("Please keep your answer family-friendly! 🌟")
        return
      }
      setCustomAnswerError("")
      setSelectedAnswer('custom')
      setFlexiResponse(getFlexiResponse('custom', customAnswer))
    }
  }

  // Add a function to reset the response
  const handleResetResponse = () => {
    setSelectedAnswer(null)
    setCustomAnswer("")
    setFlexiResponse("")
    setSelectedReaction(null)
    setShowFollowUpMessage(false)
    setFollowUpReaction(null)
    setShowFinalMessage(false)
  }

  const handleReactionSelect = (reaction) => {
    setSelectedReaction(reaction)
    // Show follow-up message after a short delay
    setTimeout(() => {
      setShowFollowUpMessage(true)
    }, 500)
  }

  const handleFollowUpReaction = (reaction) => {
    setFollowUpReaction(reaction)
    // Show final message after a short delay
    setTimeout(() => {
      setShowFinalMessage(true)
    }, 500)
  }

  return (
    <div 
      ref={containerRef} 
      className={`container ${level === 0 ? 'no-baskets' : ''} ${level === 5 ? 'blank-page' : ''}`}

    >
      {level !== 5 && (
        <button 
          className="restart-button"
          onClick={handleRestart}
          title="Restart current page"
        >
          ↻
        </button>
      )}
      <h1 className="title">Division by Zero</h1>
      <div className="interactive-area">
        {level !== 5 && apples.map((apple) => (
          <div 
            key={apple.id}
            className={`apple ${isAnimating ? 'animating' : ''} ${apple.isDragging ? 'dragging' : ''} ${apple.id === highlightedAppleId ? (isShowingHint ? 'hint-move' : 'highlight') : ''}`}
            style={{
              '--x': `${apple.x}px`,
              '--y': `${apple.y}px`,
              '--hint-x': `${hintPosition.x}px`,
              '--hint-y': `${hintPosition.y}px`,
              transform: (apple.id === highlightedAppleId) ? undefined : `translate(${apple.x}px, ${apple.y}px)`,
              position: 'absolute',
              transition: isAnimating ? 'transform 0.5s ease-in-out' : 'none',
              cursor: 'default',
              touchAction: 'none'
            }}
            
          >
            {apple.content}
          </div>
        ))}
        <div className="baskets-container">
          {level !== 5 && visibleBaskets.map((isVisible, index) => 
            isVisible && (
              <div key={index} className="basket">
                <div className="basket-body">
                  {basketCounts[index] > 0 && (
                    <div className="basket-counter">{basketCounts[index]}</div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
        <div className="apple-tree">
          <div className="tree-trunk"></div>
          <div className="tree-crown">
            <div className="tree-apple">🍎</div>
            <div className="tree-apple">🍎</div>
            <div className="tree-apple">🍎</div>
            <div className="tree-apple">🍎</div>
            <div className="tree-apple">🍎</div>
            <div className="tree-apple">🍎</div>
            <div className="tree-apple">🍎</div>
            <div className="tree-apple">🍎</div>
            <div className="tree-apple">🍎</div>
          </div>
        </div>
        <img 
          src={(() => {
            if (level === 5) {
              return flexiPointImage;  // Show pointing Flexi on blank page
            }
            
            if (level === 0) {
              // Initial "Where did the baskets go?" message
              if (flexiMessage === "Oh no! Where did all the baskets go?" && !selectedAnswer && !flexiResponse) {
                return flexiWoahImage;
              }
              // Show excited Flexi during answer options and initial response
              if (!showFollowUpMessage) {
                return flexiExcitedImage;
              }
              // Show idea Flexi during the follow-up message about division
              if (showFollowUpMessage && !showFinalMessage) {
                return flexiIdeaImage;
              }
              // Show original Flexi for final message
              return flexiImage;
            }
            // Show stars Flexi when user is actively placing apples
            const isDraggingApple = apples.some(apple => apple.isDragging);
            if (isDraggingApple) {
              return flexiStarsImage;
            }
            return flexiImage;
          })()}
          alt="Flexi character" 
          className="flexi"
        />
        <div className={`flexi-speech-bubble ${level === 0 && (showFollowUpMessage || showFinalMessage) ? 'undefined-message-position' : ''}`}>
          {level === 0 && !flexiResponse ? (
            <>
              {flexiMessage}
              <div className="answer-options">
                <button 
                  className={`answer-option ${selectedAnswer === 'circus' ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect('circus')}
                >
                  They ran away to join the circus! 🎪
                </button>
                <button 
                  className={`answer-option ${selectedAnswer === 'hide-seek' ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect('hide-seek')}
                >
                  They're playing hide-and-seek! 🙈
                </button>
                <div>
                  <p className="answer-label">Or type your own answer:</p>
                  <div className="custom-answer-container">
                    <input
                      type="text"
                      className="custom-answer-input"
                      value={customAnswer}
                      onChange={handleCustomAnswerChange}
                      placeholder="What do you think?"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCustomAnswerSubmit()
                        }
                      }}
                    />
                    {customAnswerError && (
                      <div className="custom-answer-error">
                        {customAnswerError}
                      </div>
                    )}
                  </div>
                  <button 
                    className="custom-answer-submit"
                    onClick={handleCustomAnswerSubmit}
                    disabled={!customAnswer.trim()}
                  >
                    Submit ✨
                  </button>
                </div>
              </div>
            </>
          ) : level === 0 ? (
            <div className="flexi-response-container">
              {!showFollowUpMessage ? (
                <>
                  <div className={`flexi-response-message ${selectedAnswer === 'hide-seek' ? 'hide-seek-response' : ''}`}>
                    {flexiResponse}
                  </div>
                  <div className="reaction-buttons">
                    {selectedAnswer === 'custom' ? (
                      <button 
                        className={`reaction-button ${selectedReaction === 'thanks' ? 'selected' : ''}`}
                        onClick={() => handleReactionSelect('thanks')}
                      >
                        Thanks! 😊
                      </button>
                    ) : (
                      <button 
                        className={`reaction-button ${selectedReaction === 'haha' ? 'selected' : ''}`}
                        onClick={() => handleReactionSelect('haha')}
                      >
                        Haha definitely!
                      </button>
                    )}
                  </div>
                </>
              ) : !showFinalMessage ? (
                <>
                  <div className="flexi-response-message follow-up undefined-response">
                    Since there are no baskets, we say the answer is undefined.
                  </div>
                  <div className="reaction-buttons">
                    <button 
                      className={`reaction-button ${followUpReaction === 'understand' ? 'selected' : ''}`}
                      onClick={() => handleFollowUpReaction('understand')}
                    >
                      I understand now! 💡
                    </button>
                  </div>
                </>
              ) : (
                <div className="flexi-response-message final">
                  <div className="fraction-container">
                    <div className="fraction">
                      <div className="numerator">6</div>
                      <div className="fraction-line"></div>
                      <div className="denominator">0</div>
                    </div>
                    <div className="equals">=</div>
                    <div className="undefined">Undefined</div>
                  </div>
                </div>
              )}
              <div className="response-hint" onClick={handleResetResponse}>
                (Click to try another answer)
              </div>
            </div>
          ) : level === 5 ? (
            <>
              <div className="welcome-message">
                {flexiMessage}
              </div>
              <div className="start-options">
                <button 
                  className="start-option animated-option"
                  onClick={handleAnimatedMode}
                >
                  Show me how! ✨
                </button>
              </div>
            </>
          ) : level >= 1 && level <= 3 ? (
            <div className="message-text">{flexiMessage}</div>
          ) : (
            flexiMessage
          )}
        </div>
        {level !== 5 && (
          <div className="nav-buttons">
            <button 
              className="nav-button" 
              onClick={handleBack}
              disabled={level >= 5}
            >
              &lt;
            </button>
            <button 
              className={`nav-button ${level === 0 ? 'at-zero' : ''}`}
              onClick={handleForward}
              disabled={level <= 0}
              title={level === 0 ? "You've reached the end! Division by zero is undefined." : "Go forward"}
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App