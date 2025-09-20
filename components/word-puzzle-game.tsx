"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trophy, RotateCcw, Clock, HelpCircle } from "lucide-react"

const WORD_BANK = [
  { word: "HUND", hint: "Bester Freund des Menschen" },
  { word: "KATZE", hint: "Samtpfotiges Haustier, das gerne schnurrt" },
  { word: "HAUS", hint: "Gebäude zum Wohnen" },
  { word: "BAUM", hint: "Große Pflanze mit Stamm und Ästen" },
  { word: "WASSER", hint: "Klare Flüssigkeit zum Trinken" },
  { word: "SONNE", hint: "Heller Stern am Himmel" },
  { word: "MOND", hint: "Himmelskörper, der nachts scheint" },
  { word: "BUCH", hint: "Sammlung von Seiten zum Lesen" },
  { word: "AUTO", hint: "Fahrzeug mit vier Rädern" },
  { word: "BLUME", hint: "Bunte Pflanze im Garten" },
  { word: "SCHULE", hint: "Ort zum Lernen für Kinder" },
  { word: "FREUND", hint: "Person, die man sehr gern hat" },
  { word: "MUSIK", hint: "Schöne Töne und Melodien" },
  { word: "SPIEL", hint: "Aktivität zum Spaß haben" },
  { word: "FARBE", hint: "Rot, Blau, Grün sind Beispiele" },
  { word: "ZEIT", hint: "Vergeht von Sekunde zu Sekunde" },
  { word: "LIEBE", hint: "Starkes Gefühl der Zuneigung" },
  { word: "GLÜCK", hint: "Gefühl der Freude und Zufriedenheit" },
  { word: "TRAUM", hint: "Was man nachts beim Schlafen erlebt" },
  { word: "LEBEN", hint: "Existenz von der Geburt bis zum Tod" },
]

// Grid size
const GRID_SIZE = 10
const WORDS_PER_GAME = 8 // Number of words to select for each game

const GERMAN_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜSS"

type Cell = {
  letter: string
  isFound: boolean
  isSelected: boolean
  wordIndex?: number
}

type Direction = {
  dx: number
  dy: number
}

type GameWord = {
  word: string
  hint: string
}

const DIRECTIONS: Direction[] = [
  { dx: 0, dy: 1 }, // horizontal
  { dx: 1, dy: 0 }, // vertical
  { dx: 1, dy: 1 }, // diagonal down-right
  { dx: 1, dy: -1 }, // diagonal up-right
]

