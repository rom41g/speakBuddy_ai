import type { UnitContent } from './types'

export const book3 = [
  {
    title: 'At school',
    theme: {
      en: 'School subjects and activities',
      ru: 'Школьные предметы и занятия',
    },
    page: 9,
    vocabulary: [
      'science',
      'English',
      'computer studies',
      'music',
      'break time',
      'maths',
      'social studies',
      'PE',
      'art',
      'homework',
    ],
    cards: [
      {
        word: 'science',
        icon: '🔬',
        clue: 'In this lesson you can learn about plants and do experiments.',
      },
      {
        word: 'art',
        icon: '🎨',
        clue: 'In this lesson you can draw and paint.',
      },
    ],
    conversation: {
      question: 'Which subject would you put first on your ideal timetable?',
      followUp: 'What do pupils do in that lesson?',
      challenge: 'What subject is easy for you and why?',
    },
    role: {
      question: 'I am a new pupil. What subject have we got after break time?',
      followUp: 'What do we need for that lesson?',
    },
    example: {
      text: 'We do experiments in science.',
      ru: 'На уроках естествознания мы ставим опыты.',
      ipa: '/s/',
    },
  },
  {
    title: 'At home together',
    theme: {
      en: 'Chores and free time',
      ru: 'Домашние дела и свободное время',
    },
    page: 23,
    vocabulary: [
      'make the bed',
      'read a comic',
      'wash up',
      'watch a film',
      'tidy up',
      'play chess',
      'dust',
      'clean',
      'sweep the floor',
      'play computer games',
    ],
    cards: [
      {
        word: 'play chess',
        icon: '♟️',
        clue: 'You move kings and queens on a board with black and white squares.',
      },
      {
        word: 'sweep the floor',
        icon: '🧹',
        clue: 'You use a broom to clean the floor.',
      },
    ],
    conversation: {
      question: 'What do you usually do after school?',
      followUp: 'How often do you tidy up or make the bed?',
      challenge: 'Which free-time activity would you recommend?',
    },
    role: {
      question: 'We have two jobs to do at home. Which job would you choose?',
      followUp: 'What shall we do when the work is finished?',
    },
    example: {
      text: 'I play chess after I tidy up.',
      ru: 'Я играю в шахматы после того, как приберусь.',
      ipa: '/tʃ/',
    },
  },
  {
    title: 'Around town',
    theme: {
      en: 'Places around town',
      ru: 'Места в городе',
    },
    page: 35,
    vocabulary: [
      'café',
      'train station',
      'cinema',
      'bus stop',
      'shopping centre',
      'swimming pool',
      'library',
      'hospital',
      'supermarket',
      'bank',
    ],
    cards: [
      {
        word: 'library',
        icon: '📚',
        clue: 'You can borrow books at this place.',
      },
      {
        word: 'cinema',
        icon: '🎬',
        clue: 'People watch films here on a large screen.',
      },
    ],
    conversation: {
      question: 'Where were you on Saturday in an imaginary town?',
      followUp: 'What were you doing there?',
      challenge: 'Where can people buy food or borrow books?',
    },
    role: {
      question:
        'I am new in town. Which place should I visit to borrow a book?',
      followUp: 'What other place would you show me?',
    },
    example: {
      text: 'We were at the library before lunch.',
      ru: 'До обеда мы были в библиотеке.',
      ipa: '/l/',
    },
  },
  {
    title: 'Safari adventure',
    theme: {
      en: 'Food, drinks and tableware',
      ru: 'Еда, напитки и посуда',
    },
    page: 49,
    vocabulary: [
      'soup',
      'sandwich',
      'tea',
      'cheese',
      'plate',
      'biscuit',
      'pasta',
      'cup',
      'salad',
      'bottle',
    ],
    cards: [
      {
        word: 'sandwich',
        icon: '🥪',
        clue: 'It is two pieces of bread with food between them.',
      },
      {
        word: 'cup',
        icon: '☕',
        clue: 'It is a small container you drink from.',
      },
    ],
    conversation: {
      question: 'What would you pack for a picnic on safari?',
      followUp: 'How many sandwiches would you take?',
      challenge: 'Is there any salad or tea in your picnic basket?',
    },
    role: {
      question:
        'I am setting the picnic table. Can you ask me for something we need?',
      followUp: 'How many plates and cups do we need?',
    },
    example: {
      text: 'There is a sandwich on my plate.',
      ru: 'На моей тарелке лежит бутерброд.',
      ipa: '/s/',
    },
  },
  {
    title: 'My grandpa',
    theme: {
      en: 'Family and musical instruments',
      ru: 'Семья и музыкальные инструменты',
    },
    page: 61,
    vocabulary: [
      'husband',
      'flute',
      'grandson',
      'violin',
      'wife',
      'drum',
      'daughter',
      'granddaughter',
      'trumpet',
      'son',
    ],
    cards: [
      {
        word: 'violin',
        icon: '🎻',
        clue: 'This instrument has strings and you often play it with a bow.',
      },
      {
        word: 'drum',
        icon: '🥁',
        clue: 'You hit this instrument to make a beat.',
      },
    ],
    conversation: {
      question: 'Imagine a family concert. Who played the violin?',
      followUp: 'What did another person play?',
      challenge: 'Did the audience enjoy the music?',
    },
    role: {
      question:
        'We are making a programme for a family concert. Who plays first?',
      followUp: 'Which instrument will we hear next?',
    },
    example: {
      text: 'My granddaughter played the violin yesterday.',
      ru: 'Моя внучка вчера играла на скрипке.',
      ipa: '/v/',
    },
  },
  {
    title: 'Under the sea',
    theme: {
      en: 'Sea animals',
      ru: 'Морские животные',
    },
    page: 71,
    vocabulary: [
      'jellyfish',
      'octopus',
      'penguin',
      'eel',
      'whale',
      'seahorse',
      'dolphin',
      'starfish',
      'shark',
      'crab',
    ],
    cards: [
      {
        word: 'octopus',
        icon: '🐙',
        clue: 'This sea animal has eight arms.',
      },
      {
        word: 'whale',
        icon: '🐋',
        clue: 'This very large sea animal comes to the surface to breathe.',
      },
    ],
    conversation: {
      question: 'Which sea animal would you like to see?',
      followUp: 'Which is bigger, a crab or a whale?',
      challenge: 'Can you compare two more sea animals?',
    },
    role: {
      question:
        'I am your aquarium guide. Which sea animal do you want to learn about?',
      followUp: 'Is your animal bigger or smaller than a penguin?',
    },
    example: {
      text: 'The octopus is smaller than the whale.',
      ru: 'Осьминог меньше кита.',
      ipa: '/kt/',
    },
  },
  {
    title: 'Once upon a time',
    theme: {
      en: 'Story verbs in the past',
      ru: 'Глаголы в прошедшем времени',
    },
    page: 83,
    vocabulary: [
      'came',
      'went',
      'had',
      'made',
      'read',
      'said',
      'saw',
      'stood',
      'thought',
      'wore',
    ],
    cards: [
      {
        word: 'saw',
        icon: '👀',
        clue: 'It is the past form of the verb that means to look at and notice.',
      },
      {
        word: 'wore',
        icon: '🧥',
        clue: 'It is the past form of the verb for having clothes on your body.',
      },
    ],
    conversation: {
      question: 'A character went into a wood. What did the character see?',
      followUp: 'What did the character say?',
      challenge: 'What happened next in your story?',
    },
    role: {
      question:
        'I am interviewing the hero of your story. Where did you go yesterday?',
      followUp: 'Who did you see, and what did they say?',
    },
    example: {
      text: 'I saw a bright light in the forest.',
      ru: 'Я увидел яркий свет в лесу.',
      ipa: '/s/',
    },
  },
  {
    title: 'Back in time',
    theme: {
      en: 'Objects in a history museum',
      ru: 'Предметы в историческом музее',
    },
    page: 97,
    vocabulary: [
      'museum',
      'history',
      'fire',
      'tool',
      'sculpture',
      'necklace',
      'bowl',
      'knife',
      'coin',
      'musical instrument',
    ],
    cards: [
      {
        word: 'coin',
        icon: '🪙',
        clue: 'It is a small, round piece of metal used as money.',
      },
      {
        word: 'necklace',
        icon: '📿',
        clue: 'You wear this piece of jewellery around your neck.',
      },
    ],
    conversation: {
      question: 'Imagine a history museum. What was in the first room?',
      followUp: 'Were there any coins or bowls?',
      challenge: 'What object would you like to see up close?',
    },
    role: {
      question: 'I am a museum guide. Which object shall we look at first?',
      followUp: 'What do you think it was used for?',
    },
    example: {
      text: 'There was an old coin in the museum.',
      ru: 'В музее была старая монета.',
      ipa: '/ɔɪ/',
    },
  },
  {
    title: 'Sport for all',
    theme: {
      en: 'Sports clothes and equipment',
      ru: 'Спортивная одежда и снаряжение',
    },
    page: 109,
    vocabulary: [
      'swimming cap',
      'tracksuit',
      'goggles',
      'helmet',
      'towel',
      'trainers',
      'bat',
      'swimming costume',
      'glove',
      'flip-flops',
    ],
    cards: [
      {
        word: 'goggles',
        icon: '🥽',
        clue: 'You wear these over your eyes to see under water.',
      },
      {
        word: 'helmet',
        icon: '⛑️',
        clue: 'You wear it to protect your head in some sports.',
      },
    ],
    conversation: {
      question: 'What do you have to bring to a swimming lesson?',
      followUp: 'Why do some sports players wear a helmet?',
      challenge: 'What equipment do you need for another sport?',
    },
    role: {
      question:
        'I am packing a bag for swimming practice. What should I put in first?',
      followUp: 'Do we need a towel or trainers for the pool?',
    },
    example: {
      text: 'I wear goggles when I swim.',
      ru: 'Я надеваю очки, когда плаваю.',
      ipa: '/ɡ/',
    },
  },
  {
    title: 'Let’s celebrate!',
    theme: {
      en: 'Months and dates',
      ru: 'Месяцы и даты',
    },
    page: 123,
    vocabulary: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    cards: [
      {
        word: 'January',
        icon: '🎆',
        clue: 'This is the first month of the year.',
      },
      {
        word: 'October',
        icon: '🎃',
        clue: 'This month is after September and before November.',
      },
    ],
    conversation: {
      question: 'When is a festival in your pretend town?',
      followUp: 'What are people going to do there?',
      challenge: 'What date would you choose for another celebration?',
    },
    role: {
      question:
        'I am organising a school celebration. Which month shall we choose?',
      followUp: 'What are we going to do at the celebration?',
    },
    example: {
      text: 'Our school party is on the third of January.',
      ru: 'Наш школьный праздник третьего января.',
      ipa: '/dʒ/',
    },
  },
] satisfies readonly UnitContent[]
