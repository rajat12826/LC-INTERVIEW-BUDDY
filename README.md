# 🚀 LeetCode Interview Buddy

<div align="center">

![LeetCode Interview Buddy](https://img.shields.io/badge/LeetCode-Interview%20Buddy-00D9FF?style=for-the-badge&logo=leetcode&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Your AI-Powered Coding Interview Companion**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**LeetCode Interview Buddy** is a comprehensive, AI-powered platform designed to help developers master coding interviews. With an extensive library of curated problems, intelligent AI tutoring, an integrated Monaco code editor, and premium problem sets, this application transforms the way you prepare for technical interviews.

### ✨ Key Highlights

- 🧠 **AI-Powered Tutoring** - Get personalized guidance using Google's Gemini AI
- 💎 **Premium Problem Collection** - Access exclusive, detailed problem sets
- ⚡ **Real-Time Code Editor** - Monaco Editor with multi-language support
- 🎯 **Smart Filtering** - Filter by difficulty, companies, topics, and solved status
- 📊 **Progress Tracking** - Track your solved problems and improvement
- 🌙 **Dark/Light Mode** - Beautiful UI with theme switching
- 🔍 **Similar Questions** - Discover related problems dynamically
- 💳 **Subscription Management** - Dodo integration for premium features

---

## 🎯 Features

### Core Features

#### 1. **Curated Problem Library**
- **1000+** carefully selected coding challenges
- Filter by:
  - Difficulty (Easy, Medium, Hard)
  - Companies (Google, Amazon, Microsoft, etc.)
  - Topics (Arrays, Dynamic Programming, Trees, etc.)
  - Solved/Unsolved status
- Real-time search functionality
- Progress tracking with visual indicators

#### 2. **AI Coding Tutor**
Powered by Google's Gemini AI, the tutor provides:
- Problem analysis and requirements breakdown
- Algorithm design and optimization strategies
- Step-by-step guidance without spoiling solutions
- Code review with constructive feedback
- Time and space complexity analysis
- Best practices and clean code patterns

#### 3. **Premium Problem Collection**
- Exclusive premium challenges with:
  - Detailed problem descriptions
  - Step-by-step solution approaches
  - Visual illustrations and diagrams
  - Multiple examples with explanations
  - Key points and constraints
  - Company-specific insights

#### 4. **Integrated Code Editor**
- **Monaco Editor** (VS Code engine) with:
  - Syntax highlighting for 8+ languages
  - IntelliSense and auto-completion
  - Multiple themes (Dark, Light, High Contrast)
  - Keyboard shortcuts (Ctrl+Enter, Ctrl+S)
  - Auto-formatting
  - Code templates for each language
  - Responsive layout (horizontal/vertical split)

#### 5. **Similar Questions Discovery**
- AI-powered recommendation system
- Fetches related problems from LeetCode
- Lazy-loading for detailed information
- Topic tags and acceptance rates
- Direct links to solve on LeetCode

### Additional Features

- 🔐 **Authentication** - Secure user management with Clerk
- 💾 **Progress Persistence** - Zustand-based state management
- 🎨 **Beautiful UI** - Custom-designed with Tailwind CSS
- 📱 **Responsive Design** - Mobile-first approach
- ⚡ **Performance Optimized** - Virtual scrolling for large lists
- 🌐 **SEO Friendly** - Automatic sitemap generation
- 📊 **Analytics Ready** - Built-in tracking capabilities

---

## 🖥️ Demo

### Screenshots

#### Challenge Library
*Browse and filter through hundreds of curated coding problems*

#### AI Tutor Interface
*Get personalized guidance with integrated code editor*

#### Premium Problems
*Access detailed problem explanations with visual aids*

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15.3 (App Router, Server Components)
- **Language:** TypeScript 5.0
- **UI Library:** React 19.0
- **Styling:** Tailwind CSS 4.0
- **Animations:** Framer Motion, GSAP
- **Code Editor:** Monaco Editor
- **Icons:** Lucide React
- **State Management:** Zustand

### Backend & Services
- **API Routes:** Next.js API Routes
- **AI Integration:** Google Gemini AI
- **Authentication:** Clerk
- **Database:** Supabase
- **Payments:** Stripe, DodoPayments
- **Email:** Nodemailer

### Development Tools
- **Build Tool:** Turbopack
- **Linting:** ESLint
- **Type Checking:** TypeScript
- **Package Manager:** npm/yarn/pnpm
- **Sitemap:** next-sitemap
- **Bundle Analysis:** @next/bundle-analyzer

---

## 📦 Installation

### Prerequisites

- Node.js 20.x or higher
- npm/yarn/pnpm package manager
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/rajat12826/lc-interview-buddy.git
cd lc-interview-buddy
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Step 3: Environment Setup

Create a `.env.local` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# DodoPayments
NEXT_PUBLIC_DODO_BUSINESS_ID=your_dodo_business_id
DODO_API_KEY=your_dodo_api_key

# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Usage

### For Users

#### 1. **Browse Challenges**
Navigate to `/challenges` to explore the problem library. Use filters to find problems by difficulty, company, or topic.

#### 2. **Start Solving**
Click on any problem to:
- View problem details
- Access the AI tutor
- Write and test code in the Monaco editor
- Get hints and guidance

#### 3. **Premium Access**
Subscribe to unlock:
- Premium problem collection (`/challenges/premium`)
- Advanced AI features
- Detailed solution explanations

#### 4. **Track Progress**
Monitor your progress through:
- Solved problem indicators
- Personal statistics dashboard
- Difficulty-based completion rates

### For Developers

#### Project Structure

```
lc-interview-buddy/
├── app/                          # Next.js app directory
│   ├── _components/              # Shared components
│   │   ├── challenges/           # Challenge-related components
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── PremiumQuestionCard.tsx
│   │   │   ├── ChallengeFilter.tsx
│   │   │   └── SimilarQuestionsModal.tsx
│   │   └── DotGrid.tsx
│   ├── api/                      # API routes
│   │   └── problem/[slug]/       # Dynamic problem fetching
│   ├── challenges/               # Challenge pages
│   │   ├── page.tsx              # Main challenges page
│   │   └── premium/              # Premium challenges
│   ├── ai-tutor/                 # AI tutor interface
│   └── layout.tsx                # Root layout
├── components/                   # UI components
│   └── ui/                       # Reusable UI elements
├── utils/                        # Utility functions
│   ├── stores/                   # Zustand stores
│   │   ├── useQuestionStore.ts
│   │   ├── useChallengeFilterStore.ts
│   │   └── useChallegeStoreP.ts
│   ├── GeminiAIModel.ts          # AI integration
│   └── types.ts                  # TypeScript definitions
├── public/                       # Static assets
├── styles/                       # Global styles
└── next.config.js                # Next.js configuration
```

#### Key Files

- **`useQuestionStore.ts`** - Manages question data and solved status
- **`GeminiAIModel.ts`** - Configures Google Gemini AI
- **`QuestionCard.tsx`** - Displays individual challenge cards
- **`SimilarQuestionsModal.tsx`** - Shows related problems
- **AI Tutor Pages** - Provides interactive coding assistance

---

## 🎨 Customization

### Theming

The application uses Tailwind CSS with custom theme configuration. Modify colors in `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      // Add custom colors
    }
  }
}
```

### AI Configuration

Customize AI behavior in `utils/GeminiAIModel.ts`:

```typescript
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
}
```

---

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build
```

---

## 📈 Performance

- **Virtual Scrolling** - Efficiently renders large lists (1000+ items)
- **Code Splitting** - Dynamic imports for Monaco Editor
- **Image Optimization** - Next.js Image component
- **Caching** - Optimized API responses
- **Bundle Analysis** - Run `ANALYZE=true npm run build`

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow TypeScript best practices
- Maintain consistent code style
- Add comments for complex logic
- Update documentation as needed
- Test thoroughly before submitting

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **LeetCode** - For the extensive problem library
- **Google Gemini** - AI-powered tutoring capabilities
- **Monaco Editor** - Professional code editing experience
- **Clerk** - Seamless authentication
- **Vercel** - Deployment platform
- **Open Source Community** - For amazing tools and libraries

---

## 📞 Support

- 📧 **Email:** lcinterviewbuddy@gmail.com
- 🐛 **Issues:** [GitHub Issues](https://github.com/rajat12826/lc-interview-buddy/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/rajat12826/lc-interview-buddy/discussions)

---

## 🗺️ Roadmap

### Upcoming Features

- [ ] **Video Solutions** - Integrated video explanations
- [ ] **Mock Interviews** - Timed coding sessions
- [ ] **Collaborative Coding** - Real-time pair programming
- [ ] **Code Playback** - Review your coding sessions
- [ ] **Mobile App** - Native iOS/Android applications
- [ ] **Community Forums** - Discussion boards
- [ ] **Leaderboards** - Competitive rankings
- [ ] **Custom Problem Sets** - Create your own challenges

---

## 💻 Development

### Scripts

```bash
# Development
npm run dev              # Start dev server with Turbopack

# Production
npm run build            # Build for production
npm run start            # Start production server

# Utilities
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
npm run analyze          # Bundle analysis
npm run postbuild        # Generate sitemap
```

### Environment Variables

See [Installation](#-installation) for required environment variables.

---

<div align="center">

**Made with ❤️ by developers, for developers**


[⬆ Back to Top](#-leetcode-interview-buddy)

</div>