
import { createI18n } from 'vue-i18n'

export type AppLocale = 'en' | 'fil'

const getInitialLocale = (): AppLocale => {
  try {
    return localStorage.getItem('trabaholokal-language') === 'fil'
      ? 'fil'
      : 'en'
  } catch {
    return 'en'
  }
}

const messages = {
  en: {
    language: {
      label: 'Language',
      english: 'English',
      filipino: 'Filipino',
    },

    common: {
      home: 'Home',
      jobs: 'Jobs',
      account: 'Account',
      applications: 'Applications',
      myWork: 'My Work',
      save: 'Save',
      cancel: 'Cancel',
      search: 'Search',
      dashboard: 'Dashboard',
      myJobs: 'My Jobs',
      applicants: 'Applicants',
      workforce: 'Workforce',
      overview: 'Overview',
      reports: 'Reports',
      users: 'Users',
      loading: 'Loading...',
    },

    guestJobs: {
        title: 'Jobs',
        subtitle: 'Skills. Opportunities. Local Progress.',
        searchPlaceholder: 'Search jobs, skills, employers...',
        noJobs: 'No jobs found',
        adjustSearch: 'Try adjusting your search or filters.',
        filters: 'Filters',
        category: 'Category',
        allCategories: 'All categories',
        municipality: 'Municipality',
        allMunicipalities: 'All municipalities',
        showJobs: 'Show jobs',
        loadFailed: 'Failed to load jobs.',
      },

      jobCard: {
        jobTitle: 'Job title',
        employer: 'Employer',
        category: 'Category',
        compensation: 'Compensation',
        location: 'Location',
        employmentType: 'Employment type',
        requiredSkills: 'Required skills',
        safetyNotice: 'Safety notice. Please review this job before applying.',
        preferredCategory: 'Preferred category',
        moreSkills: 'more skills',
      },

    admin: {
      notifications: 'Notifications',
      unreadCount: '{count} unread',
      allCaughtUp: 'All caught up',
      tapNotification: 'Tap a notification to mark it read.',
      markAllRead: 'Mark all read',
      noNotifications: 'No notifications',
      notificationDescription: 'Updates about reports and moderation will appear here.',
      new: 'New',
      markedAsRead: 'Marked as read.',
      couldNotMarkRead: 'Could not mark as read.',
      allMarkedRead: 'All caught up — marked everything as read.',
      couldNotMarkAllRead: 'Could not mark all as read.',
    },
  },

  fil: {
    language: {
      label: 'Wika',
      english: 'Ingles',
      filipino: 'Filipino',
    },

    common: {
      home: 'Tahanan',
      jobs: 'Mga Trabaho',
      account: 'Account',
      applications: 'Mga Aplikasyon',
      myWork: 'Aking Trabaho',
      save: 'I-save',
      cancel: 'Kanselahin',
      search: 'Maghanap',
      dashboard: 'Dashboard',
      myJobs: 'Aking mga Trabaho',
      applicants: 'Mga Aplikante',
      workforce: 'Mga Manggagawa',
      overview: 'Pangkalahatang-ideya',
      reports: 'Mga Ulat',
      users: 'Mga User',
      loading: 'Naglo-load...',
    },

    guestJobs: {
        title: 'Mga Trabaho',
        subtitle: 'Mga Kasanayan. Mga Oportunidad. Lokal na Pag-unlad.',
        searchPlaceholder: 'Maghanap ng trabaho, kasanayan, o employer...',
        noJobs: 'Walang nahanap na trabaho',
        adjustSearch: 'Subukang baguhin ang iyong paghahanap o mga filter.',
        filters: 'Mga Filter',
        category: 'Kategorya',
        allCategories: 'Lahat ng kategorya',
        municipality: 'Munisipalidad',
        allMunicipalities: 'Lahat ng munisipalidad',
        showJobs: 'Ipakita ang mga Trabaho',
        loadFailed: 'Hindi ma-load ang mga trabaho.',
      },

      jobCard: {

        jobTitle: 'Pamagat ng trabaho',
        employer: 'Employer',
        category: 'Kategorya',
        compensation: 'Sahod',
        location: 'Lokasyon',
        employmentType: 'Uri ng trabaho',
        requiredSkills: 'Mga kinakailangang kasanayan',
        safetyNotice: 'Paalala sa kaligtasan. Suriin muna ang trabahong ito bago mag-apply.',
        preferredCategory: 'Piniling kategorya',
        moreSkills: 'pang kasanayan',
      },

    admin: {
      notifications: 'Mga Abiso',
      unreadCount: '{count} hindi pa nababasa',
      allCaughtUp: 'Wala nang bagong abiso',
      tapNotification: 'Pindutin ang abiso upang markahan ito bilang nabasa na.',
      markAllRead: 'Markahan lahat bilang nabasa na',
      noNotifications: 'Walang mga abiso',
      notificationDescription: 'Lalabas dito ang mga update tungkol sa mga ulat at moderasyon.',
      new: 'Bago',
      markedAsRead: 'Namarkahan na bilang nabasa.',
      couldNotMarkRead: 'Hindi namarkahan bilang nabasa.',
      allMarkedRead: 'Lahat ng abiso ay namarkahan na bilang nabasa.',
      couldNotMarkAllRead: 'Hindi namarkahan ang lahat bilang nabasa.',
    },
  },
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages,
})
