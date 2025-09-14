export const getExpiryDate = (purchaseDate, months) => {
  const date = new Date(purchaseDate);
  date.setMonth(date.getMonth() + months);
  return date;
};

export const getMonthsLeft = (expiryDate) => {
  const now = new Date();
  const end = new Date(expiryDate);

  if (end < now) return 0;

  let months = (end.getFullYear() - now.getFullYear()) * 12;
  months -= now.getMonth();
  months += end.getMonth();

  if (end.getDate() < now.getDate()) {
    months--;
  }

  return months <= 0 ? 0 : months;
};

export const getProgressPercentage = (purchaseDate, warrantyLengthMonths) => {
  const start = new Date(purchaseDate);
  const now = new Date();
  const end = getExpiryDate(purchaseDate, warrantyLengthMonths);

  if (now >= end) return 100;
  if (now <= start) return 0;

  const totalDuration = end.getTime() - start.getTime();
  const elapsedDuration = now.getTime() - start.getTime();

  if (totalDuration === 0) return 100;

  return (elapsedDuration / totalDuration) * 100;
};
export const getRemainingPercentage = (purchaseDate, warrantyLengthMonths) => {
  const elapsed = getProgressPercentage(purchaseDate, warrantyLengthMonths);
  return 100 - elapsed;
};
