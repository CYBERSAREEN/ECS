const { body } = require('express-validator');

// Person-name fields: max 20 chars, letters + spaces only — rejects
// !@#$%^&*()-+{}[]\|:;"'.,/?><  and everything else outside that allowlist.
// An allowlist (not a denylist) so we don't have to enumerate every
// possible dangerous character by hand.
const NAME_PATTERN = /^[A-Za-z ]{1,20}$/;

function nameField(fieldName = 'name') {
  return body(fieldName)
    .trim()
    .notEmpty().withMessage(`${fieldName} is required`)
    .isLength({ max: 20 }).withMessage(`${fieldName} must be 20 characters or fewer`)
    .matches(NAME_PATTERN).withMessage(`${fieldName} may only contain letters and spaces`);
}

module.exports = { NAME_PATTERN, nameField };
