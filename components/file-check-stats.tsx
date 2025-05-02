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

interface FileCheckStatisticsProps {
  currentUser: User | null
  onLogout: () => void
}

export default function FileCheckStatistics({ currentUser, onLogout }: FileCheckStatisticsProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
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

  // Add a log entry with current timestamp
  const addLog = (text: string) => {
    setLogs((prev) => [...prev, { text, timestamp: new Date() }])
  }

  const handleFileSelection = (selectedFile: File) => {
    setFile(selectedFile)

    // Reset statistics when a new file is loaded
    if (mode === "checker") {
      setCheckerStats({
        ...checkerStats,
        loaded: Math.floor(selectedFile.size / 100), // Simulate number of lines based on file size
      })
    } else {
      setRefresherStats({
        ...refresherStats,
        loaded: Math.floor(selectedFile.size / 100), // Simulate number of lines based on file size
      })
    }

    setLogs([
      {
        text: `Файл загружен: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`,
        timestamp: new Date(),
      },
    ])
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
          setElapsedTime(formatElapsedTime(startTime))
        }, 1000)
      }

      // Resume progress simulation
      simulateProgress()

      addLog(`Проверка возобновлена`)
      return
    }

    setIsChecking(true)
    setProgress(0)
    setTopAccounts([])

    // Set start time and start timer
    const now = new Date()
    setStartTime(now)
    setElapsedTime("00:00")

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setElapsedTime(formatElapsedTime(now))
    }, 1000)

    // Reset statistics for the current mode
    if (mode === "checker") {
      setCheckerStats({
        ...checkerStats,
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
        ...refresherStats,
        refreshed: 0,
        error: 0,
      })
    }

    addLog(`Начало ${mode === "checker" ? "проверки" : "обновления"} файла: ${file.name}`)
    addLog(`Используется ${mode === "checker" ? settings.checker.threads : settings.refresher.threads} потоков`)

    if (mode === "refresher") {
      addLog(`Режим обновления: ${settings.refresher.mode === "main" ? "Основной" : "Быстрый"}`)
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
          // Generate random increments for checker stats
          const validIncrement = Math.floor(Math.random() * 3)
          const invalidIncrement = Math.floor(Math.random() * 2)
          const errorIncrement = Math.random() > 0.8 ? 1 : 0

          setCheckerStats((prevStats) => ({
            ...prevStats,
            valid: prevStats.valid + validIncrement,
            invalid: prevStats.invalid + invalidIncrement,
            errors: prevStats.errors + errorIncrement,
            donate: prevStats.donate + (Math.random() > 0.9 ? 1 : 0),
            balance: prevStats.balance + (Math.random() > 0.7 ? Math.floor(Math.random() * 100) : 0),
            pending: prevStats.pending + (Math.random() > 0.8 ? Math.floor(Math.random() * 10) : 0),
            rap: prevStats.rap + (Math.random() > 0.7 ? Math.floor(Math.random() * 1000) : 0),
            billing: prevStats.billing + (Math.random() > 0.9 ? 1 : 0),
            premium: prevStats.premium + (Math.random() > 0.95 ? 1 : 0),
            card: prevStats.card + (Math.random() > 0.9 ? 1 : 0),
            badge: prevStats.badge + (Math.random() > 0.85 ? 1 : 0),
            gamepass: prevStats.gamepass + (Math.random() > 0.85 ? 1 : 0),
          }))

          // Occasionally generate a new account for the top list
          if (Math.random() > 0.8) {
            updateTopAccounts(generateRandomAccount())
          }

          // Add detailed logs for checker mode
          if (validIncrement > 0) {
            addLog(`Найден валидный аккаунт: ${validIncrement}`)
          }
          if (invalidIncrement > 0) {
            addLog(`Найден невалидный аккаунт: ${invalidIncrement}`)
          }
          if (errorIncrement > 0) {
            addLog(`Ошибка проверки: ${errorIncrement}`)
          }
        } else {
          // Generate random increments for refresher stats
          const refreshedIncrement = Math.floor(Math.random() * 3)
          const errorIncrement = Math.random() > 0.8 ? 1 : 0

          setRefresherStats((prevStats) => ({
            ...prevStats,
            refreshed: prevStats.refreshed + refreshedIncrement,
            error: prevStats.error + errorIncrement,
          }))

          // Add detailed logs for refresher mode
          if (refreshedIncrement > 0) {
            addLog(`Обновлено аккаунтов: ${refreshedIncrement}`)
          }
          if (errorIncrement > 0) {
            addLog(`Ошибка обновления: ${errorIncrement}`)
          }
        }

        // Check if process is complete
        if (newProgress >= 100) {
          clearInterval(intervalRef.current!)
          clearInterval(timerRef.current!)
          setIsChecking(false)
          setIsPaused(false)
          addLog(mode === "checker" ? "Проверка завершена" : "Обновление завершено")

          // If Telegram settings are configured, log notification
          if (settings.telegram.token && settings.telegram.chatId) {
            if (
              (mode === "checker" && settings.telegram.notifyChecker) ||
              (mode === "refresher" && settings.telegram.notifyRefresher)
            ) {
              addLog(`Уведомление отправлено в Telegram (${settings.telegram.chatId})`)
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
    addLog(mode === "checker" ? "Проверка приостановлена" : "Обновление приостановлено")
  }

  const clearLogs = () => {
    setLogs([])
    setProgress(0)
    setFile(null)
    setElapsedTime("00:00")
    setTopAccounts([])
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
                          addLog(`Тестовое уведомление отправлено в Telegram (${settings.telegram.chatId})`)
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
                <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
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
                  <TabsList className="grid w-full grid-cols-2 dark:bg-[rgb(40,40,45)]">
                    <TabsTrigger value="logs" className="dark:data-[state=active]:bg-[rgb(32,32,35)]">
                      <FileText className="mr-2 h-4 w-4" />
                      Логи
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="dark:data-[state=active]:bg-[rgb(32,32,35)]">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Статистика
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
                                {log.timestamp.toLocaleTimeString()}:{" "}
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
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Статистика</h4>
                            <div className="space-y-1 text-sm">
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
                        </div>
                      )}
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
