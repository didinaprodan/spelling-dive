// Homework 1: First Grade Spelling Bee, 40 words.
// Missions go from the easiest words to the hardest; the last one is the boss.

export const WORDS = {
  red: { emoji: '🔴', sentence: 'The apple is red.' },
  ten: { emoji: '🔟', sentence: 'I have ten fingers.' },
  six: { emoji: '6️⃣', sentence: 'A bug has six legs.' },
  bus: { emoji: '🚌', sentence: 'I ride the bus to school.' },
  car: { emoji: '🚗', sentence: 'Dad drives a car.' },

  boy: { emoji: '👦', sentence: 'The boy can run fast.' },
  sky: { emoji: '🌤️', sentence: 'The sky is blue today.' },
  nine: { emoji: '9️⃣', sentence: 'Nine comes after eight.' },
  five: { emoji: '🖐️', sentence: 'I have five fingers on one hand.' },
  book: { emoji: '📖', sentence: 'I read a book before bed.' },

  tree: { emoji: '🌳', sentence: 'A bird sits in the tree.' },
  blue: { emoji: '🔵', sentence: 'The sea is blue.' },
  green: { emoji: '🟢', sentence: 'The grass is green.' },
  girl: { emoji: '👧', sentence: 'The girl has a red hat.' },
  clock: { emoji: '⏰', sentence: 'The clock says it is time for bed.' },

  one: { emoji: '1️⃣', sentence: 'I have one nose.' },
  two: { emoji: '2️⃣', sentence: 'I have two eyes.' },
  four: { emoji: '4️⃣', sentence: 'A cat has four legs.' },
  three: { emoji: '3️⃣', sentence: 'Three comes after two.' },
  seven: { emoji: '7️⃣', sentence: 'There are seven days in a week.' },

  chair: { emoji: '🪑', sentence: 'I sit on a chair.' },
  ruler: { emoji: '📏', sentence: 'I draw a line with a ruler.' },
  apple: { emoji: '🍎', sentence: 'I eat an apple.' },
  pencil: { emoji: '✏️', sentence: 'I write with a pencil.' },
  window: { emoji: '🪟', sentence: 'Look out of the window.' },

  sister: { emoji: '👭', sentence: 'My sister likes to sing.' },
  crayon: { emoji: '🖍️', sentence: 'I draw with a green crayon.' },
  banana: { emoji: '🍌', sentence: 'The monkey eats a banana.' },
  orange: { emoji: '🍊', sentence: 'An orange is a sweet fruit.' },
  family: { emoji: '👨‍👩‍👦', sentence: 'I love my family.' },

  mother: { emoji: '👩', sentence: 'My mother reads to me.' },
  father: { emoji: '👨', sentence: 'My father makes dinner.' },
  school: { emoji: '🏫', sentence: 'I go to school every day.' },
  eight: { emoji: '8️⃣', sentence: 'A spider has eight legs.' },
  friend: { emoji: '🤝', sentence: 'My friend plays with me.' },

  brother: { emoji: '👬', sentence: 'My brother is tall.' },
  grandma: { emoji: '👵', sentence: 'Grandma bakes a cake.', parts: ['grand', 'ma'] },
  grandpa: { emoji: '👴', sentence: 'Grandpa tells funny stories.', parts: ['grand', 'pa'] },
  computer: { emoji: '💻', sentence: 'I play games on the computer.', parts: ['com', 'pu', 'ter'] },

  whiteboard: { emoji: '🧑‍🏫', sentence: 'The teacher writes on the whiteboard.', parts: ['white', 'board'] },
};

