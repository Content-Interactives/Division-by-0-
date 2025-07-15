import { useState, useRef, useEffect } from 'react'
import './App.css'
import flexiImage from './assets/Flexi_ThumbsUp (1).png'

function App() {
  const containerRef = useRef(null)
  const lastBasketUpdateRef = useRef(null)
  const [basketCounts, setBasketCounts] = useState([0, 0, 0, 0])
  const [visibleBaskets, setVisibleBaskets] = useState([true, true, true, true])
  const [level, setLevel] = useState(4) // Start with 4 baskets
  const messageTimeoutRef = useRef(null)
  const inactivityTimeoutRef = useRef(null)
  const hintTimeoutRef = useRef(null)
  const [highlightedAppleId, setHighlightedAppleId] = useState(null)
  const [hintPosition, setHintPosition] = useState({ x: 0, y: 0 })
  const [isShowingHint, setIsShowingHint] = useState(false)
  const [flexiMessage, setFlexiMessage] = useState("Divide the apples so every basket has the same number!")
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

  // Get max apples per basket based on level
  const getMaxApplesPerBasket = () => {
    console.log('Getting max apples for level:', level)
    let maxApples;
    switch (level) {
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

  const handleMouseDown = (e, id) => {
    const apple = e.target
    const rect = apple.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    setHighlightedAppleId(null)
    setIsShowingHint(false)
    resetInactivityTimer()

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
      prevApples.map(apple =>
        apple.isDragging
          ? {
              ...apple,
              x: e.clientX - apple.offsetX - containerRef.current.getBoundingClientRect().left,
              y: e.clientY - apple.offsetY - containerRef.current.getBoundingClientRect().top
            }
          : apple
      )
    )
  }

  // Update handleMouseUp to check for even distribution immediately
  const handleMouseUp = () => {
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

        // Create updated apples array
        const updatedApples = prevApples.map(a =>
          a.id === draggedApple.id
            ? { ...a, isDragging: false, basketIndex }
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
    for (let i = 0; i < level - 1; i++) {
      newVisibleBaskets[i] = true
    }
    setVisibleBaskets(newVisibleBaskets)
    
    setBasketCounts(new Array(4).fill(0))
    setLevel(prev => prev - 1)
    
    // Special message for 0 baskets
    if (level === 1) {
      setFlexiMessage("Oh no! Where did all the baskets go? We can't divide by zero!")
    } else {
      setFlexiMessage(`Now try dividing the apples between ${level - 1} baskets!`)
    }
  }

  // Handle back button click
  const handleBack = () => {
    if (level >= 4) return
    
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
    
    // Show all baskets for the new level
    const newVisibleBaskets = Array(4).fill(false)
    for (let i = 0; i < level + 1; i++) {
      newVisibleBaskets[i] = true
    }
    setVisibleBaskets(newVisibleBaskets)
    
    // Reset basket counts
    setBasketCounts(new Array(4).fill(0))
    
    // Update level and message
    setLevel(prev => prev + 1)
    
    // Special message when coming back from 0 baskets
    if (level === 0) {
      setFlexiMessage("Phew! We got a basket back. Now we can divide again!")
    } else {
      setFlexiMessage(`Let's try dividing the apples between ${level + 1} baskets!`)
    }
  }

  return (
    <div 
      ref={containerRef} 
      className={`container ${level === 0 ? 'no-baskets' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <h1 className="title">Division by Zero</h1>
      <div className="interactive-area">
        {apples.map((apple) => (
          <div 
            key={apple.id}
            className={`apple ${apple.isDragging ? 'dragging' : ''} ${apple.id === highlightedAppleId ? (isShowingHint ? 'hint-move' : 'highlight') : ''}`}
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
          >
            {apple.content}
          </div>
        ))}
        <div className="baskets-container">
          {visibleBaskets.map((isVisible, index) => 
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
        <img 
          src={flexiImage}
          alt="Flexi character" 
          className="flexi"
        />
        <div className="flexi-speech-bubble">
          {flexiMessage}
        </div>
        <div className="nav-buttons">
          <button 
            className="nav-button" 
            onClick={handleBack}
            disabled={level >= 4}
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
      </div>
    </div>
  )
}

export default App
