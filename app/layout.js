import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Footer from "./dashboard/_components/Footer";
import Header from "./dashboard/_components/Header";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
  fallback: ['system-ui', 'arial', 'sans-serif']
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  fallback: ['Courier New', 'monospace']
});

export const metadata = {
  metadataBase: new URL('https://www.intivolutionai.com'),
  title: {
    default: 'Intivolution AI - AI-Powered Interview Preparation',
    template: '%s | Intivolution AI'
  },
  description: 'Elevate your interview skills with AI-powered mock interviews. Get personalized coaching, real-time feedback, and boost your confidence.',
  keywords: [
    'AI interview preparation', 
    'mock interviews', 
    'interview coaching', 
    'career development', 
    'job interview help'
  ],
  authors: [{ name: 'Intivolution AI Team' }],
  creator: 'Intivolution AI',
  publisher: 'Intivolution AI',
  
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.intivolutionai.com/',
    title: 'Intivolution AI - AI-Powered Interview Preparation',
    description: 'Elevate your interview skills with AI-powered mock interviews. Get personalized coaching, real-time feedback, and boost your confidence.',
    siteName: 'Intivolution AI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Intivolution AI - Revolutionizing Interview Preparation'
      }
    ]
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Intivolution AI - AI-Powered Interview Preparation',
    description: 'Elevate your interview skills with AI-powered mock interviews. Get personalized coaching, real-time feedback, and boost your confidence.',
    creator: '@IntivolutionAI',
    images: ['/twitter-image.png']
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  
  verification: {
    google: 'your-google-site-verification-code',
    // Add other verification codes as needed
  }
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html 
        lang="en" 
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        <body 
          className={`
            antialiased 
            min-h-screen 
            flex 
            flex-col 
            bg-white 
            text-gray-900 
            font-sans
            overflow-x-hidden
          `}
        >
          <a 
            href="#main-content" 
            className="
              absolute 
              top-[-999px] 
              left-[-999px] 
              z-[-1] 
              focus:top-0 
              focus:left-0 
              focus:z-50 
              p-4 
              bg-indigo-600 
              text-white
            "
          >
            Skip to main content
          </a>
          
          <Header />
          <Toaster />
          
          <main 
            id="main-content" 
            className="
              flex-grow 
              pt-16 
              sm:pt-20 
              w-full 
              px-2.5 
              sm:px-4 
              lg:px-5
            "
          >
            {children}
          </main>
          
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
