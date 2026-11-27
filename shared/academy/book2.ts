import type { UnitContent } from './types'

export const book2 = [
  {
    title: 'In the wild',
    theme: {
      en: 'Wild animals and countries',
      ru: 'Дикие животные и страны',
    },
    page: 9,
    vocabulary: [
      'bear',
      'camel',
      'crocodile',
      'kangaroo',
      'panda',
      'wolf',
      'Australia',
      'India',
      'China',
      'Russia',
    ],
    cards: [
      {
        word: 'kangaroo',
        icon: '🦘',
        clue: 'It jumps and carries its baby in a pouch.',
      },
      {
        word: 'crocodile',
        icon: '🐊',
        clue: 'It has a long tail and sharp teeth and swims in rivers.',
      },
    ],
    conversation: {
      question: 'Imagine a wildlife park. What animals are there?',
      followUp: 'Are there any pandas or bears?',
      challenge: 'Which animal would you look for in Australia?',
    },
    role: {
      question:
        'I am your wildlife guide. Which animal do you want to see first?',
      followUp: 'Are there any animals that can swim in our park?',
    },
    example: {
      text: 'There are two kangaroos near the trees.',
      ru: 'Возле деревьев два кенгуру.',
      ipa: '/ŋ/',
    },
  },
  {
    title: 'My busy week',
    theme: {
      en: 'Days and activities',
      ru: 'Дни недели и занятия',
    },
    page: 19,
    vocabulary: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
      'do gymnastics',
      'go to school',
      'have a music lesson',
      'play basketball',
    ],
    cards: [
      {
        word: 'play basketball',
        icon: '🏀',
        clue: 'You try to throw a ball through a hoop.',
      },
      {
        word: 'have a music lesson',
        icon: '🎼',
        clue: 'You learn to play an instrument or sing with a teacher.',
      },
    ],
    conversation: {
      question: 'What do you do on Monday after school?',
      followUp: 'Do you play basketball on Fridays?',
      challenge: 'Tell me about Saturday and Sunday.',
    },
    role: {
      question:
        'I am making our club calendar. What shall we put on Wednesday?',
      followUp: 'Which day is good for a music lesson?',
    },
    example: {
      text: 'I play basketball on Thursday.',
      ru: 'Я играю в баскетбол по четвергам.',
      ipa: '/b/',
    },
  },
  {
    title: 'Our things',
    theme: {
      en: 'Personal possessions',
      ru: 'Личные вещи',
    },
    page: 31,
    vocabulary: [
      'camera',
      'computer',
      'glasses',
      'guitar',
      'phone',
      'radio',
      'TV',
      'watch',
    ],
    cards: [
      {
        word: 'camera',
        icon: '📷',
        clue: 'You use this to take photos.',
      },
      {
        word: 'guitar',
        icon: '🎸',
        clue: 'It has strings, and you play music on it.',
      },
    ],
    conversation: {
      question: 'Which things would you use to take a picture or play music?',
      followUp: 'Imagine you find a watch. Whose watch is it?',
      challenge: 'What things might be in a band’s room?',
    },
    role: {
      question:
        'I work at a lost-property desk. I found a camera. Whose is it?',
      followUp: 'What colour are their glasses?',
    },
    example: {
      text: 'That is our camera by the radio.',
      ru: 'Это наша камера рядом с радио.',
      ipa: '/k/',
    },
  },
  {
    title: 'Out and about',
    theme: {
      en: 'Buildings and places',
      ru: 'Здания и места',
    },
    page: 45,
    vocabulary: [
      'building',
      'flat',
      'garden',
      'house',
      'park',
      'restaurant',
      'shop',
      'street',
    ],
    cards: [
      {
        word: 'garden',
        icon: '🌷',
        clue: 'It is outside, and you can grow plants there.',
      },
      {
        word: 'restaurant',
        icon: '🍽️',
        clue: 'People go to this place to buy and eat a meal.',
      },
    ],
    conversation: {
      question: 'What places are on an imaginary street?',
      followUp: 'Does the person in your story live in a house or a flat?',
      challenge: 'Where does this person go on Saturdays?',
    },
    role: {
      question: 'I am visiting your pretend town. Which place should I visit?',
      followUp: 'Is there a shop near the park?',
    },
    example: {
      text: 'The house has a garden behind it.',
      ru: 'За домом есть сад.',
      ipa: '/ɡ/',
    },
  },
  {
    title: 'Sun and snow',
    theme: {
      en: 'Weather and the landscape',
      ru: 'Погода и природа',
    },
    page: 57,
    vocabulary: [
      'cloud',
      'rain',
      'snow',
      'sun',
      'wind',
      'beach',
      'mountain',
      'sea',
    ],
    cards: [
      {
        word: 'snow',
        icon: '❄️',
        clue: 'It falls in white flakes when it is cold.',
      },
      {
        word: 'mountain',
        icon: '⛰️',
        clue: 'It is high land, much higher than a little hill.',
      },
    ],
    conversation: {
      question: 'Picture a white mountain. What is the weather like there?',
      followUp: 'What are people doing at the beach today?',
      challenge: 'What can you see when there is a lot of wind?',
    },
    role: {
      question:
        'I am making a weather report. What can I say about the sea today?',
      followUp: 'What is happening near the mountains?',
    },
    example: {
      text: 'The snow is falling on the mountain.',
      ru: 'Снег падает на гору.',
      ipa: '/sn/',
    },
  },
  {
    title: 'Stay safe',
    theme: {
      en: 'Transport and road safety',
      ru: 'Транспорт и безопасность на дороге',
    },
    page: 71,
    vocabulary: [
      'bus',
      'helicopter',
      'lorry',
      'motorbike',
      'plane',
      'train',
      'traffic light',
      'left',
      'right',
    ],
    cards: [
      {
        word: 'traffic light',
        icon: '🚦',
        clue: 'Its red, yellow and green lights tell drivers when to stop or go.',
      },
      {
        word: 'train',
        icon: '🚆',
        clue: 'This vehicle travels on tracks and has carriages.',
      },
    ],
    conversation: {
      question: 'What transport can you see on a busy street?',
      followUp: 'What do you do at a red traffic light?',
      challenge: 'Name one thing that flies and one that uses tracks.',
    },
    role: {
      question:
        'I am walking with you to the school bus. The light is red. What do we do?',
      followUp: 'Do we look left or right before crossing?',
    },
    example: {
      text: 'Wait at the traffic light with me.',
      ru: 'Подожди со мной у светофора.',
      ipa: '/tr/',
    },
  },
  {
    title: 'Seasons of fun',
    theme: {
      en: 'Seasons and outdoor activities',
      ru: 'Времена года и занятия на улице',
    },
    page: 83,
    vocabulary: [
      'spring',
      'summer',
      'autumn',
      'winter',
      'have a picnic',
      'make a snowman',
      'plant flowers',
      'play outside',
    ],
    cards: [
      {
        word: 'make a snowman',
        icon: '⛄',
        clue: 'Build a person out of snow.',
      },
      {
        word: 'plant flowers',
        icon: '🌷',
        clue: 'Put seeds or small flowering plants in the soil.',
      },
    ],
    conversation: {
      question: 'What do you like doing in winter?',
      followUp: 'What do you like doing when spring comes?',
      challenge: 'Which season is good for a picnic, and why?',
    },
    role: {
      question: 'We can play outside this weekend. What shall we do?',
      followUp: 'What would you suggest if there is snow?',
    },
    example: {
      text: 'Let’s make a snowman on Saturday.',
      ru: 'Давай слепим снеговика в субботу.',
      ipa: '/sn/',
    },
  },
  {
    title: 'How food grows',
    theme: {
      en: 'Fruit and vegetables',
      ru: 'Фрукты и овощи',
    },
    page: 97,
    vocabulary: [
      'beans',
      'coconut',
      'grapes',
      'lemon',
      'peas',
      'pepper',
      'potato',
      'watermelon',
    ],
    cards: [
      {
        word: 'lemon',
        icon: '🍋',
        clue: 'It is yellow, and its juice tastes sour.',
      },
      {
        word: 'watermelon',
        icon: '🍉',
        clue: 'This large fruit is usually green outside and red inside.',
      },
    ],
    conversation: {
      question: 'What would you put in a fruit salad?',
      followUp: 'Which of these vegetables would you grow?',
      challenge: 'What colour is a watermelon on the inside?',
    },
    role: {
      question: 'I sell fruit and vegetables at a market. What would you like?',
      followUp: 'Would you like some peas or a potato too?',
    },
    example: {
      text: 'I would like a lemon for my drink.',
      ru: 'Я хочу лимон для своего напитка.',
      ipa: '/l/',
    },
  },
  {
    title: 'Let’s look inside',
    theme: {
      en: 'Rooms and furniture',
      ru: 'Комнаты и мебель',
    },
    page: 109,
    vocabulary: [
      'bathroom',
      'dining room',
      'hall',
      'kitchen',
      'living room',
      'bookcase',
      'shower',
      'sofa',
    ],
    cards: [
      {
        word: 'sofa',
        icon: '🛋️',
        clue: 'Two or more people can sit on this soft piece of furniture.',
      },
      {
        word: 'shower',
        icon: '🚿',
        clue: 'You stand under falling water to wash.',
      },
    ],
    conversation: {
      question: 'What furniture is in your pretend living room?',
      followUp: 'Where would you put the bookcase?',
      challenge: 'Which room has a shower?',
    },
    role: {
      question:
        'I am giving you a tour of a pretend house. Which room shall we see first?',
      followUp: 'What was in the living room when you looked?',
    },
    example: {
      text: 'The sofa is in the living room.',
      ru: 'Диван находится в гостиной.',
      ipa: '/s/',
    },
  },
  {
    title: 'Fantastic weekends',
    theme: {
      en: 'Places to visit',
      ru: 'Куда сходить на выходных',
    },
    page: 123,
    vocabulary: [
      'aquarium',
      'art gallery',
      'bowling alley',
      'campsite',
      'concert',
      'skate park',
      'theme park',
      'zoo',
    ],
    cards: [
      {
        word: 'campsite',
        icon: '🏕️',
        clue: 'This is a place where you can put up a tent.',
      },
      {
        word: 'concert',
        icon: '🎤',
        clue: 'At this event people listen to musicians play live.',
      },
    ],
    conversation: {
      question: 'Imagine last weekend. Which place did you visit?',
      followUp: 'What did you do there?',
      challenge: 'What other place would you like to visit?',
    },
    role: {
      question:
        'We are planning a weekend outing. Would you prefer the zoo or the aquarium?',
      followUp: 'What can we do there together?',
    },
    example: {
      text: 'We stayed at a campsite last weekend.',
      ru: 'В прошлые выходные мы остановились в кемпинге.',
      ipa: '/k/',
    },
  },
] satisfies readonly UnitContent[]
