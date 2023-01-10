const validator = require("validator");
const MESSAGES = require("./constants");
// const bcrypt = require("bcryptjs");
// const { compare, hash } = bcrypt;

const validateEmail = (email) => {
  return validator.isEmail(email);
};

const validateFullName = (fullName) => {
  return /^[a-zA-Z][a-zA-Z\s]{6,50}$/.test(fullName);
};

const validateRegPassword = (password) => {
  const minLength = 6;
  const minSymbols = 1;
  return validator.isStrongPassword(password, { minLength, minSymbols });
};

// exports.validateConfirmPassword = (password: string, confirmPassword: string) => {
//   return password === confirmPassword;
// };

exports.validateAccountForm = (formData, cPass = false) => {
  const errors = [];

  const { fullName, email, password, cPassword } = formData;

  if (!validateFullName(fullName))
    errors.push({ name: "fullName", msg: MESSAGES.FORM.FULL_NAME });

  if (!validateEmail(email))
    errors.push({ name: "email", msg: MESSAGES.FORM.EMAIL });

  if (!validateRegPassword(password))
    errors.push({ name: "password", msg: MESSAGES?.FORM?.PASSWORD });

  // if (cPass) {
  //   if (!validateConfirmPassword(password, cPassword))
  //     errors.push({
  //       name: "cPassword",
  //       msg: MESSAGES.FORM.CPASSWORD,
  //     });
  // }

  return errors;
};

// const validateUserPassword = async (password, hashPassword) =>
//   await compare(password, hashPassword);

// const hashPassword = async (password: string) => await hash(password, 12);
