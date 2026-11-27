import type { UnitContent } from './types'

export const book1 = [
  {
    title: 'My funny friends',
    theme: {
      en: 'People and descriptions',
      ru: 'Люди и их описание',
    },
    page: 11,
    vocabulary: [
      'boy',
      'girl',
      'friend',
      'teacher',
      'big',
      'small',
      'tall',
      'funny',
    ],
    cards: [
      {
        word: 'friend',
        icon: '🧑‍🤝‍🧑',
        clue: 'You like playing with this person.',
      },
      {
        word: 'teacher',
        icon: '🧑‍🏫',
        clue: 'This person helps you learn at school.',
      },
    ],
    conversation: {
      question: 'Make up a friend. Is your friend tall or small?',
      followUp: 'Is your friend funny?',
      challenge: 'Tell me about one more person.',
    },
    role: {
      question: 'We are making a puppet show. Who is your puppet’s friend?',
      followUp: 'Is this friend tall or small?',
    },
    example: {
      text: 'My friend is funny and tall.',
      ru: 'Мой друг смешной и высокий.',
      ipa: '/fr/',
    },
  },
  {
    title: 'New for school',
    theme: {
      en: 'Classroom objects',
      ru: 'Школьные принадлежности',
    },
    page: 21,
    vocabulary: [
      'bag',
      'book',
      'glue',
      'pen',
      'pencil',
      'pencil case',
      'rubber',
      'ruler',
    ],
    cards: [
      {
        word: 'pencil',
        icon: '✏️',
        clue: 'You write or draw with it. You can rub out the lines.',
      },
      {
        word: 'ruler',
        icon: '📏',
        clue: 'You use it to draw a straight line.',
      },
    ],
    conversation: {
      question: 'What have you got in your school bag?',
      followUp: 'What colour is one thing in your bag?',
      challenge: 'What do you use to draw a straight line?',
    },
    role: {
      question:
        'I found something by the school door. What are you looking for?',
      followUp: 'Is it a pen or a pencil?',
    },
    example: {
      text: 'My pencil is next to the book.',
      ru: 'Мой карандаш рядом с книгой.',
      ipa: '/p/',
    },
  },
  {
    title: 'This is my family',
    theme: {
      en: 'Family members',
      ru: 'Члены семьи',
    },
    page: 33,
    vocabulary: [
      'grandma',
      'grandpa',
      'mum',
      'dad',
      'sister',
      'brother',
      'baby',
      'family',
    ],
    cards: [
      {
        word: 'baby',
        icon: '👶',
        clue: 'This is a very young child.',
      },
      {
        word: 'grandpa',
        icon: '👴',
        clue: 'This is your mum’s or dad’s father.',
      },
    ],
    conversation: {
      question: 'Imagine a family in a story. Who is in it?',
      followUp: 'Who is the youngest in the story?',
      challenge: 'Tell me about another person in the family.',
    },
    role: {
      question: 'I am taking a pretend family photo. Who is next to Dad?',
      followUp: 'Where is the baby in the photo?',
    },
    example: {
      text: 'The baby is next to Grandpa.',
      ru: 'Малыш рядом с дедушкой.',
      ipa: '/eɪ/',
    },
  },
  {
    title: 'Fantastic feelings',
    theme: {
      en: 'Feelings and needs',
      ru: 'Чувства и состояния',
    },
    page: 47,
    vocabulary: [
      'happy',
      'sad',
      'hot',
      'cold',
      'hungry',
      'thirsty',
      'tired',
      'angry',
    ],
    cards: [
      {
        word: 'thirsty',
        icon: '🥤',
        clue: 'You feel like this when you want a drink.',
      },
      {
        word: 'tired',
        icon: '😴',
        clue: 'You feel like this when you need to rest.',
      },
    ],
    conversation: {
      question: 'A puppet has just run a long race. How does it feel?',
      followUp: 'How do you feel when you need a drink?',
      challenge: 'When might the puppet feel happy?',
    },
    role: {
      question:
        'I am a puppet at a picnic. I forgot my water. How do you think I feel?',
      followUp: 'Can you help me choose something to drink?',
    },
    example: {
      text: 'I am thirsty after the game.',
      ru: 'Я хочу пить после игры.',
      ipa: '/θ/',
    },
  },
  {
    title: 'I can do it!',
    theme: {
      en: 'Actions and abilities',
      ru: 'Действия и умения',
    },
    page: 59,
    vocabulary: [
      'catch',
      'climb',
      'jump',
      'kick',
      'ride a bike',
      'sing',
      'swim',
      'throw',
    ],
    cards: [
      {
        word: 'swim',
        icon: '🏊',
        clue: 'You move through water using your arms and legs.',
      },
      {
        word: 'ride a bike',
        icon: '🚴',
        clue: 'You travel on two wheels and use pedals.',
      },
    ],
    conversation: {
      question: 'What can you do at a sports day?',
      followUp: 'Can you catch a ball or climb?',
      challenge: 'What can an imaginary animal do?',
    },
    role: {
      question:
        'I am choosing a game for sports day. Can you throw or catch a ball?',
      followUp: 'What else can you do for our team?',
    },
    example: {
      text: 'I can swim with my friends.',
      ru: 'Я умею плавать с друзьями.',
      ipa: '/sw/',
    },
  },
  {
    title: 'Let’s play today!',
    theme: {
      en: 'Playground and toys',
      ru: 'Игрушки и игровая площадка',
    },
    page: 73,
    vocabulary: [
      'bike',
      'boat',
      'car',
      'kite',
      'sandpit',
      'seesaw',
      'slide',
      'swing',
    ],
    cards: [
      {
        word: 'slide',
        icon: '🛝',
        clue: 'You climb up and go down it at the playground.',
      },
      {
        word: 'kite',
        icon: '🪁',
        clue: 'It flies in the wind on a string.',
      },
    ],
    conversation: {
      question: 'Which playground thing would you like to play on?',
      followUp: 'Where is the slide in your imaginary playground?',
      challenge: 'What could be next to the swing?',
    },
    role: {
      question:
        'I cannot see my kite at the playground. Can you tell me where it is?',
      followUp: 'Is it near the slide or near the swing?',
    },
    example: {
      text: 'The slide is next to the sandpit.',
      ru: 'Горка рядом с песочницей.',
      ipa: '/sl/',
    },
  },
  {
    title: 'Long legs, short legs',
    theme: {
      en: 'Parts of the body',
      ru: 'Части тела',
    },
    page: 85,
    vocabulary: ['eye', 'ear', 'arm', 'leg', 'foot', 'tail', 'long', 'short'],
    cards: [
      {
        word: 'eye',
        icon: '👁️',
        clue: 'You use this part of your body to see.',
      },
      {
        word: 'ear',
        icon: '👂',
        clue: 'You use this part of your body to hear.',
      },
    ],
    conversation: {
      question: 'Invent a monster. How many eyes has it got?',
      followUp: 'Has it got long or short legs?',
      challenge: 'Tell me about its tail or its arms.',
    },
    role: {
      question:
        'I draw monsters. Tell me what eyes I should draw for your monster.',
      followUp: 'How long are its arms?',
    },
    example: {
      text: 'My monster has got one eye and two ears.',
      ru: 'У моего монстра один глаз и два уха.',
      ipa: '/aɪ/',
    },
  },
  {
    title: 'Old and new clothes',
    theme: {
      en: 'Clothes',
      ru: 'Одежда',
    },
    page: 99,
    vocabulary: [
      'dress',
      'jacket',
      'shirt',
      'shoes',
      'skirt',
      'socks',
      'trousers',
      'T-shirt',
    ],
    cards: [
      {
        word: 'socks',
        icon: '🧦',
        clue: 'You put these on your feet before your shoes.',
      },
      {
        word: 'dress',
        icon: '👗',
        clue: 'This is one piece of clothing with a skirt at the bottom.',
      },
    ],
    conversation: {
      question: 'What are you wearing for a pretend party?',
      followUp: 'What colour are your shoes or socks?',
      challenge: 'What are you wearing when it is cold?',
    },
    role: {
      question:
        'I have a costume box. What would you like to wear for our play?',
      followUp: 'Do you need a shirt or a jacket too?',
    },
    example: {
      text: 'My socks are green and yellow.',
      ru: 'Мои носки зелёные и жёлтые.',
      ipa: '/s/',
    },
  },
  {
    title: 'Brilliant bedrooms',
    theme: {
      en: 'Bedroom furniture',
      ru: 'Мебель в спальне',
    },
    page: 111,
    vocabulary: [
      'bed',
      'chair',
      'clock',
      'desk',
      'door',
      'lamp',
      'wardrobe',
      'window',
    ],
    cards: [
      {
        word: 'clock',
        icon: '🕒',
        clue: 'You look at it to find out the time.',
      },
      {
        word: 'bed',
        icon: '🛏️',
        clue: 'You sleep on it.',
      },
    ],
    conversation: {
      question: 'Imagine a new bedroom. What is in it?',
      followUp: 'Where is the clock or the lamp?',
      challenge: 'What is near the window?',
    },
    role: {
      question: 'I am helping you plan a bedroom. Where shall we put the bed?',
      followUp: 'What would you put on the desk?',
    },
    example: {
      text: 'There is a clock by the door.',
      ru: 'У двери есть часы.',
      ipa: '/kl/',
    },
  },
  {
    title: 'Fabulous food',
    theme: {
      en: 'Food',
      ru: 'Еда',
    },
    page: 125,
    vocabulary: [
      'banana',
      'burger',
      'cake',
      'carrot',
      'mango',
      'onion',
      'pear',
      'tomato',
    ],
    cards: [
      {
        word: 'carrot',
        icon: '🥕',
        clue: 'This orange vegetable grows in the ground.',
      },
      {
        word: 'pear',
        icon: '🍐',
        clue: 'This fruit is narrow at the top and round at the bottom.',
      },
    ],
    conversation: {
      question: 'You are packing a picnic. What food do you like?',
      followUp: 'What food do you not like?',
      challenge: 'Which two foods are the same colour?',
    },
    role: {
      question: 'I work at a picnic stall. Which fruit would you like?',
      followUp: 'Would you like a carrot or a tomato too?',
    },
    example: {
      text: 'I like carrots with my burger.',
      ru: 'Мне нравится морковь с бургером.',
      ipa: '/æ/',
    },
  },
] satisfies readonly UnitContent[]
