export const parseUTC = (dateString) => {
  if (!dateString) return new Date();
  const date = new Date(dateString + 'Z');
  return date;
};
