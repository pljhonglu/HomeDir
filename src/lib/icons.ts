import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

// 从字符串名称获取 lucide 图标组件
export function getIcon(name: string): LucideIcon {
  const icon = (LucideIcons as unknown as Record<string, LucideIcon>)[name];
  return icon || LucideIcons.Globe;
}

/** 获取图标的显示 URL */
export function getIconUrl(iconUrl: string): string {
  if (!iconUrl) return "";
  return `/api/icons/${iconUrl}`;
}

// 常用图标列表，用于后台选择
export const commonIcons = [
  "Globe", "HardDrive", "Server", "Database", "Monitor", "Cpu", "MemoryStick",
  "Wifi", "WifiOff", "Router", "Broadcast", "Signal", "Antenna",
  "Lock", "Unlock", "Key", "Shield", "ShieldCheck", "ShieldAlert", "Eye", "EyeOff",
  "Cloud", "CloudSun", "CloudRain", "CloudSnow", "CloudLightning", "CloudDrizzle",
  "Sun", "Moon", "Star", "Sunset", "Sunrise", "Sparkles",
  "Mail", "Inbox", "MessageSquare", "MessageCircle", "Bell", "BellRing", "BellOff",
  "Phone", "PhoneCall", "PhoneIncoming", "PhoneOutgoing", "PhoneOff",
  "Video", "VideoOff", "Camera", "CameraOff", "Image", "Images", "Film", "Clapperboard",
  "Music", "Music2", "Music3", "Music4", "Headphones", "Speaker", "Volume2", "VolumeX",
  "Mic", "MicOff", "Radio", "Podcast",
  "Folder", "FolderOpen", "FolderClosed", "Archive", "Package", "Box", "Container",
  "Download", "Upload", "DownloadCloud", "UploadCloud", "Share", "Share2", "Link", "Link2",
  "FileText", "File", "FileCode", "FileJson", "FileXml", "FileYaml", "FileImage", "FileVideo",
  "FileAudio", "FileArchive", "FileCheck", "FileWarning", "FileX", "Files",
  "Terminal", "Console", "Code", "Code2", "GitBranch", "GitCommit", "GitMerge", "GitPullRequest", "GitCompare",
  "Bug", "Bot", "Brain", "CircuitBoard", "Component", "Blocks", "BoxSelect", "Puzzle",
  "Layers", "Layout", "LayoutGrid", "LayoutDashboard", "LayoutList", "LayoutTemplate",
  "Gauge", "Activity", "BarChart", "BarChart2", "BarChart3", "PieChart", "LineChart", "ChartLine", "ChartArea", "ChartPie", "ChartBar",
  "Zap", "Flashlight", "Lightbulb", "Lamp", "CandlestickChart",
  "Settings", "Sliders", "SlidersHorizontal", "Wrench", "Screwdriver", "Hammer", "Tool", "Tools",
  "Home", "Building", "Building2", "Factory", "Warehouse", "Store", "Shop", "ShoppingCart", "ShoppingBag",
  "MapPin", "Map", "Globe", "Globe2", "Earth", "Compass", "Navigation", "Paperclip", "landmark",
  "Bookmark", "BookmarkCheck", "BookmarkPlus", "Tag", "Tags", "Ticket", "TicketCheck", "TicketPlus",
  "CreditCard", "Wallet", "DollarSign", "Euro", "PoundSterling", "Yen", "Bitcoin", "Coins", "Receipt",
  "Printer", "Scanner", "Projector", "Display", "ScreenShare", "Airplay", "Tv", "Tv2",
  "Smartphone", "Tablet", "Laptop", "Watch", "Keyboard", "Mouse", "Gamepad", "Joystick",
  "Car", "Truck", "Bus", "Train", "Plane", "Ship", "Rocket", "Rocket", "Helicopter", "Bike", "Scooter",
  "Umbrella", "Wrench", "Crown", "Gem", "Diamond", "Award", "Medal", "Trophy", "Target",
  "Clock", "Timer", "AlarmClock", "Hourglass", "Watch", "Calendar", "CalendarCheck", "CalendarClock", "DateRange",
  "User", "Users", "UserPlus", "UserCheck", "UserX", "UserCog", "Contact", "IdCard", "BadgeCheck",
  "Heart", "HeartPulse", "Pulse", "Thermometer", "Droplet", "Wind", "Flame", "Mountain", "TreePine", "Leaf",
  "Coffee", "Beer", "Pizza", "Apple", "Cherry", "Grape", "Lemon", "Pepper", "Salt", "Utensils", "ChefHat",
  "Dog", "Cat", "Bird", "Fish", "Bug", "Butterfly", "Snake", "Turtle",
  "Book", "BookOpen", "BookMarked", "Newspaper", "Library", "GraduationCap", "School",
  "Calculator", "Clipboard", "ClipboardCheck", "ClipboardList", "ClipboardText", "StickyNote", "Note", "Notebook",
  "Flag", "FlagTriangle", "FlagOff", "Crosshair", "MousePointer", "Cursor", "Pointer",
  "Aperture", "Focus", "ZoomIn", "ZoomOut", "Maximize", "Minimize", "Expand", "Shrink", "Move",
  "Palette", "Paintbrush", "Brush", "Pencil", "Pen", "Highlighter", "Eraser", "Ruler", "Scissors", "Copy",
  "Trash", "Trash2", "TrashUndo", "Recycle", "Bin", "ArchiveRestore",
  "Save", "HardDrive", "Database", "DatabaseBackup", "Server", "ServerCrash", "Cluster",
  "Network", "Share2", "ShareNetwork", "Cast", "Wireless", "Bluetooth", "BluetoothConnected",
  "Power", "Plug", "PlugZap", "Battery", "BatteryCharging", "BatteryFull", "BatteryLow",
  "Search", "Find", "Filter", "FilterAlt", "SortAsc", "SortDesc", "ArrowUpDown", "Shuffle",
  "Plus", "Minus", "Check", "X", "CheckCircle", "XCircle", "AlertCircle", "AlertTriangle", "AlertOctagon", "Info", "HelpCircle",
  "ChevronUp", "ChevronDown", "ChevronLeft", "ChevronRight", "ChevronsUp", "ChevronsDown", "ChevronsLeft", "ChevronsRight",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUpCircle", "ArrowDownCircle", "ArrowUpRight", "ArrowDownLeft",
  "RotateCcw", "RotateCw", "Repeat", "Repeat2", "RefreshCcw", "RefreshCw", "History", "Undo", "Redo",
  "ExternalLink", "OpenInNew", "Link", "Link2", "Link2Off", "Unlink",
  "ToggleLeft", "ToggleRight", "ToggleRight", "SwitchCamera", "SwitchCamera2",
  "Play", "Pause", "Stop", "SkipBack", "SkipForward", "FastForward", "Rewind", "Volume1", "Volume2", "VolumeX",
  "Square", "Circle", "Triangle", "Hexagon", "Octagon", "Pentagon", "Diamond", "Cross",
  "CheckSquare", "SquareStack", "Layers1", "Layers2", "Layer", "Sprout", "TreeDeciduous", "TreePine",
  "MountainSnow", "Mountain", "Volcano", "Waves", "Droplets", "Drop", "Tint", "Snowflake",
  "Zap", "Flashlight", "Bolt", "Lightning", "SunMedium", "MoonStar",
  "GraduationCap", "BookOpen", "Bible", "Scroll", "GraduationCap", "School",
  "BrainCircuit", "Brain", "Atom", "FlaskConical", "FlaskRound", "Microscope", "TestTube",
  "Cross", "Crosshair", "Dice1", "Dice2", "Dice3", "Dice4", "Dice5", "Dice6",
  "Smile", "Frown", "Meh", "Laugh", "Party", "Confetti", "Puzzle", "Gamepad2",
  "Building", "Church", "Hospital", "Bank", "Hotel", "Warehouse", "Factory", "Tent", "Home",
  "Fence", "DoorOpen", "DoorClosed", "Entrance", "Exit", "Bath", "Bed", "BedDouble",
  "CupSoda", "GlassWater", "Wine", "Whiskey", "Coffee", "Beer", "IceCream", "Cake",
] as const;