export function WordPuzzleGame() {
  const [grid, setGrid] = useState<Cell[][]>([])
  const [gameWords, setGameWords] = useState<GameWord[]>([]) // Store selected words with hints
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set())
  const [selectedCells, setSelectedCells] = useState<{ row: number; col: number }[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [score, setScore] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [showStartPage, setShowStartPage] = useState(true)

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameStarted && foundWords.size < gameWords.length) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [gameStarted, foundWords.size, gameWords.length])

  const selectRandomWords = useCallback(() => {
    const shuffled = [...WORD_BANK].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, WORDS_PER_GAME)
  }, [])

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const selectedWords = selectRandomWords()
    setGameWords(selectedWords)

    const WORDS = selectedWords.map((w) => w.word)

    const newGrid: Cell[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => ({
            letter: "",
            isFound: false,
            isSelected: false,
          })),
      )

    // Place words in grid
    const placedWords: { word: string; positions: { row: number; col: number }[] }[] = []

    WORDS.forEach((word, wordIndex) => {
      let placed = false
      let attempts = 0

      while (!placed && attempts < 100) {
        const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
        const startRow = Math.floor(Math.random() * GRID_SIZE)
        const startCol = Math.floor(Math.random() * GRID_SIZE)

        // Check if word fits
        const endRow = startRow + direction.dx * (word.length - 1)
        const endCol = startCol + direction.dy * (word.length - 1)

        if (endRow >= 0 && endRow < GRID_SIZE && endCol >= 0 && endCol < GRID_SIZE) {
          // Check for conflicts
          let canPlace = true
          const positions: { row: number; col: number }[] = []

          for (let i = 0; i < word.length; i++) {
            const row = startRow + direction.dx * i
            const col = startCol + direction.dy * i
            positions.push({ row, col })

            if (newGrid[row][col].letter !== "" && newGrid[row][col].letter !== word[i]) {
              canPlace = false
              break
            }
          }

          if (canPlace) {
            // Place the word
            positions.forEach((pos, i) => {
              newGrid[pos.row][pos.col] = {
                letter: word[i],
                isFound: false,
                isSelected: false,
                wordIndex,
              }
            })
            placedWords.push({ word, positions })
            placed = true
          }
        }
        attempts++
      }
    })

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (newGrid[row][col].letter === "") {
          newGrid[row][col].letter = GERMAN_LETTERS[Math.floor(Math.random() * GERMAN_LETTERS.length)]
        }
      }
    }

    setGrid(newGrid)
    setFoundWords(new Set())
    setScore(0)
    setTimeElapsed(0)
    setGameStarted(true)
    setShowStartPage(false)
  }, [selectRandomWords])

  const handleCellMouseDown = (row: number, col: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsSelecting(true)
    setSelectedCells([{ row, col }])
    updateGridSelection([{ row, col }])
  }

  const handleCellMouseEnter = (row: number, col: number) => {
    if (isSelecting) {
      const newSelection = [...selectedCells, { row, col }]
      setSelectedCells(newSelection)
      updateGridSelection(newSelection)
    }
  }

  const handleCellMouseUp = () => {
    if (selectedCells.length > 1) {
      checkForWord()
    }
    setIsSelecting(false)
    clearSelection()
  }

  const updateGridSelection = (selection: { row: number; col: number }[]) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell, isSelected: false })))

      selection.forEach(({ row, col }) => {
        if (newGrid[row] && newGrid[row][col]) {
          newGrid[row][col].isSelected = true
        }
      })

      return newGrid
    })
  }

  const clearSelection = () => {
    setSelectedCells([])
    setGrid((prevGrid) => prevGrid.map((row) => row.map((cell) => ({ ...cell, isSelected: false }))))
  }

  const checkForWord = () => {
    const selectedWord = selectedCells.map(({ row, col }) => grid[row][col].letter).join("")
    const reversedWord = selectedWord.split("").reverse().join("")

    const WORDS = gameWords.map((w) => w.word)
    const foundWord = WORDS.find((word) => word === selectedWord || word === reversedWord)

    if (foundWord && !foundWords.has(foundWord)) {
      // Mark cells as found
      setGrid((prevGrid) => {
        const newGrid = [...prevGrid]
        selectedCells.forEach(({ row, col }) => {
          newGrid[row][col].isFound = true
        })
        return newGrid
      })

      setFoundWords((prev) => new Set([...prev, foundWord]))
      setScore((prev) => prev + foundWord.length * 10)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const isGameComplete = gameStarted && gameWords.length > 0 && foundWords.size === gameWords.length

  // Remove automatic game initialization - game starts only when user clicks start button

  // Start Page Component
  const StartPage = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-8 p-4">
        {/* Animated German Letters */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8">
          {GERMAN_LETTERS.split('').map((letter, index) => (
            <div
              key={letter}
              className="w-12 h-12 sm:w-16 sm:h-16 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-lg sm:text-2xl font-bold shadow-lg animate-bounce"
              style={{
                animationDelay: `${index * 0.1}s`,
                animationDuration: '2s',
                animationIterationCount: 'infinite'
              }}
            >
              {letter}
            </div>
          ))}
        </div>

        {/* Game Title */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-6xl font-bold text-primary mb-4">
            Wörter-Rätsel
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Finde alle versteckten deutschen Wörter im Gitter!
            <br />
            Ziehe mit dem Finger über die Buchstaben, um Wörter zu bilden.
          </p>
        </div>

        {/* Start Button */}
        <Button
          onClick={initializeGrid}
          size="lg"
          className="text-lg sm:text-xl px-8 py-4 h-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
        >
          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 mr-2" />
          Spiel Starten
        </Button>

        {/* Game Instructions */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-center">Spielanleitung</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                <p>Ziehe mit dem Finger über die Buchstaben</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                <p>Wörter können horizontal, vertikal oder diagonal sein</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                <p>Wörter können vorwärts oder rückwärts stehen</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                <p>Verwende die Hinweise um die Wörter zu finden</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Show start page if not started
  if (showStartPage) {
    return <StartPage />
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-3 sm:mb-8">
        <h1 className="text-xl sm:text-4xl font-bold text-primary mb-1 sm:mb-2">Wörter-Rätsel Spiel</h1>
        <p className="text-muted-foreground text-xs sm:text-lg">Finde alle versteckten Wörter im Gitter!</p>
      </div>

      {/* Game Stats */}
      <div className="flex justify-center gap-1 sm:gap-4 mb-3 sm:mb-6">
        <Card className="min-w-[80px] sm:min-w-[120px]">
          <CardContent className="p-1.5 sm:p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-1">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium">Punkte</span>
            </div>
            <div className="text-sm sm:text-2xl font-bold text-primary">{score}</div>
          </CardContent>
        </Card>

        <Card className="min-w-[80px] sm:min-w-[120px]">
          <CardContent className="p-1.5 sm:p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-1">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium">Zeit</span>
            </div>
            <div className="text-sm sm:text-2xl font-bold">{formatTime(timeElapsed)}</div>
          </CardContent>
        </Card>

        <Card className="min-w-[80px] sm:min-w-[120px]">
          <CardContent className="p-1.5 sm:p-4 text-center">
            <div className="text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Gefunden</div>
            <div className="text-sm sm:text-2xl font-bold text-accent">
              {foundWords.size}/{gameWords.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile: Hints first, then Grid */}
      <div className="block sm:hidden space-y-4">
        {/* Mobile Hints */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Hinweise</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {gameStarted && gameWords.length > 0 ? (
              <div className="space-y-1.5">
                {gameWords.map((gameWord) => (
                  <div key={gameWord.word} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">
                        {foundWords.has(gameWord.word) ? gameWord.word : "???"}
                      </span>
                      {foundWords.has(gameWord.word) && (
                        <Badge variant="secondary" className="text-xs">
                          ✓
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground italic">{gameWord.hint}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-muted-foreground">
                  Starte ein neues Spiel um Hinweise zu sehen!
                </p>
              </div>
            )}

            <Separator className="my-2" />

            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Spielanleitung:</strong>
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>Klicke und ziehe um Buchstaben auszuwählen</li>
                <li>Wörter können horizontal, vertikal oder diagonal sein</li>
                <li>Wörter können vorwärts oder rückwärts stehen</li>
                <li>Verwende die Hinweise um die Wörter zu finden</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Game Grid */}
        <Card>
          <CardHeader className="pb-1">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Wörter-Gitter</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={initializeGrid}
                    className="text-xs bg-transparent"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Neu
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStartPage(true)}
                    className="text-xs bg-transparent"
                  >
                    <HelpCircle className="h-3 w-3 mr-1" />
                    Start
                  </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-1">
            {gameStarted && gameWords.length > 0 ? (
              <>
                <div
                  className="grid gap-1 mx-auto w-full max-w-[90vw] select-none"
                  style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
                  onMouseLeave={() => {
                    if (isSelecting) {
                      setIsSelecting(false)
                      clearSelection()
                    }
                  }}
                >
                  {grid.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`
                          w-full aspect-square border border-border flex items-center justify-center
                          text-sm font-bold cursor-pointer transition-colors
                          ${
                            cell.isFound
                              ? "bg-accent text-accent-foreground"
                              : cell.isSelected
                                ? "bg-secondary text-secondary-foreground"
                                : "bg-card hover:bg-muted"
                          }
                        `}
                        onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
                        onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                        onMouseUp={handleCellMouseUp}
                        onTouchStart={(e) => {
                          e.preventDefault()
                          handleCellMouseDown(rowIndex, colIndex, e)
                        }}
                        onTouchMove={(e) => {
                          e.preventDefault()
                          if (isSelecting) {
                            const touch = e.touches[0]
                            const element = document.elementFromPoint(touch.clientX, touch.clientY)
                            if (element && (element as HTMLElement).dataset.row && (element as HTMLElement).dataset.col) {
                              handleCellMouseEnter(
                                Number.parseInt((element as HTMLElement).dataset.row!),
                                Number.parseInt((element as HTMLElement).dataset.col!),
                              )
                            }
                          }
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault()
                          handleCellMouseUp()
                        }}
                        data-row={rowIndex}
                        data-col={colIndex}
                      >
                        {cell.letter}
                      </div>
                    )),
                  )}
                </div>

                {isGameComplete && (
                  <div className="text-center mt-2 p-2 bg-accent/10 rounded-lg">
                    <h3 className="text-sm font-bold text-accent mb-1">
                      🎉 Herzlichen Glückwunsch!
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Du hast alle Wörter in {formatTime(timeElapsed)} mit {score} Punkten gefunden!
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-xs">Klicke auf "Neues Spiel" um zu starten!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Desktop: Grid and Hints side by side */}
      <div className="hidden sm:grid lg:grid-cols-3 gap-2 sm:gap-6">
        {/* Desktop Game Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-1 sm:pb-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm sm:text-xl">Wörter-Gitter</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={initializeGrid}
                    className="text-xs sm:text-sm bg-transparent"
                  >
                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Neues Spiel</span>
                    <span className="sm:hidden">Neu</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStartPage(true)}
                    className="text-xs sm:text-sm bg-transparent"
                  >
                    <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Start Seite</span>
                    <span className="sm:hidden">Start</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-1 sm:p-6">
              {gameStarted && gameWords.length > 0 ? (
                <>
                  <div
                    className="grid gap-1 sm:gap-1 mx-auto w-fit select-none"
                    style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
                    onMouseLeave={() => {
                      if (isSelecting) {
                        setIsSelecting(false)
                        clearSelection()
                      }
                    }}
                  >
                    {grid.map((row, rowIndex) =>
                      row.map((cell, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`
                            w-10 h-10 sm:w-10 sm:h-10 md:w-12 md:h-12 border border-border flex items-center justify-center
                            text-sm sm:text-sm md:text-base font-bold cursor-pointer transition-colors
                            ${
                              cell.isFound
                                ? "bg-accent text-accent-foreground"
                                : cell.isSelected
                                  ? "bg-secondary text-secondary-foreground"
                                  : "bg-card hover:bg-muted"
                            }
                          `}
                          onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
                          onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                          onMouseUp={handleCellMouseUp}
                          onTouchStart={(e) => {
                            e.preventDefault()
                            handleCellMouseDown(rowIndex, colIndex, e)
                          }}
                          onTouchMove={(e) => {
                            e.preventDefault()
                            if (isSelecting) {
                              const touch = e.touches[0]
                              const element = document.elementFromPoint(touch.clientX, touch.clientY)
                              if (element && (element as HTMLElement).dataset.row && (element as HTMLElement).dataset.col) {
                                handleCellMouseEnter(
                                  Number.parseInt((element as HTMLElement).dataset.row!),
                                  Number.parseInt((element as HTMLElement).dataset.col!),
                                )
                              }
                            }
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault()
                            handleCellMouseUp()
                          }}
                          data-row={rowIndex}
                          data-col={colIndex}
                        >
                          {cell.letter}
                        </div>
                      )),
                    )}
                  </div>

                  {isGameComplete && (
                    <div className="text-center mt-2 sm:mt-6 p-2 sm:p-4 bg-accent/10 rounded-lg">
                      <h3 className="text-sm sm:text-xl font-bold text-accent mb-1 sm:mb-2">
                        🎉 Herzlichen Glückwunsch!
                      </h3>
                      <p className="text-xs sm:text-base text-muted-foreground">
                        Du hast alle Wörter in {formatTime(timeElapsed)} mit {score} Punkten gefunden!
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 sm:py-8">
                  <p className="text-muted-foreground text-xs sm:text-base">Klicke auf "Neues Spiel" um zu starten!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="block">
          <Card>
            <CardHeader className="pb-1 sm:pb-6">
              <CardTitle className="text-sm sm:text-xl">Hinweise</CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              {gameStarted && gameWords.length > 0 ? (
                <div className="space-y-1.5 sm:space-y-3">
                  {gameWords.map((gameWord) => (
                    <div key={gameWord.word} className="space-y-0.5 sm:space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium">
                          {foundWords.has(gameWord.word) ? gameWord.word : "???"}
                        </span>
                        {foundWords.has(gameWord.word) && (
                          <Badge variant="secondary" className="text-xs">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground italic">{gameWord.hint}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 sm:py-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Starte ein neues Spiel um Hinweise zu sehen!
                  </p>
                </div>
              )}

              <Separator className="my-2 sm:my-4" />

              <div className="text-xs sm:text-sm text-muted-foreground space-y-1 sm:space-y-2">
                <p>
                  <strong>Spielanleitung:</strong>
                </p>
                <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-xs">
                  <li>Klicke und ziehe um Buchstaben auszuwählen</li>
                  <li>Wörter können horizontal, vertikal oder diagonal sein</li>
                  <li>Wörter können vorwärts oder rückwärts stehen</li>
                  <li>Verwende die Hinweise um die Wörter zu finden</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}