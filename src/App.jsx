import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const containerRef = useRef(null)
  const lastBasketUpdateRef = useRef(null)
  const [basketCounts, setBasketCounts] = useState([0, 0, 0, 0])
  const [visibleBaskets, setVisibleBaskets] = useState([true, true, true, true])
  const [level, setLevel] = useState(4) // Start with 4 baskets
  const messageTimeoutRef = useRef(null)
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
    switch (level) {
      case 4: return 3;  // 4 baskets: 3 apples each
      case 3: return 4;  // 3 baskets: 4 apples each
      case 2: return 6;  // 2 baskets: 6 apples each
      default: return 3;
    }
  }

  const warningMessages = [
    "Oops! This basket is full!",
    "That basket can't hold any more apples!",
    "Try another basket, this one's at maximum capacity!",
    "No more room in this basket!",
    "This basket is completely full!",
    "The basket can't fit any more apples!"
  ]

  const handleMouseDown = (e, id) => {
    const apple = e.target
    const rect = apple.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

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
        const updateKey = `${draggedApple.id}-${basketIndex}`
        if (lastBasketUpdateRef.current === updateKey) {
          return prevApples.map(a =>
            a.id === draggedApple.id ? { ...a, isDragging: false } : a
          )
        }
        lastBasketUpdateRef.current = updateKey

        const maxApples = getMaxApplesPerBasket()
        if (basketCounts[basketIndex] >= maxApples && draggedApple.basketIndex !== basketIndex) {
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
    if (level <= 2) return
    
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
    setFlexiMessage(`Now try dividing the apples between ${level - 1} baskets!`)
  }

  // Handle back button click
  const handleBack = () => {
    if (level >= 4) return
    
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
    for (let i = 0; i < level + 1; i++) {
      newVisibleBaskets[i] = true
    }
    setVisibleBaskets(newVisibleBaskets)
    
    setBasketCounts(new Array(4).fill(0))
    setLevel(prev => prev + 1)
    setFlexiMessage(`Let's try dividing the apples between ${level + 1} baskets!`)
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
            className={`apple ${apple.isDragging ? 'dragging' : ''}`}
            style={{
              transform: `translate(${apple.x}px, ${apple.y}px)`,
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
                <div className="basket-top"></div>
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
            disabled={level <= 2}
          >
            Forward →
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
