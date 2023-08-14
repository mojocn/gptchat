import bcrypt from "bcrypt";

export function bcryptPasswordHash(plainPassword: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainPassword, salt);
}

export function bcryptPasswordCheck(
  inputPassword: string,
  hashedPassword: string,
): boolean {
  return bcrypt.compareSync(inputPassword, hashedPassword); // true
}

export function getUUID() {
  let d = new Date().getTime();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
