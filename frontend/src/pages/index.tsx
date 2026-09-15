import React, { useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/home.module.css';

type Language = 'ta' | 'en' | 'hi' | 'ur' | 'te' | 'ml';

interface LanguageConfig {
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Record<Language, LanguageConfig> = {
  ta: { name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  ur: { name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    title: 'Muslim Welfare AI System',
    subtitle: 'Empowering Communities with Intelligent Household Surveys',
    survey: 'Start Survey',
    analytics: 'View Analytics',
    agents: 'Test Agents',
    householdId: 'Household ID',
    enumeratorId: 'Enumerator ID',
    language: 'Survey Language',
    features: 'Key Features',
    feature1: '6 languages support',
    feature2: 'Voice input & output',
    feature3: 'Works offline',
    feature4: 'AI-powered analysis',
    feature5: 'Real-time validation',
    feature6: 'Instant reports',
  },
  ta: {
    title: 'முஸ்லிம் நல்வாழ்க்கை AI அமைப்பு',
    subtitle: 'தகவல் அறிவு கொண்ட குடும்ப ஆய்வுகள் மூலம் சமூகங்களை வலுப்படுத்துதல்',
    survey: 'கணக்கெடுப்பைத் தொடங்கவும்',
    analytics: 'பகுப்பாய்வுகளைக் காணுங்கள்',
    agents: 'ஏஜென்ட்களைச் சோதிக்கவும்',
    householdId: 'குடும்ப ID',
    enumeratorId: 'கணக்கெடுப்பாளர் ID',
    language: 'கணக்கெடுப்பு மொழி',
    features: 'முக்கிய அம்சங்கள்',
    feature1: '6 மொழি ஆதரவு',
    feature2: 'குரல் உள்ளீடு & வெளியீடு',
    feature3: 'ஆஃப்லைனில் செயல்படுகிறது',
    feature4: 'AI-இயக்கப்படும் பகுப்பாய்வு',
    feature5: 'நிரந்தர சரிபார்ப்பு',
    feature6: 'உடனடி அறிக்கைகள்',
  },
  hi: {
    title: 'मुस्लिम कल्याण AI प्रणाली',
    subtitle: 'बुद्धिमान घरेलू सर्वेक्षणों के साथ समुदायों को सशक्त बनाना',
    survey: 'सर्वेक्षण शुरू करें',
    analytics: 'विश्लेषण देखें',
    agents: 'एजेंट्स परीक्षण करें',
    householdId: 'घर का आईडी',
    enumeratorId: 'गणक आईडी',
    language: 'सर्वेक्षण भाषा',
    features: 'मुख्य विशेषताएं',
    feature1: '6 भाषा समर्थन',
    feature2: 'वॉइस इनपुट और आउटपुट',
    feature3: 'ऑफ़लाइन काम करता है',
    feature4: 'AI-संचालित विश्लेषण',
    feature5: 'वास्तविक समय सत्यापन',
    feature6: 'तत्काल रिपोर्ट',
  },
  ur: {
    title: 'مسلم فلاح ایئی سسٹم',
    subtitle: 'ذہین گھریلو سروے کے ذریعے کمیونٹیز کو طاقتور بنانا',
    survey: 'سروے شروع کریں',
    analytics: 'تجزیات دیکھیں',
    agents: 'ایجنٹس ٹیسٹ کریں',
    householdId: 'گھر کی شناخت',
    enumeratorId: 'شماریاتی ID',
    language: 'سروے کی زبان',
    features: 'اہم خصوصیات',
    feature1: '6 زبانوں کی سپورٹ',
    feature2: 'آواز ان پٹ اور آؤٹ پٹ',
    feature3: 'آف لائن کام کرتا ہے',
    feature4: 'AI کی طاقت سے چلنے والا تجزیہ',
    feature5: 'حقیقی وقت کی تصدیق',
    feature6: 'فوری رپورٹس',
  },
  te: {
    title: 'ముస్లిం సంక్షేమ AI వ్యవస్థ',
    subtitle: 'తెలివైన గృహ సర్వేల ద్వారా సమాజాలను శక్తివంతం చేయడం',
    survey: 'సర్వే ప్రారంభించండి',
    analytics: 'విశ్లేషణలను చూడండి',
    agents: 'ఏజెంట్‌లను పరీక్షించండి',
    householdId: 'గృహ ID',
    enumeratorId: 'లెక్కకు కట్టుబడిన ID',
    language: 'సర్వే భాష',
    features: 'ముఖ్య లక్షణాలు',
    feature1: '6 భాషల సమర్థన',
    feature2: 'వాయిస్ ఇన్‌పుట్ & అవుట్‌పుట్',
    feature3: 'ఆఫ్‌లైన్‌లో పనిచేస్తుంది',
    feature4: 'AI-ఆధారిత విశ్లేషణ',
    feature5: 'రియల్-టైమ్ ధృవీకరణ',
    feature6: 'తక్షణ నివేదికలు',
  },
  ml: {
    title: 'മുസ്ലിം ക്ഷേമ AI സിസ്റ്റം',
    subtitle: 'ബുദ്ധിമത്തയുള്ള കുടുംബ സർവെകളിലൂടെ സമൂഹങ്ങളെ ശക്തിപ്പെടുത്തുന്നു',
    survey: 'സർവെ ആരംഭിക്കുക',
    analytics: 'വിശകലനം കാണുക',
    agents: 'ഏജന്റുകൾ പരീക്ഷിക്കുക',
    householdId: 'വീട് ID',
    enumeratorId: 'എണ്ണത്തെ ID',
    language: 'സർവെ ഭാഷ',
    features: 'പ്രധാന സവിശേഷതകൾ',
    feature1: '6 ഭാഷാ പിന്തുണ',
    feature2: 'വോയിസ് ഇൻപുട് & ഔട്ട്‌പുട്ട്',
    feature3: 'ഓഫ്‌ലൈനിൽ പ്രവർത്തിക്കുന്നു',
    feature4: 'AI-ആധാരിത വിശകലനം',
    feature5: 'തത്സമയ സാധൂകരണം',
    feature6: 'തൽക്ഷണ റിപ്പോർട്ടുകൾ',
  },
};

export default function Home() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [householdId, setHouseholdId] = useState('');
  const [enumeratorId, setEnumeratorId] = useState('');

  const t = translations[selectedLanguage];

  return (
    <div className={styles.container}>
      {/* Background Effects */}
      <div className={styles.bgGradient}></div>
      <div className={styles.bgGrid}></div>

      {/* Header with Language Selector */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoText}>🕌</span>
          <span className={styles.logoName}>Kifayah</span>
        </div>
        <div className={styles.languageSelector}>
          <button
            className={styles.languageButton}
            onClick={() => setShowLanguagePicker(!showLanguagePicker)}
          >
            <span>{languages[selectedLanguage].flag}</span>
            <span>{languages[selectedLanguage].nativeName}</span>
            <span className={styles.chevron}>▼</span>
          </button>

          {showLanguagePicker && (
            <div className={styles.languageMenu}>
              {(Object.keys(languages) as Language[]).map((lang) => (
                <button
                  key={lang}
                  className={`${styles.languageOption} ${selectedLanguage === lang ? styles.active : ''}`}
                  onClick={() => {
                    setSelectedLanguage(lang);
                    setShowLanguagePicker(false);
                  }}
                >
                  <span>{languages[lang].flag}</span>
                  <span>{languages[lang].nativeName}</span>
                  <span className={styles.langName}>{languages[lang].name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>{t.title}</h1>
            <p className={styles.subtitle}>{t.subtitle}</p>

            {/* Survey Form */}
            <form className={styles.surveyForm}>
              <div className={styles.formGroup}>
                <label>{t.householdId}</label>
                <input
                  type="text"
                  placeholder="HH-TN-001"
                  value={householdId}
                  onChange={(e) => setHouseholdId(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t.enumeratorId}</label>
                <input
                  type="text"
                  placeholder="EN001"
                  value={enumeratorId}
                  onChange={(e) => setEnumeratorId(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t.language}</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as Language)}
                  className={styles.input}
                >
                  {(Object.keys(languages) as Language[]).map((lang) => (
                    <option key={lang} value={lang}>
                      {languages[lang].nativeName} ({languages[lang].name})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.buttonGroup}>
                <Link
                  href="/survey"
                  className={`${styles.button} ${styles.primary}`}
                >
                  📋 {t.survey}
                </Link>
                <Link href="/reports" className={`${styles.button} ${styles.secondary}`}>
                  📊 {t.analytics}
                </Link>
                <Link href="/agents" className={`${styles.button} ${styles.outline}`}>
                  🤖 {t.agents}
                </Link>
              </div>
            </form>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <h2 className={styles.sectionTitle}>✨ {t.features}</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🌍</div>
              <p>{t.feature1}</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎤</div>
              <p>{t.feature2}</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📱</div>
              <p>{t.feature3}</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🤖</div>
              <p>{t.feature4}</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>✅</div>
              <p>{t.feature5}</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📄</div>
              <p>{t.feature6}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Muslim Welfare AI System • Powered by Anthropic Claude</p>
      </footer>
    </div>
  );
}
