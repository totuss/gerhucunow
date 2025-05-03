"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Upload,
  Play,
  Pause,
  Trash2,
  FileText,
  BarChart3,
  Sun,
  Moon,
  Settings,
  Clock,
  ChevronDown,
  ArrowDown,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { User, LogEntry, Account } from "@/lib/types"
import { formatTimeLeft } from "@/lib/types"

// Format time in Moscow timezone (UTC+3)
const formatMoscowTime = (date: Date): string => {
  return new Date(date.getTime() + 3 * 60 * 60 * 1000).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

// Filter cookies from text, extracting only the valid cookie part
const filterCookies = (text: string): string[] => {
  const lines = text.split("\n")
  const filtered: string[] = []

  for (const line of lines) {
    if (line.includes("_|WARNING:-DO-NOT-SHARE-THIS.")) {
      const cookieStart = line.indexOf("_|WARNING:-DO-NOT-SHARE-THIS.")
      // Extract the cookie part (until space or end of line)
      const cookiePart = line.substring(cookieStart).split(/\s+/)[0]
      filtered.push(cookiePart)
    }
  }

  return filtered
}

interface FileCheckStatisticsProps {
  currentUser: User | null
  onLogout: () => void
}

export default function FileCheckStatistics({ currentUser, onLogout }: FileCheckStatisticsProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isPaused, setIsPaused] = useState(isChecking)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [mode, setMode] = useState("checker")
  const [theme, setTheme] = useState("light")
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState("00:00")
  const [autoScroll, setAutoScroll] = useState(true)
  const [selectedTopAccount, setSelectedTopAccount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const logsScrollAreaRef = useRef<HTMLDivElement>(null)
  const [sortBy, setSortBy] = useState<keyof Account>("rap")
  const [topAccounts, setTopAccounts] = useState<Account[]>([])
  const [results, setResults] = useState<Account[]>([])
  const [resultsSortBy, setResultsSortBy] = useState<keyof Account>("rap")
  const [subscriptionTimer, setSubscriptionTimer] = useState<NodeJS.Timeout | null>(null)

  // Reference to interval for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Statistics state for Checker mode
  const [checkerStats, setCheckerStats] = useState({
    loaded: 0,
    valid: 0,
    invalid: 0,
    errors: 0,
    donate: 0,
    balance: 0,
    pending: 0,
    rap: 0,
    billing: 0,
    premium: 0,
    card: 0,
    badge: 0,
    gamepass: 0,
  })

  // Statistics state for Refresher mode
  const [refresherStats, setRefresherStats] = useState({
    loaded: 0,
    refreshed: 0,
    error: 0,
  })

  // Settings state
  const [settings, setSettings] = useState({
    checker: {
      threads: 4,
      korblox: false,
      headless: false,
      badge: "",
      gamepass: "",
    },
    refresher: {
      mode: "main",
      threads: 2,
    },
    telegram: {
      token: "",
      chatId: "",
      notifyChecker: true,
      notifyRefresher: false,
    },
  })

  // Add a state for refresher cookies
  const [refresherCookies, setRefresherCookies] = useState<string[]>([])

  // Toggle theme between light and dark
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  // Initialize theme on component mount
  useEffect(() => {
    // Check if user has a preferred theme
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initialTheme = prefersDark ? "dark" : "light"
    setTheme(initialTheme)

    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark")
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Setup drag and drop functionality
  useEffect(() => {
    const dropZone = dropZoneRef.current
    if (!dropZone) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dropZone.classList.add("border-primary")
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dropZone.classList.remove("border-primary")
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dropZone.classList.remove("border-primary")

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFile = e.dataTransfer.files[0]
        handleFileSelection(droppedFile)
      }
    }

    if (dropZone) {
      dropZone.addEventListener("dragover", handleDragOver)
      dropZone.addEventListener("dragleave", handleDragLeave)
      dropZone.addEventListener("drop", handleDrop)

      return () => {
        dropZone.removeEventListener("dragover", handleDragOver)
        dropZone.removeEventListener("dragleave", handleDragLeave)
        dropZone.removeEventListener("drop", handleDrop)
      }
    }
  }, [dropZoneRef.current])

  // Auto-scroll logs when new logs are added
  useEffect(() => {
    if (autoScroll && logsScrollAreaRef.current && logs.length > 0) {
      const scrollArea = logsScrollAreaRef.current
      scrollArea.scrollTop = scrollArea.scrollHeight
    }
  }, [logs, autoScroll])

  // Format elapsed time to minutes:seconds
  const formatElapsedTimeFunc = (startTime: Date) => {
    const now = new Date()
    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)

    const minutes = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0")
    const seconds = Math.floor(elapsed % 60)
      .toString()
      .padStart(2, "0")

    return `${minutes}:${seconds}`
  }

  // Add a log entry with current timestamp
  const addLogFunc = (text: string) => {
    setLogs((prev) => [...prev, { text, timestamp: new Date() }])
  }

  const handleFileSelection = (selectedFile: File) => {
    // Check if file is txt format
    if (!selectedFile.name.toLowerCase().endsWith(".txt")) {
      addLogFunc(`Ошибка: Можно загружать только файлы формата .txt`)
      return
    }

    setFile(selectedFile)

    // Read the file to count lines and filter cookies
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        const content = e.target.result as string
        const filteredCookies = filterCookies(content)
        const lineCount = filteredCookies.length

        // Reset statistics based on mode
        if (mode === "checker") {
          setCheckerStats({
            ...checkerStats,
            loaded: lineCount,
          })
        } else {
          setRefresherStats({
            ...refresherStats,
            loaded: lineCount,
          })

          // For refresher mode, store the filtered cookies
          setRefresherCookies(filteredCookies)
        }

        addLogFunc(
          `Файл загружен: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB, отсортировано: ${lineCount} куки)`,
        )
      }
    }
    reader.readAsText(selectedFile)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0])
    }
  }

  // Generate a random username
  const generateUsername = () => {
    const prefixes = ["Cool", "Super", "Mega", "Ultra", "Pro", "Epic", "Awesome", "Master", "Legend", "Elite"]
    const suffixes = ["Player", "Gamer", "User", "Fan", "Star", "Hero", "Ninja", "Warrior", "Champion", "King"]
    const numbers = Math.floor(Math.random() * 1000)

    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}${numbers}`
  }

  // Generate a random account
  const generateRandomAccount = (): Account => {
    return {
      username: generateUsername(),
      donate: Math.floor(Math.random() * 100),
      balance: Math.floor(Math.random() * 1000),
      pending: Math.floor(Math.random() * 20),
      rap: Math.floor(Math.random() * 10000),
      billing: Math.floor(Math.random() * 100),
      premium: Math.random() > 0.7,
      card: Math.random() > 0.8,
      badge: Math.floor(Math.random() * 5),
      gamepass: Math.floor(Math.random() * 3),
      cookie: `_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_${Math.random().toString(36).substring(2, 15)}`,
    }
  }

  // Update top accounts
  const updateTopAccounts = (newAccount: Account) => {
    // Add to results
    setResults((prevResults) => {
      const updatedResults = [...prevResults]
      // Only add if not already in results
      if (!updatedResults.some((acc) => acc.cookie === newAccount.cookie)) {
        updatedResults.push(newAccount)
      }
      return updatedResults.sort((a, b) => {
        if (typeof a[resultsSortBy] === "boolean") {
          return a[resultsSortBy] === b[resultsSortBy] ? 0 : a[resultsSortBy] ? -1 : 1
        }
        return (b[resultsSortBy] as number) - (a[resultsSortBy] as number)
      })
    })

    setTopAccounts((prevAccounts) => {
      const updatedAccounts = [...prevAccounts, newAccount]
      return updatedAccounts
        .sort((a, b) => {
          if (typeof a[sortBy] === "boolean") {
            return a[sortBy] === b[sortBy] ? 0 : a[sortBy] ? -1 : 1
          }
          return (b[sortBy] as number) - (a[sortBy] as number)
        })
        .slice(0, 3) // Keep top 3 accounts
    })
  }

  // Change sort criteria
  const changeSortCriteria = (criteria: keyof Account) => {
    setSortBy(criteria)
    setTopAccounts((prevAccounts) => {
      return [...prevAccounts].sort((a, b) => {
        if (typeof a[criteria] === "boolean") {
          return a[criteria] === b[criteria] ? 0 : a[criteria] ? -1 : 1
        }
        return (b[criteria] as number) - (a[criteria] as number)
      })
    })
  }

  const startCheck = () => {
    if (!file) return

    // If paused, just resume
    if (isPaused) {
      setIsPaused(false)
      setIsChecking(true)

      // Resume timer
      if (startTime) {
        timerRef.current = setInterval(() => {
          setElapsedTime(formatElapsedTimeFunc(startTime))
        }, 1000)
      }

      // Resume progress simulation
      simulateProgress()

      addLogFunc(`Проверка возобновлена`)
      return
    }

    setIsChecking(true)
    setProgress(0)
    setTopAccounts([])
    setResults([])

    // Set start time and start timer
    const now = new Date()
    setStartTime(now)
    setElapsedTime("00:00")

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setElapsedTime(formatElapsedTimeFunc(now))
    }, 1000)

    // Reset statistics for the current mode
    if (mode === "checker") {
      setCheckerStats((prev) => ({
        ...prev,
        valid: 0,
        invalid: 0,
        errors: 0,
        donate: 0,
        balance: 0,
        pending: 0,
        rap: 0,
        billing: 0,
        premium: 0,
        card: 0,
        badge: 0,
        gamepass: 0,
      }))
    } else {
      setRefresherStats((prev) => ({
        ...prev,
        refreshed: 0,
        error: 0,
      }))
    }

    addLogFunc(`Начало ${mode === "checker" ? "проверки" : "обновления"} файла: ${file.name}`)
    addLogFunc(`Используется ${mode === "checker" ? settings.checker.threads : settings.refresher.threads} потоков`)

    if (mode === "refresher") {
      addLogFunc(`Режим обновления: ${settings.refresher.mode === "main" ? "Основной" : "Быстрый"}`)
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Start progress simulation
    simulateProgress()
  }

  const simulateProgress = () => {
    // Simulate progress and update statistics
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 1

        // Update statistics based on mode
        if (mode === "checker") {
          // Calculate how many cookies to process in this step
          const totalProcessed = checkerStats.valid + checkerStats.invalid
          const remainingToProcess = checkerStats.loaded - totalProcessed

          if (remainingToProcess > 0) {
            // Decide how many cookies to process in this step (1-3)
            const cookiesToProcess = Math.min(Math.floor(Math.random() * 3) + 1, remainingToProcess)

            // Decide how many of those will be valid vs invalid
            const validIncrement = Math.floor(Math.random() * (cookiesToProcess + 1))
            const invalidIncrement = cookiesToProcess - validIncrement

            setCheckerStats((prevStats) => ({
              ...prevStats,
              valid: prevStats.valid + validIncrement,
              invalid: prevStats.invalid + invalidIncrement,
              // Only update these stats for valid accounts
              donate: prevStats.donate + (validIncrement > 0 ? Math.floor(Math.random() * 2) * validIncrement : 0),
              balance: prevStats.balance + (validIncrement > 0 ? Math.floor(Math.random() * 100) * validIncrement : 0),
              pending: prevStats.pending + (validIncrement > 0 ? Math.floor(Math.random() * 5) * validIncrement : 0),
              rap: prevStats.rap + (validIncrement > 0 ? Math.floor(Math.random() * 1000) * validIncrement : 0),
              billing: prevStats.billing + (validIncrement > 0 ? (Math.random() > 0.9 ? 1 : 0) * validIncrement : 0),
              premium: prevStats.premium + (validIncrement > 0 ? (Math.random() > 0.95 ? 1 : 0) * validIncrement : 0),
              card: prevStats.card + (validIncrement > 0 ? (Math.random() > 0.9 ? 1 : 0) * validIncrement : 0),
              badge: prevStats.badge + (validIncrement > 0 ? (Math.random() > 0.85 ? 1 : 0) * validIncrement : 0),
              gamepass: prevStats.gamepass + (validIncrement > 0 ? (Math.random() > 0.85 ? 1 : 0) * validIncrement : 0),
            }))

            // Only generate new accounts for valid increments
            if (validIncrement > 0) {
              // Generate accounts for each valid increment
              for (let i = 0; i < validIncrement; i++) {
                updateTopAccounts(generateRandomAccount())
              }
              addLogFunc(`Найден валидный аккаунт: ${validIncrement}`)
            }

            if (invalidIncrement > 0) {
              addLogFunc(`Найден невалидный аккаунт: ${invalidIncrement}`)
            }
          }
        } else {
          // For refresher mode, similar logic to ensure refreshed + error = loaded
          const totalProcessed = refresherStats.refreshed + refresherStats.error
          const remainingToProcess = refresherStats.loaded - totalProcessed

          if (remainingToProcess > 0) {
            // Decide how many cookies to process in this step (1-3)
            const cookiesToProcess = Math.min(Math.floor(Math.random() * 3) + 1, remainingToProcess)

            // Decide how many of those will be refreshed vs error
            const refreshedIncrement = Math.floor(Math.random() * (cookiesToProcess + 1))
            const errorIncrement = cookiesToProcess - refreshedIncrement

            setRefresherStats((prevStats) => ({
              ...prevStats,
              refreshed: prevStats.refreshed + refreshedIncrement,
              error: prevStats.error + errorIncrement,
            }))

            // Add refreshed cookies to results only for valid ones
            if (refreshedIncrement > 0) {
              addLogFunc(`Обновлено аккаунтов: ${refreshedIncrement}`)

              // Add refreshed cookies to results
              for (let i = 0; i < refreshedIncrement; i++) {
                if (refresherCookies.length > 0) {
                  const index = Math.floor(Math.random() * refresherCookies.length)
                  const cookie = refresherCookies[index]

                  // Add to results
                  setResults((prevResults) => {
                    const updatedResults = [...prevResults]
                    // Only add if not already in results
                    if (!updatedResults.some((acc) => acc.cookie === cookie)) {
                      updatedResults.push({
                        username: `User${Math.floor(Math.random() * 10000)}`,
                        cookie: cookie,
                        donate: 0,
                        balance: 0,
                        pending: 0,
                        rap: 0,
                        billing: 0,
                        premium: false,
                        card: false,
                        badge: 0,
                        gamepass: 0,
                      })
                    }
                    return updatedResults
                  })

                  // Remove from refresherCookies to avoid duplicates
                  setRefresherCookies((prev) => prev.filter((_, i) => i !== index))
                }
              }
            }

            if (errorIncrement > 0) {
              addLogFunc(`Ошибка обновления: ${errorIncrement}`)
            }
          }
        }

        // Check if process is complete - either progress reached 100% or all cookies processed
        const isAllProcessed =
          mode === "checker"
            ? checkerStats.valid + checkerStats.invalid >= checkerStats.loaded
            : refresherStats.refreshed + refresherStats.error >= refresherStats.loaded

        if (newProgress >= 100 || isAllProcessed) {
          clearInterval(intervalRef.current!)
          clearInterval(timerRef.current!)
          setIsChecking(false)
          setIsPaused(false)
          addLogFunc(mode === "checker" ? "Проверка завершена" : "Обновление завершено")

          // If Telegram settings are configured, log notification
          if (settings.telegram.token && settings.telegram.chatId) {
            if (
              (mode === "checker" && settings.telegram.notifyChecker) ||
              (mode === "refresher" && settings.telegram.notifyRefresher)
            ) {
              addLogFunc(`Уведомление отправлено в Telegram (${settings.telegram.chatId})`)
            }
          }

          return 100
        }

        return newProgress
      })
    }, 200) // Faster updates for more realistic simulation
  }

  const stopCheck = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setIsPaused(true)
    setIsChecking(false)
    addLogFunc(mode === "checker" ? "Проверка приостановлена" : "Обновление приостановлена")
  }

  const clearLogs = () => {
    setLogs([])
    setProgress(0)
    setFile(null)
    setElapsedTime("00:00")
    setTopAccounts([])
    setResults([])
    setIsPaused(false)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    // Reset statistics
    if (mode === "checker") {
      setCheckerStats({
        loaded: 0,
        valid: 0,
        invalid: 0,
        errors: 0,
        donate: 0,
        balance: 0,
        pending: 0,
        rap: 0,
        billing: 0,
        premium: 0,
        card: 0,
        badge: 0,
        gamepass: 0,
      })
    } else {
      setRefresherStats({
        loaded: 0,
        refreshed: 0,
        error: 0,
      })
    }

    // Stop any running intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  // Handle settings changes
  const updateSettings = (category, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }))
  }

  // Handle manual thread input
  const handleThreadInput = (category, value) => {
    const numValue = Number.parseInt(value)
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 20) {
      updateSettings(category, "threads", numValue)
    }
  }

  // Handle scroll in logs area
  const handleLogsScroll = () => {
    if (logsScrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsScrollAreaRef.current
      // If user scrolls up, disable auto-scroll
      if (scrollHeight - scrollTop - clientHeight > 50) {
        setAutoScroll(false)
      }
    }
  }

  // Enable auto-scroll
  const enableAutoScroll = () => {
    setAutoScroll(true)
    if (logsScrollAreaRef.current) {
      logsScrollAreaRef.current.scrollTop = logsScrollAreaRef.current.scrollHeight
    }
  }

  const downloadResults = () => {
    if (results.length === 0) return

    let content = ""

    if (mode === "checker") {
      content = results
        .map((account) => {
          return `Username: ${account.username} |Balance: ${account.balance} |Donate: ${account.donate} |Rap: ${account.rap} |Billing: ${account.billing.toFixed(1)} USD |Premium: ${account.premium} |Mail: ${Math.random() > 0.5} |Card: ${account.card} |Pending: ${account.pending} |Badges: ${account.badge} |Gamepasses: ${account.gamepass} |Cookie: ${account.cookie}`
        })
        .join("\n")
    } else {
      // For refresher mode, just output the cookies
      content = results.map((account) => account.cookie).join("\n")
    }

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `results_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Add this function to sort results
  const sortResults = (criteria: keyof Account) => {
    setResultsSortBy(criteria)
    setResults((prevResults) => {
      return [...prevResults].sort((a, b) => {
        if (typeof a[criteria] === "boolean") {
          return a[criteria] === b[criteria] ? 0 : a[criteria] ? -1 : 1
        }
        return (b[criteria] as number) - (a[criteria] as number)
      })
    })
  }

  // Add this useEffect for subscription time synchronization
  useEffect(() => {
    // Start a timer to decrease subscription time
    if (currentUser && currentUser.days_left > 0) {
      // Update every minute (60000 ms)
      const timer = setInterval(() => {
        // Decrease by approximately 1 minute worth of days
        const minuteInDays = 1 / (24 * 60)

        // Update the current user's subscription time
        if (currentUser.days_left > 0) {
          currentUser.days_left = Math.max(0, currentUser.days_left - minuteInDays)

          // Force a re-render
          setSubscriptionTimer(timer)
        } else {
          // If subscription has expired, clear the timer
          clearInterval(timer)
          setSubscriptionTimer(null)
          // Redirect or show message if needed
        }
      }, 60000) // Every minute

      setSubscriptionTimer(timer)

      return () => {
        clearInterval(timer)
      }
    }
  }, [currentUser])

  // Update the addLog function to use Moscow time
  const addLog = (text: string) => {
    setLogs((prev) => [...prev, { text, timestamp: new Date() }])
  }

  // Update the formatElapsedTime function to use Moscow time
  const formatElapsedTime = (startTime: Date) => {
    const now = new Date()
    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)

    const minutes = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0")
    const seconds = Math.floor(elapsed % 60)
      .toString()
      .padStart(2, "0")

    return `${minutes}:${seconds}`
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[rgb(23,23,24)] text-black dark:text-white transition-colors duration-200">
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-center">qTools</h1>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 border-l border-gray-300 dark:border-gray-600 pl-2">
              {currentUser?.days_left ? formatTimeLeft(currentUser.days_left) : "0 дней"}
            </span>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-200 dark:border-[rgb(45,45,48)] dark:text-gray-100"
                  aria-label="Open settings"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)] overflow-y-auto max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Настройки</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="checker" className="mt-4">
                  <TabsList className="grid w-full grid-cols-3 dark:bg-[rgb(40,40,45)]">
                    <TabsTrigger
                      value="checker"
                      className="dark:data-[state=active]:bg-[rgb(32,32,35)] dark:text-white"
                    >
                      Checker
                    </TabsTrigger>
                    <TabsTrigger
                      value="refresher"
                      className="dark:data-[state=active]:bg-[rgb(32,32,35)] dark:text-white"
                    >
                      Refresher
                    </TabsTrigger>
                    <TabsTrigger
                      value="telegram"
                      className="dark:data-[state=active]:bg-[rgb(32,32,35)] dark:text-white"
                    >
                      Telegram
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="checker" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <h4 className="font-medium dark:text-white">Проверять на:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div
                            className="relative flex items-center"
                            onClick={() => updateSettings("checker", "korblox", !settings.checker.korblox)}
                          >
                            <input
                              type="checkbox"
                              id="check-korblox"
                              checked={settings.checker.korblox}
                              onChange={(e) => updateSettings("checker", "korblox", e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                                settings.checker.korblox
                                  ? "bg-blue-500 border-blue-500 dark:bg-blue-600 dark:border-blue-600"
                                  : "bg-transparent border-blue-300 dark:border-blue-400"
                              }`}
                            >
                              {settings.checker.korblox && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 text-white"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <Label htmlFor="check-korblox" className="ml-2 dark:text-white cursor-pointer">
                              Korblox
                            </Label>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div
                            className="relative flex items-center"
                            onClick={() => updateSettings("checker", "headless", !settings.checker.headless)}
                          >
                            <input
                              type="checkbox"
                              id="check-headless"
                              checked={settings.checker.headless}
                              onChange={(e) => updateSettings("checker", "headless", e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                                settings.checker.headless
                                  ? "bg-blue-500 border-blue-500 dark:bg-blue-600 dark:border-blue-600"
                                  : "bg-transparent border-blue-300 dark:border-blue-400"
                              }`}
                            >
                              {settings.checker.headless && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 text-white"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <Label htmlFor="check-headless" className="ml-2 dark:text-white cursor-pointer">
                              Headless
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="check-badge" className="dark:text-white">
                          Badge:
                        </Label>
                        <Input
                          id="check-badge"
                          type="text"
                          value={settings.checker.badge}
                          onChange={(e) => updateSettings("checker", "badge", e.target.value)}
                          placeholder="Введите ID бейджа"
                          className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="check-gamepass" className="dark:text-white">
                          Gamepass:
                        </Label>
                        <Input
                          id="check-gamepass"
                          type="text"
                          value={settings.checker.gamepass}
                          onChange={(e) => updateSettings("checker", "gamepass", e.target.value)}
                          placeholder="Введите ID геймпасса"
                          className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="checker-threads" className="dark:text-white">
                            Количество потоков:
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              max="20"
                              value={settings.checker.threads}
                              onChange={(e) => handleThreadInput("checker", e.target.value)}
                              className="w-16 h-8 text-center dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
                              style={{ appearance: "textfield", MozAppearance: "textfield" }}
                            />
                          </div>
                        </div>
                        <Slider
                          id="checker-threads"
                          min={1}
                          max={20}
                          step={0.01}
                          value={[settings.checker.threads]}
                          onValueChange={(value) => updateSettings("checker", "threads", Math.round(value[0]))}
                          className="dark:bg-[rgb(40,40,45)]"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="refresher" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="refresher-mode" className="dark:text-white">
                        Режим обновления
                      </Label>
                      <Select
                        value={settings.refresher.mode}
                        onValueChange={(value) => updateSettings("refresher", "mode", value)}
                      >
                        <SelectTrigger
                          id="refresher-mode"
                          className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
                        >
                          <SelectValue placeholder="Выберите режим" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
                          <SelectItem value="main" className="dark:text-white">
                            Основной
                          </SelectItem>
                          <SelectItem value="fast" className="dark:text-white">
                            Быстрый
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="refresher-threads" className="dark:text-white">
                          Количество потоков:
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            value={settings.refresher.threads}
                            onChange={(e) => handleThreadInput("refresher", e.target.value)}
                            className="w-16 h-8 text-center dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
                            style={{ appearance: "textfield", MozAppearance: "textfield" }}
                          />
                        </div>
                      </div>
                      <Slider
                        id="refresher-threads"
                        min={1}
                        max={20}
                        step={0.01}
                        value={[settings.refresher.threads]}
                        onValueChange={(value) => updateSettings("refresher", "threads", Math.round(value[0]))}
                        className="dark:bg-[rgb(40,40,45)]"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="telegram" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="telegram-token" className="dark:text-white">
                        Token
                      </Label>
                      <Input
                        id="telegram-token"
                        type="text"
                        placeholder="Введите Telegram Bot Token"
                        value={settings.telegram.token}
                        onChange={(e) => updateSettings("telegram", "token", e.target.value)}
                        className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telegram-chatid" className="dark:text-white">
                        Chat ID
                      </Label>
                      <Input
                        id="telegram-chatid"
                        type="text"
                        placeholder="Введите Chat ID"
                        value={settings.telegram.chatId}
                        onChange={(e) => updateSettings("telegram", "chatId", e.target.value)}
                        className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
                      />
                    </div>

                    <div className="space-y-4 mt-4">
                      <h4 className="font-medium dark:text-white">Отстук:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div
                            className="relative flex items-center"
                            onClick={() =>
                              updateSettings("telegram", "notifyChecker", !settings.telegram.notifyChecker)
                            }
                          >
                            <input
                              type="checkbox"
                              id="notify-checker"
                              checked={settings.telegram.notifyChecker}
                              onChange={(e) => updateSettings("telegram", "notifyChecker", e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                                settings.telegram.notifyChecker
                                  ? "bg-blue-500 border-blue-500 dark:bg-blue-600 dark:border-blue-600"
                                  : "bg-transparent border-blue-300 dark:border-blue-400"
                              }`}
                            >
                              {settings.telegram.notifyChecker && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 text-white"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <Label htmlFor="notify-checker" className="ml-2 dark:text-white cursor-pointer">
                              Checker
                            </Label>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div
                            className="relative flex items-center"
                            onClick={() =>
                              updateSettings("telegram", "notifyRefresher", !settings.telegram.notifyRefresher)
                            }
                          >
                            <input
                              type="checkbox"
                              id="notify-refresher"
                              checked={settings.telegram.notifyRefresher}
                              onChange={(e) => updateSettings("telegram", "notifyRefresher", e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                                settings.telegram.notifyRefresher
                                  ? "bg-blue-500 border-blue-500 dark:bg-blue-600 dark:border-blue-600"
                                  : "bg-transparent border-blue-300 dark:border-blue-400"
                              }`}
                            >
                              {settings.telegram.notifyRefresher && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 text-white"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <Label htmlFor="notify-refresher" className="ml-2 dark:text-white cursor-pointer">
                              Refresher
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full mt-2 dark:bg-[rgb(40,40,45)] dark:hover:bg-[rgb(50,50,55)] dark:text-white dark:border-[rgb(45,45,48)]"
                      variant="outline"
                      onClick={() => {
                        if (settings.telegram.token && settings.telegram.chatId) {
                          addLogFunc(`Тестовое уведомление отправлено в Telegram (${settings.telegram.chatId})`)
                        }
                      }}
                    >
                      Проверить отстук
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="border-gray-200 dark:border-[rgb(45,45,48)] dark:text-gray-100"
              aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="border-gray-200 dark:border-[rgb(45,45,48)] dark:text-gray-100"
            >
              Выйти
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Loaded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mode === "checker" ? checkerStats.loaded : refresherStats.loaded}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{mode === "checker" ? "Valid" : "Refreshed"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500 dark:text-green-400">
                {mode === "checker" ? checkerStats.valid : refresherStats.refreshed}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{mode === "checker" ? "Invalid" : "Error"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500 dark:text-red-400">
                {mode === "checker" ? checkerStats.invalid : refresherStats.error}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-2 dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
            <CardHeader>
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Режим работы</h3>
                <RadioGroup defaultValue="checker" value={mode} onValueChange={setMode} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="checker" id="checker" className="dark:border-[rgb(45,45,48)]" />
                    <Label htmlFor="checker" className="dark:text-gray-200">
                      Checker
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="refresher" id="refresher" className="dark:border-[rgb(45,45,48)]" />
                    <Label htmlFor="refresher" className="dark:text-gray-200">
                      Refresher
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center border-gray-300 dark:border-[rgb(45,45,48)] hover:border-primary dark:hover:border-primary transition-colors cursor-pointer"
                ref={dropZoneRef}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  accept=".txt"
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground dark:text-gray-400" />
                  <span className="text-sm font-medium">Загрузить файл</span>
                  {file && (
                    <span className="text-xs text-muted-foreground dark:text-gray-400">
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  )}
                </label>
              </div>

              {file && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Progress value={progress} className="h-2 dark:bg-[rgb(40,40,45)]" />
                      <span className="text-sm font-medium whitespace-nowrap">
                        {progress}% (
                        {Math.floor(
                          (progress * (mode === "checker" ? checkerStats.loaded : refresherStats.loaded)) / 100,
                        )}
                        /{mode === "checker" ? checkerStats.loaded : refresherStats.loaded})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">{elapsedTime}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={startCheck}
                    disabled={!file || (isChecking && !isPaused)}
                    className="col-span-1 bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700 dark:text-white"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {isPaused ? "Продолжить" : "Старт"}
                  </Button>

                  <Button
                    onClick={stopCheck}
                    disabled={!isChecking}
                    variant="outline"
                    className="col-span-1 dark:border-[rgb(45,45,48)] dark:text-gray-200 dark:hover:bg-[rgb(40,40,45)]"
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Стоп
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={clearLogs}
                    variant="destructive"
                    className="col-span-1 dark:bg-red-700 dark:hover:bg-red-800"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Очистить логи
                  </Button>
                  <div className="col-span-1"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
            <CardHeader>
              <div className="w-full">
                <Tabs defaultValue="logs" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 dark:bg-[rgb(40,40,45)]">
                    <TabsTrigger value="logs" className="dark:data-[state=active]:bg-[rgb(32,32,35)]">
                      <FileText className="mr-2 h-4 w-4" />
                      Логи
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="dark:data-[state=active]:bg-[rgb(32,32,35)]">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Статистика
                    </TabsTrigger>
                    <TabsTrigger value="results" className="dark:data-[state=active]:bg-[rgb(32,32,35)]">
                      <Download className="mr-2 h-4 w-4" />
                      Результаты
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="logs" className="mt-4">
                    <div className="relative">
                      <ScrollArea
                        className="h-[400px] w-full rounded-md border p-4 dark:border-[rgb(45,45,48)] dark:bg-[rgb(32,32,35)]"
                        ref={logsScrollAreaRef}
                        onScroll={handleLogsScroll}
                      >
                        {logs.length > 0 ? (
                          logs.map((log, index) => (
                            <div
                              key={index}
                              className="py-1 text-sm border-b border-gray-100 dark:border-[rgb(45,45,48)] last:border-0"
                            >
                              <span className="text-muted-foreground dark:text-gray-400 text-xs">
                                {formatMoscowTime(log.timestamp)}:{" "}
                              </span>
                              {log.text}
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground dark:text-gray-400">
                            Логи будут отображаться здесь
                          </div>
                        )}
                      </ScrollArea>
                      {!autoScroll && logs.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute bottom-2 right-2 bg-white dark:bg-[rgb(40,40,45)] opacity-80"
                          onClick={enableAutoScroll}
                        >
                          <ArrowDown className="h-4 w-4 mr-1" />
                          Вниз
                        </Button>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="stats" className="mt-4">
                    <div className="h-[400px] w-full rounded-md border p-2 dark:border-[rgb(45,45,48)] dark:bg-[rgb(32,32,35)]">
                      {mode === "checker" ? (
                        <div className="space-y-1">
                          <h4 className="font-medium">Статистика</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Valid:</span>
                                <span className="text-green-500 dark:text-green-400">{checkerStats.valid}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Invalid:</span>
                                <span className="text-yellow-500 dark:text-yellow-400">{checkerStats.invalid}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Errors:</span>
                                <span className="text-red-500 dark:text-red-400">{checkerStats.errors}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Donate:</span>
                                <span>{checkerStats.donate}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Balance:</span>
                                <span>{checkerStats.balance}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Pending:</span>
                                <span>{checkerStats.pending}</span>
                              </div>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">RAP:</span>
                                <span>{checkerStats.rap}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Billing:</span>
                                <span>{checkerStats.billing.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Premium:</span>
                                <span>{checkerStats.premium}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Card:</span>
                                <span>{checkerStats.card}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Badge:</span>
                                <span>{checkerStats.badge || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Gamepass:</span>
                                <span>{checkerStats.gamepass || 0}</span>
                              </div>
                            </div>
                          </div>

                          <Separator className="my-1" />

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center">
                                <h4 className="font-medium">Топ аккаунты</h4>
                                <div className="ml-2 flex gap-1">
                                  {[0, 1, 2].map((index) => (
                                    <Button
                                      key={index}
                                      size="sm"
                                      variant={selectedTopAccount === index ? "default" : "outline"}
                                      className="h-6 w-6 p-0"
                                      onClick={() => setSelectedTopAccount(index)}
                                      disabled={topAccounts.length <= index}
                                    >
                                      {index + 1}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              <div className="relative">
                                <select
                                  value={sortBy}
                                  onChange={(e) => changeSortCriteria(e.target.value as keyof Account)}
                                  className="appearance-none bg-gray-100 dark:bg-[rgb(40,40,45)] rounded-md px-3 py-1 pr-8 text-sm font-medium cursor-pointer border border-gray-200 dark:border-[rgb(45,45,48)]"
                                >
                                  <option value="rap">RAP</option>
                                  <option value="balance">Balance</option>
                                  <option value="donate">Donate</option>
                                  <option value="pending">Pending</option>
                                  <option value="billing">Billing</option>
                                  <option value="premium">Premium</option>
                                  <option value="card">Card</option>
                                  <option value="badge">Badge</option>
                                  <option value="gamepass">Gamepass</option>
                                </select>
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                </div>
                              </div>
                            </div>

                            {topAccounts.length > 0 && topAccounts[selectedTopAccount] ? (
                              <div className="p-2 border rounded dark:border-[rgb(45,45,48)]">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="font-medium text-base">
                                    Username: {topAccounts[selectedTopAccount].username}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs dark:bg-[rgb(40,40,45)] dark:hover:bg-[rgb(50,50,55)] dark:text-white dark:border-[rgb(45,45,48)]"
                                    onClick={() => {
                                      navigator.clipboard.writeText(topAccounts[selectedTopAccount].cookie)
                                    }}
                                  >
                                    Copy Cookie
                                  </Button>
                                </div>
                                <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
                                  {/* Column 1 */}
                                  <div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground dark:text-gray-400">Balance:</span>
                                      <span>{topAccounts[selectedTopAccount].balance}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground dark:text-gray-400">Donate:</span>
                                      <span>{topAccounts[selectedTopAccount].donate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground dark:text-gray-400">Pending:</span>
                                      <span>{topAccounts[selectedTopAccount].pending}</span>
                                    </div>
                                  </div>

                                  {/* Column 2 */}
                                  <div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground dark:text-gray-400">RAP:</span>
                                      <span>{topAccounts[selectedTopAccount].rap}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground dark:text-gray-400">Billing:</span>
                                      <span>{topAccounts[selectedTopAccount].billing}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground dark:text-gray-400">Premium:</span>
                                      <span>{topAccounts[selectedTopAccount].premium ? "Yes" : "No"}</span>
                                    </div>
                                  </div>

                                  {/* Column 3 */}
                                  <div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground dark:text-gray-400">Card:</span>
                                      <span>{topAccounts[selectedTopAccount].card ? "Yes" : "No"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground dark:text-gray-400">Badge:</span>
                                      <span>{topAccounts[selectedTopAccount].badge}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground dark:text-gray-400">Gamepass:</span>
                                      <span>{topAccounts[selectedTopAccount].gamepass}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground dark:text-gray-400 py-2">
                                Топ аккаунты появятся в процессе проверки
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Refresher mode statistics
                        <div className="space-y-4 h-full">
                          <div>
                            <h4 className="font-medium mb-2">Статистика</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Loaded:</span>
                                <span>{refresherStats.loaded}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Refreshed:</span>
                                <span className="text-green-500 dark:text-green-400">{refresherStats.refreshed}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Error:</span>
                                <span className="text-red-500 dark:text-red-400">{refresherStats.error}</span>
                              </div>
                            </div>
                          </div>

                          {/* Add placeholder content to fill empty space */}
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Информация</h4>
                            <div className="text-sm text-muted-foreground dark:text-gray-400">
                              <p>Режим обновления: {settings.refresher.mode === "main" ? "Основной" : "Быстрый"}</p>
                              <p>Потоков: {settings.refresher.threads}</p>
                              <p>Формат файла: .txt (1 строка = 1 куки)</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="results" className="mt-4">
                    <div className="h-[400px] w-full rounded-md border dark:border-[rgb(45,45,48)] dark:bg-[rgb(32,32,35)]">
                      <div className="p-2 flex justify-between items-center border-b dark:border-[rgb(45,45,48)]">
                        <div className="flex items-center">
                          <h4 className="font-medium">Результаты ({results.length})</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          {mode === "checker" && (
                            <div className="relative">
                              <select
                                value={resultsSortBy}
                                onChange={(e) => sortResults(e.target.value as keyof Account)}
                                className="appearance-none bg-gray-100 dark:bg-[rgb(40,40,45)] rounded-md px-3 py-1 pr-8 text-sm font-medium cursor-pointer border border-gray-200 dark:border-[rgb(45,45,48)]"
                              >
                                <option value="rap">RAP</option>
                                <option value="balance">Balance</option>
                                <option value="donate">Donate</option>
                                <option value="pending">Pending</option>
                                <option value="billing">Billing</option>
                                <option value="premium">Premium</option>
                                <option value="card">Card</option>
                                <option value="badge">Badge</option>
                                <option value="gamepass">Gamepass</option>
                              </select>
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </div>
                            </div>
                          )}
                          <Button
                            size="sm"
                            onClick={downloadResults}
                            disabled={results.length === 0}
                            className="dark:bg-[rgb(40,40,45)] dark:hover:bg-[rgb(50,50,55)] dark:text-white"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Скачать
                          </Button>
                        </div>
                      </div>

                      <ScrollArea className="h-[350px]">
                        {results.length > 0 ? (
                          <div className="space-y-2 p-2">
                            {mode === "checker"
                              ? // Checker mode results
                                results.map((account, index) => (
                                  <div key={index} className="p-2 border rounded dark:border-[rgb(45,45,48)] text-sm">
                                    <div className="flex justify-between items-center mb-1">
                                      <div className="font-medium">Username: {account.username}</div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-xs dark:bg-[rgb(40,40,45)] dark:hover:bg-[rgb(50,50,55)] dark:text-white dark:border-[rgb(45,45,48)]"
                                        onClick={() => {
                                          navigator.clipboard.writeText(account.cookie)
                                          addLogFunc(`Куки скопированы: ${account.username}`)
                                        }}
                                      >
                                        Copy Cookie
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground dark:text-gray-400">Balance:</span>
                                        <span>{account.balance}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground dark:text-gray-400">Donate:</span>
                                        <span>{account.donate}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground dark:text-gray-400">RAP:</span>
                                        <span>{account.rap}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground dark:text-gray-400">Billing:</span>
                                        <span>{account.billing.toFixed(1)} USD</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground dark:text-gray-400">Premium:</span>
                                        <span>{account.premium ? "Yes" : "No"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground dark:text-gray-400">Mail:</span>
                                        <span>{Math.random() > 0.5 ? "Yes" : "No"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground dark:text-gray-400">Card:</span>
                                        <span>{account.card ? "Yes" : "No"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground dark:text-gray-400">Pending:</span>
                                        <span>{account.pending}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground dark:text-gray-400">Badges:</span>
                                        <span>{account.badge}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground dark:text-gray-400">Gamepasses:</span>
                                        <span>{account.gamepass}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              : // Refresher mode results - just cookies
                                results.map((account, index) => (
                                  <div key={index} className="p-2 border rounded dark:border-[rgb(45,45,48)] text-sm">
                                    <div className="flex justify-between items-center">
                                      <div className="font-medium truncate mr-2 flex-1">{account.cookie}</div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-xs dark:bg-[rgb(40,40,45)] dark:hover:bg-[rgb(50,50,55)] dark:text-white dark:border-[rgb(45,45,48)]"
                                        onClick={() => {
                                          navigator.clipboard.writeText(account.cookie)
                                          addLogFunc(`Куки скопированы`)
                                        }}
                                      >
                                        Copy
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground dark:text-gray-400">
                            Результаты будут отображаться здесь
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent></CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
