export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function sleep2(milliseconds: number) {
  const startTime = Date.now();
  let endTime = Date.now();
  while (endTime < startTime + milliseconds) {
    endTime = Date.now();
  }
}
