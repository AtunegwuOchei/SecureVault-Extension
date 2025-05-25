// Password character sets
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-={}[]|:;<>,.?/~';
const AMBIGUOUS = 'Il1O0';

// Common words for passphrase generation
const COMMON_WORDS = [
  'correct', 'horse', 'battery', 'staple', 'apple', 'orange', 'banana', 'grape',
  'elephant', 'giraffe', 'zebra', 'tiger', 'mountain', 'river', 'ocean', 'forest',
  'paper', 'pencil', 'marker', 'crayon', 'happy', 'joyful', 'excited', 'peaceful',
  'green', 'blue', 'red', 'yellow', 'large', 'small', 'tiny', 'giant',
  'water', 'fire', 'earth', 'wind', 'book', 'page', 'story', 'chapter'
];

export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  avoidAmbiguous: boolean;
}

export interface PassphraseOptions {
  wordCount: number;
  separator: string;
  capitalizeWords: boolean;
  includeNumbers: boolean;
}

/**
 * Generates a random password based on the provided options
 */
export function generatePassword(options: PasswordOptions): string {
  let charSet = '';
  let password = '';
  
  // Build character set based on options
  if (options.includeLowercase) charSet += LOWERCASE;
  if (options.includeUppercase) charSet += UPPERCASE;
  if (options.includeNumbers) charSet += NUMBERS;
  if (options.includeSymbols) charSet += SYMBOLS;
  
  // Remove ambiguous characters if option is selected
  if (options.avoidAmbiguous) {
    for (const char of AMBIGUOUS) {
      charSet = charSet.replace(char, '');
    }
  }
  
  // Ensure we have at least some characters
  if (charSet.length === 0) {
    charSet = LOWERCASE;
  }
  
  // Generate the password
  for (let i = 0; i < options.length; i++) {
    const randomIndex = Math.floor(Math.random() * charSet.length);
    password += charSet[randomIndex];
  }
  
  // Ensure the password includes at least one character from each selected set
  let requiredChars = '';
  if (options.includeLowercase) requiredChars += LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)];
  if (options.includeUppercase) requiredChars += UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)];
  if (options.includeNumbers) requiredChars += NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  if (options.includeSymbols) requiredChars += SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  
  // Replace first few characters with required characters
  password = requiredChars + password.slice(requiredChars.length);
  
  // Shuffle the password to make it more random
  return shuffleString(password).slice(0, options.length);
}

/**
 * Generates a random passphrase based on the provided options
 */
export function generatePassphrase(options: PassphraseOptions): string {
  let words: string[] = [];
  
  // Generate the words
  for (let i = 0; i < options.wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * COMMON_WORDS.length);
    let word = COMMON_WORDS[randomIndex];
    
    // Apply capitalization if needed
    if (options.capitalizeWords) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    
    words.push(word);
  }
  
  // Add a random number to the end if option is selected
  if (options.includeNumbers) {
    const randomNumber = Math.floor(Math.random() * 1000);
    words.push(randomNumber.toString());
  }
  
  // Join words with the selected separator
  return words.join(options.separator);
}

/**
 * Shuffles a string to make characters appear in random order
 */
function shuffleString(str: string): string {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}
