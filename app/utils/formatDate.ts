export const formatDateEs = (date: Date = new Date()) => {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