export const MISSIONS = [
  { id: 'safe-shallows', name: 'Safe Shallows', icon: '🐚', hue: '#3fd6c6', words: ['red', 'ten', 'six', 'bus', 'car'], creature: 'rabbit-ray' },
  { id: 'kelp-forest', name: 'Kelp Forest', icon: '🌿', hue: '#5fd068', words: ['boy', 'sky', 'nine', 'five', 'book'], creature: 'stalker' },
  { id: 'grassy-plateaus', name: 'Grassy Plateaus', icon: '🌾', hue: '#ff8a65', words: ['tree', 'blue', 'green', 'girl', 'clock'], creature: 'sand-shark' },
  { id: 'mushroom-forest', name: 'Mushroom Forest', icon: '🍄', hue: '#c38bff', words: ['one', 'two', 'four', 'three', 'seven'], creature: 'jellyray' },
  { id: 'jellyshroom-cave', name: 'Jellyshroom Cave', icon: '🪼', hue: '#9b7bff', words: ['chair', 'ruler', 'apple', 'pencil', 'window'], creature: 'crabsnake' },
  { id: 'underwater-islands', name: 'Underwater Islands', icon: '🏝️', hue: '#4fb3ff', words: ['sister', 'crayon', 'banana', 'orange', 'family'], creature: 'boneshark' },
  { id: 'blood-kelp', name: 'Blood Kelp Zone', icon: '🦑', hue: '#ff5d7a', words: ['mother', 'father', 'school', 'eight', 'friend'], creature: 'crabsquid' },
  { id: 'lost-river', name: 'Lost River', icon: '💀', hue: '#7dffb0', words: ['brother', 'grandma', 'grandpa', 'computer'], creature: 'river-prowler' },
  { id: 'crash-zone', name: 'Crash Zone', icon: '🚀', hue: '#ff6a3d', words: ['whiteboard'], creature: 'reaper', boss: true },
];

// The first word he ever spells right gives a welcome bonus.
export const BONUS_CREATURE = 'peeper';

export const CREATURES = {
  peeper: {
    name: 'Peeper', kind: 'Small fish', color: '#ffc94d',
    fact: 'A tiny fast fish with one giant eye. It loves the Safe Shallows.',
  },
  'rabbit-ray': {
    name: 'Rabbit Ray', kind: 'Friendly fauna', color: '#ffb3d9',
    fact: 'A gentle ray with long ears. It swims slowly and never bites.',
  },
  stalker: {
    name: 'Stalker', kind: 'Predator', color: '#8fc3e8',
    fact: 'It hunts in the Kelp Forest and steals shiny metal for its nest.',
  },
  'sand-shark': {
    name: 'Sand Shark', kind: 'Predator', color: '#f0c27a',
    fact: 'It hides under the sand and jumps out with a big bite.',
  },
  jellyray: {
    name: 'Jellyray', kind: 'Friendly fauna', color: '#7fe0ff',
    fact: 'A glowing see-through ray that glides above the giant mushrooms.',
  },
  crabsnake: {
    name: 'Crabsnake', kind: 'Predator', color: '#c49bff',
    fact: 'It lives inside a giant mushroom and snaps at anyone who swims too close.',
  },
  boneshark: {
    name: 'Boneshark', kind: 'Predator', color: '#e9dcff',
    fact: 'A shark covered in hard bone armor. It can hit a Seamoth!',
  },
  crabsquid: {
    name: 'Crabsquid', kind: 'Predator', color: '#5ab0ff',
    fact: 'It has crab claws and can switch off your lights with a blue flash.',
  },
  'river-prowler': {
    name: 'River Prowler', kind: 'Predator', color: '#9dffc4',
    fact: 'A long thin hunter that swims in the green water of the Lost River.',
  },
  reaper: {
    name: 'Reaper Leviathan', kind: 'LEVIATHAN CLASS', color: '#ff6b4a', leviathan: true,
    fact: 'The giant hunter near the crashed Aurora. You can hear its roar from far away!',
  },
};

// Slots shown in the PDA as "signals" for future homework.
export const FUTURE_SIGNALS = 3;

export const ALL_WORDS = MISSIONS.flatMap((m) => m.words);
