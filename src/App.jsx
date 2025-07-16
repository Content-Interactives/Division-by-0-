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
  const [highlightedAppleId, setHighlightedAppleId] = useState(null)
  const [hintPosition, setHintPosition] = useState({ x: 0, y: 0 })
  const [isShowingHint, setIsShowingHint] = useState(false)
  const [magneticAppleId, setMagneticAppleId] = useState(null)
  const [flexiMessage, setFlexiMessage] = useState("Welcome to Division by Zero! Let's learn about dividing apples into baskets. Ready to start? 🍎")
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [customAnswer, setCustomAnswer] = useState("")
  const [apples, setApples] = useState(() => {
    const GRID_COLS = 6
    const GRID_ROWS = 2
    const APPLE_SIZE = 64
    const GAP = 20

    return Array(12).fill('🍎').map((apple, index) => {
      const row = Math.floor(index / GRID_COLS)
      const col = index % GRID_COLS
      
      const x = col * (APPLE_SIZE + GAP) + GAP * 2
      const y = row * (APPLE_SIZE + GAP) + GAP * 3

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
      case 5: maxApples = 0; break;  // blank page: no apples
      case 4: maxApples = 3; break;  // 4 baskets: 3 apples each
      case 3: maxApples = 4; break;  // 3 baskets: 4 apples each
      case 2: maxApples = 6; break;  // 2 baskets: 6 apples each
      case 1: maxApples = 12; break; // 1 basket: all 12 apples
      case 0: maxApples = 0; break;  // 0 baskets: no apples allowed
      default: maxApples = 3;
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
    "Fantastic job! All the baskets have the same number of apples! 🌟",
    "Wow! You divided the apples equally - you're amazing at math! ⭐",
    "High five! You made all the baskets have the same number of apples! 🎉",
    "Super duper! You're great at sharing apples equally! 🌈",
    "Yay! You did it! Each basket has the same number of apples! 🎈"
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
    
    // For 4 baskets level, we expect 3 apples in each basket
    const expectedApplesPerBasket = 12 / numVisibleBaskets
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
    
    return isEven && totalApples === 12
  }

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
    }
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current)
    }
    
    setIsShowingHint(false)
    setHighlightedAppleId(null)
    
    // Only set timer if we're on the 4-basket page and no interaction has occurred
    if (level === 4) {
      inactivityTimeoutRef.current = setTimeout(() => {
        // Don't show highlight if there's been any interaction
        if (basketCounts.some(count => count > 0)) {
          return;
        }
        
        // Highlight the first apple in the second row (index 6)
        setHighlightedAppleId(6)
        
        // Show a helpful message from Flexi when highlighting
        setFlexiMessage("Try dragging this apple to one of the baskets! 🍎")
        
        // Start hint animation after highlighting
        hintTimeoutRef.current = setTimeout(() => {
          // Don't show hint if there's been any interaction
          if (basketCounts.some(count => count > 0)) {
            setHighlightedAppleId(null);
            return;
          }
          
          const basketElement = document.querySelector('.basket')
          if (basketElement) {
            const basketRect = basketElement.getBoundingClientRect()
            const containerRect = containerRef.current.getBoundingClientRect()
            
            setHintPosition({
              x: basketRect.left - containerRect.left + (basketRect.width / 2) - 32,
              y: basketRect.top - containerRect.top - 20 // Move it higher up above the basket
            })
            setIsShowingHint(true)
            
            // Update message when hint animation starts
            setFlexiMessage("Watch this apple move to show you where to drop it! ✨")
          }
        }, 500) // Start hint animation 0.5 seconds after highlight
      }, 3000)
    } else {
      setHighlightedAppleId(null)
    }
  }

  // Clear highlight and timer when level changes
  useEffect(() => {
    setHighlightedAppleId(null)
    setIsShowingHint(false)
    resetInactivityTimer()
    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current)
      }
    }
  }, [level])

  // Add event listeners for user activity
  useEffect(() => {
    const handleActivity = () => {
      // If there are any apples in baskets, permanently disable the highlight
      if (basketCounts.some(count => count > 0)) {
        setHighlightedAppleId(null)
        setIsShowingHint(false)
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current)
        }
        if (hintTimeoutRef.current) {
          clearTimeout(hintTimeoutRef.current)
        }
        return;
      }
      resetInactivityTimer()
    }

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('click', handleActivity)
    window.addEventListener('keydown', handleActivity)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current)
      }
    }
  }, [level, basketCounts])

  const motivationalMessages = [
    "You're doing great! Keep going! ⭐",
    "That's the way! You're getting it! 🌟",
    "Nice work with those apples! ✨",
    "You're making this look easy! 🌠",
    "Keep going, you're on the right track! ⭐",
    "Wonderful job dividing those apples! 🌟"
  ]

  const handleMouseDown = (e, id) => {
    const apple = e.target
    const rect = apple.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    setHighlightedAppleId(null)
    setIsShowingHint(false)
    resetInactivityTimer()

    // Show random motivational message when picking up an apple
    if (level !== 0) {
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
      setFlexiMessage(randomMessage)
    }

    setApples(prevApples =>
      prevApples.map(a =>
        a.id === id
          ? { ...a, isDragging: true, offsetX, offsetY }
          : a
      )
    )
  }

  const handleMouseMove = (e) => {
    setApples(prevApples =>
      prevApples.map(apple => {
        if (!apple.isDragging) return apple

        let newX = e.clientX - apple.offsetX - containerRef.current.getBoundingClientRect().left
        let newY = e.clientY - apple.offsetY - containerRef.current.getBoundingClientRect().top

        // Check for magnetic attraction to baskets
        const basketElements = document.querySelectorAll('.basket')
        let closestBasketIndex = -1
        let closestDistance = Infinity
        const MAGNETIC_RADIUS = 80 // Distance in pixels for magnetic effect

        basketElements.forEach((basket, index) => {
          if (!visibleBaskets[index]) return
          
          const basketRect = basket.getBoundingClientRect()
          const containerRect = containerRef.current.getBoundingClientRect()
          
          // Calculate basket center
          const basketCenterX = basketRect.left - containerRect.left + basketRect.width / 2
          const basketCenterY = basketRect.top - containerRect.top + basketRect.height / 2
          
          // Calculate apple center
          const appleCenterX = newX + 32 // 32 is half of apple width (64px)
          const appleCenterY = newY + 32 // 32 is half of apple height (64px)
          
          // Calculate distance
          const distance = Math.sqrt(
            Math.pow(appleCenterX - basketCenterX, 2) + 
            Math.pow(appleCenterY - basketCenterY, 2)
          )
          
          if (distance < closestDistance && distance < MAGNETIC_RADIUS) {
            closestDistance = distance
            closestBasketIndex = index
          }
        })

        // Apply magnetic effect if close to a basket
        if (closestBasketIndex !== -1) {
          const basketElement = basketElements[closestBasketIndex]
          const basketRect = basketElement.getBoundingClientRect()
          const containerRect = containerRef.current.getBoundingClientRect()
          
          // Calculate basket center
          const basketCenterX = basketRect.left - containerRect.left + basketRect.width / 2
          const basketCenterY = basketRect.top - containerRect.top + basketRect.height / 2
          
          // Calculate magnetic force (stronger as you get closer)
          const magneticForce = Math.max(0, 1 - (closestDistance / MAGNETIC_RADIUS))
          const magneticStrength = 0.3 * magneticForce
          
          // Apply magnetic pull
          const appleCenterX = newX + 32
          const appleCenterY = newY + 32
          
          newX += (basketCenterX - appleCenterX) * magneticStrength
          newY += (basketCenterY - appleCenterY) * magneticStrength
          
          // Set magnetic state for visual feedback
          setMagneticAppleId(apple.id)
        } else {
          // Clear magnetic state if not near any basket
          setMagneticAppleId(null)
        }

        return {
          ...apple,
          x: newX,
          y: newY
        }
      })
    )
  }

  // Update handleMouseUp to check for even distribution immediately
  const handleMouseUp = () => {
    setMagneticAppleId(null) // Clear magnetic state
    setApples(prevApples => {
      const draggedApple = prevApples.find(a => a.isDragging)
      if (!draggedApple) return prevApples

      const basketElements = document.querySelectorAll('.basket')
      let droppedInBasket = false
      let basketIndex = -1

      basketElements.forEach((basket, index) => {
        if (!visibleBaskets[index]) return // Skip invisible baskets
        
        const basketRect = basket.getBoundingClientRect()
        const appleRect = {
          left: draggedApple.x + containerRef.current.getBoundingClientRect().left,
          right: draggedApple.x + containerRef.current.getBoundingClientRect().left + 64,
          top: draggedApple.y + containerRef.current.getBoundingClientRect().top,
          bottom: draggedApple.y + containerRef.current.getBoundingClientRect().top + 64
        }

        if (
          appleRect.left < basketRect.right &&
          appleRect.right > basketRect.left &&
          appleRect.bottom > basketRect.top &&
          appleRect.top < basketRect.bottom
        ) {
          droppedInBasket = true
          basketIndex = index
        }
      })

      if (droppedInBasket && visibleBaskets[basketIndex]) {
        const maxApples = getMaxApplesPerBasket()
        
        if (basketCounts[basketIndex] >= maxApples) {
          setFlexiMessage(getWarningMessage(maxApples))
          
          if (messageTimeoutRef.current) {
            clearTimeout(messageTimeoutRef.current)
          }
          messageTimeoutRef.current = setTimeout(() => {
            setFlexiMessage(`Divide the apples between ${level} baskets!`)
            messageTimeoutRef.current = null
          }, 2000)

          return prevApples.map(a =>
            a.id === draggedApple.id
              ? {
                  ...a,
                  isDragging: false,
                  x: a.originalX,
                  y: a.originalY,
                  basketIndex: null
                }
              : a
          )
        }

        // Calculate new basket counts
        const newBasketCounts = [...basketCounts]
        if (draggedApple.basketIndex !== null) {
          newBasketCounts[draggedApple.basketIndex]--
        }
        newBasketCounts[basketIndex]++

        // Update the state with new basket counts
        setBasketCounts(newBasketCounts)

        // Calculate basket center position for magnetic snap
        const basketElement = basketElements[basketIndex]
        const containerRect = containerRef.current.getBoundingClientRect()
        const basketRect = basketElement.getBoundingClientRect()
        
        // Position apple to create optical illusion of being centered in basket
        const centerX = basketRect.left - containerRect.left + basketRect.width * 0.2 - 32 // Position toward left side for visual centering
        // Position apple within the basket's main body, not below it
        const centerY = basketRect.top - containerRect.top + basketRect.height * 0.2 - 32 // Position slightly down from top for visual centering
        
        // Create systematic positioning based on number of apples in basket
        const applesInBasket = newBasketCounts[basketIndex]
        let jitterX, jitterY
        
        if (applesInBasket === 1) {
          // First apple: center
          jitterX = 0
          jitterY = 0
        } else if (applesInBasket === 2) {
          // Second apple: left
          jitterX = -20
          jitterY = 0
        } else if (applesInBasket === 3) {
          // Third apple: right
          jitterX = 20
          jitterY = 0
        } else {
          // Additional apples: center
          jitterX = 0
          jitterY = 0
        }

        // Create updated apples array with magnetic snap
        const updatedApples = prevApples.map(a =>
          a.id === draggedApple.id
            ? { 
                ...a, 
                isDragging: false, 
                basketIndex,
                x: centerX + jitterX,
                y: centerY + jitterY
              }
            : a
        )

        // Check if the distribution is even using the new counts
        console.log('Checking distribution after drop:')
        console.log('Level:', level)
        console.log('Visible baskets:', visibleBaskets)
        console.log('New basket counts:', newBasketCounts)
        
        const isEvenlyDistributed = newBasketCounts.every((count, i) => 
          !visibleBaskets[i] || count === (12 / visibleBaskets.filter(Boolean).length)
        ) && newBasketCounts.reduce((sum, count) => sum + count, 0) === 12

        console.log('Is evenly distributed?', isEvenlyDistributed)

        if (isEvenlyDistributed) {
          console.log('Success! Showing congratulatory message')
          const randomIndex = Math.floor(Math.random() * congratsMessages.length)
          setFlexiMessage(congratsMessages[randomIndex])
        }

        return updatedApples
      }

      // If not dropped in a basket, return to original position
      return prevApples.map(a =>
        a.id === draggedApple.id
          ? {
              ...a,
              isDragging: false,
              x: a.originalX,
              y: a.originalY,
              basketIndex: null
            }
          : a
      )
    })
  }

  // Handle forward button click
  const handleForward = () => {
    if (level <= 0) return
    
    setApples(prevApples => 
      prevApples.map(apple => ({
        ...apple,
        x: apple.originalX,
        y: apple.originalY,
        basketIndex: null,
        isDragging: false
      }))
    )
    
    const newVisibleBaskets = Array(4).fill(false)
    // Only show baskets for levels 4-1
    if (level - 1 >= 1 && level - 1 <= 4) {
      for (let i = 0; i < level - 1; i++) {
        newVisibleBaskets[i] = true
      }
    }
    setVisibleBaskets(newVisibleBaskets)
    
    setBasketCounts(new Array(4).fill(0))
    setLevel(prev => prev - 1)
    
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
      4: "We have 4 baskets ready! Let's give each one the same number of apples!",
      3: "Three baskets incoming! How can we share the apples out?",
      2: "Let's try dividing the apples between 2 baskets!",
      1: "One basket only — everything goes in here!",
      0: "Oh no! Where did all the baskets go?"
    }

    const newLevel = level - 1

    // Set message based on the resulting number of baskets (newLevel)
    if (newLevel === 0) {
      setFlexiMessage(basketMessages[0])
    } else if (newLevel === 1) {
      setFlexiMessage("Now try putting all the apples in one basket!")
    } else if (newLevel === 4) {
      setFlexiMessage(basketMessages[4])
    } else {
      setFlexiMessage(basketMessages[newLevel] || `Now try dividing the apples between ${newLevel} baskets!`)
    }
  }

  // Handle back button click
  const handleBack = () => {
    if (level >= 5) return
    
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
    
    // Show baskets only for levels 1-4
    const newVisibleBaskets = Array(4).fill(false)
    if (level + 1 >= 1 && level + 1 <= 4) {
      for (let i = 0; i < level + 1; i++) {
        newVisibleBaskets[i] = true
      }
    }
    setVisibleBaskets(newVisibleBaskets)
    
    // Reset basket counts
    setBasketCounts(new Array(4).fill(0))
    
    // Update level and message
    setLevel(prev => prev + 1)
    
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
      4: "We have 4 baskets ready! Let's give each one the same number of apples!",
      3: "Three baskets incoming! How can we share the apples out?",
      2: "Let's try dividing the apples between 2 baskets!",
      1: "One basket only — everything goes in here!"
    }

    // Set appropriate messages for each level transition
    if (level === 0) {  // Moving back to 1 basket
      setFlexiMessage("Phew! We got a basket back. Now we can divide again!")
    } else if (level === 4) {  // Moving back to blank page
      setFlexiMessage("Time to grab some apples! How should we split them? Try 4, 3, 2, or 1 basket...but be careful with 0!")
    } else {
      // Use varied message based on the new basket count (level + 1)
      setFlexiMessage(basketMessages[level + 1] || `Let's try dividing the apples between ${level + 1} baskets!`)
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
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onPointerMove={handleMouseMove}
      onPointerUp={handleMouseUp}
    >
      <h1 className="title">Division by Zero</h1>
      <div className="interactive-area">
        {level !== 5 && apples.map((apple) => (
          <div 
            key={apple.id}
            className={`apple ${apple.isDragging ? 'dragging' : ''} ${apple.id === highlightedAppleId ? (isShowingHint ? 'hint-move' : 'highlight') : ''} ${apple.id === magneticAppleId ? 'magnetic' : ''}`}
            style={{
              '--x': `${apple.x}px`,
              '--y': `${apple.y}px`,
              '--hint-x': `${hintPosition.x}px`,
              '--hint-y': `${hintPosition.y}px`,
              transform: apple.isDragging ? `translate(${apple.x}px, ${apple.y}px)` : `translate(var(--x), var(--y))`,
              position: 'absolute',
              touchAction: 'none'
            }}
            onMouseDown={(e) => handleMouseDown(e, apple.id)}
            onPointerDown={(e) => handleMouseDown(e, apple.id)}
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
              return flexiPointImage;  // Show pointing Flexi on blank page
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
        <div className="flexi-speech-bubble">
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
                  <div className="flexi-response-message">
                    {flexiResponse}
                  </div>
                  <div className="reaction-buttons">
                    {selectedAnswer === 'custom' ? (
                      <>
                        <button 
                          className={`reaction-button ${selectedReaction === 'thanks' ? 'selected' : ''}`}
                          onClick={() => handleReactionSelect('thanks')}
                        >
                          Thanks! 😊
                        </button>
                        <button 
                          className={`reaction-button ${selectedReaction === 'imagination' ? 'selected' : ''}`}
                          onClick={() => handleReactionSelect('imagination')}
                        >
                          I just used my imagination! ✨
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className={`reaction-button ${selectedReaction === 'haha' ? 'selected' : ''}`}
                          onClick={() => handleReactionSelect('haha')}
                        >
                          Haha definitely!
                        </button>
                        <button 
                          className={`reaction-button ${selectedReaction === 'perhaps' ? 'selected' : ''}`}
                          onClick={() => handleReactionSelect('perhaps')}
                        >
                          Perhaps so!
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : !showFinalMessage ? (
                <>
                  <div className="flexi-response-message follow-up">
                    No baskets means we have nowhere to put the apples!<br/>
                    And that means we can't divide them
                  </div>
                  <div className="reaction-buttons">
                    <button 
                      className={`reaction-button ${followUpReaction === 'understand' ? 'selected' : ''}`}
                      onClick={() => handleFollowUpReaction('understand')}
                    >
                      I understand now! 💡
                    </button>
                    <button 
                      className={`reaction-button ${followUpReaction === 'interesting' ? 'selected' : ''}`}
                      onClick={() => handleFollowUpReaction('interesting')}
                    >
                      That's interesting! 🤔
                    </button>
                  </div>
                </>
              ) : (
                <div className="flexi-response-message final">
                  This is what happens when we try to divide by zero –<br/>
                  it just doesn't make sense!
                  <div className="fraction-container">
                    <div className="fraction">
                      <div className="numerator">12</div>
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
                  className="start-option"
                  onClick={handleForward}
                >
                  Let's get sorting! 🍎
                </button>
                <button 
                  className="start-option"
                  onClick={handleForward}
                >
                  Challenge accepted! 💪
                </button>
              </div>
            </>
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
              className="nav-button" 
              onClick={handleForward}
              disabled={level <= 0}
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
