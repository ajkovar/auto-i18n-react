const urlRegex = /^[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
const fileUrlRegex = /^(\/?[A-Za-z0-9-]+)(\/[A-Za-z0-9-]+)+\.([a-zA-Z0-9-])+$/;

const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

const consecutiveNonChars = /[_-]{2,}/;

// matches '$some-var'
const cssTypeVarRegex = /^\$[a-zA-Z]+(-[a-zA-Z]+)*$/;

// matches 'someVariableName'
const camelCaseVarRegex = /[a-z]+([A-Z][a-z]+)+/;

const hexColorRegex = /^#[a-zA-Z0-9-]+$/;

// matches 'someFn(argument)'
const functionCallRegex = /^[a-zA-Z]+\(.*\)$/;

const blackListedPatterns = [
  urlRegex,
  fileUrlRegex,
  emailRegex,
  consecutiveNonChars,
  cssTypeVarRegex,
  hexColorRegex,
  camelCaseVarRegex,
  functionCallRegex,
];

// Assume things with capital letters or certain punctuation are translatable.
// This may need to be adjusted
const naturalLanguageRegex = /[A-Z\.\,\!\:\? ]/;

// ensure a minimum number of consecutive characters
const minimumConsecutiveCharsRegex = /[a-zA-Z]{2,}/;

export default function (value: string, isJsxText: boolean = false) {
  return (
    !blackListedPatterns.some((pattern) => pattern.test(value)) &&
    (isJsxText
      ? value.length > 0
      : naturalLanguageRegex.test(value) &&
        minimumConsecutiveCharsRegex.test(value))
  );
}
