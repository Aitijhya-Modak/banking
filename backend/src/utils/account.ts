export async function generateUniqueAccountNo(): Promise<string> {
  let accountNo = "";

  const randomDigits = Math.floor(Math.random() * 900000000) + 1000000000;
  accountNo = randomDigits.toString();

  return accountNo;
}
