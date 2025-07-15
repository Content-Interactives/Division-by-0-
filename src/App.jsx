import { useState, useRef, useEffect } from 'react'
import './App.css'

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

  const warningMessages = [
    "Oops! This basket is full!",
    "That basket can't hold any more apples!",
    "Try another basket, this one's at maximum capacity!",
    "No more room in this basket!",
    "This basket is completely full!",
    "The basket can't fit any more apples!"
  ]

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
          right: draggedApple.x + containerRef.current.getBoundingClientRect().left + 64, // Apple width
          top: draggedApple.y + containerRef.current.getBoundingClientRect().top,
          bottom: draggedApple.y + containerRef.current.getBoundingClientRect().top + 64 // Apple height
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
        
        // If the basket already has max apples, return the apple to its original position
        if (basketCounts[basketIndex] >= maxApples) {
          console.log('Basket is full, returning apple to original position')
          const randomIndex = Math.floor(Math.random() * warningMessages.length)
          setFlexiMessage(`${warningMessages[randomIndex]} (Max: ${maxApples} apples)`)
          
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

        // If we get here, basket has room
        const newBasketCounts = [...basketCounts]
        if (draggedApple.basketIndex !== null) {
          newBasketCounts[draggedApple.basketIndex]--
        }
        newBasketCounts[basketIndex]++
        setBasketCounts(newBasketCounts)

        return prevApples.map(a =>
          a.id === draggedApple.id
            ? { ...a, isDragging: false, basketIndex }
            : a
        )
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
      className="container" 
      ref={containerRef}
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
          src="/Flexi_ThumbsUp (1).png" 
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
            ← Back
          </button>
          <button 
            className="nav-button" 
            onClick={handleForward}
            disabled={level <= 0}
          >
            Forward →
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
